/** Fast, side-effect-free validation before creating a donor's pending bank
 * transfer claim. Private storage repeats complete-file checks on upload.
 * Reading at most 12 bytes avoids allocating the full 5 MiB attachment here. */
const permitted = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export async function hasValidDonationEvidenceHeader(file: File): Promise<boolean> {
  if (!permitted.has(file.type) || file.size === 0) return false;
  try {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const starts = (...expected: number[]) =>
      bytes.length >= expected.length && expected.every((byte, i) => bytes[i] === byte);
    switch (file.type) {
      case "application/pdf": return starts(0x25, 0x50, 0x44, 0x46, 0x2d);
      case "image/jpeg": return starts(0xff, 0xd8, 0xff);
      case "image/png": return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
      case "image/webp":
        return starts(0x52, 0x49, 0x46, 0x46) &&
          bytes.length >= 12 &&
          bytes[8] === 0x57 && bytes[9] === 0x45 &&
          bytes[10] === 0x42 && bytes[11] === 0x50;
      default: return false;
    }
  } catch {
    // Failed read cannot prove evidence authenticity; reject before writing.
    return false;
  }
}
