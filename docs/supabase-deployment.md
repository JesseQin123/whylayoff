# Supabase persistence

The production pilot uses the Supabase project `whylayoff` (`lgnhtkvaumzepgeinzvl`) in `us-east-1`.

## Runtime design

Each browser receives two identities:

- an HTTP-only `next_chapter_owner` cookie used by the application to scope all in-memory operations;
- a Supabase anonymous user session used by Postgres row-level security.

The API hydrates the participant's state from `public.participant_app_states` at the start of each request and saves it after a mutation. The row is keyed by `auth_user_id`, checks the hashed application owner token, and uses `state_version` for optimistic concurrency. Every policy compares `auth.uid()` with `auth_user_id`; the `anon` database role has no table privileges and the `authenticated` role has only owner-scoped CRUD through RLS.

The browser never receives a service-role or secret key. Production needs only:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://lgnhtkvaumzepgeinzvl.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`@supabase/ssr` creates one request-scoped server client and writes refreshed auth cookies through Next.js. Do not share that client between requests.

## Migration

The deployed migration is:

```text
supabase/migrations/20260928140115_create_participant_app_states.sql
```

Apply later migrations with the Supabase CLI or the Supabase migration API. Keep RLS enabled and run both security and performance advisors after every schema change.

## Data lifecycle

Resume and audio bytes are not persisted. Parsed background data, interview messages, consent grants, generated outputs, benefit activity, and operational metadata are stored in the participant state document. The privacy-delete endpoint deletes the database row, clears local state, signs out the anonymous Supabase session, and expires the owner cookie.

Supabase does not automatically remove abandoned anonymous users. Before a large public campaign, enable CAPTCHA for anonymous sign-ins and schedule removal of anonymous users whose participant state has exceeded the agreed retention period or no longer exists.

## Testing

The normal browser suite disables Supabase so repeated local runs do not create hosted test users:

```bash
npm run test:e2e
```

To run the same suite against the configured Supabase project:

```bash
E2E_SUPABASE=1 npm run test:e2e
```

Delete the generated anonymous test users after a live persistence run. Deleting them cascades to `participant_app_states`.
