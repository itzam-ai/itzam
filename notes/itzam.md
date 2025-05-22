# Itzam

[Itzam](https://itz.am/) is an open source platform for integrating AI.

## What Itzam does?

We help developers **create AI applications**.

What this means?

- Swap models automatically or with one click;
- Change the current prompt easily;
- Great DX, integrate in 2 minutes;
- And much more… (see more features below)

## Principles

<aside>
🚫

Remove AI logic from your code.

</aside>

<aside>
👥

AI should be easy to manage.

</aside>

<aside>
🤖

Use AI, not a specific model.

</aside>

## Current Problems

### 👨🏻‍💻  DX is horrible

Other platforms don't provide a good developer experience to the engineer integrating AI.

### 🤖  New models

You blinked and a new model appeared. Changing models is painful because you have provider lock-in, test phase and change code.

### 🔃  Changing is hard

Having AI logics mixed in your code can become a problem. Besides that, changing anything - model, prompt, context - would require a redeploy.

## How we solve them?

### ⚙️ AI Dashboard

Our dashboard makes it easier to manage AI workflows without touching code. Configure everything - model, prompt, context, etc - through a simple interface.

### ⚡ Hot Swap

We handle model integrations and updates, so you can switch to newer, better models with one click.

### 👨🏻‍💻 4 lines to Integrate

Our API & SDKs make integrating AI into your app a matter of 4 lines of code.

## How it works

We are divided into 2 components: the Itzam Dashboard and the API & SDKs.

---

For example, let's imagine you want to create a support chat in your landing page and want it to be powered by AI.

Here’s how you would do this with Itzam:

### Dashboard

Everything starts in the dashboard, where you will create a Workflow. A Workflow represents a functionality in your app, in this case, the support chat.

1. Create a Workflow called “Support Chat”.
2. Inside your Workflow you can configure:
   - AI model (GPT o3, Claude 3.7, Gemini 2.5)
   - Model settings (style, response length)
   - Prompt (e.g. “You are a customer support agent from Acme Inc…”)
   - Knowledge (what the model will use as context, e.g. company docs, links)
3. Great, now grab this Workflow’s slug and an API key in the dashboard and let's integrate!

### API & SDKs

Now it’s time to add the Workflow to your app.

1. Use the API key to authenticate:

   ```jsx
   import { Itzam } from "itzam";

   const itzam = new Itzam("my-great-api-key");
   ```

2. Use the Workflow’s slug to run it with your user’s input:

   ```jsx
   const response = await itzam.generateText({
     input: "I am having trouble finding your documentation...",
     workflowSlug: "support-chat",
   });

   console.log(response.text);
   // > "Follow this link to access our documentation: acme.com/docs"
   ```

## Features

### 🤖 Model Hot Swap

Change the current model - or the model settings - instantly.

### 💬 Prompt Management

Change the prompt instantly and compare the output with other executions.

### 💳 Costs & Usage

Track all your AI spending in one place.

### 👨🏻‍💻 Easy SDKs & API

Integrate AI in your product with 4 lines of code.

### 🛝  Playground

Tweak and test your workflow in the playground.

### 🧠 Knowledge

Manage the context - docs, images, links, texts - you want to give to the AI for each workflow.

## Next features

### 🖼️ Attachments

Send attachments - docs, images - via API & SDKs.

### 📐 Rules

Create custom rules for each workflow.

e.g. if AI bill is over $50 → switch to a cheaper model.

### ✨  Model Recommendation

Get recommendations on the best model (balancing cost, latency, and intelligence).

### 🚧  Guardrails

Create limits for the AI’s response.

## Links

- Itzam: [itz.am](http://itz.am)
- Itzam Docs: [docs.itz.am](http://docs.itz.am)
- Roadmap: [itz.am/roadmap](https://itz.am/roadmap)
- AI Landscape: [link](https://docs.google.com/spreadsheets/d/1JfD2fnOSa0Cj7shuLuU0rGtqkgdbrctPS-6cOwzI158/edit?usp=sharing)
- GitHub: https://github.com/itzam-ai/itzam
