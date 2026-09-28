"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VoiceInput } from "@/components/voice-input";

type FieldName = "role" | "industry" | "responsibilities" | "dates" | "location" | "career_goal";
type FieldDraft = { field: FieldName; value: string; unknown: boolean };
type Asset = { id: string; status: string; errorCode: string | null; fields: Array<{ field: FieldName; value: unknown }> };

const labels: Record<FieldName, string> = {
  role: "Most recent role",
  industry: "Industry",
  responsibilities: "Main responsibilities",
  dates: "Dates in that role",
  location: "Location",
  career_goal: "What you want next",
};

const emptyFields = (Object.keys(labels) as FieldName[]).map((field) => ({ field, value: "", unknown: false }));

export function BackgroundIntake({ initialSource }: { initialSource: string }) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stateVersion, setStateVersion] = useState(0);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [fields, setFields] = useState<FieldDraft[]>(emptyFields);
  const [notes, setNotes] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("next_chapter_session_id");
    if (!id) return router.replace("/start");
    fetch(`/api/sessions/${id}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error()))
      .then((data: { session: { stateVersion: number } }) => {
        setSessionId(id);
        setStateVersion(data.session.stateVersion);
      })
      .catch(() => router.replace("/start"));
  }, [router]);

  function applyAsset(nextAsset: Asset) {
    setAsset(nextAsset);
    if (nextAsset.status === "failed") {
      setStatus("We could not read that file. You can enter the details below and continue.");
      return;
    }
    setFields((current) => current.map((draft) => {
      const candidate = nextAsset.fields.find((field) => field.field === draft.field);
      return candidate ? { ...draft, value: String(candidate.value ?? "") } : draft;
    }));
    setStatus("Review every detail below. Nothing is confirmed yet.");
  }

  async function uploadFile(file: File) {
    if (!sessionId) return;
    setBusy(true);
    setStatus("Reading your document privately…");
    const form = new FormData();
    form.set("sessionId", sessionId);
    form.set("file", file);
    const response = await fetch("/api/background", { method: "POST", body: form });
    if (!response.ok) {
      setStatus("That file could not be accepted. Use a PDF or DOCX under 5 MB, or enter the details below.");
    } else {
      applyAsset((await response.json() as { asset: Asset }).asset);
    }
    setBusy(false);
  }

  async function saveText(type: "manual" | "pasted_text" | "linkedin_url", value: string) {
    if (!sessionId || !value.trim()) return null;
    setBusy(true);
    const response = await fetch("/api/background", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, type, value }),
    });
    if (!response.ok) {
      setStatus(type === "linkedin_url" ? "Enter a full https://www.linkedin.com/ profile link." : "Those notes could not be saved.");
      setBusy(false);
      return null;
    }
    const nextAsset = (await response.json() as { asset: Asset }).asset;
    applyAsset(nextAsset);
    setBusy(false);
    return nextAsset;
  }

  function updateField(field: FieldName, update: Partial<FieldDraft>) {
    setFields((current) => current.map((item) => item.field === field ? { ...item, ...update } : item));
  }

  async function confirmBackground() {
    if (!sessionId) return;
    setBusy(true);
    let currentAsset = asset;
    if (!currentAsset) {
      const summary = fields.map((field) => `${labels[field.field]}: ${field.value}`).join("\n");
      currentAsset = await saveText("manual", summary);
    }
    if (!currentAsset) {
      setBusy(false);
      return;
    }
    const response = await fetch(`/api/background/${currentAsset.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        expectedStateVersion: stateVersion,
        fields: fields.map((field) => ({
          field: field.field,
          value: field.unknown ? null : field.value.trim(),
          status: field.unknown || !field.value.trim() ? "unknown" : "confirmed",
        })),
      }),
    });
    if (!response.ok) {
      setStatus("Your review was not saved. Refresh and try again.");
      setBusy(false);
      return;
    }
    router.push("/interview");
  }

  if (!sessionId) return <p role="status">Restoring your private session…</p>;

  return (
    <div className="background-intake">
      <section className="intake-source-card">
        {initialSource === "resume" ? (
          <label className="file-drop">
            <strong>Choose a PDF or DOCX resume</strong>
            <span>Private upload, up to 5 MB. The original is removed after you confirm the extracted details.</span>
            <input
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={busy}
              onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file); }}
              type="file"
            />
          </label>
        ) : null}
        {initialSource === "linkedin" ? (
          <div className="input-action-row">
            <label>
              <span>LinkedIn profile link</span>
              <input type="url" value={linkedin} onChange={(event) => setLinkedin(event.target.value)} placeholder="https://www.linkedin.com/in/…" />
            </label>
            <button className="secondary-button" disabled={busy || !linkedin.trim()} onClick={() => saveText("linkedin_url", linkedin)} type="button">Save link</button>
            <p>We store the link for context. This version does not visit, scrape, or enrich it.</p>
          </div>
        ) : null}
        <label>
          <span>Paste or describe your background</span>
          <textarea rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Role, industry, main work, dates, and what you want next…" />
        </label>
        <div className="intake-source-actions">
          <button className="secondary-button" disabled={busy || !notes.trim()} onClick={() => saveText("pasted_text", notes)} type="button">Use these notes</button>
          <VoiceInput sessionId={sessionId} language="en" onUseTranscript={(text) => setNotes((current) => current ? `${current}\n${text}` : text)} />
        </div>
        {status ? <p className="status-note" role="status">{status}</p> : null}
      </section>

      <section className="background-review" aria-labelledby="background-review-title">
        <div>
          <p className="eyebrow">Review before saving</p>
          <h2 id="background-review-title">Your background cards</h2>
          <p>Edit anything that is wrong. Empty or unknown details will not block the interview.</p>
        </div>
        <div className="background-card-grid">
          {fields.map((field) => (
            <article className="background-card" key={field.field}>
              <label>
                <span>{labels[field.field]}</span>
                {field.field === "responsibilities" ? (
                  <textarea rows={4} disabled={field.unknown} value={field.value} onChange={(event) => updateField(field.field, { value: event.target.value })} />
                ) : (
                  <input disabled={field.unknown} value={field.value} onChange={(event) => updateField(field.field, { value: event.target.value })} />
                )}
              </label>
              <label className="unknown-check">
                <input checked={field.unknown} onChange={(event) => updateField(field.field, { unknown: event.target.checked })} type="checkbox" />
                I don&apos;t know or prefer not to add this
              </label>
            </article>
          ))}
        </div>
        <div className="background-actions">
          <button className="button button--primary" disabled={busy} onClick={confirmBackground} type="button">Confirm and continue</button>
          <button className="text-button" onClick={() => router.push("/interview")} type="button">Continue without background</button>
        </div>
      </section>
    </div>
  );
}
