import { describe, expect, it } from "vitest";
import { parseCuratedStoredZip } from "./curated-gallery-zip";
import { CURATED_GALLERY_ARCHIVE_ENTRY_COUNT } from "./curated-gallery-identity";

type Archive = { buffer: ArrayBuffer; view: DataView; central: number; offsets: number[] };

function fixture(firstName = ".curated-media/manifest.json"): Archive {
  const encoder = new TextEncoder();
  const names = Array.from({ length: CURATED_GALLERY_ARCHIVE_ENTRY_COUNT },
    (_value, index) => encoder.encode(index === 0 ? firstName : `images/${String(index).padStart(3, "0")}.jpg`));
  const localSize = names.reduce((sum, name) => sum + 31 + name.length, 0);
  const centralSize = names.reduce((sum, name) => sum + 46 + name.length, 0);
  const buffer = new ArrayBuffer(localSize + centralSize + 22);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const u16 = (offset: number, value: number) => view.setUint16(offset, value, true);
  const u32 = (offset: number, value: number) => view.setUint32(offset, value, true);
  const offsets: number[] = [];
  let cursor = 0;
  for (const name of names) {
    offsets.push(cursor);
    u32(cursor, 0x04034b50);
    u16(cursor + 26, name.length);
    u32(cursor + 18, 1);
    u32(cursor + 22, 1);
    bytes.set(name, cursor + 30);
    bytes[cursor + 30 + name.length] = 42;
    cursor += 31 + name.length;
  }
  expect(cursor).toBe(localSize);
  for (const [index, name] of names.entries()) {
    u32(cursor, 0x02014b50);
    u16(cursor + 28, name.length);
    u32(cursor + 20, 1);
    u32(cursor + 24, 1);
    u32(cursor + 42, offsets[index]);
    bytes.set(name, cursor + 46);
    cursor += 46 + name.length;
  }
  expect(cursor).toBe(localSize + centralSize);
  u32(cursor, 0x06054b50);
  u16(cursor + 8, names.length);
  u16(cursor + 10, names.length);
  u32(cursor + 12, centralSize);
  u32(cursor + 16, localSize);
  return { buffer, view, central: localSize, offsets };
}

describe("checksum-authenticated gallery ZIP structural parser", () => {
  it("returns all approved-count stored entries as byte views without copying the full package", () => {
    const { buffer } = fixture();
    const result = parseCuratedStoredZip(buffer);
    expect(result.size).toBe(CURATED_GALLERY_ARCHIVE_ENTRY_COUNT);
    expect(result.get(".curated-media/manifest.json")?.bytes[0]).toBe(42);
    expect(result.get(".curated-media/manifest.json")?.bytes.buffer).toBe(buffer);
  });

  it("rejects a truncated archive or a fake end record", () => {
    expect(() => parseCuratedStoredZip(new ArrayBuffer(10))).toThrow();
    const { buffer, view } = fixture();
    view.setUint32(buffer.byteLength - 22, 0, true);
    expect(() => parseCuratedStoredZip(buffer)).toThrow();
  });

  it("rejects a false end offset or central directory outside its range", () => {
    const { buffer, view } = fixture();
    view.setUint32(buffer.byteLength - 22 + 16, 0xfffffff0, true);
    expect(() => parseCuratedStoredZip(buffer)).toThrow();
  });

  it("rejects central records whose declared length exceeds the directory", () => {
    const { buffer, view, central } = fixture();
    view.setUint16(central + 28, 65535, true);
    expect(() => parseCuratedStoredZip(buffer)).toThrow();
  });

  it("rejects local-name disagreement with the central directory", () => {
    const { buffer } = fixture();
    new Uint8Array(buffer)[30] ^= 0x1;
    expect(() => parseCuratedStoredZip(buffer)).toThrow("name disagrees");
  });

  it("rejects local size, checksum, or compression disagreement", () => {
    const { buffer, view, central } = fixture();
    view.setUint32(18, 500, true);
    expect(() => parseCuratedStoredZip(buffer)).toThrow("size or checksum");
    view.setUint32(18, 1, true);
    view.setUint16(central + 10, 8, true);
    expect(() => parseCuratedStoredZip(buffer)).toThrow("compressed");
  });

  it("rejects encrypted or overlapping entries", () => {
    const { buffer, view, central } = fixture();
    view.setUint16(central + 8, 1, true);
    expect(() => parseCuratedStoredZip(buffer)).toThrow("Encrypted");
    view.setUint16(central + 8, 0, true);
    // Point the second directory entry at the first local file.
    const firstName = new TextEncoder().encode(".curated-media/manifest.json");
    view.setUint32(central + 46 + firstName.length + 42, 0, true);
    expect(() => parseCuratedStoredZip(buffer)).toThrow();
  });

  it("rejects traversal paths, even when local and central names agree", () => {
    const { buffer } = fixture("../escape");
    expect(() => parseCuratedStoredZip(buffer)).toThrow("unsafe");
  });

  it("rejects trailing data that does not belong to the ZIP comment", () => {
    const { buffer } = fixture();
    const extended = new ArrayBuffer(buffer.byteLength + 1);
    new Uint8Array(extended).set(new Uint8Array(buffer));
    expect(() => parseCuratedStoredZip(extended)).toThrow();
  });
});
