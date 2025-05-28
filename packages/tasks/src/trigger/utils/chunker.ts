/**
 * Options for the chunk function.
 */
export interface ChunkOptions {
  /** Maximum number of tokens per chunk. Default: 512 */
  chunkSize?: number;
  /** Number of tokens to overlap between consecutive chunks. Default: 0 */
  chunkOverlap?: number;
  /** Minimum number of sentences per chunk. Default: 1 */
  minSentencesPerChunk?: number;
  /** Minimum number of characters for a valid sentence. Default: 12 */
  minCharactersPerSentence?: number;
  /** List of sentence delimiters. Default: ['. ', '! ', '? ', '\n'] */
  delim?: string[];
  /** Whether to include delimiter with previous ('prev'), next ('next'), or exclude (null). Default: 'prev' */
  includeDelim?: "prev" | "next" | null;
}

/**
 * Represents a sentence with its position and token count.
 */
interface Sentence {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
}

/**
 * Represents a chunk of text containing multiple sentences.
 */
export interface TextChunk {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  sentences: Sentence[];
}

/**
 * Simple tokenizer that approximates token count by word count.
 * For production use, replace with a proper tokenizer like GPT-2.
 */
const approximateTokenCount = (text: string): number => {
  // Simple approximation: ~1.3 tokens per word
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3);
};

/**
 * Binary search to find the leftmost position where value should be inserted.
 */
const bisectLeft = (arr: number[], value: number, lo: number = 0): number => {
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < value) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
};

/**
 * Detect if text is likely JSON or structured data
 */
const isStructuredData = (text: string): boolean => {
  const trimmed = text.trim();
  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    trimmed.includes('{"') ||
    trimmed.includes('":{') ||
    (trimmed.split("\n").length > 10 && trimmed.includes(":"))
  );
};

/**
 * Split structured data (JSON, etc.) into manageable chunks
 */
const splitStructuredData = (text: string, maxChunkSize: number): string[] => {
  const chunks: string[] = [];

  // For very large structured data, split by lines first
  const lines = text.split("\n");
  let currentChunk = "";

  for (const line of lines) {
    const testChunk = currentChunk + (currentChunk ? "\n" : "") + line;

    // If adding this line would exceed our target size, save current chunk
    if (approximateTokenCount(testChunk) > maxChunkSize && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk = testChunk;
    }
  }

  // Add the last chunk if it exists
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  // If we still have chunks that are too large, split them further
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (approximateTokenCount(chunk) > maxChunkSize) {
      // Split by common JSON delimiters
      const subChunks = splitByDelimiters(
        chunk,
        ["},", "],", "},{", "],["],
        maxChunkSize
      );
      finalChunks.push(...subChunks);
    } else {
      finalChunks.push(chunk);
    }
  }

  return finalChunks.filter((chunk) => chunk.trim().length > 0);
};

/**
 * Split text by delimiters when it's too large
 */
const splitByDelimiters = (
  text: string,
  delimiters: string[],
  maxChunkSize: number
): string[] => {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining && approximateTokenCount(remaining) > maxChunkSize) {
    let bestSplit = -1;
    let bestDelim = "";

    // Find the best delimiter to split on (closest to our target size)
    for (const delim of delimiters) {
      const index = remaining.indexOf(delim);
      if (index > 0) {
        const beforeSplit = remaining.substring(0, index + delim.length);
        if (approximateTokenCount(beforeSplit) <= maxChunkSize) {
          if (bestSplit === -1 || index > bestSplit) {
            bestSplit = index;
            bestDelim = delim;
          }
        }
      }
    }

    if (bestSplit > 0) {
      const chunk = remaining.substring(0, bestSplit + bestDelim.length);
      chunks.push(chunk);
      remaining = remaining.substring(bestSplit + bestDelim.length);
    } else {
      // If no good split point found, force split at character level
      const targetChars = Math.floor(maxChunkSize * 4); // Rough char estimate
      chunks.push(remaining.substring(0, targetChars));
      remaining = remaining.substring(targetChars);
    }
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
};

/**
 * Split text into sentences while maintaining delimiters.
 */
const splitText = (
  text: string,
  delim: string[],
  includeDelim: "prev" | "next" | null,
  minCharactersPerSentence: number,
  maxChunkSize: number = 512
): string[] => {
  // Check if this is structured data (JSON, etc.)
  if (isStructuredData(text)) {
    return splitStructuredData(text, maxChunkSize);
  }

  const sep = "✄";
  let t = text;

  // Replace delimiters with separator
  for (const c of delim) {
    if (includeDelim === "prev") {
      t = t.split(c).join(c + sep);
    } else if (includeDelim === "next") {
      t = t.split(c).join(sep + c);
    } else {
      t = t.split(c).join(sep);
    }
  }

  // Split by separator and filter out empty or too short strings
  const sentences = t
    .split(sep)
    .map((s) => s.trim())
    .filter(
      (s) => s.length > 0 && s.length >= minCharactersPerSentence && s !== sep
    );

  return sentences;
};

