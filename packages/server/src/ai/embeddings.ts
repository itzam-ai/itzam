import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "../db";
import { chunks } from "../db/schema";

const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");
const CHUNKS_RETRIEVE_LIMIT = 4;
const SIMILARITY_THRESHOLD = 0.5;

export type Chunk = typeof chunks.$inferSelect;

// SINGLE EMBEDDING (for user prompt)
export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: input,
  });
  return embedding;
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
