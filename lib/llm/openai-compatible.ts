import { z } from "zod";
import type { InterviewIntent } from "@/lib/interview/intents";
import { localizedQuestion } from "@/lib/interview/intents";

const questionOutputSchema = z.object({
  acknowledgement: z.string().max(240),
  question: z.string().min(4).max(400),
}).strict();

type FormatQuestionInput = {
  intent: InterviewIntent;
  language: string;
  previousAnswer: string;
};

function deterministicQuestion({ intent, language }: FormatQuestionInput) {
  return localizedQuestion(intent, language);
}

async function callModel(model: string, input: FormatQuestionInput) {
  const baseUrl = process.env.LLM_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.LLM_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("Gateway is not configured");
  const prompt = [
    "You are a careful career interviewer.",
    `Language: ${input.language}`,
    `Selected intent: ${input.intent.id}`,
    `Intent question: ${localizedQuestion(input.intent, input.language)}`,
    `Participant's previous answer: ${input.previousAnswer.slice(0, 1200)}`,
    "Return JSON with exactly two string keys: acknowledgement and question.",
    "Ask exactly one question. Keep the selected intent. Do not add facts, permissions, identity fields, prices, benefits, or claims about why a layoff happened.",
  ].join("\n");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Gateway returned ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Gateway returned no content");
  const jsonText = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw;
  return questionOutputSchema.parse(JSON.parse(jsonText));
}

export async function formatNextQuestion(input: FormatQuestionInput) {
  if (process.env.LLM_MODE !== "gateway") return deterministicQuestion(input);
  const models = [process.env.LLM_INTERVIEW_MODEL, process.env.LLM_FALLBACK_MODEL].filter(Boolean) as string[];
  for (const [modelIndex, model] of models.entries()) {
    const attempts = modelIndex === 0 ? 2 : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const output = await callModel(model, input);
        return output.acknowledgement ? `${output.acknowledgement} ${output.question}` : output.question;
      } catch (error) {
        console.warn("Question model attempt failed", {
          model,
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    }
  }
  return deterministicQuestion(input);
}
