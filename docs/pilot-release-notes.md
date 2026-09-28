# Pilot release notes

This build provides an anonymous, mobile-first career interview; manual, LinkedIn-link, PDF, and DOCX background intake; evidence-linked skill and career drafts; editable resume output in text, DOCX, and PDF; optional industry problem cards; a benefit directory; independent contact preferences; privacy export and deletion; and local owner-scoped operations views.

The Muse listing is an external community resource. The linked page says it is not affiliated with Meta. Next Chapter has not verified code inventory, token amounts, remaining uses, country eligibility, expiry, or successful redemption. Jobright.ai is a potential partner with terms pending. No Jobright coupon, referral benefit, or formal collaboration is active.

Opening an external link, assigning or copying a code, and a participant reporting success are separate activity states. None is provider-verified redemption. The public API cannot mark an event provider verified.

Known pilot limitations:

- Server-side voice transcription is not configured because the private gateway's audio capability has not been confirmed. Browser speech recognition is optional progressive enhancement; typed input and phone-keyboard dictation remain available.
- Real iPhone Safari and Android Chrome microphone paths, weak-network recovery, VoiceOver, TalkBack, real software keyboards, and in-app browsers have not completed the release matrix.
- The local repository is in memory and clears when the server restarts. Supabase schema and row-level policies are defined, but production database, authentication, private storage, staff roles, and background workers are not deployed.
- The configured text-model gateway is on a private home network and is not assumed reachable from a public hosting provider.
- Spanish strings and export characters have automated coverage, but the complete Spanish experience still needs native-language content and voice review.
- The operations page is an owner-scoped pilot preview. It is not a production cross-participant admin console.

Operational telemetry records operation name, success/failure/fallback, model and prompt versions, latency, token counts when returned, configured-rate cost estimates, and failure codes. It excludes raw interview answers, transcripts, resumes, and email addresses.
