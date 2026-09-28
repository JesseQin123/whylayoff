export type InterviewIntent = {
  id: string;
  field: string;
  reasonCode: "goal_missing" | "example_needed" | "background_missing" | "summary_ready";
  skippable: boolean;
  question: { en: string; es: string };
};

export const interviewIntents: InterviewIntent[] = [
  { id: "M01", field: "career_goal", reasonCode: "goal_missing", skippable: false, question: { en: "What would you most like to change about your work situation in the next one to three months?", es: "¿Qué te gustaría cambiar de tu situación laboral en los próximos uno a tres meses?" } },
  { id: "M02", field: "primary_constraint", reasonCode: "goal_missing", skippable: true, question: { en: "What should we take into account to make a plan realistic for you?", es: "¿Qué deberíamos tener en cuenta para que el plan sea realista para ti?" } },
  { id: "M03", field: "role_responsibility", reasonCode: "background_missing", skippable: false, question: { en: "What did people mainly rely on you to get done in your last role?", es: "¿Qué esperaban principalmente de ti en tu último puesto?" } },
  { id: "M04", field: "workflow_example", reasonCode: "example_needed", skippable: false, question: { en: "Could you walk me through one typical piece of work, starting with how it reached you?", es: "¿Puedes contarme cómo realizabas una tarea habitual, desde que la recibías?" } },
  { id: "M05", field: "workflow_handoff", reasonCode: "example_needed", skippable: true, question: { en: "What did you receive, and what did you hand over when you were done?", es: "¿Qué recibías al empezar y qué entregabas al terminar?" } },
  { id: "M06", field: "judgment_example", reasonCode: "example_needed", skippable: true, question: { en: "Where did that work need your judgment?", es: "¿En qué parte de ese trabajo necesitabas aplicar tu criterio?" } },
  { id: "M07", field: "impact_example", reasonCode: "example_needed", skippable: true, question: { en: "Can you recall a time when your work made a useful difference?", es: "¿Recuerdas una ocasión en la que tu trabajo produjo una mejora útil?" } },
  { id: "M08", field: "work_change_context", reasonCode: "background_missing", skippable: true, question: { en: "Is there anything about how that role ended or changed that you would like to share? We can skip this.", es: "¿Hay algo sobre cómo terminó o cambió ese puesto que quieras compartir? Podemos omitirlo." } },
  { id: "M09", field: "tools_experience", reasonCode: "background_missing", skippable: true, question: { en: "Which tools or new ways of working have you tried, if any?", es: "¿Qué herramientas o nuevas formas de trabajar has probado, si has probado alguna?" } },
  { id: "M10", field: "preferred_next_step", reasonCode: "summary_ready", skippable: false, question: { en: "Which next step would you like to try first?", es: "¿Cuál de estos próximos pasos te gustaría probar primero?" } },
];

export const getIntent = (intentId: string | null) => interviewIntents.find((intent) => intent.id === intentId) ?? null;

export function localizedQuestion(intent: InterviewIntent, language: string) {
  return language.toLowerCase().startsWith("es") ? intent.question.es : intent.question.en;
}

export function selectNextIntent(asked: string[], declined: string[]) {
  const handled = new Set([...asked, ...declined]);
  return interviewIntents.find((intent) => !handled.has(intent.id)) ?? null;
}
