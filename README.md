# Next Chapter

Next Chapter is a mobile-first, multilingual career transition interview for people navigating a layoff. It turns a guided conversation into a skills reassessment, resume-ready language, and a structured set of industry insights for Solo Unicorn research when the participant explicitly consents.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The current UI can be explored without credentials. Server-side model features use the OpenAI-compatible gateway settings documented in [docs/local-model-gateway.md](docs/local-model-gateway.md).

Participant data uses Supabase when `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are configured. Without them, local development falls back to the in-memory store. See [docs/supabase-deployment.md](docs/supabase-deployment.md) for the data model, migration, and deployment settings.

## Quality checks

For hosted development, see [Codex Cloud setup and task handoff](docs/codex-cloud.md).

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

Product scope, architecture, interview policy, and delivery order are indexed in [docs/README.md](docs/README.md).
