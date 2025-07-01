# Itzam Python Processing Service

This is a FastAPI-based document processing service that handles text extraction, chunking, and embeddings generation.

## Docker Build

### CPU-Only Build (Recommended)

The default Dockerfile uses CPU-only dependencies to avoid GPU compatibility issues:

```bash
docker build . -f Dockerfile -t itzam-python
```

This uses `requirements-cpu.txt` which excludes:

- `triton` - GPU acceleration library
- All `nvidia-*` CUDA dependencies
- Other GPU-specific packages

### GPU Build (Advanced)

If you need GPU acceleration and have compatible hardware:

```bash
# Use the original requirements with GPU dependencies
docker build . -f Dockerfile --build-arg REQUIREMENTS_FILE=requirements.txt -t itzam-python-gpu
```

## Architecture Compatibility

The CPU-only build works on both:

- ARM64 (Apple Silicon, some cloud providers)
- AMD64/x86_64 (Intel, most cloud providers)

This eliminates the "exec format error" that occurs when using platform-specific builds.

## Dependencies

The service primarily uses:

- **FastAPI** - Web framework
- **Docling** - Document processing with VLM image descriptions
- **Chonkie** - Text chunking and embeddings
- **Supabase** - Database and storage
- **OpenAI** - Embeddings generation

## Endpoints

- `GET /` - Health check
- `POST /api/v1/create-resource` - Process documents with embeddings
- `GET /health` - Service health status
- `POST /api/v1/rescrape` - Reprocess existing resources

## Project Structure

```
apps/python/
├── app/                    # Main application package
│   ├── __init__.py        # Package initialization
│   ├── main.py            # FastAPI app creation and configuration
│   ├── config.py          # Settings and environment configuration
│   ├── schemas.py         # Pydantic models for request/response validation
│   ├── database.py        # Supabase client and database operations
│   ├── dependencies.py    # Dependency injection (auth, etc.)
│   ├── services.py        # Business logic and processing services
│   └── routers/           # API route handlers
│       ├── __init__.py
│       ├── health.py      # Health check endpoints
│       └── resources.py   # Resource management endpoints
├── main.py                # Application entry point
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Features

- **Document Processing**: Extract text from various file formats using Apache Tika
- **Text Chunking**: Intelligent text chunking using token-based splitting
- **Embedding Generation**: Generate embeddings using OpenAI's text-embedding-3-small model
- **Database Storage**: Store chunks and embeddings directly to Supabase
- **Authentication**: Supabase JWT token authentication
- **Real-time Updates**: Send status updates via Supabase channels
- **Resource Management**: Create and manage resources with workflow tracking
- **RESTful API**: Clean REST endpoints with proper validation and error handling
- **Modular Architecture**: Well-organized FastAPI structure following best practices

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set up environment variables:

```bash
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_ANON_KEY="your-supabase-anon-key"
export OPENAI_API_KEY="your-openai-api-key"  # Required for embeddings
```

3. Run the application:

```bash
# Option 1: Direct Python execution
python main.py

# Option 2: Using uvicorn directly
uvicorn main:app --reload

# Option 3: Using uvicorn with the app module
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## Authentication

All main endpoints require a valid Supabase JWT token in the Authorization header:

```bash
Authorization: Bearer your-supabase-jwt-token
```

## API Endpoints

### Health Check

```
GET /health/
```

Returns the health status of the API and checks for required environment variables.

### Root Status

```
GET /
```

Returns basic API status information.

### Create Resource Task

```
POST /api/v1/create-resource
```

**Authentication**: Required  
**Description**: Create and process multiple resources with automatic chunking, embedding generation, and database storage. Equivalent to the TypeScript `createResourceTask`.

**Request Body:**

```json
{
  "resources": [
    {
      "url": "https://example.com/document.pdf",
      "type": "FILE",
      "mimeType": "application/pdf",
      "fileName": "document.pdf",
      "fileSize": 1024000,
      "id": "optional-uuid"
    },
    {
      "url": "https://example.com/webpage",
      "type": "LINK",
      "id": "optional-uuid"
    }
  ],
  "knowledgeId": "knowledge-123",
  "workflowId": "workflow-456",
  "userId": "user-789"
}
```

**Response:**

```json
{
  "success": true,
  "resources": [...],
  "results": [
    {
      "resource_id": "uuid",
      "title": "Generated title",
      "chunks_count": 15,
      "status": "PROCESSED",
      "saved_to_supabase": true,
      "error": null
    }
  ],
  "summary": {
    "total": 2,
    "processed": 1,
    "failed": 1
  }
}
```

### Chunk Task

```
POST /api/v1/chunk
```
