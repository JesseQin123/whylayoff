"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Source = "conversation" | "resume" | "linkedin";

const options: Array<{ source: Source; icon: string; title: string; detail: string; featured?: boolean }> = [
  {
    source: "conversation",
    icon: "●",
    title: "Tell me about your work",
    detail: "Speak or type one answer at a time",
    featured: true,
  },
  {
    source: "resume",
    icon: "↥",
    title: "Use an existing resume",
    detail: "Upload a PDF or DOCX, then confirm the details",
  },
  {
    source: "linkedin",
    icon: "in",
    title: "Add a LinkedIn link",
    detail: "We save the link for context; we do not fetch it in this version",
  },
];

export function StartOptions() {
  const router = useRouter();
  const [loading, setLoading] = useState<Source | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function begin(source: Source) {
    setLoading(source);
    setError(null);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: navigator.language.slice(0, 2) || "en", source }),
      });
      if (!response.ok) throw new Error("We could not start your session.");
      const payload = await response.json() as { session: { id: string } };
      localStorage.setItem("next_chapter_session_id", payload.session.id);
      router.push(`/background?source=${source}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not start your session.");
      setLoading(null);
    }
  }

  return (
    <>
      <div className="choice-stack">
        {options.map((option) => (
          <button
            className={`choice-card${option.featured ? " choice-card--featured" : ""}`}
            disabled={loading !== null}
            key={option.source}
            onClick={() => begin(option.source)}
            type="button"
          >
            <span className="choice-card__icon" aria-hidden="true">{option.icon}</span>
            <span>
              <strong>{loading === option.source ? "Starting securely…" : option.title}</strong>
              <small>{option.detail}</small>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        ))}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </>
  );
}
