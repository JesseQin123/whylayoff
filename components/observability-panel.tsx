"use client";

import { useEffect, useState } from "react";

type Summary = {
  total: number;
  successes: number;
  failures: number;
  fallbacks: number;
  averageLatencyMs: number;
  estimatedCostUsd: number | null;
  unknownCostOperations: number;
  events: Array<{
    id: string;
    operation: string;
    status: string;
    latencyMs: number;
    modelId: string;
    modelVersion: string | null;
    promptVersion: string | null;
    failureCode: string | null;
    createdAt: string;
  }>;
};

export function ObservabilityPanel() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState("Loading operational metrics…");

  useEffect(() => {
    const sessionId = localStorage.getItem("next_chapter_session_id");
    if (!sessionId) {
      queueMicrotask(() => setStatus("No local session is available."));
      return;
    }
    fetch(`/api/admin/observability?sessionId=${encodeURIComponent(sessionId)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error()))
      .then((data: Summary) => {
        setSummary(data);
        setStatus("Metrics contain model IDs, versions, latency, token counts, cost estimates, and failure codes only. Raw answers and resumes are excluded.");
      })
      .catch(() => setStatus("Operational metrics could not be loaded."));
  }, []);

  return (
    <section className="admin-panel observability-panel">
      <div className="admin-panel__header">
        <div><p className="eyebrow">Safe observability</p><h2>Model and transcription health</h2></div>
        <span className="status-pill">{summary?.total ?? 0} operations</span>
      </div>
      {summary ? (
        <div className="observability-metrics">
          <span><strong>{summary.successes}</strong> success</span>
          <span><strong>{summary.failures}</strong> failure</span>
          <span><strong>{summary.fallbacks}</strong> fallback</span>
          <span><strong>{summary.averageLatencyMs} ms</strong> average</span>
          <span>
            <strong>{summary.estimatedCostUsd == null ? "Unknown" : `$${summary.estimatedCostUsd.toFixed(4)}`}</strong>
            {summary.unknownCostOperations ? `${summary.unknownCostOperations} operations lack pricing` : "estimated cost"}
          </span>
        </div>
      ) : null}
      <p className="status-note" role="status">{status}</p>
      {summary?.events.length ? (
        <div className="event-table" role="region" aria-label="Recent operational events" tabIndex={0}>
          <table>
            <thead><tr><th>Operation</th><th>Status</th><th>Model</th><th>Latency</th><th>Failure</th></tr></thead>
            <tbody>{summary.events.map((event) => (
              <tr key={event.id}><td>{event.operation}</td><td>{event.status}</td><td>{event.modelId}</td><td>{event.latencyMs} ms</td><td>{event.failureCode ?? "—"}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
