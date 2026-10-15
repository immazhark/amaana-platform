import { CURATED_GALLERY_ARCHIVE_ENTRY_COUNT } from "./curated-gallery-identity";

export type CuratedZipEntry = { name: string; bytes: Uint8Array };

function safeZipPath(name: string) {
  if (!name || name.startsWith("/") || /^[A-Za-z]:/.test(name) ||
      name.includes("\\") || name.includes("\0")) return false;
  return !name.split("/").some(part => !part || part === "." || part === "..");
}

/** Read only stored entries from an already SHA-256-authenticated ZIP.
 * Bounds-check metadata before every DataView read. Archive identities and
 * per-image checksums are validated separately by the owner-curated importer. */
export function parseCuratedStoredZip(buffer: ArrayBuffer): Map<string, CuratedZipEntry> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  if (bytes.length < 22) throw new Error("ZIP archive is truncated.");

  const u16 = (offset: number) => {
    if (offset < 0 || offset + 2 > bytes.length) throw new Error("ZIP metadata is truncated.");
    return view.getUint16(offset, true);
  };
  const u32 = (offset: number) => {
    if (offset < 0 || offset + 4 > bytes.length) throw new Error("ZIP metadata is truncated.");
    return view.getUint32(offset, true);
  };

  const min = Math.max(0, bytes.length - 65_557);
  let end = -1;
  for (let index = bytes.length - 22; index >= min; index--) {
    if (u32(index) === 0x06054b50 && index + 22 + u16(index + 20) === bytes.length) {
      end = index;
      break;
    }
  }
  if (end < 0) throw new Error("ZIP end-of-central-directory record is missing or malformed.");
  if (u16(end + 4) || u16(end + 6) || u16(end + 8) !== u16(end + 10)) {
    throw new Error("Multi-disk ZIP archives are not accepted.");
  }

  const count = u16(end + 10);
  const centralSize = u32(end + 12);
  const centralStart = u32(end + 16);
  if (count !== CURATED_GALLERY_ARCHIVE_ENTRY_COUNT) {
    throw new Error("ZIP entry count does not match the approved package.");
  }
  if (centralStart > end || centralSize !== end - centralStart) {
    throw new Error("ZIP central directory is outside its declared bounds.");
  }

  const entries = new Map<string, CuratedZipEntry>();
  const occupied: Array<[number, number]> = [];
  let cursor = centralStart;
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > end || u32(cursor) !== 0x02014b50) {
      throw new Error("ZIP central-directory entry is truncated or invalid.");
    }
    const flags = u16(cursor + 8);
    const method = u16(cursor + 10);
    const size = u32(cursor + 20);
    const rawSize = u32(cursor + 24);
    const nameLength = u16(cursor + 28);
    const extraLength = u16(cursor + 30);
    const commentLength = u16(cursor + 32);
    const localOffset = u32(cursor + 42);
    const next = cursor + 46 + nameLength + extraLength + commentLength;
    if (next > end || nameLength === 0) throw new Error("ZIP directory entry exceeds archive bounds.");
    if (method !== 0 || size !== rawSize || (flags & 0x41) !== 0) {
      throw new Error("Encrypted or compressed ZIP entries are not accepted.");
    }
    const centralName = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
    const name = decoder.decode(centralName);
    if (!safeZipPath(name) || entries.has(name)) throw new Error("ZIP contains an unsafe or duplicate path.");

    if (localOffset + 30 > centralStart || u32(localOffset) !== 0x04034b50) {
      throw new Error("ZIP local-file header is missing or invalid.");
    }
    const localFlags = u16(localOffset + 6);
    const localMethod = u16(localOffset + 8);
    const localNameLength = u16(localOffset + 26);
    const localExtraLength = u16(localOffset + 28);
    if (localMethod !== method || localFlags !== flags || localNameLength !== nameLength) {
      throw new Error("ZIP central and local-file headers disagree.");
    }
    if ((flags & 0x8) === 0 && (u32(localOffset + 18) !== size || u32(localOffset + 22) !== rawSize ||
        u32(localOffset + 14) !== u32(cursor + 16))) {
      throw new Error("ZIP local-file size or checksum disagrees with the directory.");
    }

    const nameStart = localOffset + 30;
    const dataStart = nameStart + localNameLength + localExtraLength;
    const dataEnd = dataStart + rawSize;
    if (dataEnd > centralStart || dataStart < nameStart) {
      throw new Error("ZIP entry data exceeds archive bounds.");
    }
    for (let byteIndex = 0; byteIndex < nameLength; byteIndex++) {
      if (bytes[nameStart + byteIndex] !== centralName[byteIndex]) {
        throw new Error("ZIP local-file name disagrees with its directory.");
      }
    }
    occupied.push([localOffset, dataEnd]);
    entries.set(name, { name, bytes: bytes.subarray(dataStart, dataEnd) });
    cursor = next;
  }
  if (cursor !== end) throw new Error("ZIP central directory contains unexpected data.");
  occupied.sort((a, b) => a[0] - b[0]);
  for (let index = 1; index < occupied.length; index++) {
    if (occupied[index][0] < occupied[index - 1][1]) {
      throw new Error("ZIP local-file entries overlap.");
    }
  }
  return entries;
}
