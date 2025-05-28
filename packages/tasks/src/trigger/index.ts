// Export all tasks
export { chunkAndEmbedTask } from "./chunk-and-embed";

// Export utilities
export { chunk, simpleChunk } from "./utils/chunker";
export type { ChunkOptions, TextChunk } from "./utils/chunker";
export { getTaskStatus, triggerChunkAndEmbed } from "./utils/trigger-client";
export type { ChunkAndEmbedPayload } from "./utils/trigger-client";

export { tasks } from "@trigger.dev/sdk/v3";
