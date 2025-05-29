## Now (22w · 2025)

- [ ] Knowledge
  - [ ] Improve chunking (must work with pdf, json, xml, html, csv, raw (txt))
- [ ] Threads
- [x] Attachments
  - [x] UI (be able to see attachments used in a run)

## Next features

- [ ] Attachments | _Send attachments - docs, images - via API & SDKs_
  - [ ] - UI
  - [x] - SDK
  - [ ] - Docs
- [ ] Rules | _Create custom rules for each workflow (e.g. if AI bill is over $50 → switch to a cheaper model)_
- [ ] Model Recommendation | _Get recommendations on the best model (balancing cost, latency, and intelligence)_
- [ ] Guardrails | _Create limits for the AI’s response._
- [ ] Tools | _Integrate tools to your workflow._

### Other improvements

- [ ] Error treatment in SDK
- [ ] Check metadata in SDK

- [ ] Grouping messages (threads)

- [ ] UI

  - [ ] Async buttons instead of toast (multiple states)
  - [x] Usage workflow selector

- [ ] Knowledge

  - [x] Improve UI [G]
    - [x] TextLoop when status changes (add number of chunks)
    - [x] Animations
    - [x] Show usage
  - [x] Validate plan limit [G]
    - [x] 50MB free tier?
  - [ ] Fix big files upload [A]
  - [ ] Better chunking algorithm [A]
  - [ ] Reranking before inserting in prompt
  - [ ] Test using tools instead of retrieve

- [ ] Workflow UI

  - [ ] Improve header (details)
  - [ ] Improve creation modal
  - [ ] Steps in empty state
  - [ ] Model recommendation based on details provided

- [ ] Playground tab

  - [x] Improve UI (less boxes)
  - [x] Fix streamed response
  - [ ] Improve error treatment
  - [ ] Attachments
  - [ ] Check knowledge

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
