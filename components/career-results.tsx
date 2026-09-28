"use client";

import { useEffect, useState } from "react";

type Skill = { skill: string; evidence: string; transferableTo: string; needsValidation: string };
type Career = { directions: string[]; rationale: string; keywords: string[] };

export function CareerResults() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [career, setCareer] = useState<Career | null>(null);
  const [message, setMessage] = useState("Building your evidence-backed draft…");

  useEffect(() => {
    const sessionId = localStorage.getItem("next_chapter_session_id");
    if (!sessionId) {
      queueMicrotask(() => setMessage("Start an interview to build your results."));
      return;
    }
    fetch(`/api/outputs?sessionId=${encodeURIComponent(sessionId)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error()))
      .then((data: { skills: Skill[]; career: Career }) => {
        setSkills(data.skills);
        setCareer(data.career);
        setMessage(data.skills.length ? "" : "Complete a few experience questions to add evidence-backed skills.");
      })
      .catch(() => setMessage("Your results could not be prepared. Refresh and try again."));
  }, []);

  return (
    <section className="career-results" aria-labelledby="skills-title">
      <div className="section-heading">
        <p className="eyebrow">Backed by your examples</p>
        <h2 id="skills-title">Your skills reassessment</h2>
      </div>
      {message ? <p className="status-note" role="status">{message}</p> : null}
      {skills.length ? (
        <div className="skill-grid">
          {skills.map((skill) => (
            <article className="skill-card" key={skill.skill}>
              <h3>{skill.skill}</h3>
              <p><strong>Your example:</strong> {skill.evidence}</p>
              <p><strong>May transfer to:</strong> {skill.transferableTo}</p>
              <small>{skill.needsValidation}</small>
            </article>
          ))}
        </div>
      ) : null}
      {career ? (
        <div className="career-direction-card">
          <h2>Directions to investigate</h2>
          <ol>{career.directions.map((direction) => <li key={direction}>{direction}</li>)}</ol>
          <p>{career.rationale}</p>
          <div className="keyword-list" aria-label="Suggested search keywords">
            {career.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
          </div>
        </div>
      ) : null}
    </section>
  );
}
