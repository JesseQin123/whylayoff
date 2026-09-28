"use client";

import { useEffect, useState } from "react";

type Fact = { field: string; value: unknown; status: string };

export function FactCorrection() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stateVersion, setStateVersion] = useState(0);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [field, setField] = useState("");
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("next_chapter_session_id");
    if (!id) return;
    fetch(`/api/sessions/${id}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error()))
      .then((data: { session: { stateVersion: number }; facts: Fact[] }) => {
        const editableFacts = data.facts.filter((fact) => fact.status !== "declined" && fact.status !== "unknown");
        setSessionId(id);
        setStateVersion(data.session.stateVersion);
        setFacts(editableFacts);
        if (editableFacts[0]) {
          setField(editableFacts[0].field);
          setText(String(editableFacts[0].value ?? ""));
        }
      })
      .catch(() => setMessage("Your saved details could not be loaded."));
  }, []);

  function chooseField(nextField: string) {
    setField(nextField);
    const fact = facts.find((item) => item.field === nextField);
    setText(String(fact?.value ?? ""));
  }

  async function saveCorrection() {
    if (!sessionId || !field || !text.trim()) return;
    const response = await fetch(`/api/sessions/${sessionId}/corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientMessageId: crypto.randomUUID(),
        expectedStateVersion: stateVersion,
        field,
        text,
      }),
    });
    if (!response.ok) return setMessage("Your correction was not saved. Refresh and try again.");
    const data = await response.json() as { stateVersion: number };
    setStateVersion(data.stateVersion);
    setFacts((current) => current.map((fact) => fact.field === field ? { ...fact, value: text, status: "confirmed" } : fact));
    setMessage("Correction saved with the earlier version kept in your history.");
  }

  if (!sessionId || facts.length === 0) return null;

  return (
    <section className="correction-card" aria-labelledby="correct-details-title">
      <div>
        <p className="eyebrow">Review your facts</p>
        <h2 id="correct-details-title">Correct something we saved</h2>
        <p>Your earlier wording stays in the revision history so later outputs can be updated safely.</p>
      </div>
      <label>
        <span>Detail</span>
        <select value={field} onChange={(event) => chooseField(event.target.value)}>
          {facts.map((fact) => <option key={fact.field} value={fact.field}>{fact.field.replaceAll("_", " ")}</option>)}
        </select>
      </label>
      <label>
        <span>Corrected wording</span>
        <textarea rows={4} value={text} onChange={(event) => setText(event.target.value)} />
      </label>
      <button className="secondary-button" type="button" onClick={saveCorrection}>Save correction</button>
      {message ? <p className="status-note" role="status">{message}</p> : null}
    </section>
  );
}
