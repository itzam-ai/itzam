# Chonkie OpenAIEmbeddings Migration

This document outlines the refactoring of Itzam's embedding pipeline to use [Chonkie's OpenAIEmbeddings](https://docs.chonkie.ai/python-sdk/getting-started/introduction) for a more unified and efficient chunking and embedding workflow, with direct [Supabase](https://supabase.com/docs/reference/python/installing) saving capabilities.

## Overview

Previously, Itzam used separate libraries for chunking and embedding:
- **Chunking**: Chonkie's `TokenChunker` in Python
- **Embedding**: AI SDK's `embedMany` in TypeScript
- **Saving**: TypeScript handles database operations

After refactoring, we now have a unified approach using Chonkie for both operations, with optional direct Supabase saving from Python, reducing data transfer overhead.

## Changes Made

### 1. Python Dependencies (`packages/tasks/src/python/requirements.txt`)
```diff
- chonkie==1.0.8
+ chonkie[openai]==1.0.8
+ supabase==2.9.1
```

### 2. Python Chunking Script (`packages/tasks/src/python/chunk.py`)
**New Features:**
- Added `OpenAIEmbeddings` import from Chonkie
- Added Supabase Python client for direct database operations
- Optional embedding generation based on command-line argument
- **Direct Supabase saving** to eliminate large data transfers
- Environment variable support for OpenAI API key and Supabase credentials
- Graceful error handling for embedding and database failures

**Usage:**
```bash
# Chunking only (original behavior)
python chunk.py <url> <mime_type> <tika_url>

# Chunking + embeddings (return to TypeScript)
python chunk.py <url> <mime_type> <tika_url> true

# Chunking + embeddings + direct Supabase save
python chunk.py <url> <mime_type> <tika_url> true <resource_id> <workflow_id> true
```

### 3. Enhanced Chunk Task (`packages/tasks/src/trigger/chunk.ts`)
**Unified Implementation:**
- Modified existing `chunkTask` to support optional embedding generation
- Added `saveToSupabase` parameter for direct database operations
- Added `workflowId` parameter for Supabase saving
- Enhanced logging and tracing for all modes

**Usage:**
```typescript
// Chunking only (original behavior)
const chunks = await chunkTask.triggerAndWait({ resource });

// Chunking + embeddings (return embeddings)
const result = await chunkTask.triggerAndWait({ 
  resource, 
  generateEmbeddings: true 
});

// Chunking + embeddings + direct Supabase save
const result = await chunkTask.triggerAndWait({ 
  resource, 
  generateEmbeddings: true,
  saveToSupabase: true,
  workflowId: "workflow-123"
});
```

### 4. Resource Creation Pipeline (`packages/tasks/src/trigger/create-resource.ts`)
**Improved Strategy:**
1. **Primary**: Use enhanced `chunkTask` with `saveToSupabase: true` for direct database operations
2. **Fallback 1**: Use `chunkTask` with `generateEmbeddings: true` + TypeScript database save
3. **Fallback 2**: Use `chunkTask` with `generateEmbeddings: false` + AI SDK embeddings
4. **Logging**: Track which method was used for monitoring

## Benefits

### 🚀 Performance
- **Unified Processing**: Single Python call for chunking + embeddings + database save
- **Reduced Data Transfer**: No need to transfer large embedding arrays to TypeScript
- **Optimized Pipeline**: Chonkie's native integration with direct database operations
- **Lower Memory Usage**: Embeddings are saved immediately rather than held in memory

### 🔧 Consistency
- **Single Library**: Chonkie handles both chunking and embedding
- **Direct Database Operations**: Python handles the complete pipeline
- **Simplified Architecture**: One task handles all operations with flexible parameters

### 🛡️ Reliability
- **Multi-layer Fallback**: Three levels of fallback ensure maximum reliability
- **Graceful Degradation**: Each failure automatically tries the next approach
- **Backward Compatibility**: Existing workflows continue to work unchanged
- **Transaction Safety**: Database operations are handled atomically

## Implementation Details

### Enhanced Chunk Task with Supabase Saving
```typescript
// The chunk task now supports all modes
export const chunkTask = task({
  id: "chunk",
  run: async ({ 
    resource, 
    generateEmbeddings = false,
    saveToSupabase = false,
    workflowId,
  }: { 
    resource: Resource; 
    generateEmbeddings?: boolean;
    saveToSupabase?: boolean;
    workflowId?: string;
  }) => {
    // ... implementation handles chunking, embeddings, and optional Supabase saving
  }
});
```

### Primary Path (Chonkie + Supabase Direct Save)
```python
from chonkie import TokenChunker
from chonkie.embeddings import OpenAIEmbeddings
from supabase import create_client

# Initialize components
chunker = TokenChunker(tokenizer)
embeddings_model = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key=os.getenv("OPENAI_API_KEY")
)
supabase = create_client(url, key)

# Process and save in one operation
chunks = chunker(content)
embeddings = embeddings_model.embed_documents(chunk_texts)
supabase.table("chunks").insert(chunk_records).execute()
```

### Fallback Paths
```typescript
// Fallback 1: Chonkie embeddings + TypeScript save
const result = await chunkTask.triggerAndWait({ 
  resource, 
  generateEmbeddings: true,
  saveToSupabase: false
});
// Then save via TypeScript

// Fallback 2: AI SDK approach
const chunks = await chunkTask.triggerAndWait({ 
  resource, 
  generateEmbeddings: false 
});
const { embeddings } = await embedMany({ model, values: chunks });
// Then save via TypeScript
```

## Monitoring and Metrics

The refactoring includes enhanced logging to track:
- Which embedding method was used (`chonkie-openai-supabase`, `chonkie-openai`, `ai-sdk-fallback`)
- Whether data was saved directly to Supabase or via TypeScript
- Processing times for each approach including database operations
- Error rates and fallback frequency for each level
- Data transfer sizes and memory usage optimization

## Environment Variables

Required environment variables for full functionality:
```bash
# OpenAI (for embeddings)
OPENAI_API_KEY=your_openai_api_key

# Supabase (for direct saving)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Tika (for text extraction)
TIKA_URL=http://localhost:9998/tika
```

## Future Considerations

### Full Migration Options
1. **Server Embeddings** (`packages/server/src/ai/embeddings.ts`):
   - Could be migrated to use Chonkie for consistency
   - Reference implementation available in `packages/server/src/ai/chonkie-embeddings.ts`

2. **Supabase Functions** (`supabase/functions/create-knowledge-resource/index.ts`):
   - Could use Chonkie for unified Deno runtime
   - Would require Deno-compatible Chonkie installation

### Performance Optimization
- Monitor data transfer reduction from direct Supabase saves
- A/B test direct save vs TypeScript save performance
- Optimize batch sizes for Supabase insertions

## Rollback Plan

If issues arise, the system can be rolled back by:
1. Setting environment variables to disable Chonkie embeddings and Supabase saving
2. The multi-layer fallback mechanism ensures zero downtime
3. Monitoring will show 100% fallback usage indicating successful rollback

## Getting Started

1. **Environment Setup**: 
   - Ensure `OPENAI_API_KEY` is available in Python environment
   - Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` for direct saving
2. **Dependencies**: Install updated Python requirements with Supabase client
3. **Deployment**: Deploy with all fallbacks enabled for safety
4. **Monitoring**: Watch logs for method usage and performance metrics
5. **Optimization**: Tune Chonkie and Supabase settings based on performance data

## References

- [Chonkie Documentation](https://docs.chonkie.ai/python-sdk/getting-started/introduction)
- [Chonkie OpenAI Embeddings](https://docs.chonkie.ai/embeddings/openai-embeddings)
- [Supabase Python Client](https://supabase.com/docs/reference/python/installing)
- [Chonkie GitHub Repository](https://github.com/chonkie-inc/chonkie) 