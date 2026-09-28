import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { describe, expect, it } from "vitest";
import type { ProfileFact } from "@/lib/domain";
import { generateResumeContent, generateSkills, type ResumeContent } from "@/lib/outputs/generate";
import { resumeToDocx, resumeToPdf, resumeToPlainText } from "@/lib/outputs/export";
import { ResumeStore } from "@/lib/outputs/resume-store";

function fact(field: string, value: string, status: ProfileFact["status"] = "confirmed"): ProfileFact {
  return {
    id: field,
    participantId: "participant",
    field,
    value,
    status,
    evidenceMessageId: "message",
    revision: 1,
    history: [],
    updatedAt: new Date(0).toISOString(),
  };
}

const completeContent: ResumeContent = {
  name: "María Núñez",
  contactLine: "maria@example.com | Bogotá",
  targetRole: "Coordinación de operaciones",
  summary: "Experiencia coordinando procesos y resolviendo excepciones.",
  experience: {
    role: "Coordinadora logística",
    dates: "2020–2025",
    location: "Bogotá",
    bullets: ["Gestionó documentos de entrega y coordinó con facturación."],
  },
  skills: ["Coordinación", "Resolución de problemas"],
};

describe("career outputs", () => {
  it("uses only confirmed facts and keeps examples attached to skills", () => {
    const facts = [
      fact("role", "Logistics Coordinator"),
      fact("responsibilities", "Resolved missing delivery documents."),
      fact("judgment_example", "Distinguished a missing scan from a delivery issue."),
      fact("employer", "Unsupported Employer", "unknown"),
    ];

    const resume = generateResumeContent(facts);
    const skills = generateSkills(facts);
    expect(JSON.stringify(resume)).not.toContain("Unsupported Employer");
    expect(skills[0]).toMatchObject({
      skill: "Judgment and exception handling",
      evidence: "Distinguished a missing scan from a delivery issue.",
    });
  });

  it("does not mark incomplete or conflicting drafts ready", () => {
    const store = new ResumeStore();
    const incomplete = store.create("owner", "session", { ...completeContent, name: "" }, []);
    expect(incomplete.status).toBe("facts_incomplete");

    const conflict = store.save("owner", "session", completeContent, ["dates"], true);
    expect(conflict.status).toBe("facts_incomplete");

    const ready = store.save("owner", "session", completeContent, [], true);
    expect(ready.status).toBe("ready_to_export");
  });

  it("keeps English and Spanish content consistent across text, DOCX, and selectable PDF", async () => {
    const plain = resumeToPlainText(completeContent);
    const docx = await resumeToDocx(completeContent);
    const docxText = (await mammoth.extractRawText({ buffer: docx })).value;
    const pdf = await resumeToPdf(completeContent);
    const parser = new PDFParse({ data: pdf });
    const pdfText = (await parser.getText()).text;
    await parser.destroy();

    for (const expected of ["María Núñez", "Coordinación de operaciones", "Coordinadora logística", "Gestionó documentos de entrega"]) {
      expect(plain).toContain(expected);
      expect(docxText).toContain(expected);
      expect(pdfText).toContain(expected);
    }
  });
});
