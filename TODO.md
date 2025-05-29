## Now (22w 2025)
- [ ] Knowledge
  - [ ] Improve chunking (must work with pdf, json, xml, html, csv, raw (txt))
- [ ] Threads
- [ ] Attachments
  - [ ] UI (be able to see attachments used in a run)

## Next
### 23w 2025
- [ ] Context (segmented knowledge)
  - [ ] Docs 
    - [ ] Excalidraw illustrations
    - [ ] Glossary
  - [ ] CRUD (UI)
  - [ ] SDK (Integration with threads API)
- [ ] Link rescrape (knowledge/context) 
```ts 
itzam.thread.create({
  workflowSlug: "my-workflow",
  context: [ // context id
    "context-1", 
    "context-2",
    "context-3"
  ]
})
```
### 24w 2025
- [ ] Context (segmented knowledge)
  - [ ] CRUD (SDK)
    - [ ] How the user can sync a context programmatically?
- [ ] SDK/API error treatment 

## Future

- [ ] Attachments | _Send attachments - docs, images - via API & SDKs_
  - [ ] - UI
  - [x] - SDK
  - [ ] - Docs
- [ ] Rules | _Create custom rules for each workflow (e.g. if AI bill is over $50 → switch to a cheaper model)_
- [ ] Model Recommendation | _Get recommendations on the best model (balancing cost, latency, and intelligence)_
- [ ] Guardrails | _Create limits for the AI’s response._
- [ ] Tools | _Integrate tools to your workflow._

### Other improvements

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

  - [ ] Improve UI (less boxes)
  - [ ] Improve error treatment
  - [ ] Fix streamed response

- [ ] Prompt tab

  - [ ] Enhance with AI
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

### Others

- [ ] Demos
  - [ ] Add file/link to knowledge and now models knows who you are

### Past (Done)
#### 22w 2025
- [x] Usage workflow selector 
##### Knowledge 
- [x] Improve UI [G]
  - [x] TextLoop when status changes (add number of chunks)
  - [x] Animations
  - [x] Show usage
- [x] Validate plan limit [G]
  - [x] 50MB free tier?
- [x] Fix big files upload [A]