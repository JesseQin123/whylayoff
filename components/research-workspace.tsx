"use client";

import { useEffect, useState } from "react";

type Card = {
  id: string;
  version: number;
  noProblemObserved: boolean;
  validationStatus: string;
  fields: Record<string, string>;
  claims: Array<{ id: string; field: string; quote: string; sourceType: string; status: string; independentlyVerified: boolean }>;
};

export function ResearchWorkspace() {
  const [cards, setCards] = useState<Card[]>([]);
  const [status, setStatus] = useState("Checking current research permissions…");

  useEffect(() => {
    const sessionId = localStorage.getItem("next_chapter_session_id");
    if (!sessionId) {
      queueMicrotask(() => setStatus("No local participant session is available."));
      return;
    }
    fetch(`/api/research?sessionId=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        if (response.status === 403) return { cards: [], denied: true };
        if (!response.ok) throw new Error();
        return { ...(await response.json() as { cards: Card[] }), denied: false };
      })
      .then((data) => {
        setCards(data.cards);
        setStatus(data.denied
          ? "Filtered out: product research permission is not currently active."
          : data.cards.length ? "Showing only records with a current product research grant." : "No reviewed problem cards yet.");
      })
      .catch(() => setStatus("Research records could not be loaded."));
  }, []);

  return (
    <section className="admin-panel research-workspace">
      <div className="admin-panel__header">
        <div>
          <p className="eyebrow">Research workspace</p>
          <h2>Permission-filtered problem cards</h2>
        </div>
        <span className="status-pill">{cards.length} cards</span>
      </div>
      <p className="status-note" role="status">{status}</p>
      {cards.map((card) => (
        <article className="workspace-card" key={card.id}>
          <div className="workspace-card__topline">
            <strong>{card.noProblemObserved ? "No recurring problem observed" : card.fields.firsthandArea || "Firsthand area"}</strong>
            <span>v{card.version} · unvalidated participant report</span>
          </div>
          <dl>
            {card.claims.map((claim) => (
              <div key={claim.id}>
                <dt>{claim.field} · {claim.sourceType}</dt>
                <dd>{claim.quote}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </section>
  );
}
