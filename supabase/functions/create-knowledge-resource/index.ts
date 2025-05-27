import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { Itzam } from "itzam";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { openai } from "npm:@ai-sdk/openai@^0.0.66";
import { embedMany } from "npm:ai@^4.0.0";
import { v7 } from "npm:uuid@^11.1.0";
import { z } from "npm:zod@^3.24.2";
import postgres from "postgres";
import { chunk } from "../_shared/chunker.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { chunks, resources } from "../_shared/schema.ts";

const connectionString = Deno.env.get("SUPABASE_DB_URL")!;
const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");
const TIKA_URL = Deno.env.get("TIKA_URL") || "http://localhost:9998/tika";
const ITZAM_API_KEY = Deno.env.get("ITZAM_API_KEY")!;
const ITZAM_API_URL = Deno.env.get("NEXT_PUBLIC_APP_URL")!;

const itzam = new Itzam(ITZAM_API_KEY);

const ResourceSchema = z.object({
  resources: z.array(
    z.object({
      url: z.string(),
      type: z.enum(["FILE", "LINK"]),
      mimeType: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
      id: z.string().uuid().optional(),
    })
  ),
  knowledgeId: z.string(),
  workflowId: z.string(),
});

// UTILITY FUNCTIONS

// return a promise that resolves with a File instance
async function getFileFromString(
  url: string,
  filename: string,
  mimeType: string
) {
  console.log("Getting file from string", {
    url,
    filename,
    mimeType,
  });

  if (isBase64File(url)) {
    const arr = url.split(",");
    const mime = arr[0]?.match(/:(.*?);/)?.[1];
    const bstr = atob(arr[arr.length - 1] ?? "");
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const file = new File([u8arr], filename, { type: mime || mimeType });
    return Promise.resolve(file);
  }

  if (isUrlFile(url)) {
    const file = await fetch(url);

    if (!file.ok) {
      throw new Error("Could not fetch file");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const type = mimeType || file.headers.get("content-type");

    if (!type) {
      throw new Error("Could not determine mime type");
    }

    return new File([buffer], filename, {
      type,
    });
  }

  throw new Error("Invalid file");
}

function isBase64File(file: string) {
  return file.startsWith("data:");
}

function isUrlFile(file: string) {
  return file.startsWith("http://") || file.startsWith("https://");
}

const getChannelId = (resource: any) => {
  return `knowledge-${resource.knowledgeId}-${
    resource.type === "FILE" ? "files" : "links"
  }`;
};

// TIKA CONVERSION
async function convertSingleFile(attachment: {
  file: string;
  mimeType: string;
}): Promise<{ text: string; fileSize: number }> {
  try {
    // Convert string to File object
    const file = await getFileFromString(
      attachment.file,
      "file",
      attachment.mimeType || "application/octet-stream"
    );

    // Send to Tika
    const res = await fetch(TIKA_URL, {
      method: "PUT",
      headers: {
        Accept: "text/plain",
      },
      body: file,
    });

    if (!res.ok) {
      throw new Error(`Failed to convert file: ${res.statusText}`);
    }

    const text = await res.text();
    return { text, fileSize: file.size };
  } catch (err) {
    console.error("Error processing file:", err);
    return { text: "", fileSize: 0 }; // Return empty string for failed conversions
  }
}

async function generateFileTitle(
  text: string,
  originalFileName: string
): Promise<string> {
  // limit text to 1000 characters
  const limitedText = text.slice(0, 1000);
  try {
    const response = await itzam.generateText({
      input: `
        Original file name: ${originalFileName}
        File content: ${limitedText}
        `,
      workflowSlug: "file-title-generator",
    });

    return response.text || originalFileName;
  } catch (error) {
    console.error("Error generating file title:", error);
    return originalFileName;
  }
}

// CHUNKER (using our custom sentence chunker)
const chunker = (input: string): string[] => {
  // Pre-process text to remove excessive whitespace
  input = input.replace(/\s+/g, " ").trim();

  // Remove tabs
  input = input.replace(/\t/g, "");

  // Safety check for extremely large inputs
  const maxInputSize = 1000000; // 1MB character limit
  if (input.length > maxInputSize) {
    console.warn(
      `Input text is very large (${input.length} characters), truncating to ${maxInputSize} characters`
    );
    input = input.substring(0, maxInputSize);
  }

  try {
    // Chunk the text using our custom sentence chunker
    const chunks = chunk(input, {
      chunkSize: 512,
      chunkOverlap: 50,
      minSentencesPerChunk: 1,
      minCharactersPerSentence: 12,
      delim: [". ", "! ", "? ", "\n"],
      includeDelim: "prev",
    });

    console.log(`Generated ${chunks.length} custom chunks`);

    // Extract text from chunk objects and filter empty chunks
    const textChunks = chunks
      .map((chunk) => chunk.text)
      .filter((text) => text.trim() !== "");

    // Additional safety check - limit total number of chunks
    const maxChunks = 1000;
    if (textChunks.length > maxChunks) {
      console.warn(
        `Too many chunks generated (${textChunks.length}), limiting to ${maxChunks}`
      );
      return textChunks.slice(0, maxChunks);
    }

    return textChunks;
  } catch (error) {
    console.error("Error during chunking:", error);
    // Fallback: simple character-based chunking
    return fallbackChunker(input);
  }
};

// Fallback chunker for when the main chunker fails
const fallbackChunker = (input: string): string[] => {
  const chunks: string[] = [];
  const chunkSize = 2000; // characters

  for (let i = 0; i < input.length; i += chunkSize) {
    chunks.push(input.substring(i, i + chunkSize));
  }

  return chunks.filter((chunk) => chunk.trim().length > 0);
};

// MULTIPLE EMBEDDINGS (for files and links)
const generateEmbeddings = async (
  value: string
): Promise<Array<{ embedding: number[]; content: string | undefined }>> => {
  console.log("Chunking value", value);

  const chunks = chunker(value);

  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: chunks,
  });

  console.log("Generated " + embeddings.length + " embeddings");

  return embeddings.map((e: any, i: string | number) => ({
    content: chunks[i],
    embedding: e,
  }));
};

