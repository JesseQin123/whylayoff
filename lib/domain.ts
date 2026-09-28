import { z } from "zod";

export const purposes = [
  "personal_service",
  "product_research",
  "course_information",
  "community",
  "expert_follow_up",
] as const;

export const purposeSchema = z.enum(purposes);
export type Purpose = z.infer<typeof purposeSchema>;

export const factStatuses = ["confirmed", "unknown", "declined", "contradicted"] as const;
export const factStatusSchema = z.enum(factStatuses);
export type FactStatus = z.infer<typeof factStatusSchema>;

export const sessionStates = [
  "created",
  "informed",
  "intake",
  "background_review",
  "experience_interview",
  "career_summary_review",
  "resume_draft",
  "resume_fact_review",
  "export_ready",
  "paused",
  "deletion_requested",
  "access_revoked",
  "deletion_completed",
] as const;

export const sessionStateSchema = z.enum(sessionStates);
export type SessionState = z.infer<typeof sessionStateSchema>;

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type Participant = {
  id: string;
  ownerTokenHash: string;
  language: string;
  country: string | null;
  createdAt: string;
  verifiedIdentityId: string | null;
  deletedAt: string | null;
};

export type InterviewSession = {
  id: string;
  participantId: string;
  language: string;
  source: "conversation" | "resume" | "linkedin";
  state: SessionState;
  stateVersion: number;
  currentIntentId: string | null;
  currentQuestion: string | null;
  askedIntentIds: string[];
  declinedIntentIds: string[];
  stateBeforePause: SessionState | null;
  createdAt: string;
  updatedAt: string;
};

export type PurposeGrant = {
  id: string;
  participantId: string;
  purpose: Purpose;
  selected: boolean;
  noticeVersion: string;
  version: number;
  grantedAt: string | null;
  revokedAt: string | null;
  updatedAt: string;
};

export type ContactPreferences = {
  participantId: string;
  courseInformation: boolean;
  community: boolean;
  expertFollowUp: boolean;
  version: number;
  updatedAt: string;
};

export type ProfileFactRevision = {
  value: JsonValue;
  status: FactStatus;
  messageId: string | null;
  recordedAt: string;
};

export type ProfileFact = {
  id: string;
  participantId: string;
  field: string;
  value: JsonValue;
  status: FactStatus;
  evidenceMessageId: string | null;
  revision: number;
  history: ProfileFactRevision[];
  updatedAt: string;
};

export type Message = {
  id: string;
  participantId: string;
  sessionId: string;
  clientMessageId: string;
  text: string;
  createdAt: string;
};

export type EvidenceClaim = {
  id: string;
  participantId: string;
  sessionId: string;
  messageId: string;
  intentId: string;
  field: string;
  statement: string;
  quote: string;
  spanStart: number;
  spanEnd: number;
  sourceLanguage: string;
  participantConfirmed: boolean;
  independentlyVerified: boolean;
  allowedPurposes: Purpose[];
  createdAt: string;
};

export type AnswerReceipt = {
  messageId: string;
  sessionId: string;
  stateVersion: number;
  duplicate: boolean;
  facts: ProfileFact[];
  nextQuestion: { intentId: string; text: string; reasonCode: string } | null;
};

export const createSessionSchema = z.object({
  language: z.string().trim().min(2).max(12).default("en"),
  country: z.string().trim().min(2).max(2).toUpperCase().nullable().optional(),
  source: z.enum(["conversation", "resume", "linkedin"]).default("conversation"),
});

export const answerSchema = z.object({
  clientMessageId: z.string().min(8).max(100),
  expectedStateVersion: z.number().int().nonnegative(),
  text: z.string().trim().min(1).max(10_000),
  facts: z.array(z.object({
    field: z.string().regex(/^[a-z][a-z0-9_]{1,63}$/),
    value: z.json(),
    status: factStatusSchema,
  })).max(20).default([]),
});

export const interviewAnswerSchema = answerSchema.pick({
  clientMessageId: true,
  expectedStateVersion: true,
  text: true,
}).extend({
  correctionForField: z.string().regex(/^[a-z][a-z0-9_]{1,63}$/).optional(),
});

export const sessionActionSchema = z.object({
  clientActionId: z.string().min(8).max(100),
  expectedStateVersion: z.number().int().nonnegative(),
  action: z.enum(["pause", "resume", "skip", "finish"]),
});

export const correctionSchema = z.object({
  clientMessageId: z.string().min(8).max(100),
  expectedStateVersion: z.number().int().nonnegative(),
  field: z.string().regex(/^[a-z][a-z0-9_]{1,63}$/),
  text: z.string().trim().min(1).max(10_000),
});

export const backgroundFieldSchema = z.object({
  field: z.enum(["role", "industry", "responsibilities", "dates", "location", "career_goal"]),
  value: z.json(),
  status: z.enum(["confirmed", "unknown", "declined"]),
});

export const backgroundConfirmSchema = z.object({
  sessionId: z.string().uuid(),
  expectedStateVersion: z.number().int().nonnegative(),
  fields: z.array(backgroundFieldSchema).min(1).max(12),
});

export const purposeGrantInputSchema = z.object({
  sessionId: z.string().uuid(),
  purpose: purposeSchema.exclude(["personal_service"]),
  selected: z.boolean(),
  noticeVersion: z.string().min(1).max(80),
});

export const contactPreferenceInputSchema = z.object({
  sessionId: z.string().uuid(),
  courseInformation: z.boolean(),
  community: z.boolean(),
  expertFollowUp: z.boolean(),
  noticeVersion: z.string().min(1).max(80),
});
