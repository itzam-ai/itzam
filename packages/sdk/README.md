# Itzam SDK

[![npm version](https://badge.fury.io/js/itzam.svg)](https://badge.fury.io/js/itzam)

Itzam provides tools for seamlessly integrating AI into your applications. With Itzam, you can manage AI workflows without mixing AI logic into your business code, allowing both technical and non-technical team members to control AI features through a simple dashboard interface.

## Features

- 🤖 **Model Hot Swap** - Change AI models or settings instantly without code changes
- 💬 **Prompt Hot Swap** - Update prompts on the fly and compare outputs
- 💳 **Unified Billing** - Manage all AI spending in one place
- 🔌 **Simple Integration** - Add AI features with just a few lines of code
- 🗃️ **Context Management** _(coming soon)_ - Easily manage AI context including docs, images, and more
- 📐 **Custom Rules** _(coming soon)_ - Create automated rules for model switching and workflow management

## Installation

```bash
npm install itzam
# or
yarn add itzam
# or
pnpm add itzam
```

## Quick Start

1. Create a workflow in the [Itzam Dashboard](https://dashboard.itzam.ai)
2. Get your API key and workflow slug
3. Integrate Itzam into your application:

```typescript
import { Itzam } from "itzam";

// Initialize the client
const itzam = new Itzam("your-api-key");

// Or with custom base URL
const itzam = new Itzam("your-api-key", {
  basePath: "https://your-custom-api-url.com"
});

// Use your workflow
const response = await itzam.generateText({
  input: "Your input text here",
  workflowSlug: "your-workflow-slug",
});

console.log(response.output);
```

## Configuration

The Itzam SDK can be configured with the following options:

```typescript
const itzam = new Itzam("your-api-key", {
  basePath: "https://your-custom-api-url.com" // Optional: Custom API base URL
});
```

### Configuration Options

- `basePath` (optional): Custom base URL for the API. Defaults to the `NEXT_PUBLIC_APP_URL` environment variable if not provided.

## Example: Building an AI Support Chat

Here's how to create an AI-powered support chat using Itzam:

1. **Dashboard Setup**

   - Create a "Support Chat" workflow in the Itzam Dashboard
   - Configure your preferred AI model (GPT, Claude, Gemini)
   - Set up your prompt and context
   - Get your workflow slug and API key

2. **Code Integration**

```typescript
import { Itzam } from "itzam";

const itzam = new Itzam("your-api-key");

// Handle user messages
const handleUserMessage = async (userInput: string) => {
  const response = await itzam.generateText({
    input: userInput,
    workflowSlug: "support-chat",
  });

  return response.output;
};
```

## Why Itzam?

- **Separation of Concerns** - Keep AI logic separate from your business logic
- **No-Code Management** - Empower non-technical team members to manage AI workflows
- **Future-Proof** - Easily switch between AI models as technology evolves
- **Instant Updates** - Change prompts and settings without redeploying your application

## Documentation

For detailed documentation, visit our [official documentation](https://docs.itz.am).

## Support

- Email: support@itzam.ai
