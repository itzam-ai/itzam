# Itzam Processing API

A comprehensive FastAPI application that provides document processing, chunking, embedding generation, and storage capabilities with Supabase integration, authentication, and real-time updates.

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

**Authentication**: Required  
**Description**: Process a single resource for chunking and optionally generate embeddings. Equivalent to the TypeScript `chunkTask`.

**Request Body:**

```json
{
  "resource": {
    "url": "https://example.com/document.pdf",
    "type": "FILE",
    "mimeType": "application/pdf",
    "fileName": "document.pdf",
    "fileSize": 1024000
  },
  "generateEmbeddings": true,
  "saveToSupabase": true,
  "workflowId": "workflow-456"
}
```

**Response:**

```json
{
  "chunks": ["chunk1 text...", "chunk2 text..."],
  "count": 2,
  "title": "Generated document title",
  "file_size": 1024000,
  "saved_to_supabase": true,
  "chunks_saved": 2,
  "chunk_ids": ["chunk-uuid1", "chunk-uuid2"]
}
```

## Architecture

### Configuration (`app/config.py`)

- Centralized settings management
- Environment variable handling
- Health check utilities

### Schemas (`app/schemas.py`)

- Pydantic models for request/response validation
- Type safety and automatic documentation
- Alias support for camelCase/snake_case conversion

### Database (`app/database.py`)

- Supabase client management
- Database operations (CRUD)
- Real-time channel updates

### Dependencies (`app/dependencies.py`)

- Authentication middleware
- Dependency injection patterns
- Security utilities

### Services (`app/services.py`)

- Business logic implementation
- Document processing workflows
- Embedding generation and storage

### Routers (`app/routers/`)

- Modular endpoint organization
- Route-specific logic
- Clean separation of concerns

## Real-time Updates

The API sends real-time updates via Supabase channels during processing:

**Channel Format**: `knowledge-{knowledgeId}-{files|links}`

**Update Payload**:

```json
{
  "status": "PROCESSED",
  "title": "Document title",
  "chunks": 15,
  "file_size": 1024000,
  "resource_id": "resource-uuid"
}
```

## Database Schema

The API interacts with the following Supabase tables:

### Resources Table

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL, -- 'FILE' or 'LINK'
  url TEXT NOT NULL,
  fileName TEXT,
  mimeType TEXT,
  fileSize INTEGER,
  title TEXT,
  status TEXT DEFAULT 'PROCESSING', -- 'PROCESSING', 'PROCESSED', 'FAILED'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Chunks Table

```sql
CREATE TABLE chunks (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimension
  resourceId UUID REFERENCES resources(id),
  workflowId TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Interactive Documentation

Once the server is running, you can access:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

## Development

### Adding New Endpoints

1. Create a new router in `app/routers/`
2. Define schemas in `app/schemas.py`
3. Add business logic to `app/services.py`
4. Include the router in `app/main.py`

### Testing

```bash
# Test import structure
python -c "from app.main import app; print('✅ Structure OK')"

# Test server startup
uvicorn app.main:app --reload --port 8001
```

## Error Handling

The API includes comprehensive error handling:

- HTTP 401: Authentication required/failed
- HTTP 400: Bad request (invalid data, missing parameters, etc.)
- HTTP 500: Internal server error
- Detailed error messages in response bodies
- Proper logging for debugging
- Real-time error status updates

## Dependencies

- **FastAPI**: Web framework with automatic API documentation
- **Pydantic**: Data validation and serialization
- **Chonkie**: Text chunking library
- **OpenAI**: Embedding generation
- **Supabase**: Database storage and real-time updates
- **Requests**: HTTP client for file downloads
- **Tiktoken**: Tokenization for chunking
- **python-jose**: JWT token handling
- **passlib**: Password hashing utilities

## Deployment Notes

For production deployment:

1. Set up proper environment variables
2. Configure HTTPS for secure token transmission
3. Set up proper logging and monitoring
4. Consider rate limiting for API endpoints
5. Use a production ASGI server like Gunicorn with Uvicorn workers:

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```
