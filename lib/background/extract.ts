import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { BackgroundField } from "@/lib/background/background-store";

export function detectDocumentType(mimeType: string, bytes: Uint8Array) {
  if (mimeType === "application/pdf" && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-") return "pdf" as const;
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    && bytes[0] === 0x50 && bytes[1] === 0x4b) return "docx" as const;
  return null;
}

export async function extractDocumentText(type: "pdf" | "docx", bytes: Uint8Array) {
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  if (type === "docx") {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
    return result.value.trim();
  }
  const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

const labeledValue = (text: string, labels: string[]) => {
  const pattern = new RegExp(`(?:^|\\n)\\s*(?:${labels.join("|")})\\s*[:：-]\\s*([^\\n]{2,200})`, "i");
  return text.match(pattern)?.[1]?.trim() ?? "";
};

export function candidateFields(text: string): BackgroundField[] {
  const normalized = text.replace(/\r/g, "").trim();
  if (!normalized) return [];
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const candidates: BackgroundField[] = [];
  const role = labeledValue(normalized, ["role", "title", "position", "puesto", "cargo"]);
  const industry = labeledValue(normalized, ["industry", "sector", "industria"]);
  const location = labeledValue(normalized, ["location", "city", "ubicación", "ciudad"]);
  const dates = labeledValue(normalized, ["dates", "employment", "fechas"]);
  if (role) candidates.push({ field: "role", value: role, status: "captured" });
  if (industry) candidates.push({ field: "industry", value: industry, status: "captured" });
  if (dates) candidates.push({ field: "dates", value: dates, status: "captured" });
  if (location) candidates.push({ field: "location", value: location, status: "captured" });
  candidates.push({
    field: "responsibilities",
    value: labeledValue(normalized, ["responsibilities", "summary", "experience", "responsabilidades", "resumen"])
      || lines.slice(0, 8).join(" ").slice(0, 1500),
    status: "captured",
  });
  return candidates;
}

export function publicBackgroundAsset(asset: import("@/lib/background/background-store").BackgroundAsset) {
  return {
    id: asset.id,
    sessionId: asset.sessionId,
    type: asset.type,
    name: asset.name,
    status: asset.status,
    errorCode: asset.errorCode,
    fields: asset.fields,
    sourceValue: asset.type === "linkedin_url" ? asset.sourceValue : null,
    createdAt: asset.createdAt,
    deleteAfter: asset.deleteAfter,
  };
}
