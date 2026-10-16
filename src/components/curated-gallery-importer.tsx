"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CURATED_GALLERY_ARCHIVE_ENTRY_COUNT as ARCHIVE_COUNT,
  CURATED_GALLERY_BATCH as BATCH,
  CURATED_GALLERY_PACKAGE_BYTES as PACKAGE_BYTES,
  CURATED_GALLERY_PACKAGE_SHA256 as PACKAGE_HASH,
  CURATED_GALLERY_RECORD_COUNT as TOTAL,
  archivePathForCuratedRecord,
} from "@/lib/curated-gallery-identity";
import { parseCuratedGalleryStatus, readApprovedCuratedManifest, type CuratedGalleryStatus } from "@/lib/curated-gallery-browser";
import { boundedPrivateRequest } from "@/lib/bounded-private-request";
import { parseCuratedStoredZip } from "@/lib/curated-gallery-zip";

const endpoint = "/api/admin/media/curated-gallery/";
const verified = (status: CuratedGalleryStatus) =>
  status.initialized && status.uploaded === TOTAL && status.missing === 0 &&
  status.mismatches.length === 0 && status.galleryOnly;

async function hash(bytes: ArrayBuffer | Uint8Array) {
  const input: BufferSource = bytes instanceof Uint8Array
    ? new Uint8Array(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength)
    : bytes;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
  return Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("");
}

async function galleryRequest(
  path: string, init: RequestInit, lifetime: AbortSignal | undefined, timeout = 12_000,
) {
  return boundedPrivateRequest(async signal => {
    const response = await fetch(endpoint + path, { ...init, credentials: "same-origin", signal });
    const payload: unknown = await response.json().catch(() => null);
    const data = payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload as Record<string, unknown> : null;
    if (!response.ok) {
      const reason = typeof data?.error === "string" ? data.error.trim().slice(0, 200) : "";
      throw new Error(reason || `Gallery request failed (HTTP ${response.status}).`);
    }
    if (!data) throw new Error("Gallery service returned an invalid response.");
    return data;
  }, timeout, lifetime);
}

