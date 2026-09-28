import { randomUUID } from "node:crypto";
import type {
  AnswerReceipt,
  ContactPreferences,
  EvidenceClaim,
  InterviewSession,
  JsonValue,
  Message,
  Participant,
  ProfileFact,
  Purpose,
  PurposeGrant,
} from "@/lib/domain";
import { getIntent, localizedQuestion } from "@/lib/interview/intents";

export class DataAccessError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "DELETED",
  ) {
    super(message);
  }
}

type AnswerInput = {
  clientMessageId: string;
  expectedStateVersion: number;
  text: string;
  facts: Array<{ field: string; value: JsonValue; status: ProfileFact["status"] }>;
  intentId?: string;
  declined?: boolean;
  nextQuestion?: { intentId: string; text: string; reasonCode: string } | null;
  preserveProgress?: boolean;
};

const now = () => new Date().toISOString();
const sameValue = (left: JsonValue, right: JsonValue) => JSON.stringify(left) === JSON.stringify(right);

export class LocalRepository {
  private participants = new Map<string, Participant>();
  private participantByToken = new Map<string, string>();
  private sessions = new Map<string, InterviewSession>();
  private grants = new Map<string, PurposeGrant>();
  private facts = new Map<string, ProfileFact>();
  private messages = new Map<string, Message>();
  private evidenceClaims = new Map<string, EvidenceClaim>();
  private receipts = new Map<string, AnswerReceipt>();
  private actionReceipts = new Map<string, InterviewSession>();
  private contactPreferences = new Map<string, ContactPreferences>();

  createParticipant(ownerTokenHash: string, language: string, country: string | null): Participant {
    const participant: Participant = {
      id: randomUUID(),
      ownerTokenHash,
      language,
      country,
      createdAt: now(),
      verifiedIdentityId: null,
      deletedAt: null,
    };
    this.participants.set(participant.id, participant);
    this.participantByToken.set(ownerTokenHash, participant.id);
    return participant;
  }

  findParticipantByToken(ownerTokenHash: string): Participant | null {
    const participantId = this.participantByToken.get(ownerTokenHash);
    return participantId ? this.participants.get(participantId) ?? null : null;
  }

