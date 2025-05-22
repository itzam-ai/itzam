import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { v7 } from "uuid";
import { db } from "../db";
import { Resource } from "../db/knowledge/actions";
import { chunks, resources } from "../db/schema";
import { createClient } from "../db/supabase/server";
import { generateFileTitle } from "../itzam/file-title-generator";
import { convertSingleFile } from "./tika";

const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");
const CHUNKS_RETRIEVE_LIMIT = 4;
const SIMILARITY_THRESHOLD = 0.2;

// PARSE RESOURCE AND CREATE EMBEDDINGS
export async function createEmbeddings(resource: Resource, workflowId: string) {
  try {
    // SEND TO TIKA
    const textFromTika = await convertSingleFile({
      file: resource.url,
      mimeType: resource.mimeType,
    });

    const title = await generateFileTitleForResource(textFromTika, resource);

    if (!textFromTika) {
      throw new Error("No text from Tika");
    }

    // GENERATE EMBEDDINGS
    const embeddings = await generateEmbeddings(textFromTika);

    // SAVE CHUNK TO DB
    await db.insert(chunks).values(
      embeddings.map((embedding) => ({
        ...embedding,
        id: v7(),
        resourceId: resource.id,
        content: embedding.content ?? "",
        workflowId,
      }))
    );
    const supabase = await createClient();
    supabase.channel(`knowledge-${resource.knowledgeId}`).send({
      type: "broadcast",
      event: "update",
      payload: { status: "PROCESSED", resourceId: resource.id, title },
    });

    await db
      .update(resources)
      .set({ status: "PROCESSED" })
      .where(eq(resources.id, resource.id));
  } catch (error) {
    console.error("Error creating embeddings", error);
    await db
      .update(resources)
      .set({ status: "FAILED" })
      .where(eq(resources.id, resource.id));
  }
}
// MUTIPLE EMBEDDINGS (for files and links)
export const generateEmbeddings = async (
  value: string
): Promise<Array<{ embedding: number[]; content: string | undefined }>> => {
  console.log("Chunking value", value);

  const chunks = chunker(value);

  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: chunks,
  });

  console.log("generated " + embeddings.length + " embeddings");

  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

// SINGLE EMBEDDING (for user prompt)
export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: input,
  });
  return embedding;
};

// CHUNKER (currently splits by new line)
const chunker = (input: string): string[] => {
  // Pre-process text to remove excessive whitespace
  input = input.replace(/\s+/g, " ").trim();

  // Remove tabs
  input = input.replace(/\t/g, "");

  return input
    .trim()
    .split(/\n\n\n+/) // split
    .filter((i) => i !== "");
};

// FIND RELEVANT CONTENT FOR USER QUERY
export const findRelevantContent = async (
  userQuery: string,
  workflowId: string
) => {
  // Generating embedding for user query
  const userQueryEmbedded = await generateEmbedding(userQuery);

  // Calculating similarity between user query and chunks
  const similarity = sql<number>`1 - (${cosineDistance(
    chunks.embedding,
    userQueryEmbedded
  )})`;

  // Retrieving chunks with similarity greater than SIMILARITY_THRESHOLD
  const similarChunks = await db
    .select({
      content: chunks.content,
      similarity,
      resourceId: chunks.resourceId,
    })
    .from(chunks)
    .where(
      and(
        gt(similarity, SIMILARITY_THRESHOLD),
        eq(chunks.workflowId, workflowId),
        eq(chunks.active, true)
      )
    )
    .orderBy((t) => desc(t.similarity))
    .limit(CHUNKS_RETRIEVE_LIMIT);

  // Getting resource ids from similar chunks to add to run (removing duplicates)
  const resourceIds = [
    ...new Set(
      similarChunks.map((chunk) => chunk.resourceId).filter((id) => id !== null)
    ),
  ];

  return {
    similarChunks,
    resourceIds,
  };
};

export const generateFileTitleForResource = async (
  text: string,
  resource: Resource
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
