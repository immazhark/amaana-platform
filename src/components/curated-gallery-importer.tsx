"use client";

import { useState } from "react";
import {
  CURATED_GALLERY_ARCHIVE_ENTRY_COUNT,
  CURATED_GALLERY_BATCH,
  CURATED_GALLERY_MANIFEST_SHA256,
  CURATED_GALLERY_PACKAGE_BYTES,
  CURATED_GALLERY_PACKAGE_SHA256,
  CURATED_GALLERY_RECORD_COUNT,
  archivePathForCuratedRecord,
  curatedGalleryManifestSchema,
  type CuratedGalleryManifest,
} from "@/lib/curated-gallery-contract";

type ZipEntry = {
  name: string;
  bytes: Uint8Array;
};

type ImportStatus = {
  expected?: number;
  uploaded?: number;
  published?: number;
  missing?: number;
  mismatches?: string[];
  galleryOnly?: boolean;
};

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(bytes: ArrayBuffer | Uint8Array) {
  const value = bytes instanceof Uint8Array
    ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    : bytes;
  return hex(await crypto.subtle.digest("SHA-256", value));
}

function safeZipPath(name: string) {
  if (!name || name.startsWith("/") || /^[A-Za-z]:/.test(name) || name.includes("\\")) return false;
  return !name.split("/").some(part => !part || part === "." || part === "..");
}

function parseStoredZip(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const min = Math.max(0, bytes.byteLength - 65_557);
  let eocd = -1;
  for (let offset = bytes.byteLength - 22; offset >= min; offset--) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error("ZIP end-of-central-directory record was not found.");

  const entryCount = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  if (entryCount !== CURATED_GALLERY_ARCHIVE_ENTRY_COUNT) throw new Error("ZIP entry count does not match the approved package.");
  if (centralOffset + centralSize > bytes.byteLength) throw new Error("ZIP central directory is outside the archive.");

  const entries = new Map<string, ZipEntry>();
  let cursor = centralOffset;
  for (let index = 0; index < entryCount; index++) {
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error("Invalid ZIP central-directory entry.");
    const flags = view.getUint16(cursor + 8, true);
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    if (method !== 0 || compressedSize !== uncompressedSize) throw new Error("The approved ZIP must contain stored, unmodified files.");
    if ((flags & 0x1) !== 0) throw new Error("Encrypted ZIP entries are not accepted.");

    const nameStart = cursor + 46;
    const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLength));
    if (!safeZipPath(name) || entries.has(name)) throw new Error("ZIP contains an unsafe or duplicate path.");
    if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error("Invalid ZIP local-file header.");
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + uncompressedSize;
    if (dataEnd > bytes.byteLength) throw new Error("ZIP entry exceeds archive bounds.");
    entries.set(name, { name, bytes: bytes.subarray(dataStart, dataEnd) });
    cursor = nameStart + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function responseJson(response: Response) {
  const result = await response.json().catch(() => ({})) as { error?: string } & Record<string, unknown>;
  if (!response.ok) throw new Error(result.error ?? `Request failed with status ${response.status}`);
  return result;
}

