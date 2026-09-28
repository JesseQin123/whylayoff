import { DataAccessError, type LocalRepository } from "@/lib/data/local-repository";
import { type ProblemCardInput, type ResearchStore } from "@/lib/research/research-store";

export class ResearchService {
  constructor(private repository: LocalRepository, private store: ResearchStore) {}

  private authorized(ownerTokenHash: string, sessionId: string) {
    const session = this.repository.getOwnedSession(ownerTokenHash, sessionId);
    if (!this.repository.canProcess(session.participantId, "product_research")) {
      throw new DataAccessError("Product research permission is not active", "FORBIDDEN");
    }
    return session;
  }

  create(ownerTokenHash: string, sessionId: string, input: ProblemCardInput) {
    const session = this.authorized(ownerTokenHash, sessionId);
    return this.store.create(ownerTokenHash, session.participantId, sessionId, input);
  }

  update(ownerTokenHash: string, sessionId: string, cardId: string, input: ProblemCardInput) {
    this.authorized(ownerTokenHash, sessionId);
    try {
      return this.store.update(ownerTokenHash, sessionId, cardId, input);
    } catch (error) {
      if (error instanceof Error && error.message === "RESEARCH_CARD_NOT_FOUND") {
        throw new DataAccessError("Research card not found", "NOT_FOUND");
      }
      throw error;
    }
  }

  list(ownerTokenHash: string, sessionId: string) {
    this.authorized(ownerTokenHash, sessionId);
    return this.store.listByOwner(ownerTokenHash, sessionId);
  }
}

export function publicProblemCard(card: ReturnType<ResearchStore["create"]>) {
  return {
    id: card.id,
    sessionId: card.sessionId,
    version: card.version,
    status: card.status,
    validationStatus: card.validationStatus,
    noProblemObserved: card.noProblemObserved,
    fields: card.fields,
    claims: card.claims,
    revisionHistory: card.revisionHistory,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}
