-- Production shape for Supabase Postgres. The MVP uses LocalRepository until
-- a Supabase project is configured.
create extension if not exists pgcrypto;

create type public.purpose_kind as enum (
  'personal_service', 'product_research', 'course_information', 'community', 'expert_follow_up'
);
create type public.fact_status as enum ('confirmed', 'unknown', 'declined', 'contradicted');

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  language text not null default 'en',
  country text check (country is null or char_length(country) = 2),
  verified_identity_id text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  language text not null,
  source text not null check (source in ('conversation', 'resume', 'linkedin')),
  state text not null default 'informed',
  state_version integer not null default 0 check (state_version >= 0),
  current_intent_id text,
  current_question text,
  asked_intent_ids jsonb not null default '[]'::jsonb,
  declined_intent_ids jsonb not null default '[]'::jsonb,
  state_before_pause text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purpose_grants (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  purpose public.purpose_kind not null,
  selected boolean not null default false,
  notice_version text not null,
  version integer not null default 1 check (version > 0),
  granted_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (participant_id, purpose)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  client_message_id text not null,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  unique (session_id, client_message_id)
);

create table public.profile_facts (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  field text not null check (field ~ '^[a-z][a-z0-9_]{1,63}$'),
  value jsonb not null,
  status public.fact_status not null,
  evidence_message_id uuid references public.messages(id) on delete set null,
  revision integer not null default 1 check (revision > 0),
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (participant_id, field)
);

create table public.evidence_claims (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  intent_id text not null,
  field text not null,
  statement text not null,
  quote text not null,
  span_start integer not null check (span_start >= 0),
  span_end integer not null check (span_end >= span_start),
  source_language text not null,
  participant_confirmed boolean not null default false,
  independently_verified boolean not null default false,
  allowed_purposes public.purpose_kind[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.contact_preferences (
  participant_id uuid primary key references public.participants(id) on delete cascade,
  course_information boolean not null default false,
  community boolean not null default false,
  expert_follow_up boolean not null default false,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table public.transcription_jobs (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  client_upload_id text not null,
  storage_path text not null,
  language text not null,
  mime_type text not null,
  byte_size integer not null check (byte_size between 1 and 8388608),
  status text not null check (status in ('processing', 'completed', 'failed', 'deleted')),
  transcript text,
  error_code text,
  created_at timestamptz not null default now(),
  delete_after timestamptz not null,
  unique (participant_id, client_upload_id)
);

create table public.source_assets (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  asset_type text not null check (asset_type in ('pdf', 'docx', 'pasted_text', 'manual', 'linkedin_url')),
  display_name text not null,
  storage_path text,
  source_value text,
  extracted_text text,
  extraction_status text not null check (extraction_status in ('processing', 'ready', 'failed', 'confirmed')),
  extraction_error text,
  candidate_fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  delete_after timestamptz not null
);

alter table public.participants enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.purpose_grants enable row level security;
alter table public.messages enable row level security;
alter table public.profile_facts enable row level security;
alter table public.evidence_claims enable row level security;
alter table public.contact_preferences enable row level security;
alter table public.transcription_jobs enable row level security;
alter table public.source_assets enable row level security;

create policy participant_owner on public.participants
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

create policy session_owner on public.interview_sessions
  for all using (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  )) with check (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  ));

create policy grant_owner on public.purpose_grants
  for all using (exists (
    select 1 from public.participants p where p.id = participant_id and p.auth_user_id = auth.uid()
  )) with check (exists (
    select 1 from public.participants p where p.id = participant_id and p.auth_user_id = auth.uid()
  ));

create policy message_owner on public.messages
  for all using (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  )) with check (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  ));

create policy fact_owner on public.profile_facts
  for all using (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  )) with check (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  ));

create policy evidence_owner on public.evidence_claims
  for all using (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  )) with check (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  ));

create policy preference_owner on public.contact_preferences
  for all using (exists (
    select 1 from public.participants p where p.id = participant_id and p.auth_user_id = auth.uid()
  )) with check (exists (
    select 1 from public.participants p where p.id = participant_id and p.auth_user_id = auth.uid()
  ));

create policy transcription_owner on public.transcription_jobs
  for all using (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  )) with check (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  ));

create policy source_asset_owner on public.source_assets
  for all using (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  )) with check (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  ));

-- Answer submission must run in one transaction: lock the session FOR UPDATE,
-- check expected state_version, insert the unique client_message_id, merge facts,
-- and increment the session version.
