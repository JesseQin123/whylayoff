import type { EvidenceClaim, InterviewSession, ProfileFact, PurposeGrant } from "@/lib/domain";

export function publicSession(session: InterviewSession) {
  return {
    id: session.id,
    language: session.language,
    source: session.source,
    state: session.state,
    stateVersion: session.stateVersion,
    currentIntentId: session.currentIntentId,
    currentQuestion: session.currentQuestion,
    askedIntentIds: session.askedIntentIds,
    declinedIntentIds: session.declinedIntentIds,
    acquisition: session.acquisition,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export function publicEvidenceClaim(claim: EvidenceClaim) {
  return {
    id: claim.id,
    messageId: claim.messageId,
    intentId: claim.intentId,
    field: claim.field,
    statement: claim.statement,
    quote: claim.quote,
    spanStart: claim.spanStart,
    spanEnd: claim.spanEnd,
    sourceLanguage: claim.sourceLanguage,
    participantConfirmed: claim.participantConfirmed,
    independentlyVerified: claim.independentlyVerified,
    allowedPurposes: claim.allowedPurposes,
    createdAt: claim.createdAt,
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
