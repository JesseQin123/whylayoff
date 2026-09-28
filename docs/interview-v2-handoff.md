# Four-step interview: approved scope and cloud handoff

Status: approved product direction; implementation is pending. This document supersedes earlier interview UI and framework proposals where they conflict.

## Outcome

Make the first visit easy to complete with little typing. Capture a preliminary career profile and one concrete industry problem, return a useful personal result, and collect optional follow-up preferences. Around three minutes is a design target to test, not an established completion-time claim.

## Four visible stages

1. Background: select industry and work type, or optionally upload a resume and confirm extracted details. Do not ask again for information already supplied.
2. One real example: invite a short voice response or a sentence about a recurring work problem. Keep a typed path; suggestions must include Other and Not sure.
3. Clarification: ask at most two short follow-up questions, one at a time. Select missing details from the participant's answer and prefer clicks when suitable. Never exceed the server-enforced follow-up budget; allow early results and skipping.
4. Results: show an editable summary, experience strengths grounded in the answer, one relevant next step, and a resume-ready draft where evidence supports it. Display results without requiring an email. Offer optional deeper participation afterward.

Always show the four-stage navigation and the remaining follow-up allowance. Use information coverage internally; do not present it as a misleading completion percentage. Avoid repeated research-consent controls on each question. Keep research and each contact purpose independently optional, revocable, and enforced by the server.

## Information and evidence

- Profile: industry, role, relevant experience, present needs, contact preferences.
- Problem: task/workflow, specific pain point, current workaround, affected people, frequency if supplied, and observed technology changes.
- Link extracted claims to their source answer or resume passage. Keep unknowns unknown and distinguish participant-confirmed information from model drafts.
- Distinguish the participant's report of a company explanation, personal observations, and personal hypotheses. A reported company explanation is not independently verified.
- Never invent employers, achievements, buyer budgets, causation, automation-risk scores, or calibrated confidence percentages.
- Deeper workflow, buyer, and purchasing questions belong in a separately chosen follow-up interview.

## Minimal implementation

Retain Next.js, React, Zod, Supabase, existing ownership and purpose controls, exports, and document parsing. Add Vercel AI SDK for structured extraction, bounded follow-up suggestions, and grounded results. Validate structure and evidence on the server. Use explicit stage and follow-up counters; do not let a model control permissions or the interview length.

Do not introduce SurveyJS, assistant-ui, LangGraph, Docling, vector search, or a graph database in this iteration. These are deferred until an actual requirement justifies them.

The deployed application currently uses deterministic demo mode. A cloud-reachable, user-authorized LLM endpoint and tested mobile transcription are required for a real AI/voice release. The home gateway at 192.168.1.156 is not reachable from ordinary cloud environments without additional networking. Do not copy local credentials or expose that gateway as part of this handoff.

## Cloud development handoff

Repository: https://github.com/JesseQin123/whylayoff

Use a new feature branch with the `codex/` prefix. The present desktop task is local; this document does not provision a cloud environment or transfer this conversation automatically.

- Configure Node.js 22 and install dependencies with `npm ci`.
- Use `LLM_MODE=demo` for deterministic checks. Start without Supabase variables to use the in-memory development fallback; provision dedicated development data configuration for hosted integration tests.
- Run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build`.
- The current Playwright configuration selects Chrome. Install it in a compatible Linux environment with `npx playwright install --with-deps chrome` before `npm run test:e2e`, or deliberately adapt and validate the test configuration.
- Do not assume local environment files, desktop plugins, network access, or account sessions transfer to cloud tasks. In Codex cloud, setup secrets and agent-phase environment variables have different lifetimes; consult the environment documentation before live API testing.
- Open a pull request with a Vercel preview for review. Keep test participant data separate from production.

## Acceptance criteria

- Mobile flow has four understandable stages, no mandatory long-form writing, back/edit controls, skip, and early results.
- An answer can fill multiple fields, and already known information is not asked again.
- No path allows more than two clarification questions in the initial experience.
- Invalid model output or a provider failure does not lose saved input or fabricate a result.
- Model-derived facts retain source evidence and can be corrected; correction does not leave stale results presented as current.
- Consent revocation, owner isolation, export, and deletion still work.
- Voice is labeled and tested according to actual capabilities, with review before sending and a working text alternative.
- Validate completion time, abandonment, input burden, and problem specificity with an initial ten target participants before making speed or outcome claims.
