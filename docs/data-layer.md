# Session, consent, and fact layer

The running MVP uses `LocalRepository`, an in-process adapter that models the same ownership and version rules planned for Supabase. It is intended for local pilots only: restarting the server clears it. `supabase/schema.sql` defines the production table shape and row-level security policies.

An anonymous browser receives a random, HTTP-only ownership token. Only its SHA-256 hash is stored. API routes resolve the current participant from that hash and verify the session owner before reading or writing. A future verified login can attach `verifiedIdentityId` without changing the participant or session IDs.

Purpose grants are independent. `personal_service` is recorded when a participant starts the disclosed career service. Product research, course information, community, and expert follow-up start off. Changing or withdrawing one purpose does not change any other purpose.

Answers carry `clientMessageId` and `expectedStateVersion`. The repository saves each client message once and returns the original receipt on retry. A stale version returns `409 CONFLICT`. Confirmed facts retain revision history; competing confirmed values become `contradicted` until the participant resolves them.

The privacy API exports the current participant's session data as JSON. Deletion revokes all purposes, removes messages and facts, and blocks further access. In production this contract will create a cross-storage deletion job before reporting completion.