/**
 * Main chunking function
 */
export const chunk = (
  text: string,
  options: ChunkOptions = {}
): TextChunk[] => {
  const {
    chunkSize = 512,
    chunkOverlap = 50,
    minSentencesPerChunk = 1,
    minCharactersPerSentence = 12,
    delim = [". ", "! ", "? ", "\n"],
    includeDelim = "prev",
  } = options;

  // Pre-process text to remove excessive whitespace
  text = text.replace(/\s+/g, " ").trim();
  text = text.replace(/\t/g, "");

  // Safety check for extremely large inputs
  const maxInputSize = 1000000; // 1MB character limit
  if (text.length > maxInputSize) {
    console.warn(
      `Input text is very large (${text.length} characters), truncating to ${maxInputSize} characters`
    );
    text = text.substring(0, maxInputSize);
  }

  // Split text into sentences
  const sentences = splitText(
    text,
    delim,
    includeDelim,
    minCharactersPerSentence,
    chunkSize
  );

  if (sentences.length === 0) {
    return [];
  }

  // Convert sentences to Sentence objects with token counts
  const sentenceObjects: Sentence[] = sentences.map((sentence, index) => {
    const startIndex =
      index === 0 ? 0 : sentences.slice(0, index).join(" ").length + 1;
    const endIndex = startIndex + sentence.length;

    return {
      text: sentence,
      startIndex,
      endIndex,
      tokenCount: approximateTokenCount(sentence),
    };
  });

  // Create chunks
  const chunks: TextChunk[] = [];
  let currentSentences: Sentence[] = [];
  let currentTokenCount = 0;

  for (const sentence of sentenceObjects) {
    // Check if adding this sentence would exceed chunk size
    if (
      currentSentences.length >= minSentencesPerChunk &&
      currentTokenCount + sentence.tokenCount > chunkSize
    ) {
      // Create chunk from current sentences
      if (currentSentences.length > 0) {
        chunks.push(createChunk(currentSentences));
      }

      // Handle overlap
      if (chunkOverlap > 0 && currentSentences.length > 1) {
        // Keep some sentences for overlap
        const overlapSentences: Sentence[] = [];
        let overlapTokens = 0;

        for (let i = currentSentences.length - 1; i >= 0; i--) {
          if (overlapTokens + currentSentences[i].tokenCount <= chunkOverlap) {
            overlapSentences.unshift(currentSentences[i]);
            overlapTokens += currentSentences[i].tokenCount;
          } else {
            break;
          }
        }

        currentSentences = overlapSentences;
        currentTokenCount = overlapTokens;
      } else {
        currentSentences = [];
        currentTokenCount = 0;
      }
    }

    currentSentences.push(sentence);
    currentTokenCount += sentence.tokenCount;
  }

  // Add the last chunk if it has sentences
  if (currentSentences.length > 0) {
    chunks.push(createChunk(currentSentences));
  }

  return chunks;
};

/**
 * Create a TextChunk from an array of sentences
 */
const createChunk = (sentences: Sentence[]): TextChunk => {
  const text = sentences.map((s) => s.text).join(" ");
  const startIndex = sentences[0].startIndex;
  const endIndex = sentences[sentences.length - 1].endIndex;
  const tokenCount = sentences.reduce((sum, s) => sum + s.tokenCount, 0);

  return {
    text,
    startIndex,
    endIndex,
    tokenCount,
    sentences,
  };
};

/**
 * Simple chunker function that returns just the text (for compatibility)
 */
export const simpleChunk = (
  input: string,
  options: ChunkOptions = {}
): string[] => {
  try {
    const chunks = chunk(input, options);
    return chunks
      .map((chunk) => chunk.text)
      .filter((text) => text.trim() !== "");
  } catch (error) {
    console.error("Error during chunking:", error);
    // Fallback: simple character-based chunking
    return fallbackChunker(input);
  }
};

/**
 * Fallback chunker for when the main chunker fails
 */
const fallbackChunker = (input: string): string[] => {
  const chunks: string[] = [];
  const chunkSize = 2000; // characters

  for (let i = 0; i < input.length; i += chunkSize) {
    chunks.push(input.substring(i, i + chunkSize));
  }

  return chunks.filter((chunk) => chunk.trim().length > 0);
};