const generateFileTitleForResource = async (
  text: string,
  resource: any,
  db: any
) => {
  let title = "";
  try {
    title = await generateFileTitle(text, resource.fileName ?? "");
  } catch (error) {
    title = resource.fileName ?? "";
    console.error("Error generating file title", error);
  }

  await db
    .update(resources)
    .set({
      title: title,
    })
    .where(eq(resources.id, resource.id));

  return title;
};

// MAIN EMBEDDING CREATION FUNCTION
async function createEmbeddings(
  resource: any,
  workflowId: string,
  db: any,
  supabase: any
) {
  let title = resource.fileName ?? "";

  try {
    // SEND TO TIKA
    const { text: textFromTika, fileSize } = await convertSingleFile({
      file: resource.url,
      mimeType: resource.mimeType,
    });

    // UPDATE RESOURCE WITH FILE SIZE
    await db
      .update(resources)
      .set({ fileSize })
      .where(eq(resources.id, resource.id));

    title = await generateFileTitleForResource(textFromTika, resource, db);

    supabase.channel(getChannelId(resource)).send({
      type: "broadcast",
      event: "update",
      payload: {
        status: "PENDING",
        resourceId: resource.id,
        title,
        chunks: [],
        fileSize,
      },
    });

    if (!textFromTika) {
      throw new Error("No text from Tika");
    }

    // GENERATE EMBEDDINGS
    const embeddings = await generateEmbeddings(textFromTika);

    // SAVE CHUNK TO DB
    const createdChunks = await db
      .insert(chunks)
      .values(
        embeddings.map((embedding) => ({
          ...embedding,
          id: v7(),
          resourceId: resource.id,
          content: embedding.content ?? "",
          workflowId,
        }))
      )
      .returning();

    supabase.channel(getChannelId(resource)).send({
      type: "broadcast",
      event: "update",
      payload: {
        status: "PROCESSED",
        resourceId: resource.id,
        title,
        chunks: createdChunks,
        fileSize,
      },
    });

    await db
      .update(resources)
      .set({ status: "PROCESSED" })
      .where(eq(resources.id, resource.id));
  } catch (error) {
    console.error("Error creating embeddings", error);

    supabase.channel(getChannelId(resource)).send({
      type: "broadcast",
      event: "update",
      payload: {
        status: "FAILED",
        resourceId: resource.id,
        title,
        chunks: [],
        fileSize: 0,
      },
    });

    await db
      .update(resources)
      .set({ status: "FAILED" })
      .where(eq(resources.id, resource.id));
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  } else if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  // Get the session or user object
  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseClient.auth.getUser(token);
  const user = data.user;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    });
  }

  const body = await req.json();
  const parsed = ResourceSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
  // Disable prefetch as it is not supported for "Transaction" pool mode
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  const resourcesCreated = await db
    .insert(resources)
    .values(
      parsed.data.resources.map((resource) => ({
        ...resource,
        id: resource.id ?? v7(),
        knowledgeId: parsed.data.knowledgeId,
      }))
    )
    .returning();

  resourcesCreated.forEach((resource) => {
    EdgeRuntime.waitUntil(
      createEmbeddings(resource, parsed.data.workflowId, db, supabaseClient)
    );
  });

  return new Response(JSON.stringify({ resources: resourcesCreated }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
    status: 200,
  });
});
