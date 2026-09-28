import { randomUUID } from "node:crypto";

export type ResearchFieldName =
  | "firsthandArea" | "workflowSteps" | "roleBoundary" | "problemEvent"
  | "frequency" | "activeTime" | "waitTime" | "impact" | "workaround"
  | "barriers" | "counterexample" | "employerStatement" | "firsthandObservation"
  | "participantInference" | "publicContext";

export type ResearchClaim = {
  id: string;
  field: ResearchFieldName | "noProblemObserved";
  statement: string;
  quote: string;
  sourceType: "participant_report" | "employer_statement" | "firsthand_observation" | "participant_inference" | "public_context";
  status: "participant_confirmed" | "unknown" | "no_problem_observed";
  independentlyVerified: false;
};

export type ProblemCardInput = {
  noProblemObserved: boolean;
  fields: Partial<Record<ResearchFieldName, string>>;
};

export type ProblemCard = {
  id: string;
  ownerTokenHash: string;
  participantId: string;
  sessionId: string;
  version: number;
  status: "participant_confirmed";
  validationStatus: "unvalidated_participant_report";
  noProblemObserved: boolean;
  fields: ProblemCardInput["fields"];
  claims: ResearchClaim[];
  revisionHistory: Array<{
    version: number;
    noProblemObserved: boolean;
    fields: ProblemCardInput["fields"];
    revisedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

const sourceTypeFor = (field: ResearchFieldName): ResearchClaim["sourceType"] => {
  if (field === "employerStatement") return "employer_statement";
  if (field === "firsthandObservation") return "firsthand_observation";
  if (field === "participantInference") return "participant_inference";
  if (field === "publicContext") return "public_context";
  return "participant_report";
};

function claimsFor(input: ProblemCardInput) {
  if (input.noProblemObserved) {
    return [{
      id: randomUUID(),
      field: "noProblemObserved" as const,
      statement: "Participant reported no recurring problem in the area discussed.",
      quote: "No recurring problem observed",
      sourceType: "participant_report" as const,
      status: "no_problem_observed" as const,
      independentlyVerified: false as const,
    }];
  }
  return (Object.entries(input.fields) as Array<[ResearchFieldName, string]>).flatMap(([field, value]) => {
    const text = value?.trim();
    return text ? [{
      id: randomUUID(),
      field,
      statement: text,
      quote: text,
      sourceType: sourceTypeFor(field),
      status: "participant_confirmed" as const,
      independentlyVerified: false as const,
    }] : [];
  });
}

export class ResearchStore {
  private cards = new Map<string, ProblemCard>();

  create(ownerTokenHash: string, participantId: string, sessionId: string, input: ProblemCardInput) {
    const timestamp = new Date().toISOString();
    const card: ProblemCard = {
      id: randomUUID(),
      ownerTokenHash,
      participantId,
      sessionId,
      version: 1,
      status: "participant_confirmed",
      validationStatus: "unvalidated_participant_report",
      noProblemObserved: input.noProblemObserved,
      fields: input.fields,
      claims: claimsFor(input),
      revisionHistory: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.cards.set(card.id, card);
    return card;
  }

  update(ownerTokenHash: string, sessionId: string, cardId: string, input: ProblemCardInput) {
    const card = this.cards.get(cardId);
    if (!card || card.ownerTokenHash !== ownerTokenHash || card.sessionId !== sessionId) {
      throw new Error("RESEARCH_CARD_NOT_FOUND");
    }
    card.revisionHistory.push({
      version: card.version,
      noProblemObserved: card.noProblemObserved,
      fields: card.fields,
      revisedAt: card.updatedAt,
    });
    card.version += 1;
    card.noProblemObserved = input.noProblemObserved;
    card.fields = input.fields;
    card.claims = claimsFor(input);
    card.updatedAt = new Date().toISOString();
    return card;
  }

  listByOwner(ownerTokenHash: string, sessionId: string) {
    return [...this.cards.values()].filter((card) => card.ownerTokenHash === ownerTokenHash && card.sessionId === sessionId);
  }

  deleteForOwner(ownerTokenHash: string) {
    for (const [id, card] of this.cards) if (card.ownerTokenHash === ownerTokenHash) this.cards.delete(id);
  }
}

declare global {
  var nextChapterResearchStore: ResearchStore | undefined;
}

export const researchStore = globalThis.nextChapterResearchStore ?? new ResearchStore();
globalThis.nextChapterResearchStore = researchStore;
