"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PrivacyControls() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  function sessionId() {
    return localStorage.getItem("next_chapter_session_id");
  }

  async function exportData() {
    const id = sessionId();
    if (!id) return setMessage("No saved session was found on this device.");
    const response = await fetch("/api/privacy/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id }),
    });
    if (!response.ok) return setMessage("We could not prepare your data export.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "next-chapter-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Your data export was downloaded.");
  }

  async function deleteData() {
    const id = sessionId();
    if (!id) return setMessage("No saved session was found on this device.");
    setDeleting(true);
    const response = await fetch("/api/privacy/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id, confirmation: "DELETE" }),
    });
    if (!response.ok) {
      setDeleting(false);
      return setMessage("We could not delete the session. Please try again.");
    }
    localStorage.removeItem("next_chapter_session_id");
    router.replace("/");
  }

  return (
    <div className="privacy-actions">
      <section className="admin-panel">
        <h2>Download your data</h2>
        <p>Get the answers, facts, and permission choices connected to this browser session.</p>
        <button className="secondary-button" onClick={exportData} type="button">Download JSON</button>
      </section>
      <section className="admin-panel admin-panel--danger">
        <h2>Delete this session</h2>
        <p>This immediately blocks access and removes saved answers and profile facts from the local MVP store.</p>
        <button className="danger-button" disabled={deleting} onClick={deleteData} type="button">
          {deleting ? "Deleting…" : "Delete my session"}
        </button>
      </section>
      {message ? <p className="status-note" role="status">{message}</p> : null}
    </div>
  );
}
