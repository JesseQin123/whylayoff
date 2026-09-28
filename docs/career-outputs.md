# Skills, directions, and resume outputs

Career outputs are generated from confirmed profile facts only. Each skill contains the user's supporting example, a cautious transfer statement, and what still needs validation. Role directions and search keywords are hypotheses to investigate; the UI does not present them as open jobs or hiring probabilities.

Resume content has one normalized structure shared by the web editor, plain text, DOCX, and PDF renderers. The PDF contains selectable text. Automated tests re-extract text from DOCX and PDF and compare English and Spanish content, including accented characters.

Every save creates a new resume version. Status progresses through `facts_incomplete → fact_review → ready_to_export`. Missing name, target, summary, role, dates, experience evidence, or any contradicted source fact blocks final DOCX/PDF export. User edits are treated as participant-provided statements and require an explicit **Confirm facts** action. Plain text remains available for draft review.
