import { describe, expect, it } from "vitest";
import { BackgroundStore } from "@/lib/background/background-store";
import { candidateFields, detectDocumentType } from "@/lib/background/extract";

describe("background intake", () => {
  it("detects document signatures instead of trusting the extension", () => {
    expect(detectDocumentType("application/pdf", new TextEncoder().encode("%PDF-1.7"))).toBe("pdf");
    expect(detectDocumentType(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    )).toBe("docx");
    expect(detectDocumentType("application/pdf", new TextEncoder().encode("plain text"))).toBeNull();
  });

  it("creates review candidates without confirming them", () => {
    const fields = candidateFields("Role: Logistics Coordinator\nIndustry: Freight\nLocation: Chicago\nResponsibilities: Resolved missing delivery documents.");
    expect(fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "role", value: "Logistics Coordinator", status: "captured" }),
      expect.objectContaining({ field: "industry", value: "Freight", status: "captured" }),
    ]));
    expect(fields.every((field) => field.status === "captured")).toBe(true);
  });

  it("isolates assets and deletes raw bytes after confirmation", () => {
    const store = new BackgroundStore();
    const asset = store.create({
      ownerTokenHash: "owner-a",
      sessionId: "session-a",
      type: "pdf",
      name: "resume.pdf",
      mimeType: "application/pdf",
      byteSize: 8,
      sourceValue: null,
      extractedText: "Role: Planner",
      rawBytes: new Uint8Array([1, 2, 3]),
      status: "ready",
      errorCode: null,
      fields: [{ field: "role", value: "Planner", status: "captured" }],
    });

    expect(() => store.get("owner-b", asset.id)).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
    store.confirm("owner-a", asset.id, [{ field: "role", value: "Production Planner", status: "confirmed" }]);
    expect(store.get("owner-a", asset.id)).toMatchObject({ status: "confirmed", rawBytes: null });
  });
});
