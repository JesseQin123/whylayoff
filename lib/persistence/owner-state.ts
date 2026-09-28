import type { SupabaseClient, User } from "@supabase/supabase-js";
import { transcriptionStore, type TranscriptionJob } from "@/lib/audio/transcription-store";
import { backgroundStore, type BackgroundAsset } from "@/lib/background/background-store";
import { benefitStore, type BenefitClaim } from "@/lib/benefits/benefit-store";
import { repository } from "@/lib/data/store";
import type { RepositoryOwnerState } from "@/lib/data/local-repository";
import { operationStore, type OperationEvent } from "@/lib/observability/operation-store";
import { resumeStore, type ResumeVersion } from "@/lib/outputs/resume-store";
import { researchStore, type ProblemCard } from "@/lib/research/research-store";
import { DataAccessError } from "@/lib/data/local-repository";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type PersistedOwnerState = {
  schemaVersion: 1;
  repository: RepositoryOwnerState | null;
  backgroundAssets: BackgroundAsset[];
  resumeVersions: ResumeVersion[];
  researchCards: ProblemCard[];
  benefitClaims: BenefitClaim[];
  transcriptionJobs: TranscriptionJob[];
  operationEvents: OperationEvent[];
};

type StateRow = {
  owner_token_hash: string;
  state_version: number;
  state: PersistedOwnerState;
};

function dumpOwnerState(ownerTokenHash: string): PersistedOwnerState {
  return {
    schemaVersion: 1,
    repository: repository.dumpOwnerState(ownerTokenHash),
    backgroundAssets: backgroundStore.dumpOwnerState(ownerTokenHash),
    resumeVersions: resumeStore.dumpOwnerState(ownerTokenHash),
    researchCards: researchStore.dumpOwnerState(ownerTokenHash),
    benefitClaims: benefitStore.dumpOwnerState(ownerTokenHash),
    transcriptionJobs: transcriptionStore.dumpOwnerState(ownerTokenHash),
    operationEvents: operationStore.dumpOwnerState(ownerTokenHash),
  };
}

function restoreOwnerState(ownerTokenHash: string, state: PersistedOwnerState | null) {
  repository.restoreOwnerState(ownerTokenHash, state?.repository ?? null);
  backgroundStore.restoreOwnerState(ownerTokenHash, state?.backgroundAssets ?? []);
  resumeStore.restoreOwnerState(ownerTokenHash, state?.resumeVersions ?? []);
  researchStore.restoreOwnerState(ownerTokenHash, state?.researchCards ?? []);
  benefitStore.restoreOwnerState(ownerTokenHash, state?.benefitClaims ?? []);
  transcriptionStore.restoreOwnerState(ownerTokenHash, state?.transcriptionJobs ?? []);
  operationStore.restoreOwnerState(ownerTokenHash, state?.operationEvents ?? []);
}

async function currentOrAnonymousUser(client: SupabaseClient, createUser: boolean): Promise<User | null> {
  const { data, error } = await client.auth.getUser();
  if (!error && data.user) return data.user;
  if (!createUser) return null;
  const created = await client.auth.signInAnonymously();
  if (created.error || !created.data.user) {
    throw new Error(`SUPABASE_ANONYMOUS_AUTH_FAILED:${created.error?.code ?? "UNKNOWN"}`);
  }
  return created.data.user;
}

export type OwnerStateHandle = {
  durable: boolean;
  save: () => Promise<void>;
  delete: () => Promise<void>;
};

const localHandle: OwnerStateHandle = {
  durable: false,
  save: async () => undefined,
  delete: async () => undefined,
};

export async function hydrateOwnerState(ownerTokenHash: string, createUser = false): Promise<OwnerStateHandle> {
  if (!isSupabaseConfigured()) return localHandle;
  const client = await createSupabaseServerClient();
  if (!client) return localHandle;
  const user = await currentOrAnonymousUser(client, createUser);
  if (!user) throw new DataAccessError("Session not found", "NOT_FOUND");
  const loaded = await client
    .from("participant_app_states")
    .select("owner_token_hash,state_version,state")
    .eq("auth_user_id", user.id)
    .maybeSingle<StateRow>();
  if (loaded.error) throw new Error(`SUPABASE_STATE_LOAD_FAILED:${loaded.error.code}`);
  const row = loaded.data;
  if (row && row.owner_token_hash !== ownerTokenHash) {
    throw new DataAccessError("Browser identity does not match this participant", "FORBIDDEN");
  }
  restoreOwnerState(ownerTokenHash, row?.state ?? null);
  let revision = row?.state_version ?? 0;

  return {
    durable: true,
    save: async () => {
      const state = dumpOwnerState(ownerTokenHash);
      if (revision === 0) {
        const inserted = await client.from("participant_app_states").insert({
          auth_user_id: user.id,
          owner_token_hash: ownerTokenHash,
          state_version: 1,
          state,
        }).select("state_version").single<{ state_version: number }>();
        if (inserted.error) throw new Error(`SUPABASE_STATE_SAVE_FAILED:${inserted.error.code}`);
        revision = inserted.data.state_version;
        return;
      }
      const updated = await client.from("participant_app_states").update({
        state,
        state_version: revision + 1,
        updated_at: new Date().toISOString(),
      }).eq("auth_user_id", user.id).eq("state_version", revision)
        .select("state_version").maybeSingle<{ state_version: number }>();
      if (updated.error) throw new Error(`SUPABASE_STATE_SAVE_FAILED:${updated.error.code}`);
      if (!updated.data) throw new DataAccessError("Participant data changed in another request", "CONFLICT");
      revision = updated.data.state_version;
    },
    delete: async () => {
      const deleted = await client.from("participant_app_states").delete().eq("auth_user_id", user.id);
      if (deleted.error) throw new Error(`SUPABASE_STATE_DELETE_FAILED:${deleted.error.code}`);
      restoreOwnerState(ownerTokenHash, null);
      revision = 0;
      // The durable row is already gone at this point. Signing out also clears
      // the browser's anonymous Supabase session so a later visit starts clean.
      await client.auth.signOut({ scope: "local" });
    },
  };
}
