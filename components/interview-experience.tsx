"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VoiceInput } from "@/components/voice-input";

type SessionSnapshot = {
  session: {
    id: string;
    language: string;
    state: string;
    stateVersion: number;
    currentIntentId: string | null;
    currentQuestion: string | null;
    askedIntentIds: string[];
  };
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
      }),
    });
    if (!response.ok) {
      setMessage(response.status === 409 ? "This session changed in another tab. Refresh and try again." : "Your answer was not saved. Please try again.");
      setStatus("ready");
      return;
    }
    const payload = await response.json() as {
      stateVersion: number;
      nextQuestion: { intentId: string; text: string } | null;
    };
    if (!payload.nextQuestion) {
      router.push("/results");
      return;
    }
    setSnapshot((current) => current ? {
      ...current,
      session: {
        ...current.session,
        stateVersion: payload.stateVersion,
        currentIntentId: payload.nextQuestion!.intentId,
        currentQuestion: payload.nextQuestion!.text,
        askedIntentIds: current.session.currentIntentId
          ? [...current.session.askedIntentIds, current.session.currentIntentId]
          : current.session.askedIntentIds,
      },
    } : current);
    setAnswer("");
    setStatus("ready");
    setMessage("Saved. Here is the next question.");
  }

  async function sessionAction(action: "pause" | "resume" | "skip" | "finish") {
    if (!snapshot) return;
    setStatus("saving");
    const response = await fetch(`/api/sessions/${snapshot.session.id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientActionId: crypto.randomUUID(),
        expectedStateVersion: snapshot.session.stateVersion,
        action,
      }),
    });
    if (!response.ok) {
      setMessage("We could not save that action. Refresh and try again.");
      setStatus("ready");
      return;
    }
    const payload = await response.json() as {
      session: SessionSnapshot["session"];
      receipt: { nextQuestion: { intentId: string; text: string } | null } | null;
    };
    if (action === "finish" || (action === "skip" && !payload.receipt?.nextQuestion)) {
      router.push("/results");
      return;
    }
    setSnapshot((current) => current ? { ...current, session: payload.session } : current);
    setAnswer("");
    setStatus("ready");
    setMessage(action === "pause" ? "Your place is saved on this device." : action === "resume" ? "Interview resumed." : "Skipped. Here is the next question.");
  }

  function listenToQuestion() {
    const question = snapshot?.session.currentQuestion;
    if (!question || !("speechSynthesis" in window)) {
      setMessage("Question reading is not available in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = navigator.language;
    window.speechSynthesis.speak(utterance);
  }

  if (status === "loading") return <p className="loading-note" role="status">Restoring your private session…</p>;
  if (status === "error") return <p className="form-error" role="alert">{message}</p>;

  return (
    <section className="interview-card" aria-labelledby="current-question">
      <div className="interview-card__meta">
        <span>Question {snapshot ? snapshot.session.askedIntentIds.length + 1 : 1}</span>
        <button className="text-button" type="button" onClick={() => sessionAction(snapshot?.session.state === "paused" ? "resume" : "pause")}>
          {snapshot?.session.state === "paused" ? "Resume" : "Save for later"}
        </button>
      </div>
      <p className="eyebrow">Let&apos;s start with your goal</p>
      <h1 id="current-question">{snapshot?.session.currentQuestion}</h1>
      <p className="question-help">A short, concrete answer is enough. Do not include customer names, account numbers, or confidential files.</p>
      <label className="answer-field">
        <span className="sr-only">Your answer</span>
        <textarea
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Type your answer here…"
          rows={6}
          value={answer}
          disabled={snapshot?.session.state === "paused"}
        />
      </label>
      <div className="voice-row">
        {snapshot ? (
          <VoiceInput
            language={snapshot.session.language}
            onUseTranscript={(text) => setAnswer((current) => current ? `${current}\n${text}` : text)}
            sessionId={snapshot.session.id}
          />
        ) : null}
        <button className="secondary-button" type="button" onClick={listenToQuestion}>Listen to question</button>
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
        <div className="interview-card__minor-actions">
          <button className="text-button" type="button" onClick={() => sessionAction("skip")}>Skip this question</button>
          <button className="text-button" type="button" onClick={() => sessionAction("finish")}>Show my summary</button>
          <button className="text-button" type="button" onClick={() => router.push("/privacy")}>Privacy controls</button>
        </div>
        <button
          className="button button--primary"
          disabled={!answer.trim() || status === "saving" || snapshot?.session.state === "paused"}
          onClick={continueInterview}
          type="button"
        >
          {status === "saving" ? "Saving…" : "Continue"}
        </button>
      </div>
    </section>
  );
}
