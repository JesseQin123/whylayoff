create table public.participant_app_states (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  owner_token_hash text not null unique check (owner_token_hash ~ '^[0-9a-f]{64}$'),
  state_version bigint not null default 1 check (state_version > 0),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.participant_app_states is
  'Owner-isolated Next Chapter MVP state. Raw owner tokens are never stored.';

alter table public.participant_app_states enable row level security;

create policy "participants can read their own app state"
on public.participant_app_states for select
to authenticated
using ((select auth.uid()) = auth_user_id);

create policy "participants can create their own app state"
on public.participant_app_states for insert
to authenticated
with check ((select auth.uid()) = auth_user_id);

create policy "participants can update their own app state"
on public.participant_app_states for update
to authenticated
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);

create policy "participants can delete their own app state"
on public.participant_app_states for delete
to authenticated
using ((select auth.uid()) = auth_user_id);

revoke all on table public.participant_app_states from anon;
grant select, insert, update, delete on table public.participant_app_states to authenticated;
