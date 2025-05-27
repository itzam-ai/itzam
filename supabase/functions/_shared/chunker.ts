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

  // Split and process sentences
  const splits = t.split(sep);
  const sentences: string[] = [];
  let current = "";

  for (const s of splits) {
    if (!current) {
      current = s;
    } else {
      if (current.length >= minCharactersPerSentence) {
        sentences.push(current);
        current = s;
      } else {
        current += s;
      }
    }
  }

  if (current) {
    sentences.push(current);
  }

  return sentences;
};

/**
 * Prepare sentences with their positions and token counts.
 */
const prepareSentences = (
  text: string,
  options: Required<ChunkOptions>
): Sentence[] => {
  const sentenceTexts = splitText(
    text,
    options.delim,
    options.includeDelim,
    options.minCharactersPerSentence,
    options.chunkSize
  );

  if (!sentenceTexts.length) {
    return [];
  }

  // Calculate positions
  const positions: number[] = [];
  let currentPos = 0;
  for (const sent of sentenceTexts) {
    positions.push(currentPos);
    currentPos += sent.length;
  }

  // Create sentence objects with token counts
  return sentenceTexts.map((sent, i) => ({
    text: sent,
    startIndex: positions[i],
    endIndex: positions[i] + sent.length,
    tokenCount: approximateTokenCount(sent),
  }));
};

/**
 * Create a chunk from a list of sentences.
 */
const createChunk = (sentences: Sentence[]): TextChunk => {
  const chunkText = sentences.map((sentence) => sentence.text).join("");
  const tokenCount = approximateTokenCount(chunkText);

  return {
    text: chunkText,
    startIndex: sentences[0].startIndex,
    endIndex: sentences[sentences.length - 1].endIndex,
    tokenCount,
    sentences,
  };
};

/**
 * Split a large chunk into smaller pieces as a last resort
 */
const splitLargeChunk = (text: string, maxTokens: number): string[] => {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining && approximateTokenCount(remaining) > maxTokens) {
    // Try to split on natural boundaries first
    const boundaries = ["\n\n", "\n", ". ", "! ", "? ", ", ", " "];
    let bestSplit = -1;

    for (const boundary of boundaries) {
      const targetLength = Math.floor(maxTokens * 4); // Rough character estimate
      const searchStart = Math.max(0, targetLength - 200);
      const searchEnd = Math.min(remaining.length, targetLength + 200);
      const searchText = remaining.substring(searchStart, searchEnd);
      const boundaryIndex = searchText.lastIndexOf(boundary);

      if (boundaryIndex > 0) {
        bestSplit = searchStart + boundaryIndex + boundary.length;
        break;
      }
    }

    // If no good boundary found, force split at estimated character limit
    if (bestSplit === -1) {
      bestSplit = Math.floor(maxTokens * 4);
    }

    bestSplit = Math.min(bestSplit, remaining.length);
    chunks.push(remaining.substring(0, bestSplit));
    remaining = remaining.substring(bestSplit);
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks.filter((chunk) => chunk.trim().length > 0);
};

/**
 * Split text into overlapping chunks based on sentences while respecting token limits.
 *
 * @param text - The text to split into chunks
 * @param options - Configuration options for chunking
 * @returns Array of text chunks
 *
 * @example
 * ```typescript
 * const chunks = chunk("This is a sample text. It has multiple sentences.", {
 *   chunkSize: 100,
 *   chunkOverlap: 20
 * });
 * ```
 */
export const chunk = (
  text: string,
  options: ChunkOptions = {}
): TextChunk[] => {
  // Set defaults
  const config: Required<ChunkOptions> = {
    chunkSize: 512,
    chunkOverlap: 0,
    minSentencesPerChunk: 1,
    minCharactersPerSentence: 12,
    delim: [". ", "! ", "? ", "\n"],
    includeDelim: "prev",
    ...options,
  };

  // Validate options
  if (config.chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }
  if (config.chunkOverlap < 0) {
    throw new Error("chunkOverlap must be non-negative");
  }
  if (config.chunkOverlap >= config.chunkSize) {
    throw new Error("chunkOverlap must be less than chunkSize");
  }
  if (config.minSentencesPerChunk <= 0) {
    throw new Error("minSentencesPerChunk must be greater than 0");
  }
  if (config.minCharactersPerSentence <= 0) {
    throw new Error("minCharactersPerSentence must be greater than 0");
  }

  if (!text.trim()) {
    return [];
  }

  // Get prepared sentences with token counts
  const sentences = prepareSentences(text, config);
  if (!sentences.length) {
    return [];
  }

  // Pre-calculate cumulative token counts for binary search
  const tokenSums: number[] = [];
  let sum = 0;
  for (const sentence of sentences) {
    tokenSums.push(sum);
    sum += sentence.tokenCount;
  }
  tokenSums.push(sum);

  const chunks: TextChunk[] = [];
  let pos = 0;

  while (pos < sentences.length) {
    // Use binary search to find initial split point
    const targetTokens = tokenSums[pos] + config.chunkSize;
    let splitIdx = bisectLeft(tokenSums, targetTokens, pos) - 1;
    splitIdx = Math.min(splitIdx, sentences.length);

    // Ensure we include at least one sentence beyond pos
    splitIdx = Math.max(splitIdx, pos + 1);

    // Handle minimum sentences requirement
    if (splitIdx - pos < config.minSentencesPerChunk) {
      if (pos + config.minSentencesPerChunk <= sentences.length) {
        splitIdx = pos + config.minSentencesPerChunk;
      } else {
        console.warn(
          `Minimum sentences per chunk as ${config.minSentencesPerChunk} could not be met for all chunks. ` +
            `Last chunk of the text will have only ${sentences.length - pos} sentences. ` +
            "Consider increasing the chunkSize or decreasing the minSentencesPerChunk."
        );
        splitIdx = sentences.length;
      }
    }

    // Create chunk from sentences
    const chunkSentences = sentences.slice(pos, splitIdx);
    const chunk = createChunk(chunkSentences);

    // Safety check: if a single chunk is still too large, split it further
    if (chunk.tokenCount > config.chunkSize * 2) {
      console.warn(
        `Large chunk detected (${chunk.tokenCount} tokens), attempting to split further`
      );
      const subChunks = splitLargeChunk(chunk.text, config.chunkSize);
      for (const subChunkText of subChunks) {
        chunks.push({
          text: subChunkText,
          startIndex: chunk.startIndex,
          endIndex: chunk.startIndex + subChunkText.length,
          tokenCount: approximateTokenCount(subChunkText),
          sentences: [], // Sub-chunks don't maintain sentence structure
        });
      }
    } else {
      chunks.push(chunk);
    }

    // Calculate next position with overlap
    if (config.chunkOverlap > 0 && splitIdx < sentences.length) {
      // Calculate how many sentences we need for overlap
      let overlapTokens = 0;
      let overlapIdx = splitIdx - 1;

      while (overlapIdx > pos && overlapTokens < config.chunkOverlap) {
        const sent = sentences[overlapIdx];
        const nextTokens = overlapTokens + sent.tokenCount + 1; // +1 for space
        if (nextTokens > config.chunkOverlap) {
          break;
        }
        overlapTokens = nextTokens;
        overlapIdx--;
      }

      // Move position to after the overlap
      pos = overlapIdx + 1;
    } else {
      pos = splitIdx;
    }
  }

  return chunks;
};
