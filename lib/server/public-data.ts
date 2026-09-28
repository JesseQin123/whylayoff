import type { InterviewSession, ProfileFact, PurposeGrant } from "@/lib/domain";

export function publicSession(session: InterviewSession) {
  return {
    id: session.id,
    language: session.language,
    source: session.source,
    state: session.state,
    stateVersion: session.stateVersion,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export function publicGrant(grant: PurposeGrant) {
  return {
    id: grant.id,
    purpose: grant.purpose,
    selected: grant.selected,
    noticeVersion: grant.noticeVersion,
    version: grant.version,
    grantedAt: grant.grantedAt,
    revokedAt: grant.revokedAt,
    updatedAt: grant.updatedAt,
  };
}

export function publicFact(fact: ProfileFact) {
  return {
    id: fact.id,
    field: fact.field,
    value: fact.value,
    status: fact.status,
    evidenceMessageId: fact.evidenceMessageId,
    revision: fact.revision,
    history: fact.history,
    updatedAt: fact.updatedAt,
  };
}
