### Now (23w · 2025)

- [ ] Context (segmented knowledge)

  - [ ] Docs
    - [ ] Excalidraw illustrations
    - [ ] Glossary
  - [ ] CRUD (UI)
  - [ ] SDK (Integration with threads API)

```ts
// Context usage example

itzam.thread.create({
  workflowSlug: "my-workflow",
  context: [
    // context id
    "context-1",
    "context-2",
    "context-3",
  ],
});
```

### 24w · 2025

- [ ] Context (segmented knowledge)

  - [ ] Docs
    - [ ] API
    - [ ] SDK
  - [ ] CRUD (SDK)
    - [ ] How the user can sync a context programmatically?

- [ ] SDK/API error treatment

## Future

- [ ] Rules · _Create custom rules for each workflow (e.g. if AI bill is over $50 → switch to a cheaper model)_
- [ ] Model Recommendation · _Get recommendations on the best model (balancing cost, latency, and intelligence)_
- [ ] Guardrails · _Create limits for the AI’s response._
- [ ] Tools · _Integrate tools to your workflow._

### Other improvements

- [ ] SDK

  - [ ] Standard CRUD for _everything_
  - [ ] Add knowledge used to metadata

- [ ] UI

  - [ ] Async buttons instead of toast (multiple states)

- [ ] Knowledge

  - [ ] Test using tools instead of retrieve

- [ ] Workflow UI

  - [ ] Improve header (details)
  - [ ] Improve creation modal
  - [ ] Steps in empty state
  - [ ] Model recommendation based on details provided

- [ ] Playground tab

  - [ ] Attachments

- [ ] Prompt tab

  - [ ] Versioning

- [ ] Model tab

  - [ ] Model fallback
  - [ ] Filters
  - [ ] Task requirements based on prompt/description

- [ ] Better support for thinking models

  - [ ] Expose reasoning
  - [ ] Set reasoning effort
  - [ ] Check different token prices for reasoning tokens

- [ ] API Key limits
- [ ] Python SDK
- [ ] Support other models (Groq, Perplexity, Lamma, Azure)
- [ ] Status page

### Past (Done)

#### 25w 2025

- [x] Prompt tab

  - [x] Enhance with AI

#### 24w 2025

- [x] Playground tab

  - [x] Improve error treatment
  - [x] Check knowledge in production

- [x] Docs

  - [x] Improve clarity
  - [x] Add tutorials & guides

#### 23w 2025

- [x] Threads docs (missed from 22w)

- [x] Link rescrape (knowledge/context)

- Model tab

  - [x] Improve switch modal

#### 22w 2025

Attachments

- [x] UI (be able to see attachments used in a run)
- [x] Test SDK
  - [x] URLs
  - [x] Base64
- [x] Check docs

Threads

- [x] Works

Playground

- [x] Improve UI (less boxes)
- [x] Fix streamed response

Usage

- [x] Usage workflow selector

Knowledge

- [x] Improve UI [G]
  - [x] TextLoop when status changes (add number of chunks)
  - [x] Animations
  - [x] Show usage
- [x] Validate plan limit [G]
  - [x] 50MB free tier
- [x] Fix big files upload [A]
- [x] Improve chunking (must work with pdf, json, xml, html, csv, raw (txt))