export function CuratedGalleryImporter() {
  const [phase, setPhase] = useState("Ready for the verified 154-image ZIP.");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [needsReconciliation, setNeedsReconciliation] = useState(false);
  const [status, setStatus] = useState<CuratedGalleryStatus | null>(null);
  const generation = useRef(0);
  const locked = useRef(false);
  const uncertain = useRef<"import" | "publish" | null>(null);
  const lifetime = useRef<AbortController | null>(null);

  const applyStatus = useCallback((current: CuratedGalleryStatus, id: number) => {
    if (id !== generation.current || !lifetime.current || lifetime.current.signal.aborted) return false;
    setStatus(current);
    // A missing session can release an interrupted import, never an uncertain publication.
    if ((!current.initialized && uncertain.current !== "publish") ||
        (current.initialized && current.galleryOnly && current.mismatches.length === 0)) {
      uncertain.current = null;
      setNeedsReconciliation(false);
    }
    if (verified(current)) {
      setProgress(100);
      setPhase(current.published === TOTAL
        ? (current.renderingReady
          ? "All 154 approved gallery images are published and rendering is verified."
          : "154 gallery records published; public rendering still requires verification.")
        : `154 approved gallery originals staged; ${current.published} published.`);
    }
    return true;
  }, []);

  const refreshStatus = useCallback(async () => {
    const id = ++generation.current;
    setStatus(null); // An old status must not authorize publication during a fresh read.
    const response = await galleryRequest("status", { cache: "no-store" }, lifetime.current?.signal);
    const current = parseCuratedGalleryStatus(response);
    return applyStatus(current, id) ? current : null;
  }, [applyStatus]);

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    void refreshStatus().catch(() => {
      if (!controller.signal.aborted) {
        setStatus(null);
        setPhase("Gallery staging status is unavailable. Use Check status to retry the read.");
      }
    });
    return () => { controller.abort(); lifetime.current = null; };
  }, [refreshStatus]);

  const request = (path: string, init: RequestInit, timeout?: number) =>
    galleryRequest(path, init, lifetime.current?.signal, timeout);

  async function publishApprovedBatch() {
    if (locked.current || !window.confirm(
      "Publish all 154 owner-approved gallery images now? This will not assign any hero, banner, identity or thumbnail role.",
    )) return;
    locked.current = true;
    setBusy(true);
    setPhase("Rechecking gallery staging before publication…");
    let submitted = false;
    try {
      const before = await refreshStatus();
      if (!before || !verified(before) || before.published === TOTAL) {
        throw new Error("Gallery staging changed; publication was not submitted.");
      }
      submitted = true;
      await request("publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "PUBLISH_EXACT_OWNER_CURATED_154" }),
      }, 45_000);
      const after = await refreshStatus();
      if (!after || after.published !== TOTAL || !after.renderingReady) {
        throw new Error("Publication or public rendering could not yet be verified.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Curated gallery publication was not verified.";
      if (submitted && !lifetime.current?.signal.aborted) {
        uncertain.current = "publish";
        setNeedsReconciliation(true);
      }
      setPhase(submitted
        ? `${message} Check status before retrying; publication may have completed.` : message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  async function run(file: File) {
    if (locked.current || needsReconciliation) return;
    locked.current = true;
    ++generation.current;
    setBusy(true);
    setProgress(0);
    setStatus(null);
    let started = false;
    const controller = lifetime.current;
    const active = () => {
      if (!controller || controller.signal.aborted || controller !== lifetime.current) {
        throw new Error("Gallery import cancelled.");
      }
    };
    try {
      if (file.size !== PACKAGE_BYTES) throw new Error("ZIP byte size does not match the approved package.");
      setPhase("Verifying complete ZIP checksum…");
      const buffer = await file.arrayBuffer();
      active();
      if (await hash(buffer) !== PACKAGE_HASH) throw new Error("ZIP SHA-256 does not match the owner-approved package.");

      setPhase("Inspecting safe archive structure…");
      const entries = parseCuratedStoredZip(buffer);
      const manifestEntry = entries.get(".curated-media/manifest.json");
      if (!manifestEntry || !entries.has(".curated-media/report.json")) {
        throw new Error("ZIP is missing its manifest or verification report.");
      }
      const { manifest, manifestText } = await readApprovedCuratedManifest(manifestEntry.bytes);
      const paths = new Set([
        ".curated-media/manifest.json", ".curated-media/report.json",
        ...manifest.records.map(archivePathForCuratedRecord),
      ]);
      if (paths.size !== ARCHIVE_COUNT || entries.size !== paths.size ||
          [...entries.keys()].some(name => !paths.has(name))) {
        throw new Error("ZIP contains missing or unexpected files.");
      }

      setPhase("Rechecking all 154 original image hashes…");
      for (const [index, record] of manifest.records.entries()) {
        active();
        const entry = entries.get(archivePathForCuratedRecord(record));
        if (!entry || entry.bytes.byteLength !== record.bytes || await hash(entry.bytes) !== record.sha256) {
          throw new Error(`Image verification failed for ${record.id}.`);
        }
        setProgress(Math.floor(((index + 1) / TOTAL) * 20));
      }

      active();
      setPhase("Initializing authenticated staging import…");
      started = true;
      await request("start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageSha256: PACKAGE_HASH, manifestText }),
      }, 25_000);

      setPhase("Uploading unchanged originals and creating gallery-only drafts…");
      for (const [index, record] of manifest.records.entries()) {
        active();
        const entry = entries.get(archivePathForCuratedRecord(record));
        if (!entry) throw new Error(`Missing verified entry for ${record.id}.`);
        const imageBytes = new Uint8Array(
          entry.bytes.buffer as ArrayBuffer, entry.bytes.byteOffset, entry.bytes.byteLength,
        );
        const body = new FormData();
        body.set("batch", BATCH);
        body.set("recordId", record.id);
        body.set("file", new File([imageBytes], record.originalName, { type: record.mimeType }));
        await request("upload", { method: "POST", body }, 90_000);
        setProgress(20 + Math.floor(((index + 1) / TOTAL) * 80));
        setPhase(`Imported ${index + 1} of ${TOTAL} gallery images…`);
      }

      active();
      const final = await refreshStatus();
      if (!final || !verified(final)) {
        throw new Error("Staging reconciliation did not account cleanly for all 154 gallery records.");
      }
      setProgress(100);
      setPhase("154 gallery originals are uploaded and attached as unpublished review records. Publication remains a separate audited step.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Curated gallery import failed.";
      if (started && !lifetime.current?.signal.aborted) {
        uncertain.current = "import";
        setNeedsReconciliation(true);
      }
      setPhase(started
        ? `${message} Progress may have changed on the server; check status before restarting.` : message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="admin-card" style={{ marginBottom: "2rem" }}>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Owner-curated gallery batch</p>
          <h2>Import the verified 154-image package</h2>
          <p className="muted">This staging-only intake accepts exactly the approved ZIP checksum.
            It uploads originals unchanged, creates gallery-only unpublished records,
            and cannot assign hero/identity/banner/thumbnail roles.</p>
        </div>
        <span className="status-badge">GALLERY ONLY</span>
      </div>
      <div className="field full">
        <label htmlFor="curatedGalleryZip">Verified ZIP</label>
        <input id="curatedGalleryZip" type="file" accept=".zip,application/zip"
          disabled={busy || needsReconciliation} aria-describedby="curatedGalleryZipInstructions"
          onChange={event => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void run(file);
          }} />
        <small id="curatedGalleryZipInstructions">
          Expected SHA-256: {PACKAGE_HASH}. If a request fails after staging begins,
          check server status before selecting the package again.
        </small>
      </div>
      <div style={{ marginTop: "1rem" }} aria-live="polite">
        <strong>{phase}</strong>
        <progress value={progress} max={100} aria-label="Gallery import progress"
          style={{ width: "100%", marginTop: ".5rem" }}>{progress}%</progress>
      </div>
      {needsReconciliation && <p role="alert" className="muted" style={{ marginTop: ".75rem" }}>
        Import or publication may have changed on the server. Check status before retrying.
      </p>}
      <button type="button" className="button secondary" disabled={busy}
        onClick={() => void refreshStatus().catch(error => setPhase(
          error instanceof Error ? error.message : "Gallery status could not be verified.",
        ))} style={{ marginTop: ".75rem" }}>
        Check import and publication status
      </button>
      {status && <>
        <p className="muted" style={{ marginTop: ".75rem" }}>
          Uploaded {status.uploaded}/{status.expected} · Published {status.published} ·
          Missing {status.missing} · Mismatches {status.mismatches.length} ·
          Public render {status.renderingReady ? "22/22 verified" : "requires review"}
        </p>
        {(status.mismatches.length > 0 || !status.galleryOnly) && (
          <p role="alert" className="muted">
            Gallery records differ from the approved package or include an invalid gallery role.
            Publication is blocked until these records are reviewed.
          </p>
        )}
        {status.initiatives.length > 0 && (
          <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Gallery import records"
            style={{ marginTop: "1rem" }}>
            <table>
              <thead><tr>
                <th>Initiative</th><th>Expected</th><th>Uploaded</th><th>Published</th>
                <th>Public gallery</th><th>Hero lock</th><th>Status</th>
              </tr></thead>
              <tbody>{status.initiatives.map(item => (
                <tr key={item.slug}>
                  <td><a href={`/our-work/${item.slug}`} target="_blank" rel="noreferrer">{item.slug}</a></td>
                  <td>{item.expected}</td><td>{item.uploaded}</td><td>{item.published}</td>
                  <td>{item.galleryVisibleCount}</td>
                  <td>{item.curatedHeroSelected || item.curatedHighlightSelected ? "FAIL" : "Locked"}</td>
                  <td><span className="status-badge">{item.ready ? "PASS" : "CHECK"}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {!needsReconciliation && verified(status) && status.published !== TOTAL && (
          <div style={{ marginTop: "1rem" }}>
            <button type="button" className="button" disabled={busy}
              onClick={() => void publishApprovedBatch()}>
              Publish all 154 approved gallery images
            </button>
            <p className="muted" style={{ marginTop: ".5rem" }}>
              Uses the exact verified batch only. Hero, identity, banner and thumbnail assignments remain untouched.
            </p>
          </div>
        )}
      </>}
    </section>
  );
}
