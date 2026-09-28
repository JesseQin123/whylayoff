# Public pilot readiness checklist

Status date: 2026-09-28. The automated web checks pass. The release remains gated on real-device voice, assistive-technology checks, and moderated pilot sessions.

## Verified automatically

| Gate | Current evidence |
|---|---|
| State, evidence, consent, versioning, resume exports, benefits, owner-isolated telemetry, privacy export, and deletion | 39 Vitest contract/component tests |
| Main mobile path | Playwright completes start → background skip → interview answer → results |
| Benefit wording and state | Playwright verifies Muse as external, Jobright as terms pending, and `opened` as not provider verified |
| 360 px reflow | Playwright checks no document-level horizontal overflow |
| 200% reflow equivalent | Playwright checks the primary action at a 180 CSS-pixel viewport, equivalent to a 360 px layout reflowed at 200% |
| Keyboard entry | The first Tab reaches the skip link; Enter moves focus to the main landmark |
| Reduced height and rotation | Primary action and overflow checks run at 360×420 and 800×360 |
| WCAG scan | Axe reports no WCAG 2.0/2.1 A/AA violations in the Start, Background, Interview, Results, Resume, and Benefits main regions |
| Production compilation | `next build` passes and enumerates all current routes |

Automated checks do not prove screen-reader clarity, real soft-keyboard behavior, usable microphone permissions, or comprehension by the target audience.

## Open device and accessibility gates

Run the exact release build over HTTPS and record device, OS, browser, date, tester, and result. Required combinations:

- current and previous major iOS Safari on a real iPhone;
- current Android Chrome on a real phone;
- one LinkedIn or similar in-app browser, confirming that text fallback remains usable;
- VoiceOver with Safari and TalkBack with Chrome for headings, form labels, status messages, errors, and the resume editor;
- 200% browser text/zoom on desktop plus the largest platform text setting on each phone;
- portrait and landscape with the software keyboard open.

For voice, verify allow, deny, dismissed permission, finish, cancel, retry, 90-second stop, incoming-call/app-background interruption, lock/unlock, weak network, duplicate retry, transcript editing, and microphone-indicator shutdown. Confirm that unsupported transcription produces a clear text path and never invents a transcript.

## Pilot cohort and procedure

Recruit 15–20 participants who self-identify as recently laid off or in career transition. Include at least five people who describe themselves as less comfortable with digital tools. Record that self-description directly; do not infer it from age, accent, device, education, or completion speed.

Aim for coverage across logistics/operations plus at least two adjacent traditional sectors, English and Spanish where a native reviewer is available, resume and no-resume entry, and iPhone/Android/desktop. Do not use age as an access gate.

For each session, ask the participant to complete the flow without coaching first. Record:

- completion or abandonment by step;
- elapsed time to first useful result and full resume export;
- every assistance request and the screen where it occurred;
- permission comprehension: personal service, product research, and four follow-up choices;
- whether the skills and resume facts match what the participant said;
- whether they can find, edit, copy, and download the resume;
- whether they understand Muse is external and Jobright has no active offer;
- voice failures, retries, network state, browser, device, and fallback used;
- corrections to problem cards and whether “no problem observed” feels acceptable;
- a one-question usefulness rating plus open-ended reason.

Use participant codes in notes. Do not copy raw resumes, interview text, email addresses, or confidential employer details into analytics logs.

## Pilot stop conditions

Pause recruitment and fix the product before continuing if any participant can read another participant's data, deletion leaves accessible records, a resume export invents a fact, the UI represents an unverified benefit as active, an opt-out remains in an operational contact list, microphone capture continues after exit, or a critical path becomes unusable with keyboard or large text.

Issue #9 can close only after the device matrix and pilot evidence above are attached. Issue #4 remains the specific real-device voice gate.
