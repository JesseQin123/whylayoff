# Self-service background intake

Participants can proceed with no document or profile link. The background page accepts manual or spoken notes, stores an optional LinkedIn URL without fetching it, and parses private PDF or DOCX files up to 5 MB.

The server validates document MIME and signature before parsing. PDF text is extracted with `pdf-parse`; DOCX text is extracted with `mammoth`. A parse failure returns an editable empty card set and never blocks the interview. Candidate role, industry, responsibilities, dates, location, and career-goal values remain `captured` until the participant edits and confirms them.

Uploaded bytes live only in the local owner-scoped adapter during development. They are cleared immediately after confirmation and have a seven-day fallback expiry in the contract. Production uses private object storage and the `source_assets` RLS policy in `supabase/schema.sql`. LinkedIn URLs are validated and saved as references; the application makes no request to LinkedIn, Apollo, Clay, or another enrichment provider.
