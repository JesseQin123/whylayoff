import type { ProfileFact } from "@/lib/domain";

export type SkillSummary = {
  skill: string;
  evidence: string;
  transferableTo: string;
  needsValidation: string;
};

export type ResumeContent = {
  name: string;
  contactLine: string;
  targetRole: string;
  summary: string;
  experience: {
    role: string;
    dates: string;
    location: string;
    bullets: string[];
  };
  skills: string[];
};

const confirmedValue = (facts: ProfileFact[], field: string) => {
  const fact = facts.find((item) => item.field === field && item.status === "confirmed");
  return typeof fact?.value === "string" ? fact.value.trim() : "";
};

const skillSources = [
  { field: "role_responsibility", skill: "Operational ownership", transferableTo: "roles that require reliable follow-through" },
  { field: "workflow_example", skill: "Process execution", transferableTo: "workflow and operations coordination" },
  { field: "workflow_handoff", skill: "Cross-team coordination", transferableTo: "handoffs, case management, and service operations" },
  { field: "judgment_example", skill: "Judgment and exception handling", transferableTo: "quality, triage, and process-improvement work" },
  { field: "impact_example", skill: "Practical problem solving", transferableTo: "roles that value observable outcomes" },
  { field: "tools_experience", skill: "Tools and work methods", transferableTo: "roles using similar systems after requirements are checked" },
] as const;

export function generateSkills(facts: ProfileFact[]): SkillSummary[] {
  return skillSources.flatMap((source) => {
    const evidence = confirmedValue(facts, source.field);
    return evidence ? [{
      skill: source.skill,
      evidence,
      transferableTo: source.transferableTo,
      needsValidation: "Confirm the target role's requirements and keep this framed as self-reported experience.",
    }] : [];
  });
}

function domainKeywords(facts: ProfileFact[]) {
  const context = [
    confirmedValue(facts, "industry"),
    confirmedValue(facts, "role"),
    confirmedValue(facts, "role_responsibility"),
    confirmedValue(facts, "responsibilities"),
  ].join(" ").toLowerCase();
  if (/logistics|freight|warehouse|supply/.test(context)) return ["logistics coordinator", "supply chain operations", "exception management", "process improvement"];
  if (/finance|claim|bank|insurance/.test(context)) return ["finance operations", "claims operations", "case review", "process improvement"];
  if (/legal|matter|contract/.test(context)) return ["legal operations", "matter management", "document coordination", "workflow improvement"];
  if (/manufactur|production|plant|quality/.test(context)) return ["manufacturing operations", "production planning", "quality coordination", "continuous improvement"];
  return ["operations coordinator", "process improvement", "workflow specialist", "service operations"];
}

export function generateCareerDirections(facts: ProfileFact[]) {
  const role = confirmedValue(facts, "role") || "your recent role";
  const goal = confirmedValue(facts, "career_goal") || "your stated next step";
  return {
    directions: [
      `A role similar to ${role} with more emphasis on process improvement`,
      "An adjacent operations or workflow coordination role",
      "Implementation or documentation support using your domain experience",
    ],
    rationale: `These are directions to investigate based on ${goal}; they are not job openings or hiring guarantees.`,
    keywords: domainKeywords(facts),
  };
}

export function generateResumeContent(facts: ProfileFact[]): ResumeContent {
  const skills = generateSkills(facts);
  const role = confirmedValue(facts, "role") || confirmedValue(facts, "role_responsibility");
  const responsibilities = confirmedValue(facts, "responsibilities") || confirmedValue(facts, "role_responsibility");
  const bullets = [
    responsibilities,
    confirmedValue(facts, "workflow_example"),
    confirmedValue(facts, "workflow_handoff"),
    confirmedValue(facts, "judgment_example"),
    confirmedValue(facts, "impact_example"),
  ].filter(Boolean).slice(0, 5);
  return {
    name: "",
    contactLine: "",
    targetRole: confirmedValue(facts, "career_goal") || role,
    summary: responsibilities,
    experience: {
      role,
      dates: confirmedValue(facts, "dates"),
      location: confirmedValue(facts, "location"),
      bullets,
    },
    skills: skills.map((skill) => skill.skill),
  };
}

export function missingResumeInformation(content: ResumeContent) {
  const missing: string[] = [];
  if (!content.name.trim()) missing.push("Your name");
  if (!content.targetRole.trim()) missing.push("Target role or direction");
  if (!content.summary.trim()) missing.push("Professional summary based on your experience");
  if (!content.experience.role.trim()) missing.push("Most recent role");
  if (!content.experience.dates.trim()) missing.push("Dates for the role");
  if (content.experience.bullets.every((bullet) => !bullet.trim())) missing.push("At least one confirmed responsibility or example");
  return missing;
}
