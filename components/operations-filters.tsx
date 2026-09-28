"use client";

import { useEffect, useMemo, useState } from "react";

type Profile = {
  sessionId: string;
  domain: string;
  role: string;
  region: string;
  language: string;
  expertise: string;
  activeGrants: string[];
  contactPreferences: null | {
    emailAddress: string | null;
    serviceEmail: boolean;
    courseInformation: boolean;
    community: boolean;
    expertFollowUp: boolean;
  };
  acquisition: { source: string | null; medium: string | null; campaign: string | null };
};

const textFilters = ["domain", "role", "region", "language", "expertise"] as const;

export function OperationsFilters() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("Loading the latest permission state…");

  useEffect(() => {
    const sessionId = localStorage.getItem("next_chapter_session_id");
    if (!sessionId) {
      queueMicrotask(() => setStatus("No local session is available for this operations preview."));
      return;
    }
    fetch(`/api/admin/profiles?sessionId=${encodeURIComponent(sessionId)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error()))
      .then((data: { profiles: Profile[] }) => {
        setProfiles(data.profiles);
        setStatus("Filters use the current grant and contact-preference versions.");
      })
      .catch(() => setStatus("The operations profile could not be loaded."));
  }, []);

  const filtered = useMemo(() => profiles.filter((profile) => {
    for (const field of textFilters) {
      const expected = filters[field]?.trim().toLowerCase();
      if (expected && !profile[field].toLowerCase().includes(expected)) return false;
    }
    if (filters.grant && !profile.activeGrants.includes(filters.grant)) return false;
    if (filters.preference) {
      const preferences = profile.contactPreferences;
      if (!preferences || !preferences[filters.preference as keyof typeof preferences]) return false;
    }
    return true;
  }), [filters, profiles]);

  return (
    <section className="admin-panel operations-panel">
      <div className="admin-panel__header">
        <div>
          <p className="eyebrow">Follow-up operations</p>
          <h2>Filter by current permission</h2>
        </div>
        <span className="status-pill">{filtered.length} matches</span>
      </div>
      <div className="operations-filters">
        {textFilters.map((field) => (
          <label key={field}>
            <span>{field}</span>
            <input onChange={(event) => setFilters((current) => ({ ...current, [field]: event.target.value }))} placeholder={`Filter ${field}`} value={filters[field] ?? ""} />
          </label>
        ))}
        <label>
          <span>Current grant</span>
          <select onChange={(event) => setFilters((current) => ({ ...current, grant: event.target.value }))} value={filters.grant ?? ""}>
            <option value="">Any</option>
            <option value="product_research">Product research</option>
            <option value="service_email">Service email</option>
            <option value="course_information">Course information</option>
            <option value="community">Community</option>
            <option value="expert_follow_up">Expert follow-up</option>
          </select>
        </label>
        <label>
          <span>Contact preference</span>
          <select onChange={(event) => setFilters((current) => ({ ...current, preference: event.target.value }))} value={filters.preference ?? ""}>
            <option value="">Any</option>
            <option value="serviceEmail">Service email</option>
            <option value="courseInformation">Course information</option>
            <option value="community">Community</option>
            <option value="expertFollowUp">Expert follow-up</option>
          </select>
        </label>
      </div>
      <p className="status-note" role="status">{status}</p>
      <div className="operations-results">
        {filtered.map((profile) => (
          <article className="workspace-card" key={profile.sessionId}>
            <div className="workspace-card__topline"><strong>{profile.role || "Role not provided"}</strong><span>{profile.language} · {profile.region || "Region not provided"}</span></div>
            <p>{profile.domain || "Domain not provided"} · {profile.expertise || "Expertise not provided"}</p>
            <p><strong>Current grants:</strong> {profile.activeGrants.join(", ") || "none"}</p>
            <p><strong>Acquisition:</strong> {[profile.acquisition.source, profile.acquisition.medium, profile.acquisition.campaign].filter(Boolean).join(" / ") || "direct or unknown"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
