# Codex Cloud development

Repository: https://github.com/JesseQin123/whylayoff

This file prepares a reproducible cloud checkout. Committing it does not itself create a hosted environment or start a task. The website continues to run on Vercel with Supabase; Codex Cloud is the development worker.

## Environment configuration

Create an environment for this repository and use these settings:

| Setting | Value |
| --- | --- |
| Name | whylayoff |
| Base branch | main |
| Image | universal |
| Node.js version | 22 |
| Setup script | `bash scripts/codex-cloud-setup.sh` |
| Maintenance script | `bash scripts/codex-cloud-setup.sh` |
| `LLM_MODE` | `demo` |
| `PLAYWRIGHT_BROWSER_CHANNEL` | `chromium` |
| `NEXT_TELEMETRY_DISABLED` | `1` |
| Secrets | None needed for deterministic development |

Leave Supabase and live LLM variables unset. Do not copy `.env.local` from a developer machine. Configure the variables in environment settings, because exports in the setup script do not persist to the agent phase. Cloud secrets are only available during setup; they are not a way to configure live runtime model calls during the agent phase.

Setup installs locked dependencies, Chromium and its Linux system dependencies, then generates Next.js route types. Maintenance repeats these steps to handle dependency changes between cached branches. The script requires network access and permission to install Linux browser dependencies. It fails on installation errors instead of claiming a ready environment.

Agent internet access can remain off for existing-code checks. Issue #13 requires adding the Vercel AI SDK: install the selected dependencies during an internet-enabled setup phase or configure a limited dependency/documentation allowlist when starting that task. An offline worker must report a missing dependency rather than pretend the live integration is implemented.

## Verification

```bash
npm run typecheck
npm test
npm run lint
npm run build
PLAYWRIGHT_BROWSER_CHANNEL=chromium npm run test:e2e
```

Playwright starts its own server on port 3100 and defaults to demo/in-memory data. Do not set `E2E_SUPABASE=1` without a dedicated development database. In-memory data is temporary, and this mode does not validate hosted database persistence or real model output.

For a manual preview use `npm run dev -- --hostname 0.0.0.0 --port 3000` with the environment's preview/port-forwarding UI, if provided. Do not expect this machine's localhost URL to open the cloud process.

## First implementation task

Paste this into the environment's task composer:

> Implement GitHub issue #13 for JesseQin123/whylayoff using docs/interview-v2-handoff.md as the approved scope. Read AGENTS.md and docs/codex-cloud.md first. Work from main on a codex/ feature branch. Build the four-stage mobile flow with minimal typing, optional voice/text input, at most two server-enforced clarification questions, skip/early-results controls, and editable evidence-grounded results without an email gate. Retain ownership, independent purpose consent, export, deletion, and resume parsing. Use the current stack plus Vercel AI SDK; do not add a survey engine or graph framework. Preserve deterministic demo mode for testing and make live model/transcription requirements explicit. Do not copy local secrets, contact the home gateway, or use production participant data. Run the documented checks, add meaningful coverage for the new behavior, and produce a PR with clear validation and remaining live-service limitations. Do not merge or deploy production.

Issue: https://github.com/JesseQin123/whylayoff/issues/13

## References

- [Codex Cloud setup](https://learn.chatgpt.com/docs/cloud)
- [Cloud environment lifecycle, variables and secrets](https://learn.chatgpt.com/docs/environments/cloud-environment)

Local desktop task history, local MCP tools and credentials do not transfer automatically. The committed scope, project instructions and issue provide the handoff.
