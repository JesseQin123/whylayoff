"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FieldName =
  | "firsthandArea" | "workflowSteps" | "roleBoundary" | "problemEvent"
  | "frequency" | "activeTime" | "waitTime" | "impact" | "workaround"
  | "barriers" | "counterexample" | "employerStatement" | "firsthandObservation"
  | "participantInference" | "publicContext";

type ProblemCard = {
  id: string;
  version: number;
  noProblemObserved: boolean;
  fields: Partial<Record<FieldName, string>>;
  validationStatus: "unvalidated_participant_report";
  updatedAt: string;
};

const fieldGroups: Array<{ title: string; description: string; fields: Array<[FieldName, string, string]> }> = [
  {
    title: "Your firsthand view",
    description: "Describe the part of the work you directly did or observed.",
    fields: [
      ["firsthandArea", "Area you know firsthand", "Example: claims intake for commercial insurance"],
      ["workflowSteps", "How the workflow moves", "What happens first, next, and last?"],
      ["roleBoundary", "Your role in that workflow", "What did you own, hand off, approve, or receive?"],
    ],
  },
  {
    title: "One concrete problem",
    description: "A real event is more useful than a broad opinion. It is also valid to report that you did not observe a recurring problem.",
    fields: [
      ["problemEvent", "What happened?", "Describe one recent or typical event."],
      ["frequency", "How often?", "Daily, weekly, seasonally, or rarely?"],
      ["activeTime", "Hands-on time", "How much active work did it take?"],
      ["waitTime", "Waiting time", "Where did the work stop or queue?"],
      ["impact", "Impact", "Who was affected, and what did it cost or delay?"],
      ["workaround", "Current workaround", "How did people handle it?"],
      ["barriers", "Why it remains hard", "Policy, data, systems, trust, budget, or another barrier?"],
      ["counterexample", "When this is not a problem", "What conditions make the workflow work well?"],
    ],
  },
  {
    title: "Keep sources separate",
    description: "These statements will keep their source labels. Your idea will remain an unvalidated participant report until separate evidence supports it.",
    fields: [
      ["employerStatement", "What an employer said", "Only include words or explanations attributed to an employer."],
      ["firsthandObservation", "What you directly observed", "What did you see happen yourself?"],
      ["participantInference", "Your interpretation or idea", "What do you think caused it or could improve it?"],
      ["publicContext", "Public context", "Optional public report, policy, article, or market context."],
    ],
  },
];

const emptyFields = Object.fromEntries(
  fieldGroups.flatMap((group) => group.fields.map(([field]) => [field, ""])),
) as Record<FieldName, string>;

