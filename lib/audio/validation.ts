const startsWith = (bytes: Uint8Array, signature: number[]) => signature.every((value, index) => bytes[index] === value);

export function hasExpectedAudioSignature(mimeType: string, bytes: Uint8Array) {
  if (mimeType.startsWith("audio/webm")) return startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
  if (mimeType.startsWith("audio/ogg")) return startsWith(bytes, [0x4f, 0x67, 0x67, 0x53]);
  if (mimeType === "audio/mp4") {
    return bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp";
  }
  return false;
}
