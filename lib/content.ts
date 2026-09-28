export const stages = [
  { label: "Your background", shortLabel: "Background" },
  { label: "Your experience", shortLabel: "Experience" },
  { label: "Your next step", shortLabel: "Results" },
] as const;

export const valueCards = [
  {
    eyebrow: "Skills reassessment",
    title: "See the value in work you already know",
    body: "We turn concrete examples from your experience into clear, evidence-backed skills.",
  },
  {
    eyebrow: "Resume ready",
    title: "Leave with words you can actually use",
    body: "Review, edit, copy, and download a focused resume without invented achievements.",
  },
  {
    eyebrow: "Practical resources",
    title: "Find tools that fit your next step",
    body: "Explore relevant AI and job-search resources with their real eligibility and terms.",
  },
] as const;

export const resultCards = [
  {
    title: "What you know",
    body: "Evidence-backed skills drawn from work you described and confirmed.",
    action: "Review skills",
    href: "/results",
  },
  {
    title: "How to say it",
    body: "A focused resume draft you can edit before anything is marked ready.",
    action: "Edit resume",
    href: "/resume",
  },
  {
    title: "Where to go next",
    body: "Role directions, search terms, and useful resources based on your goal.",
    action: "Explore resources",
    href: "/benefits",
  },
] as const;
