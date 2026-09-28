<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project and cloud development

- Read `docs/interview-v2-handoff.md` for the approved product scope (GitHub issue #13).
- Read `docs/codex-cloud.md` for reproducible environment setup and the starting task prompt.
- Use Node.js 22, npm, and the committed package-lock.json. Use `codex/` branches for feature work.
- Default to `LLM_MODE=demo` with no Supabase credentials and synthetic participants. Local secrets, browser sessions, desktop plugins, and the home LLM gateway are not cloud dependencies.
- Validate with `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`, and `PLAYWRIGHT_BROWSER_CHANNEL=chromium npm run test:e2e` for flow changes. Report anything not run or failing.
- Preserve owner isolation, independent purpose consent, export and deletion. Never fabricate career claims or exceed the initial interview's two-clarification budget.
- Open a reviewable PR for feature work; do not merge or deploy production from a cloud implementation task unless specifically requested.