  createSession(input: {
    ownerTokenHash: string;
    language: string;
    country: string | null;
    source: InterviewSession["source"];
    acquisition?: Partial<InterviewSession["acquisition"]>;
  }): { participant: Participant; session: InterviewSession } {
    let participant = this.findParticipantByToken(input.ownerTokenHash);
    if (!participant) {
      participant = this.createParticipant(input.ownerTokenHash, input.language, input.country);
    }
    this.assertActive(participant);
    const timestamp = now();
    const firstIntent = getIntent("M01")!;
    const session: InterviewSession = {
      id: randomUUID(),
      participantId: participant.id,
      language: input.language,
      source: input.source,
      state: "informed",
      stateVersion: 0,
      currentIntentId: firstIntent.id,
      currentQuestion: localizedQuestion(firstIntent, input.language),
      askedIntentIds: [],
      declinedIntentIds: [],
      stateBeforePause: null,
      acquisition: {
        source: input.acquisition?.source ?? null,
        medium: input.acquisition?.medium ?? null,
        campaign: input.acquisition?.campaign ?? null,
        content: input.acquisition?.content ?? null,
        referrer: input.acquisition?.referrer ?? null,
        landingPath: input.acquisition?.landingPath ?? null,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.sessions.set(session.id, session);
    this.setPurposeGrant(participant.id, "personal_service", true, "personal-service-v1");
    for (const purpose of ["service_email", "product_research", "course_information", "community", "expert_follow_up"] as const) {
      if (!this.getPurposeGrant(participant.id, purpose)) {
        this.setPurposeGrant(participant.id, purpose, false, "optional-purposes-v1");
      }
    }
    return { participant, session };
  }

  getOwnedSession(ownerTokenHash: string, sessionId: string): InterviewSession {
    const participant = this.findParticipantByToken(ownerTokenHash);
    if (!participant) throw new DataAccessError("Session not found", "NOT_FOUND");
    this.assertActive(participant);
    const session = this.sessions.get(sessionId);
    if (!session) throw new DataAccessError("Session not found", "NOT_FOUND");
    if (session.participantId !== participant.id) {
      throw new DataAccessError("Session does not belong to this participant", "FORBIDDEN");
    }
    return session;
  }

  getSessionSnapshot(ownerTokenHash: string, sessionId: string) {
    const session = this.getOwnedSession(ownerTokenHash, sessionId);
    return {
      session,
      grants: this.listPurposeGrants(session.participantId),
      facts: this.listFacts(session.participantId),
      evidenceClaims: this.listEvidenceClaims(session.id),
    };
  }

  submitAnswer(ownerTokenHash: string, sessionId: string, input: AnswerInput): AnswerReceipt {
    const session = this.getOwnedSession(ownerTokenHash, sessionId);
    const receiptKey = `${sessionId}:${input.clientMessageId}`;
    const prior = this.receipts.get(receiptKey);
    if (prior) return { ...prior, duplicate: true };
    if (session.stateVersion !== input.expectedStateVersion) {
      throw new DataAccessError("Session version has changed", "CONFLICT");
    }
    if (!this.canProcess(session.participantId, "personal_service")) {
      throw new DataAccessError("Personal service access is no longer active", "FORBIDDEN");
    }

    const message: Message = {
      id: randomUUID(),
      participantId: session.participantId,
      sessionId,
      clientMessageId: input.clientMessageId,
      text: input.text,
      createdAt: now(),
    };
    this.messages.set(message.id, message);
    const facts = input.facts.map((candidate) => this.mergeFact(
      session.participantId,
      message.id,
      candidate,
      input.preserveProgress === true,
    ));
    if (input.intentId) {
      for (const fact of facts) {
        if (fact.status === "confirmed") this.addEvidenceClaim(session, message, input.intentId, fact);
      }
    }
    if (input.intentId && !input.preserveProgress) {
      if (!session.askedIntentIds.includes(input.intentId)) session.askedIntentIds.push(input.intentId);
      if (input.declined && !session.declinedIntentIds.includes(input.intentId)) {
        session.declinedIntentIds.push(input.intentId);
      }
      session.currentIntentId = input.nextQuestion?.intentId ?? null;
      session.currentQuestion = input.nextQuestion?.text ?? null;
    }
    session.stateVersion += 1;
    if (!input.preserveProgress) {
      session.state = input.nextQuestion === null && input.intentId ? "career_summary_review" : "experience_interview";
    }
    session.updatedAt = now();

    const receipt: AnswerReceipt = {
      messageId: message.id,
      sessionId,
      stateVersion: session.stateVersion,
      duplicate: false,
      facts,
      nextQuestion: input.nextQuestion ?? null,
    };
    this.receipts.set(receiptKey, receipt);
    return receipt;
  }

  getAnswerReceipt(ownerTokenHash: string, sessionId: string, clientMessageId: string) {
    this.getOwnedSession(ownerTokenHash, sessionId);
    return this.receipts.get(`${sessionId}:${clientMessageId}`) ?? null;
  }

  confirmBackgroundFields(
    ownerTokenHash: string,
    sessionId: string,
    expectedStateVersion: number,
    fields: Array<{ field: string; value: JsonValue; status: "confirmed" | "unknown" | "declined" }>,
  ) {
    const session = this.getOwnedSession(ownerTokenHash, sessionId);
    if (session.stateVersion !== expectedStateVersion) {
      throw new DataAccessError("Session version has changed", "CONFLICT");
    }
    const facts = fields.map((field) => this.mergeFact(session.participantId, null, field, true));
    session.state = "background_review";
    session.stateVersion += 1;
    session.updatedAt = now();
    return { session, facts };
  }

  applySessionAction(
    ownerTokenHash: string,
    sessionId: string,
    input: { clientActionId: string; expectedStateVersion: number; action: "pause" | "resume" | "finish" },
  ) {
    const session = this.getOwnedSession(ownerTokenHash, sessionId);
    const key = `${sessionId}:action:${input.clientActionId}`;
    const prior = this.actionReceipts.get(key);
    if (prior) return prior;
    if (session.stateVersion !== input.expectedStateVersion) {
      throw new DataAccessError("Session version has changed", "CONFLICT");
    }
    if (input.action === "pause") {
      if (session.state !== "paused") session.stateBeforePause = session.state;
      session.state = "paused";
    } else if (input.action === "resume") {
      session.state = session.stateBeforePause ?? "experience_interview";
      session.stateBeforePause = null;
    } else {
      session.state = "career_summary_review";
      session.currentIntentId = null;
      session.currentQuestion = null;
    }
    session.stateVersion += 1;
    session.updatedAt = now();
    this.actionReceipts.set(key, { ...session });
    return session;
  }

  setPurposeForOwnedSession(
    ownerTokenHash: string,
    sessionId: string,
    purpose: Exclude<Purpose, "personal_service">,
    selected: boolean,
    noticeVersion: string,
  ): PurposeGrant {
    const session = this.getOwnedSession(ownerTokenHash, sessionId);
    return this.setPurposeGrant(session.participantId, purpose, selected, noticeVersion);
  }

  setContactPreferences(
    ownerTokenHash: string,
    sessionId: string,
    input: Omit<ContactPreferences, "participantId" | "version" | "updatedAt"> & { noticeVersion: string },
  ): ContactPreferences {
    const session = this.getOwnedSession(ownerTokenHash, sessionId);
    const existing = this.contactPreferences.get(session.participantId);
    const preferences: ContactPreferences = {
      participantId: session.participantId,
      emailAddress: input.emailAddress,
      serviceEmail: input.serviceEmail,
      courseInformation: input.courseInformation,
      community: input.community,
      expertFollowUp: input.expertFollowUp,
      version: (existing?.version ?? 0) + 1,
      updatedAt: now(),
    };
    this.contactPreferences.set(session.participantId, preferences);
    this.setPurposeGrant(session.participantId, "service_email", input.serviceEmail, input.noticeVersion);
    this.setPurposeGrant(session.participantId, "course_information", input.courseInformation, input.noticeVersion);
    this.setPurposeGrant(session.participantId, "community", input.community, input.noticeVersion);
    this.setPurposeGrant(session.participantId, "expert_follow_up", input.expertFollowUp, input.noticeVersion);
    return preferences;
  }

  getContactPreferences(ownerTokenHash: string, sessionId: string): ContactPreferences | null {
    const session = this.getOwnedSession(ownerTokenHash, sessionId);
    return this.contactPreferences.get(session.participantId) ?? null;
  }

  getOwnedOperationsProfile(ownerTokenHash: string, sessionId: string) {
    const snapshot = this.getSessionSnapshot(ownerTokenHash, sessionId);
    const values = new Map(snapshot.facts.map((fact) => [fact.field, fact.value]));
    const text = (field: string) => {
      const value = values.get(field);
      return typeof value === "string" ? value : value == null ? "" : JSON.stringify(value);
    };
    return {
      sessionId: snapshot.session.id,
      domain: text("industry") || text("domain"),
      role: text("role"),
      region: text("location"),
      language: snapshot.session.language,
      expertise: text("responsibilities") || text("expertise"),
      activeGrants: snapshot.grants.filter((grant) => grant.selected).map((grant) => grant.purpose),
      contactPreferences: this.contactPreferences.get(snapshot.session.participantId) ?? null,
      acquisition: snapshot.session.acquisition,
    };
  }

  revokeGrant(ownerTokenHash: string, grantId: string): PurposeGrant {
    const participant = this.findParticipantByToken(ownerTokenHash);
    if (!participant) throw new DataAccessError("Grant not found", "NOT_FOUND");
    const grant = [...this.grants.values()].find((item) => item.id === grantId);
    if (!grant) throw new DataAccessError("Grant not found", "NOT_FOUND");
    if (grant.participantId !== participant.id) throw new DataAccessError("Grant is not owned", "FORBIDDEN");
    return this.setPurposeGrant(participant.id, grant.purpose, false, grant.noticeVersion);
  }

  canProcess(participantId: string, purpose: Purpose): boolean {
    return this.getPurposeGrant(participantId, purpose)?.selected === true;
  }

  exportParticipantData(ownerTokenHash: string, sessionId: string) {
    const session = this.getOwnedSession(ownerTokenHash, sessionId);
    const participant = this.participants.get(session.participantId)!;
    return {
      exportedAt: now(),
      participant: { ...participant, ownerTokenHash: "[redacted]" },
      sessions: [...this.sessions.values()].filter((item) => item.participantId === participant.id),
      grants: this.listPurposeGrants(participant.id),
      facts: this.listFacts(participant.id),
      messages: [...this.messages.values()].filter((item) => item.participantId === participant.id),
      evidenceClaims: this.listEvidenceClaims(session.id),
      contactPreferences: this.contactPreferences.get(participant.id) ?? null,
    };
  }

  deleteParticipantData(ownerTokenHash: string, sessionId: string) {
    const session = this.getOwnedSession(ownerTokenHash, sessionId);
    const participant = this.participants.get(session.participantId)!;
    const deletedAt = now();
    participant.deletedAt = deletedAt;
    session.state = "deletion_completed";
    session.stateVersion += 1;
    session.updatedAt = deletedAt;
    for (const grant of this.listPurposeGrants(participant.id)) {
      this.setPurposeGrant(participant.id, grant.purpose, false, grant.noticeVersion);
    }
    for (const [id, message] of this.messages) if (message.participantId === participant.id) this.messages.delete(id);
    for (const [key, fact] of this.facts) if (fact.participantId === participant.id) this.facts.delete(key);
    for (const [id, claim] of this.evidenceClaims) if (claim.participantId === participant.id) this.evidenceClaims.delete(id);
    return { status: "completed" as const, deletedAt };
  }

  private assertActive(participant: Participant) {
    if (participant.deletedAt) throw new DataAccessError("Participant data has been deleted", "DELETED");
  }

  private purposeKey(participantId: string, purpose: Purpose) {
    return `${participantId}:${purpose}`;
  }

  private getPurposeGrant(participantId: string, purpose: Purpose) {
    return this.grants.get(this.purposeKey(participantId, purpose));
  }

  private listPurposeGrants(participantId: string) {
    return [...this.grants.values()].filter((grant) => grant.participantId === participantId);
  }

  private setPurposeGrant(participantId: string, purpose: Purpose, selected: boolean, noticeVersion: string) {
    const key = this.purposeKey(participantId, purpose);
    const existing = this.grants.get(key);
    const timestamp = now();
    const grant: PurposeGrant = {
      id: existing?.id ?? randomUUID(),
      participantId,
      purpose,
      selected,
      noticeVersion,
      version: (existing?.version ?? 0) + 1,
      grantedAt: selected ? timestamp : existing?.grantedAt ?? null,
      revokedAt: selected ? null : timestamp,
      updatedAt: timestamp,
    };
    this.grants.set(key, grant);
    return grant;
  }

  private listFacts(participantId: string) {
    return [...this.facts.values()].filter((fact) => fact.participantId === participantId);
  }

  private listEvidenceClaims(sessionId: string) {
    return [...this.evidenceClaims.values()].filter((claim) => claim.sessionId === sessionId);
  }

  private addEvidenceClaim(session: InterviewSession, message: Message, intentId: string, fact: ProfileFact) {
    const allowedPurposes: Purpose[] = ["personal_service"];
    if (this.canProcess(session.participantId, "product_research")) allowedPurposes.push("product_research");
    const claim: EvidenceClaim = {
      id: randomUUID(),
      participantId: session.participantId,
      sessionId: session.id,
      messageId: message.id,
      intentId,
      field: fact.field,
      statement: typeof fact.value === "string" ? fact.value : JSON.stringify(fact.value),
      quote: message.text,
      spanStart: 0,
      spanEnd: Array.from(message.text).length,
      sourceLanguage: session.language,
      participantConfirmed: true,
      independentlyVerified: false,
      allowedPurposes,
      createdAt: now(),
    };
    this.evidenceClaims.set(claim.id, claim);
  }

  private mergeFact(
    participantId: string,
    messageId: string | null,
    candidate: { field: string; value: JsonValue; status: ProfileFact["status"] },
    resolveConflict = false,
  ) {
    const key = `${participantId}:${candidate.field}`;
    const existing = this.facts.get(key);
    const timestamp = now();
    if (!existing) {
      const fact: ProfileFact = {
        id: randomUUID(),
        participantId,
        field: candidate.field,
        value: candidate.value,
        status: candidate.status,
        evidenceMessageId: messageId,
        revision: 1,
        history: [],
        updatedAt: timestamp,
      };
      this.facts.set(key, fact);
      return fact;
    }
    existing.history.push({
      value: existing.value,
      status: existing.status,
      messageId: existing.evidenceMessageId,
      recordedAt: existing.updatedAt,
    });
    const conflicts = existing.status === "confirmed"
      && candidate.status === "confirmed"
      && !sameValue(existing.value, candidate.value)
      && !resolveConflict;
    existing.value = candidate.value;
    existing.status = conflicts ? "contradicted" : candidate.status;
    existing.evidenceMessageId = messageId;
    existing.revision += 1;
    existing.updatedAt = timestamp;
    return existing;
  }
}
