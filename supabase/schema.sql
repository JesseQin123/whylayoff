-- Production shape for Supabase Postgres. The MVP uses LocalRepository until
-- a Supabase project is configured.
create extension if not exists pgcrypto;

create type public.purpose_kind as enum (
  'personal_service', 'service_email', 'product_research', 'course_information', 'community', 'expert_follow_up'
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
  email_address text,
  service_email boolean not null default false,
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

create table public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  version integer not null check (version > 0),
  content jsonb not null,
  status text not null check (status in ('facts_incomplete', 'fact_review', 'ready_to_export')),
  missing_fields jsonb not null default '[]'::jsonb,
  source_conflicts jsonb not null default '[]'::jsonb,
  user_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_id, version)
);

create table public.resume_exports (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  resume_version_id uuid not null references public.resume_versions(id) on delete cascade,
  format text not null check (format in ('text', 'docx', 'pdf')),
  template_version text not null,
  created_at timestamptz not null default now()
);

create table public.research_problem_cards (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  version integer not null default 1 check (version > 0),
  status text not null default 'participant_confirmed' check (status = 'participant_confirmed'),
  validation_status text not null default 'unvalidated_participant_report'
    check (validation_status = 'unvalidated_participant_report'),
  no_problem_observed boolean not null default false,
  fields jsonb not null default '{}'::jsonb,
  revision_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.research_claims (
  id uuid primary key default gen_random_uuid(),
  problem_card_id uuid not null references public.research_problem_cards(id) on delete cascade,
  field text not null,
  statement text not null,
  source_quote text not null,
  source_type text not null check (source_type in (
    'participant_report', 'employer_statement', 'firsthand_observation',
    'participant_inference', 'public_context'
  )),
  status text not null check (status in ('participant_confirmed', 'unknown', 'no_problem_observed')),
  independently_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.source_attributions (
  session_id uuid primary key references public.interview_sessions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  source text,
  medium text,
  campaign text,
  content text,
  referrer text,
  landing_path text,
  created_at timestamptz not null default now()
);

create table public.benefit_partners (
  id text primary key,
  name text not null,
  status text not null check (status in ('resource_source', 'prospect', 'terms_pending', 'active', 'paused', 'expired')),
  relationship_label text not null,
  disclosure text not null,
  updated_at timestamptz not null default now()
);

create table public.benefit_offers (
  id text primary key,
  partner_id text not null references public.benefit_partners(id),
  title text not null,
  availability text not null check (availability in ('external_resource', 'verified_inventory', 'pending', 'unavailable')),
  description text not null,
  terms_summary text not null,
  eligibility text not null,
  resource_url text,
  starts_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.benefit_offer_codes (
  id uuid primary key default gen_random_uuid(),
  offer_id text not null references public.benefit_offers(id) on delete cascade,
  secret_code text not null,
  assigned_claim_id uuid,
  created_at timestamptz not null default now(),
  unique (offer_id, secret_code)
);

create table public.benefit_claims (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  offer_id text not null references public.benefit_offers(id),
  state text not null check (state in (
    'offered', 'assigned', 'opened', 'user_reported_success',
    'user_reported_failed', 'provider_verified', 'unavailable'
  )),
  assigned_code_id uuid references public.benefit_offer_codes(id) on delete set null,
  provider_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id, offer_id)
);

alter table public.benefit_offer_codes
  add constraint benefit_code_claim_fk foreign key (assigned_claim_id) references public.benefit_claims(id) on delete set null;

create table public.benefit_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.benefit_claims(id) on delete cascade,
  action text not null check (action in ('claim', 'open', 'copy', 'user_reported_success', 'user_reported_failed', 'provider_verify')),
  state_after text not null,
  created_at timestamptz not null default now()
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
alter table public.resume_versions enable row level security;
alter table public.resume_exports enable row level security;
alter table public.research_problem_cards enable row level security;
alter table public.research_claims enable row level security;
alter table public.source_attributions enable row level security;
alter table public.benefit_partners enable row level security;
alter table public.benefit_offers enable row level security;
alter table public.benefit_offer_codes enable row level security;
alter table public.benefit_claims enable row level security;
alter table public.benefit_events enable row level security;

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

create policy resume_version_owner on public.resume_versions
  for all using (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  )) with check (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  ));

create policy resume_export_owner on public.resume_exports
  for all using (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  )) with check (exists (
    select 1 from public.participants p
    where p.id = participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  ));

create policy research_card_owner_with_current_grant on public.research_problem_cards
  for all using (exists (
    select 1
    from public.participants p
    join public.purpose_grants g on g.participant_id = p.id
    where p.id = research_problem_cards.participant_id
      and p.auth_user_id = auth.uid()
      and p.deleted_at is null
      and g.purpose = 'product_research'
      and g.selected = true
  )) with check (exists (
    select 1
    from public.participants p
    join public.purpose_grants g on g.participant_id = p.id
    where p.id = research_problem_cards.participant_id
      and p.auth_user_id = auth.uid()
      and p.deleted_at is null
      and g.purpose = 'product_research'
      and g.selected = true
  ));

create policy research_claim_owner_with_current_grant on public.research_claims
  for all using (exists (
    select 1
    from public.research_problem_cards c
    join public.participants p on p.id = c.participant_id
    join public.purpose_grants g on g.participant_id = p.id
    where c.id = research_claims.problem_card_id
      and p.auth_user_id = auth.uid()
      and p.deleted_at is null
      and g.purpose = 'product_research'
      and g.selected = true
  )) with check (exists (
    select 1
    from public.research_problem_cards c
    join public.participants p on p.id = c.participant_id
    join public.purpose_grants g on g.participant_id = p.id
    where c.id = research_claims.problem_card_id
      and p.auth_user_id = auth.uid()
      and p.deleted_at is null
      and g.purpose = 'product_research'
      and g.selected = true
  ));

create policy attribution_owner on public.source_attributions
  for all using (exists (
    select 1 from public.participants p
    where p.id = source_attributions.participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  )) with check (exists (
    select 1 from public.participants p
    where p.id = source_attributions.participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  ));

create policy benefit_partner_public_read on public.benefit_partners for select using (true);
create policy benefit_offer_public_read on public.benefit_offers for select using (true);

create policy benefit_claim_owner on public.benefit_claims
  for all using (exists (
    select 1 from public.participants p
    where p.id = benefit_claims.participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  )) with check (exists (
    select 1 from public.participants p
    where p.id = benefit_claims.participant_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  ));

create policy benefit_event_owner on public.benefit_events
  for all using (exists (
    select 1 from public.benefit_claims c
    join public.participants p on p.id = c.participant_id
    where c.id = benefit_events.claim_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  )) with check (exists (
    select 1 from public.benefit_claims c
    join public.participants p on p.id = c.participant_id
    where c.id = benefit_events.claim_id and p.auth_user_id = auth.uid() and p.deleted_at is null
  ));

-- Answer submission must run in one transaction: lock the session FOR UPDATE,
-- check expected state_version, insert the unique client_message_id, merge facts,
-- and increment the session version.
