import type { BackgroundAsset } from "@/lib/background/background-store";

export function publicBackgroundAsset(asset: BackgroundAsset) {
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
