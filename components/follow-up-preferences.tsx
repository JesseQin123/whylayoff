"use client";

import { useEffect, useState } from "react";

type PreferenceKey = "serviceEmail" | "courseInformation" | "community" | "expertFollowUp";
type Preferences = Record<PreferenceKey, boolean> & { emailAddress: string | null; version?: number };

const emptyPreferences: Preferences = {
  emailAddress: null,
  serviceEmail: false,
  courseInformation: false,
  community: false,
  expertFollowUp: false,
};

const choices: Array<[PreferenceKey, string, string]> = [
  ["serviceEmail", "Service email", "Send requested career-pack or account updates."],
  ["courseInformation", "Course information", "Tell me about relevant learning programs."],
  ["community", "Community invitation", "Tell me if a relevant peer community opens."],
  ["expertFollowUp", "Domain expert follow-up", "Ask me separately about paid or unpaid expert conversations."],
];

export function FollowUpPreferences() {
  const [preferences, setPreferences] = useState<Preferences>(emptyPreferences);
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("next_chapter_session_id");
    if (!id) {
      queueMicrotask(() => setStatus("Start a session if you want to save follow-up choices. Benefits remain available without these choices."));
      return;
    }
    queueMicrotask(() => setSessionId(id));
    fetch(`/api/contact-preferences?sessionId=${encodeURIComponent(id)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error()))
      .then((data: { preferences: Preferences | null }) => {
        if (data.preferences) setPreferences(data.preferences);
      })
      .catch(() => setStatus("Saved follow-up choices could not be loaded."));
  }, []);

  async function save() {
    if (!sessionId) return;
    const anySelected = choices.some(([key]) => preferences[key]);
    if (anySelected && !preferences.emailAddress?.trim()) {
      setStatus("Add an email address for the follow-ups you selected.");
      return;
    }
    setBusy(true);
    const response = await fetch("/api/contact-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        ...preferences,
        emailAddress: preferences.emailAddress?.trim() || null,
        noticeVersion: "follow-up-preferences-v1",
      }),
    });
    if (response.ok) {
      const data = await response.json() as { preferences: Preferences };
      setPreferences(data.preferences);
      setStatus(`Saved version ${data.preferences.version}. Your latest choices replace earlier contact lists.`);
    } else {
      setStatus("Your follow-up choices were not saved. Check the email address and try again.");
    }
    setBusy(false);
  }

  return (
    <section className="follow-up-card" aria-labelledby="follow-up-title">
      <p className="eyebrow">Optional contact</p>
      <h2 id="follow-up-title">Choose each kind of follow-up separately</h2>
      <p>These choices do not unlock benefits and do not change your research choice. Turn every option off to opt out.</p>
      <label className="follow-up-email">
        <span>Email address</span>
        <input autoComplete="email" disabled={!sessionId} inputMode="email" onChange={(event) => setPreferences((current) => ({ ...current, emailAddress: event.target.value }))} placeholder="you@example.com" type="email" value={preferences.emailAddress ?? ""} />
      </label>
      <div className="preference-list">
        {choices.map(([key, title, description]) => (
          <label key={key}>
            <input checked={preferences[key]} disabled={!sessionId} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))} type="checkbox" />
            <span><strong>{title}</strong><small>{description}</small></span>
          </label>
        ))}
      </div>
      <button className="button button--primary" disabled={busy || !sessionId} onClick={() => void save()} type="button">Save contact choices</button>
      {status ? <p className="status-note" role="status">{status}</p> : null}
    </section>
  );
}
