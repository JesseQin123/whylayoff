import { randomUUID } from "node:crypto";
import type { FactStatus, JsonValue } from "@/lib/domain";

export type BackgroundField = {
  field: "role" | "industry" | "responsibilities" | "dates" | "location" | "career_goal";
  value: JsonValue;
  status: "captured" | FactStatus;
};

export type BackgroundAsset = {
  id: string;
  ownerTokenHash: string;
  sessionId: string;
  type: "pdf" | "docx" | "pasted_text" | "manual" | "linkedin_url";
  name: string;
  mimeType: string | null;
  byteSize: number;
  sourceValue: string | null;
  extractedText: string | null;
  rawBytes: Uint8Array | null;
  status: "processing" | "ready" | "failed" | "confirmed";
  errorCode: string | null;
  fields: BackgroundField[];
  createdAt: string;
  deleteAfter: string;
};

export class BackgroundAccessError extends Error {
  constructor(message: string, readonly code: "NOT_FOUND" | "FORBIDDEN") {
    super(message);
  }
}

export class BackgroundStore {
  private assets = new Map<string, BackgroundAsset>();

  create(input: Omit<BackgroundAsset, "id" | "createdAt" | "deleteAfter">) {
    const createdAt = new Date();
    const asset: BackgroundAsset = {
      ...input,
      id: randomUUID(),
      createdAt: createdAt.toISOString(),
      deleteAfter: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    this.assets.set(asset.id, asset);
    return asset;
  }

  get(ownerTokenHash: string, assetId: string) {
    const asset = this.assets.get(assetId);
    if (!asset) throw new BackgroundAccessError("Background asset not found", "NOT_FOUND");
    if (asset.ownerTokenHash !== ownerTokenHash) throw new BackgroundAccessError("Background asset is not owned", "FORBIDDEN");
    return asset;
  }

  list(ownerTokenHash: string, sessionId: string) {
    return [...this.assets.values()].filter((asset) => asset.ownerTokenHash === ownerTokenHash && asset.sessionId === sessionId);
  }

  confirm(ownerTokenHash: string, assetId: string, fields: BackgroundField[]) {
    const asset = this.get(ownerTokenHash, assetId);
    asset.fields = fields;
    asset.status = "confirmed";
    asset.rawBytes = null;
    return asset;
  }

  deleteForOwner(ownerTokenHash: string) {
    for (const [id, asset] of this.assets) {
      if (asset.ownerTokenHash === ownerTokenHash) this.assets.delete(id);
    }
  }
}

declare global {
  var nextChapterBackgroundStore: BackgroundStore | undefined;
}

export const backgroundStore = globalThis.nextChapterBackgroundStore ?? new BackgroundStore();
globalThis.nextChapterBackgroundStore = backgroundStore;