export function ResearchProblemForm() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState("");
  const [consented, setConsented] = useState(false);
  const [fields, setFields] = useState<Record<FieldName, string>>(emptyFields);
  const [noProblemObserved, setNoProblemObserved] = useState(false);
  const [card, setCard] = useState<ProblemCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Restoring your research choice…");

  useEffect(() => {
    const id = localStorage.getItem("next_chapter_session_id");
    if (!id) {
      router.replace("/start");
      return;
    }
    fetch(`/api/sessions/${id}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error()))
      .then(async (data: { grants: Array<{ purpose: string; selected: boolean }> }) => {
        const selected = data.grants.some((grant) => grant.purpose === "product_research" && grant.selected);
        setSessionId(id);
        setConsented(selected);
        if (!selected) {
          setStatus("");
          return;
        }
        const response = await fetch(`/api/research?sessionId=${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error();
        const research = await response.json() as { cards: ProblemCard[] };
        const existing = research.cards[0] ?? null;
        if (existing) {
          setCard(existing);
          setFields({ ...emptyFields, ...existing.fields });
          setNoProblemObserved(existing.noProblemObserved);
        }
        setStatus(existing ? `Saved problem card · version ${existing.version}` : "Research permission is active. Nothing is shared until you save this card.");
      })
      .catch(() => setStatus("We could not restore this choice. Refresh and try again."));
  }, [router]);

  async function updateConsent(selected: boolean) {
    if (!sessionId) return;
    setBusy(true);
    const response = await fetch("/api/purpose-grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, purpose: "product_research", selected, noticeVersion: "research-problem-card-v1" }),
    });
    if (response.ok) {
      setConsented(selected);
      setStatus(selected
        ? "Research permission is active. Nothing is shared until you save this card."
        : "Research permission is off. Your career tools remain available, and this workspace can no longer read or update the card.");
    } else {
      setStatus("Your research choice was not saved. Please try again.");
    }
    setBusy(false);
  }

  async function save() {
    if (!sessionId || !consented) return;
    if (!noProblemObserved && (!fields.firsthandArea.trim() || !fields.problemEvent.trim())) {
      setStatus("Add the area you know firsthand and one concrete problem, or select “I did not observe a recurring problem.”");
      return;
    }
    setBusy(true);
    setStatus("Saving the statements exactly as you reviewed them…");
    const response = await fetch(card ? `/api/research/${card.id}` : "/api/research", {
      method: card ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, noProblemObserved, fields }),
    });
    if (response.ok) {
      const data = await response.json() as { card: ProblemCard };
      setCard(data.card);
      setStatus(`Saved problem card · version ${data.card.version}. It remains labeled as an unvalidated participant report.`);
    } else if (response.status === 403) {
      setConsented(false);
      setStatus("Research permission is no longer active. Turn it on again before saving.");
    } else {
      setStatus("The problem card was not saved. Review the required fields and try again.");
    }
    setBusy(false);
  }

  return (
    <div className="research-form">
      <section className="consent-card" aria-labelledby="research-choice-title">
        <div>
          <p className="eyebrow">Separate choice</p>
          <h2 id="research-choice-title">Allow these reviewed answers to support product research</h2>
          <p>We will not copy your interview or resume answers into research. Only the problem card you explicitly save here is included. You can turn this off at any time.</p>
        </div>
        <label className="consent-toggle">
          <input checked={consented} disabled={busy || !sessionId} onChange={(event) => void updateConsent(event.target.checked)} type="checkbox" />
          <span>{consented ? "Research permission on" : "Research permission off"}</span>
        </label>
      </section>

      {consented ? (
        <>
          <label className="no-problem-card">
            <input checked={noProblemObserved} onChange={(event) => setNoProblemObserved(event.target.checked)} type="checkbox" />
            <span><strong>I did not observe a recurring problem</strong><small>This is a useful, valid research response. You can save it without filling the fields below.</small></span>
          </label>
          <div aria-disabled={noProblemObserved} className={noProblemObserved ? "research-fields research-fields--disabled" : "research-fields"}>
            {fieldGroups.map((group) => (
              <section className="research-section" key={group.title}>
                <h2>{group.title}</h2>
                <p>{group.description}</p>
                <div className="research-field-grid">
                  {group.fields.map(([field, label, placeholder]) => (
                    <label key={field}>
                      <span>{label}</span>
                      <textarea
                        disabled={noProblemObserved}
                        onChange={(event) => setFields((current) => ({ ...current, [field]: event.target.value }))}
                        placeholder={placeholder}
                        rows={field === "problemEvent" || field === "workflowSteps" ? 4 : 3}
                        value={fields[field]}
                      />
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <section className="research-review-card">
            <div>
              <strong>{card ? `Correct problem card · version ${card.version}` : "Confirm this problem card"}</strong>
              <p>Saving creates source-labeled claims with your exact text. It does not mark demand, cause, or a solution as independently validated.</p>
            </div>
            <button className="button button--primary" disabled={busy} onClick={() => void save()} type="button">{card ? "Save correction" : "Save reviewed card"}</button>
          </section>
        </>
      ) : (
        <section className="research-locked">
          <h2>The research form is closed</h2>
          <p>Turn on the separate research choice above if you want to contribute. Your resume, skills reassessment, and career directions do not depend on this choice.</p>
        </section>
      )}
      {status ? <p className="status-note" role="status">{status}</p> : null}
    </div>
  );
}
