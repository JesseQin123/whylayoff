import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ResumeContent } from "@/lib/outputs/generate";

export function resumeToPlainText(content: ResumeContent) {
  const lines = [
    content.name,
    content.contactLine,
    content.targetRole,
    "",
    "PROFESSIONAL SUMMARY",
    content.summary,
    "",
    "SELECTED EXPERIENCE",
    content.experience.role,
    [content.experience.dates, content.experience.location].filter(Boolean).join(" | "),
    ...content.experience.bullets.filter(Boolean).map((bullet) => `• ${bullet}`),
    "",
    "SKILLS",
    content.skills.join(" • "),
  ];
  return lines.filter((line, index) => line !== "" || lines[index - 1] !== "").join("\n").trim();
}

export async function resumeToDocx(content: ResumeContent) {
  const children = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: content.name, bold: true, size: 34 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, text: content.contactLine }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: content.targetRole, bold: true })] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Professional Summary" }),
    new Paragraph({ text: content.summary }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Selected Experience" }),
    new Paragraph({ children: [new TextRun({ text: content.experience.role, bold: true })] }),
    new Paragraph({ text: [content.experience.dates, content.experience.location].filter(Boolean).join(" | ") }),
    ...content.experience.bullets.filter(Boolean).map((bullet) => new Paragraph({ text: bullet, bullet: { level: 0 } })),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Skills" }),
    new Paragraph({ text: content.skills.join(" • ") }),
  ];
  return Packer.toBuffer(new Document({ sections: [{ properties: {}, children }] }));
}

export async function resumeToPdf(content: ResumeContent) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([612, 792]);
  const margin = 54;
  const width = page.getWidth() - margin * 2;
  let y = page.getHeight() - margin;

  const newPageIfNeeded = (height: number) => {
    if (y - height < margin) {
      page = pdf.addPage([612, 792]);
      y = page.getHeight() - margin;
    }
  };

  const drawWrapped = (text: string, options: { size?: number; isBold?: boolean; gapAfter?: number } = {}) => {
    const size = options.size ?? 10.5;
    const font = options.isBold ? bold : regular;
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    if (line) lines.push(line);
    const lineHeight = size * 1.35;
    newPageIfNeeded(lines.length * lineHeight + (options.gapAfter ?? 0));
    for (const value of lines) {
      page.drawText(value, { x: margin, y, size, font, color: rgb(0.09, 0.13, 0.11) });
      y -= lineHeight;
    }
    y -= options.gapAfter ?? 0;
  };

  drawWrapped(content.name, { size: 18, isBold: true, gapAfter: 3 });
  drawWrapped(content.contactLine, { size: 9.5, gapAfter: 3 });
  drawWrapped(content.targetRole, { size: 12, isBold: true, gapAfter: 16 });
  drawWrapped("PROFESSIONAL SUMMARY", { size: 11, isBold: true, gapAfter: 5 });
  drawWrapped(content.summary, { gapAfter: 16 });
  drawWrapped("SELECTED EXPERIENCE", { size: 11, isBold: true, gapAfter: 5 });
  drawWrapped(content.experience.role, { size: 11, isBold: true, gapAfter: 2 });
  drawWrapped([content.experience.dates, content.experience.location].filter(Boolean).join(" | "), { size: 9.5, gapAfter: 6 });
  for (const bullet of content.experience.bullets.filter(Boolean)) drawWrapped(`• ${bullet}`, { gapAfter: 4 });
  y -= 10;
  drawWrapped("SKILLS", { size: 11, isBold: true, gapAfter: 5 });
  drawWrapped(content.skills.join(" • "));
  return pdf.save();
}
