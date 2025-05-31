# Threads API Documentation

The Threads API allows you to create and manage conversation threads for continuous messaging. Threads are associated with workflows and runs, enabling you to maintain conversation context across multiple AI generations.

## Endpoints

### Create Thread

**POST** `/api/v1/threads`

Creates a new thread for continuous messaging within a specific workflow.

#### Request Body

```json
{
  "name": "My Thread", // optional
  "lookupKey": "user-123-session", // optional
  "workflowSlug": "my_great_workflow" // required
}
```

#### Parameters

- `name` (string, optional): The name of the thread. If not provided, will auto-generate as `thread_{first 10 chars of thread ID}`
- `lookupKey` (string, optional): Optional lookup key for finding the thread later
- `workflowSlug` (string, required): The slug of the workflow this thread belongs to

#### Response

```json
{
  "id": "thread_1234567890",
  "name": "My Thread",
  "lookupKey": "user-123-session",
  "createdAt": "2021-01-01T00:00:00.000Z",
  "updatedAt": "2021-01-01T00:00:00.000Z"
}
```

### Get Thread by ID

**GET** `/api/v1/threads/{id}`

Retrieves a thread by its ID.

#### Parameters

- `id` (string, required): The ID of the thread to retrieve

#### Response

```json
{
  "id": "thread_1234567890",
  "name": "My Thread",
  "lookupKey": "user-123-session",
  "createdAt": "2021-01-01T00:00:00.000Z",
  "updatedAt": "2021-01-01T00:00:00.000Z"
}
```

### Get Thread by Lookup Key

**GET** `/api/v1/threads/lookup/{lookupKey}`

Retrieves a thread by its lookup key.

#### Parameters

- `lookupKey` (string, required): The lookup key of the thread to retrieve

#### Response

```json
{
  "id": "thread_1234567890",
  "name": "My Thread",
  "lookupKey": "user-123-session",
  "createdAt": "2021-01-01T00:00:00.000Z",
  "updatedAt": "2021-01-01T00:00:00.000Z"
}
```

## Using Threads with Generate/Stream Endpoints

**Important**: Generate and stream requests now require **either** a `workflowSlug` **or** a `threadId`. You cannot omit both.

### Option 1: Using workflowSlug directly

**POST** `/api/v1/generate/text`

```json
{
  "input": "Hello, how are you?",
  "workflowSlug": "my-workflow"
}
```

### Option 2: Using threadId (workflow is inferred from thread)

**POST** `/api/v1/generate/text`

```json
{
  "input": "Continue our conversation",
  "threadId": "thread_1234567890"
}
```

### Option 3: Using both (threadId takes precedence for workflow resolution)

**POST** `/api/v1/generate/text`

```json
{
  "input": "Hello, how are you?",
  "workflowSlug": "my-workflow",
  "threadId": "thread_1234567890"
}
```

## Usage Examples

### Creating a Thread and Using it for Continuous Conversation

```javascript
// 1. Create a thread
const threadResponse = await fetch('https://itz.am/api/v1/threads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Api-Key': 'your-api-key'
  },
  body: JSON.stringify({
    name: 'Customer Support Chat', // optional
    lookupKey: 'user-123-support', // optional
    workflowSlug: 'customer-support' // required
  })
});

const thread = await threadResponse.json();
// Response: { id: "thread_abc123def4", name: "Customer Support Chat", ... }

// 2. Use the thread for multiple generations (no need to specify workflowSlug)
const firstMessage = await fetch('https://itz.am/api/v1/generate/text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Api-Key': 'your-api-key'
  },
  body: JSON.stringify({
    input: 'Hello, I need help with my account',
    threadId: thread.id // workflow is automatically inferred
  })
});

const secondMessage = await fetch('https://itz.am/api/v1/generate/text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Api-Key': 'your-api-key'
  },
  body: JSON.stringify({
    input: 'Can you help me reset my password?',
    threadId: thread.id // Same thread for continuity
  })
});
```

### Auto-generated Thread Names

```javascript
// Create thread without name
const response = await fetch('https://itz.am/api/v1/threads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Api-Key': 'your-api-key'
  },
  body: JSON.stringify({
    workflowSlug: 'my-workflow'
    // name is omitted
  })
});

const thread = await response.json();
// Response: { id: "thread_abc123def4", name: "thread_abc123def4", ... }
// Name is auto-generated as "thread_" + first 10 chars of ID
```

### Using workflowSlug without threads

```javascript
// Direct workflow usage (no thread continuity)
const response = await fetch('https://itz.am/api/v1/generate/text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Api-Key': 'your-api-key'
  },
  body: JSON.stringify({
    input: 'One-off generation',
    workflowSlug: 'my-workflow'
  })
});
```

## Database Schema

### `thread` table
- `id`: Primary key (varchar)
- `name`: Thread name (varchar) - auto-generated if not provided
- `lookup_key`: Optional lookup key for easy retrieval (varchar, unique)
- `workflow_id`: Reference to the workflow (varchar, required)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### `run` table (updated)
- `id`: Primary key (varchar)
- `thread_id`: Reference to the thread (varchar, optional)
- `origin`: Run origin (enum: 'SDK', 'WEB')
- `status`: Run status (enum: 'RUNNING', 'COMPLETED', 'FAILED')
- `input`: Input text (text)
- `output`: Output text (text)
- `prompt`: Prompt used (text)
- `input_tokens`: Number of input tokens (integer)
- `output_tokens`: Number of output tokens (integer)
- `cost`: Cost of the run (decimal)
- `duration_in_ms`: Duration in milliseconds (integer)
- `model_id`: Reference to the AI model used (varchar)
- `workflow_id`: Reference to the workflow (varchar)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### `workflow` table (existing)
- Has many threads through `workflow_id` foreign key

## Key Features

1. **Thread-Workflow Association**: Every thread belongs to a specific workflow
2. **Flexible Generation**: Use either `workflowSlug` or `threadId` in generate/stream requests
3. **Conversation Continuity**: Multiple runs in the same thread maintain conversation context
4. **Auto-generated Names**: Thread names are auto-generated if not provided
5. **Lookup Keys**: Optional lookup keys make it easy to find threads by custom identifiers
6. **Workflow Inference**: When using `threadId`, the workflow is automatically inferred from the thread
7. **OpenAPI Documentation**: All endpoints are properly documented for the API spec

## Validation Rules

1. **Thread Creation**: `workflowSlug` is required
2. **Generate/Stream**: Either `workflowSlug` OR `threadId` is required (cannot omit both)
3. **Thread Names**: Auto-generated as `thread_{first 10 chars of ID}` if not provided
4. **Workflow Validation**: The specified workflow must exist and be accessible

## Authentication

All endpoints require authentication using an API key in the `Api-Key` header.

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (validation errors, missing required fields)
- `401`: Unauthorized (invalid API key)
- `404`: Not Found (thread/workflow not found)
- `500`: Internal Server Error

Error responses include a descriptive error message:

```json
{
  "error": "Either workflowSlug or threadId is required"
}
``` 