export function CuratedGalleryImporter() {
  const [phase, setPhase] = useState("Ready for the verified 154-image ZIP.");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<ImportStatus | null>(null);

  async function run(file: File) {
    setBusy(true);
    setProgress(0);
    setStatus(null);
    try {
      if (file.size !== CURATED_GALLERY_PACKAGE_BYTES) throw new Error("ZIP byte size does not match the approved package.");
      setPhase("Verifying complete ZIP checksum…");
      const buffer = await file.arrayBuffer();
      if (await sha256(buffer) !== CURATED_GALLERY_PACKAGE_SHA256) {
        throw new Error("ZIP SHA-256 does not match the owner-approved package.");
      }

      setPhase("Inspecting safe archive structure…");
      const entries = parseStoredZip(buffer);
      const manifestEntry = entries.get(".curated-media/manifest.json");
      const reportEntry = entries.get(".curated-media/report.json");
      if (!manifestEntry || !reportEntry) throw new Error("ZIP is missing its manifest or verification report.");
      if (await sha256(manifestEntry.bytes) !== CURATED_GALLERY_MANIFEST_SHA256) {
        throw new Error("Manifest SHA-256 does not match the approved package.");
      }
      const manifestText = new TextDecoder().decode(manifestEntry.bytes);
      const manifest: CuratedGalleryManifest = curatedGalleryManifestSchema.parse(JSON.parse(manifestText));
      const expectedPaths = new Set([
        ".curated-media/manifest.json",
        ".curated-media/report.json",
        ...manifest.records.map(archivePathForCuratedRecord),
      ]);
      if (expectedPaths.size !== CURATED_GALLERY_ARCHIVE_ENTRY_COUNT ||
          entries.size !== expectedPaths.size ||
          [...entries.keys()].some(name => !expectedPaths.has(name))) {
        throw new Error("ZIP contains missing or unexpected files.");
      }

      setPhase("Rechecking all 154 original image hashes…");
      for (const [index, record] of manifest.records.entries()) {
        const entry = entries.get(archivePathForCuratedRecord(record));
        if (!entry || entry.bytes.byteLength !== record.bytes || await sha256(entry.bytes) !== record.sha256) {
          throw new Error(`Image verification failed for ${record.id}.`);
        }
        setProgress(Math.floor(((index + 1) / CURATED_GALLERY_RECORD_COUNT) * 20));
      }

      setPhase("Initializing authenticated staging import…");
      await responseJson(await fetch("/api/admin/media/curated-gallery/start", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageSha256: CURATED_GALLERY_PACKAGE_SHA256, manifestText }),
      }));

      setPhase("Uploading unchanged originals and creating gallery-only drafts…");
      for (const [index, record] of manifest.records.entries()) {
        const entry = entries.get(archivePathForCuratedRecord(record));
        if (!entry) throw new Error(`Missing verified entry for ${record.id}.`);
        const body = new FormData();
        body.set("batch", CURATED_GALLERY_BATCH);
        body.set("recordId", record.id);
        body.set("file", new File([entry.bytes], record.originalName, { type: record.mimeType }));
        await responseJson(await fetch("/api/admin/media/curated-gallery/upload", {
          method: "POST",
          credentials: "same-origin",
          body,
        }));
        setProgress(20 + Math.floor(((index + 1) / CURATED_GALLERY_RECORD_COUNT) * 80));
        setPhase(`Imported ${index + 1} of ${CURATED_GALLERY_RECORD_COUNT} gallery images…`);
      }

      const finalStatus = await responseJson(await fetch("/api/admin/media/curated-gallery/status", {
        credentials: "same-origin",
        cache: "no-store",
      })) as ImportStatus;
      setStatus(finalStatus);
      if (finalStatus.uploaded !== CURATED_GALLERY_RECORD_COUNT ||
          finalStatus.missing !== 0 ||
          (finalStatus.mismatches?.length ?? 0) > 0 ||
          finalStatus.galleryOnly !== true) {
        throw new Error("Staging reconciliation did not account cleanly for all 154 gallery records.");
      }
      setProgress(100);
      setPhase("154 gallery originals are uploaded and attached as unpublished review records. Publication remains a separate audited step.");
    } catch (error) {
      setPhase(error instanceof Error ? error.message : "Curated gallery import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card" style={{ marginBottom: "2rem" }}>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Owner-curated gallery batch</p>
          <h2>Import the verified 154-image package</h2>
          <p className="muted">
            This staging-only intake accepts exactly the approved ZIP checksum. It uploads originals unchanged,
            creates gallery-only unpublished records, and cannot assign hero/identity/banner/thumbnail roles.
          </p>
        </div>
        <span className="status-badge">GALLERY ONLY</span>
      </div>
      <div className="field full">
        <label htmlFor="curatedGalleryZip">Verified ZIP</label>
        <input
          id="curatedGalleryZip"
          type="file"
          accept=".zip,application/zip"
          disabled={busy}
          onChange={event => {
            const file = event.currentTarget.files?.[0];
            if (file) void run(file);
          }}
        />
        <small>Expected SHA-256: {CURATED_GALLERY_PACKAGE_SHA256}</small>
      </div>
      <div style={{ marginTop: "1rem" }} aria-live="polite">
        <strong>{phase}</strong>
        <progress value={progress} max={100} style={{ width: "100%", marginTop: ".5rem" }}>{progress}%</progress>
      </div>
      {status && (
        <p className="muted" style={{ marginTop: ".75rem" }}>
          Uploaded {status.uploaded ?? 0}/{status.expected ?? CURATED_GALLERY_RECORD_COUNT} ·
          Published {status.published ?? 0} · Missing {status.missing ?? 0}
        </p>
      )}
    </section>
  );
}
