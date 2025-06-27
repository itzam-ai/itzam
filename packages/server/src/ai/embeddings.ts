import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import {
  and,
  cosineDistance,
  desc,
  eq,
  gt,
  inArray,
  or,
  sql,
} from "drizzle-orm";
import { db } from "../db";
import { chunks, contexts, resources } from "../db/schema";

const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");
const CHUNKS_RETRIEVE_LIMIT = 4;
const SIMILARITY_THRESHOLD = 0.4;

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
  knowledgeId: string,
  contextSlugs: string[],
  workflowId: string
) => {
  // Generating embedding for user query
  const userQueryEmbedded = await generateEmbedding(userQuery);

  // Calculating similarity between user query and chunks
  const similarity = sql<number>`1 - (${cosineDistance(
    chunks.embedding,
    userQueryEmbedded
  )})`;

  // If contextSlugs is provided, find the context ids and add to where clause
  const contextIds = await db
    .select({ id: contexts.id })
    .from(contexts)
    .where(inArray(contexts.slug, contextSlugs))
    .then((res) => res.map((r) => r.id));

  // Retrieving chunks with similarity greater than SIMILARITY_THRESHOLD
  const similarChunks = await db
    .select({
      content: chunks.content,
      similarity,
      resourceId: chunks.resourceId,
    })
    .from(chunks)
    .innerJoin(resources, eq(chunks.resourceId, resources.id))
    .where(
      and(
        gt(similarity, SIMILARITY_THRESHOLD),
        eq(chunks.workflowId, workflowId),
        eq(chunks.active, true),
        // Finding chunks that are in the knowledge or in one of the contexts
        or(
          eq(resources.knowledgeId, knowledgeId),
          contextIds.length > 0
            ? inArray(resources.contextId, contextIds)
            : sql`false`
        )
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
