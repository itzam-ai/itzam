[]

## What Itzam does?

> We help you to **_seamlessly_ integrate AI into your applications**.

What this means?

- Swap models automatically or with one click;
- Change the current prompt easily;
- Customize the workflow context;
- Integrate in 2 minutes;
- And much more… (see more features below)

## Principles

<aside>
🚫

Remove AI stuff from your business logic.

</aside>

<aside>
👥

Everyone should be able to manage AI.

</aside>

<aside>
🤖

Use AI, not a specific model.

</aside>

## Current Problems

### 👨🏻‍💻  Non-technical people

_How can non-technical people manage AI workflows?_

Currently, AI workflows in companies are only managed by devs.

### 🤖  New models

_How can my AI integrations **keep up** with new models and providers?_

Changing models is painful because you have provider lock-in, you need to test them and change code.

### 🔃  Changing is hard

_If I want to change the prompt or context, can I do it without changing my code?_

Having these AI logics mixed in your code can become a problem. Besides that, changing anything would require a redeploy.

## How we solve them?

### ⚙️ AI Dashboard

Our dashboard makes it easy for anyone to manage AI workflows without coding. Just configure everything - model, prompt, context, etc - through a simple interface.

### ⚡ Hot Swap

Stay current with AI advancements without touching your code. We handle model integrations and updates, so you can switch to newer, better models with one click.

### 🖲️ Easy Changes

Make changes to your AI setup instantly through our dashboard. Modify prompts, switch models, or update context without redeploying your application. Besides that.

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
   - Context (what the model will use as context, e.g. company docs, company logo, links)
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

### 🤖  Model Hot Swap

Change the current model - or the model settings - instantly.

### 💬  Prompt Hot Swap

Change the prompt instantly and compare the output with other executions.

### 💳  Unified Billing

Manage all your AI spending in one place.

### 🔌  Easy SDKs & API

Integrate AI in your product with 2 lines of code.

### 🗣️ Multi-model Chat

Chat with every model to see which fits your workflow best.

### 🗃️  Context Management (soon)

Manage the context - docs, images, links, texts - you want to give to the AI for each workflow.

### 📐  Rules (soon)

Create custom rules for each workflow.

e.g. if AI bill is over $50 → switch to a cheaper model.

### ✨  Model Recommendation (soon)

Get recommendations on the best model (balancing cost, latency, and intelligence) based on your workflow requirements.

## Links

Itzam: [itz.am](http://itz.am)

Itzam Docs: [docs.itz.am](http://docs.itz.am)

Itzam Chat: [chat.itz.am](http://chat.itz.am)

AI Landscape: [link](https://docs.google.com/spreadsheets/d/1JfD2fnOSa0Cj7shuLuU0rGtqkgdbrctPS-6cOwzI158/edit?usp=sharing)
