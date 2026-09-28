"use client";

import { useEffect, useState } from "react";
import type { ResumeContent } from "@/lib/outputs/generate";

type ResumeVersion = {
  version: number;
  content: ResumeContent;
  status: "facts_incomplete" | "fact_review" | "ready_to_export";
  missing: string[];
  sourceConflicts: string[];
};

export function ResumeEditor() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeVersion | null>(null);
  const [message, setMessage] = useState("Loading your resume draft…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("next_chapter_session_id");
    if (!id) {
      queueMicrotask(() => setMessage("Start an interview to create a resume draft."));
      return;
    }
    fetch(`/api/outputs?sessionId=${encodeURIComponent(id)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error()))
      .then((data: { resume: ResumeVersion }) => {
        setSessionId(id);
        setResume(data.resume);
        setMessage("");
      })
      .catch(() => setMessage("Your draft could not be loaded."));
  }, []);

  function updateContent(update: Partial<ResumeContent>) {
    setResume((current) => current ? { ...current, content: { ...current.content, ...update } } : current);
  }

  function updateExperience(update: Partial<ResumeContent["experience"]>) {
    setResume((current) => current ? {
      ...current,
      content: { ...current.content, experience: { ...current.content.experience, ...update } },
    } : current);
  }

  async function save(userConfirmed: boolean) {
    if (!sessionId || !resume) return;
    setBusy(true);
    setMessage(userConfirmed ? "Checking the fact ledger…" : "Saving your draft…");
    const response = await fetch("/api/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, content: resume.content, userConfirmed }),
    });
    if (!response.ok) {
      setMessage("Your resume was not saved. Try again.");
    } else {
      const data = await response.json() as { resume: ResumeVersion };
      setResume(data.resume);
      setMessage(data.resume.status === "ready_to_export"
        ? "Facts confirmed. DOCX and PDF exports are ready."
        : "Draft saved. Complete the missing facts before final export.");
    }
    setBusy(false);
  }

  async function copyText() {
    if (!sessionId) return;
    const response = await fetch(`/api/resume/export?sessionId=${encodeURIComponent(sessionId)}&format=text`);
    if (!response.ok) return setMessage("The plain-text resume is not available yet.");
    await navigator.clipboard.writeText(await response.text());
    setMessage("Plain-text resume copied.");
  }

  async function download(format: "docx" | "pdf") {
    if (!sessionId) return;
    const response = await fetch(`/api/resume/export?sessionId=${encodeURIComponent(sessionId)}&format=${format}`);
    if (!response.ok) return setMessage("Confirm all required facts before downloading final files.");
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `next-chapter-resume.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!resume) return <p className="status-note" role="status">{message}</p>;
  const content = resume.content;

  return (
    <div className="document-layout">
      <section className="resume-preview resume-editor" aria-label="Editable resume preview">
        <div className="resume-preview__header">
          <div className="resume-identity-fields">
            <input aria-label="Your name" value={content.name} onChange={(event) => updateContent({ name: event.target.value })} placeholder="Your name" />
            <input aria-label="Contact line" value={content.contactLine} onChange={(event) => updateContent({ contactLine: event.target.value })} placeholder="Email • phone • city (optional)" />
            <input aria-label="Target role" value={content.targetRole} onChange={(event) => updateContent({ targetRole: event.target.value })} placeholder="Target role or direction" />
          </div>
          <span className={`status-pill status-pill--${resume.status}`}>{resume.status.replaceAll("_", " ")}</span>
        </div>
        <label><span>Professional summary</span><textarea rows={5} value={content.summary} onChange={(event) => updateContent({ summary: event.target.value })} /></label>
        <h3>Selected experience</h3>
        <div className="resume-field-row">
          <label><span>Role</span><input value={content.experience.role} onChange={(event) => updateExperience({ role: event.target.value })} /></label>
          <label><span>Dates</span><input value={content.experience.dates} onChange={(event) => updateExperience({ dates: event.target.value })} /></label>
          <label><span>Location</span><input value={content.experience.location} onChange={(event) => updateExperience({ location: event.target.value })} /></label>
        </div>
        <label>
          <span>Experience bullets — one per line</span>
          <textarea rows={8} value={content.experience.bullets.join("\n")} onChange={(event) => updateExperience({ bullets: event.target.value.split("\n") })} />
        </label>
        <label><span>Skills — separated by commas</span><input value={content.skills.join(", ")} onChange={(event) => updateContent({ skills: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} /></label>
      </section>
      <aside className="document-tools">
        <h2>Fact review</h2>
        {resume.missing.length ? <ul className="review-list">{resume.missing.map((item) => <li key={item}><span className="review-list__pending">!</span> {item}</li>)}</ul> : null}
        {resume.sourceConflicts.length ? <p className="form-error">Resolve conflicting facts: {resume.sourceConflicts.join(", ")}</p> : null}
        {!resume.missing.length && !resume.sourceConflicts.length ? <p>All required sections are filled. Confirm that the wording is accurate before final export.</p> : null}
        <button className="secondary-button" disabled={busy} onClick={() => save(false)} type="button">Save draft</button>
        <button className="button button--primary" disabled={busy} onClick={() => save(true)} type="button">Confirm facts</button>
        <button className="secondary-button" onClick={copyText} type="button">Copy plain text</button>
        <button className="secondary-button" disabled={resume.status !== "ready_to_export"} onClick={() => download("docx")} type="button">Download DOCX</button>
        <button className="secondary-button" disabled={resume.status !== "ready_to_export"} onClick={() => download("pdf")} type="button">Download PDF</button>
        {message ? <p className="status-note" role="status">{message}</p> : null}
      </aside>
    </div>
  );
}
