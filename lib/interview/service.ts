import type { z } from "zod";
import type { correctionSchema, interviewAnswerSchema, sessionActionSchema } from "@/lib/domain";
import { DataAccessError, type LocalRepository } from "@/lib/data/local-repository";
import { formatNextQuestion } from "@/lib/llm/openai-compatible";
import { getIntent, selectNextIntent } from "@/lib/interview/intents";

type AnswerInput = z.infer<typeof interviewAnswerSchema>;
type ActionInput = z.infer<typeof sessionActionSchema>;
type CorrectionInput = z.infer<typeof correctionSchema>;

async function nextQuestionFor(session: ReturnType<LocalRepository["getOwnedSession"]>, handledIntentId: string, previousAnswer: string) {
  const nextIntent = selectNextIntent(
    [...session.askedIntentIds, handledIntentId],
    session.declinedIntentIds,
  );
  if (!nextIntent) return null;
  return {
    intentId: nextIntent.id,
    text: await formatNextQuestion({ intent: nextIntent, language: session.language, previousAnswer }),
    reasonCode: nextIntent.reasonCode,
  };
}

export async function processInterviewAnswer(
  repository: LocalRepository,
  ownerTokenHash: string,
  sessionId: string,
  input: AnswerInput,
) {
  const prior = repository.getAnswerReceipt(ownerTokenHash, sessionId, input.clientMessageId);
  if (prior) return { ...prior, duplicate: true };
  const session = repository.getOwnedSession(ownerTokenHash, sessionId);
  if (session.state === "paused") throw new DataAccessError("Resume the session before answering", "CONFLICT");
  const intent = getIntent(session.currentIntentId);
  if (!intent) throw new DataAccessError("The interview is ready for summary", "CONFLICT");
  const nextQuestion = await nextQuestionFor(session, intent.id, input.text);
  return repository.submitAnswer(ownerTokenHash, sessionId, {
    clientMessageId: input.clientMessageId,
    expectedStateVersion: input.expectedStateVersion,
    text: input.text,
    facts: [{
      field: input.correctionForField ?? intent.field,
      value: input.text,
      status: "confirmed",
    }],
    intentId: intent.id,
    nextQuestion,
  });
}

export async function processSessionAction(
  repository: LocalRepository,
  ownerTokenHash: string,
  sessionId: string,
  input: ActionInput,
) {
  if (input.action !== "skip") {
    return {
      session: repository.applySessionAction(ownerTokenHash, sessionId, {
        clientActionId: input.clientActionId,
        expectedStateVersion: input.expectedStateVersion,
        action: input.action,
      }),
      receipt: null,
    };
  }
  const prior = repository.getAnswerReceipt(ownerTokenHash, sessionId, input.clientActionId);
  if (prior) return { session: repository.getOwnedSession(ownerTokenHash, sessionId), receipt: { ...prior, duplicate: true } };
  const session = repository.getOwnedSession(ownerTokenHash, sessionId);
  const intent = getIntent(session.currentIntentId);
  if (!intent) throw new DataAccessError("The interview is ready for summary", "CONFLICT");
  const nextQuestion = await nextQuestionFor(session, intent.id, "Participant chose to skip this question.");
  const receipt = repository.submitAnswer(ownerTokenHash, sessionId, {
    clientMessageId: input.clientActionId,
    expectedStateVersion: input.expectedStateVersion,
    text: "Participant chose not to answer this question.",
    facts: [{ field: intent.field, value: null, status: "declined" }],
    intentId: intent.id,
    declined: true,
    nextQuestion,
  });
  return { session: repository.getOwnedSession(ownerTokenHash, sessionId), receipt };
}

export async function processCorrection(
  repository: LocalRepository,
  ownerTokenHash: string,
  sessionId: string,
  input: CorrectionInput,
) {
  const prior = repository.getAnswerReceipt(ownerTokenHash, sessionId, input.clientMessageId);
  if (prior) return { ...prior, duplicate: true };
  const snapshot = repository.getSessionSnapshot(ownerTokenHash, sessionId);
  if (!snapshot.facts.some((fact) => fact.field === input.field)) {
    throw new DataAccessError("The fact to correct was not found", "NOT_FOUND");
  }
  const currentIntent = getIntent(snapshot.session.currentIntentId);
  return repository.submitAnswer(ownerTokenHash, sessionId, {
    clientMessageId: input.clientMessageId,
    expectedStateVersion: input.expectedStateVersion,
    text: input.text,
    facts: [{ field: input.field, value: input.text, status: "confirmed" }],
    intentId: "CORRECTION",
    preserveProgress: true,
    nextQuestion: currentIntent ? {
      intentId: currentIntent.id,
      text: snapshot.session.currentQuestion ?? currentIntent.question.en,
      reasonCode: currentIntent.reasonCode,
    } : null,
  });
}
