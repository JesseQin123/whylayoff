"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SessionSnapshot = {
  session: { id: string; stateVersion: number };
  grants: Array<{ purpose: string; selected: boolean }>;
};

export function InterviewExperience() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [answer, setAnswer] = useState("");
  const [researchAllowed, setResearchAllowed] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sessionId = localStorage.getItem("next_chapter_session_id");
    if (!sessionId) {
      router.replace("/start");
      return;
    }
    fetch(`/api/sessions/${sessionId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Your saved session is unavailable. Please start again.");
        return response.json() as Promise<SessionSnapshot>;
      })
      .then((data) => {
        setSnapshot(data);
        setResearchAllowed(data.grants.some((grant) => grant.purpose === "product_research" && grant.selected));
        setStatus("ready");
      })
      .catch((error: Error) => {
        setMessage(error.message);
        setStatus("error");
      });
  }, [router]);

  async function updateResearch(selected: boolean) {
    if (!snapshot) return;
    setResearchAllowed(selected);
    const response = await fetch("/api/purpose-grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: snapshot.session.id,
        purpose: "product_research",
        selected,
        noticeVersion: "research-choice-v1",
      }),
    });
    if (!response.ok) {
      setResearchAllowed(!selected);
      setMessage("We could not save that choice. Please try again.");
    } else {
      setMessage(selected ? "Research sharing is on. You can turn it off at any time." : "Research sharing is off. Your career results are unchanged.");
    }
  }

  async function continueInterview() {
    if (!snapshot || !answer.trim()) return;
    setStatus("saving");
    setMessage("");
    const response = await fetch(`/api/sessions/${snapshot.session.id}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientMessageId: crypto.randomUUID(),
        expectedStateVersion: snapshot.session.stateVersion,
        text: answer,
        facts: [{ field: "career_goal", value: answer, status: "confirmed" }],
      }),
    });
    if (!response.ok) {
      setMessage(response.status === 409 ? "This session changed in another tab. Refresh and try again." : "Your answer was not saved. Please try again.");
      setStatus("ready");
      return;
    }
    router.push("/results");
  }

  if (status === "loading") return <p className="loading-note" role="status">Restoring your private session…</p>;
  if (status === "error") return <p className="form-error" role="alert">{message}</p>;

  return (
    <section className="interview-card" aria-labelledby="current-question">
      <div className="interview-card__meta">
        <span>Question 1</span>
        <button className="text-button" type="button" onClick={() => router.push("/privacy")}>Privacy controls</button>
      </div>
      <p className="eyebrow">Let&apos;s start with your goal</p>
      <h1 id="current-question">What would you most like to change about your work situation?</h1>
      <p className="question-help">A short answer is enough. You can talk about the kind of role, schedule, or direction you want.</p>
      <label className="answer-field">
        <span className="sr-only">Your answer</span>
        <textarea
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Type your answer here…"
          rows={6}
          value={answer}
        />
      </label>
      <div className="voice-row">
        <button className="voice-button" type="button" disabled title="Voice input arrives in the next implementation slice">
          <span aria-hidden="true">●</span>
          Voice input coming next
        </button>
        <button className="secondary-button" type="button">Listen to question</button>
      </div>
      <div className="permission-card">
        <div>
          <strong>Optional research sharing</strong>
          <p>Let Solo Unicorn use your confirmed answers to study industry problems. This does not affect your career results.</p>
        </div>
        <label className="switch-row">
          <input
            checked={researchAllowed}
            onChange={(event) => updateResearch(event.target.checked)}
            type="checkbox"
          />
          <span>{researchAllowed ? "On" : "Off"}</span>
        </label>
      </div>
      {message ? <p className="status-note" role="status">{message}</p> : null}
      <div className="interview-card__actions">
        <button className="text-button" type="button" onClick={() => setAnswer("Prefer not to answer")}>Skip this question</button>
        <button
          className="button button--primary"
          disabled={!answer.trim() || status === "saving"}
          onClick={continueInterview}
          type="button"
        >
          {status === "saving" ? "Saving…" : "Continue"}
        </button>
      </div>
    </section>
  );
}
