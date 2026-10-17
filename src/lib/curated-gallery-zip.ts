import { CURATED_GALLERY_ARCHIVE_ENTRY_COUNT } from "./curated-gallery-identity";

export type CuratedZipEntry = { name: string; bytes: Uint8Array };

/** Called only after the entire fixed owner-approved ZIP passes its SHA-256
 * check. Preserve bounded stored-entry decoding for every accepted entry. */
export function parseCuratedStoredZip(buffer: ArrayBuffer): Map<string, CuratedZipEntry> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const fail = (reason: string): never => { throw new Error(`ZIP ${reason}.`); };
  const check = (at: number, length: number, limit = bytes.length) => {
    if (at < 0 || length < 0 || at + length > limit) fail("metadata is truncated");
  };
  const u16 = (at: number) => { check(at, 2); return view.getUint16(at, true); };
  const u32 = (at: number) => { check(at, 4); return view.getUint32(at, true); };
  if (bytes.length < 22) return fail("archive is truncated");

  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (u32(i) === 0x06054b50 && i + 22 + u16(i + 20) === bytes.length) {
      end = i;
      break;
    }
  }
  if (end < 0) return fail("end-of-central-directory record is missing or malformed");
  if (u16(end + 4) || u16(end + 6) || u16(end + 8) !== u16(end + 10)) {
    return fail("multi-disk archives are not accepted");
  }
  const count = u16(end + 10);
  const centralStart = u32(end + 16);
  if (count !== CURATED_GALLERY_ARCHIVE_ENTRY_COUNT) return fail("entry count does not match the approved package");
  if (centralStart > end || u32(end + 12) !== end - centralStart) {
    return fail("central directory is outside declared bounds");
  }

  const entries = new Map<string, CuratedZipEntry>();
  const spans: Array<[number, number]> = [];
  let at = centralStart;
  for (let i = 0; i < count; i++) {
    check(at, 46, end);
    if (u32(at) !== 0x02014b50) return fail("central-directory entry is invalid");
    const flags = u16(at + 8);
    const method = u16(at + 10);
    const size = u32(at + 20);
    const nameLength = u16(at + 28);
    const next = at + 46 + nameLength + u16(at + 30) + u16(at + 32);
    check(at, next - at, end);
    if (!nameLength) return fail("directory entry has no name");
    if (method || size !== u32(at + 24) || (flags & 0x41)) {
      return fail("Encrypted or compressed entries are not accepted");
    }

    const nameBytes = bytes.subarray(at + 46, at + 46 + nameLength);
    const name = decoder.decode(nameBytes);
    if (!name || name.startsWith("/") || /^[A-Za-z]:/.test(name) ||
        name.includes("\\") || name.includes("\0") ||
        name.split("/").some(part => !part || part === "." || part === "..") ||
        entries.has(name)) return fail("contains an unsafe or duplicate path");

    const local = u32(at + 42);
    check(local, 30, centralStart);
    if (u32(local) !== 0x04034b50 || u16(local + 6) !== flags ||
        u16(local + 8) !== method || u16(local + 26) !== nameLength) {
      return fail("local and central headers disagree");
    }
    if (!(flags & 8) && (u32(local + 14) !== u32(at + 16) ||
        u32(local + 18) !== size || u32(local + 22) !== size)) {
      return fail("local-file size or checksum disagrees with the directory");
    }
    const dataStart = local + 30 + nameLength + u16(local + 28);
    check(dataStart, size, centralStart);
    for (let j = 0; j < nameLength; j++) {
      if (bytes[local + 30 + j] !== nameBytes[j]) return fail("local-file name disagrees with its directory");
    }
    spans.push([local, dataStart + size]);
    entries.set(name, { name, bytes: bytes.subarray(dataStart, dataStart + size) });
    at = next;
  }
  if (at !== end) return fail("central directory contains unexpected data");
  spans.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < spans.length; i++) {
    const before = spans[i - 1];
    const after = spans[i];
    if (!before || !after || after[0] < before[1]) return fail("local-file entries overlap");
  }
  return entries;
}
