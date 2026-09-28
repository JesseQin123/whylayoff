"use client";

import { useEffect, useState } from "react";

type CatalogOffer = {
  id: string;
  title: string;
  availability: "external_resource" | "verified_inventory" | "pending" | "unavailable";
  description: string;
  termsSummary: string;
  eligibility: string;
  url: string | null;
  partner: { name: string; status: string; relationshipLabel: string; disclosure: string };
};

type Claim = { offerId: string; state: string; providerVerifiedAt: string | null };

const availabilityLabel: Record<CatalogOffer["availability"], string> = {
  external_resource: "External resource",
  verified_inventory: "Verified offer inventory",
  pending: "Terms pending",
  unavailable: "Unavailable",
};

export function BenefitsCatalog() {
  const [catalog, setCatalog] = useState<CatalogOffer[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [status, setStatus] = useState("Loading current offer status…");

  useEffect(() => {
    const sessionId = localStorage.getItem("next_chapter_session_id");
    const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    fetch(`/api/benefits${query}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error()))
      .then((data: { catalog: CatalogOffer[]; claims: Claim[] }) => {
        setCatalog(data.catalog);
        setClaims(data.claims);
        setStatus("");
      })
      .catch(() => setStatus("Current benefit information could not be loaded."));
  }, []);

  async function record(offer: CatalogOffer, action: "open" | "user_reported_success" | "user_reported_failed") {
    const sessionId = localStorage.getItem("next_chapter_session_id");
    if (action === "open" && offer.url) window.open(offer.url, "_blank", "noopener,noreferrer");
    if (!sessionId) {
      if (action !== "open") setStatus("Start a private session before saving benefit feedback.");
      return;
    }
    const response = await fetch("/api/benefits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, offerId: offer.id, action }),
    });
    if (!response.ok) {
      setStatus("The resource opened, but its local activity status could not be saved.");
      return;
    }
    const data = await response.json() as { claim: Claim };
    setClaims((current) => [...current.filter((claim) => claim.offerId !== offer.id), data.claim]);
    setStatus(action === "open"
      ? "The resource was marked opened. This is not counted as redemption."
      : "Thanks. Your result is saved as self-reported and remains separate from provider verification.");
  }

  return (
    <section aria-labelledby="benefit-catalog-title">
      <div className="section-heading">
        <p className="eyebrow">Current catalog</p>
        <h2 id="benefit-catalog-title">Offer status you can verify</h2>
      </div>
      {status ? <p className="status-note" role="status">{status}</p> : null}
      <div className="benefit-grid">
        {catalog.map((offer) => {
          const claim = claims.find((item) => item.offerId === offer.id);
          return (
            <article className="benefit-card" key={offer.id}>
              <div className="benefit-card__topline">
                <span>{offer.partner.relationshipLabel}</span>
                <span className="status-pill">{availabilityLabel[offer.availability]}</span>
              </div>
              <h2>{offer.title}</h2>
              <p>{offer.description}</p>
              <dl className="benefit-terms">
                <div><dt>Terms</dt><dd>{offer.termsSummary}</dd></div>
                <div><dt>Eligibility</dt><dd>{offer.eligibility}</dd></div>
              </dl>
              <p className="benefit-disclosure">{offer.partner.disclosure}</p>
              {offer.availability === "external_resource" && offer.url ? (
                <button className="secondary-button" onClick={() => void record(offer, "open")} type="button">Open external resource</button>
              ) : (
                <button className="secondary-button" disabled type="button">No claimable offer</button>
              )}
              {claim ? (
                <div className="benefit-feedback">
                  <p><strong>Activity status:</strong> {claim.state.replaceAll("_", " ")}{claim.providerVerifiedAt ? " · provider verified" : " · not provider verified"}</p>
                  {claim.state === "opened" ? (
                    <div>
                      <span>Did it work?</span>
                      <button onClick={() => void record(offer, "user_reported_success")} type="button">Yes</button>
                      <button onClick={() => void record(offer, "user_reported_failed")} type="button">No</button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
