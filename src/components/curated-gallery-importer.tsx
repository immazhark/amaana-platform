"use client";

import { useEffect, useRef, useState } from "react";
import {
  CURATED_GALLERY_ARCHIVE_ENTRY_COUNT,
  CURATED_GALLERY_BATCH,
  CURATED_GALLERY_PACKAGE_BYTES,
  CURATED_GALLERY_PACKAGE_SHA256,
  CURATED_GALLERY_RECORD_COUNT,
  archivePathForCuratedRecord,
} from "@/lib/curated-gallery-identity";
import { readApprovedCuratedManifest, parseCuratedGalleryStatus, type CuratedGalleryStatus } from "@/lib/curated-gallery-browser";
import { boundedPrivateRequest } from "@/lib/bounded-private-request";
import { parseCuratedStoredZip } from "@/lib/curated-gallery-zip";

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(bytes: ArrayBuffer | Uint8Array) {
  // The file buffer and verified ZIP views are not mutated while hashing.
  // Avoid cloning the entire 147 MB package in browser memory.
  const value: BufferSource = bytes instanceof Uint8Array
    ? new Uint8Array(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength)
    : bytes;
  return hex(await crypto.subtle.digest("SHA-256", value));
}

async function responseJson(response: Response) {
  const payload: unknown = await response.json().catch(() => null);
  const value = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown> : null;
  if (!response.ok) {
    const message = typeof value?.error === "string" ? value.error.trim().slice(0, 200) : "";
    throw new Error(message || `Gallery request failed (HTTP ${response.status}).`);
  }
  if (!value) throw new Error("Gallery service returned an invalid response.");
  return value;
}

export function CuratedGalleryImporter() {
  const [phase, setPhase] = useState("Ready for the verified 154-image ZIP.");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [needsReconciliation, setNeedsReconciliation] = useState(false);
  const [status, setStatus] = useState<CuratedGalleryStatus | null>(null);
  const statusRequest = useRef(0);
  const busyRef = useRef(false);
  const lifetime = useRef<AbortController | null>(null);

  function requestJson(path: string, init: RequestInit = {}, timeoutMs = 12_000) {
    return boundedPrivateRequest(
      async signal => responseJson(await fetch(path, { ...init, credentials: "same-origin", signal })),
      timeoutMs, lifetime.current?.signal,
    );
  }

  function applyStatus(current: CuratedGalleryStatus, requestId: number) {
    if (requestId !== statusRequest.current || !lifetime.current || lifetime.current.signal.aborted) return false;
    setStatus(current);
    // Only an authoritative clean status read can permit a deliberate restart
    // after a possibly committed start/upload/publish request.
    if (current.mismatches.length === 0 && current.galleryOnly) {
      setNeedsReconciliation(false);
    }
    if (current.uploaded === CURATED_GALLERY_RECORD_COUNT && current.missing === 0 &&
        current.mismatches.length === 0 && current.galleryOnly) {
      setProgress(100);
      if (current.published === CURATED_GALLERY_RECORD_COUNT) {
        setPhase(current.renderingReady
          ? "All 154 approved gallery images are published and rendering is verified."
          : "154 gallery records published; public rendering still requires verification.");
      } else {
        setPhase(`154 approved gallery originals staged; ${current.published} published.`);
      }
    }
    return true;
  }

  async function refreshStatus() {
    const id = ++statusRequest.current;
    const current = parseCuratedGalleryStatus(await requestJson(
      "/api/admin/media/curated-gallery/status", { cache: "no-store" },
    ));
    return applyStatus(current, id) ? current : null;
  }

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    const id = ++statusRequest.current;
    void boundedPrivateRequest(
      async signal => responseJson(await fetch("/api/admin/media/curated-gallery/status", {
        credentials: "same-origin", cache: "no-store", signal,
      })),
      12_000, controller.signal,
    ).then(value => {
      if (controller.signal.aborted || id !== statusRequest.current) return;
      const current = parseCuratedGalleryStatus(value);
      setStatus(current);
      if (current.mismatches.length === 0 && current.galleryOnly) setNeedsReconciliation(false);
      if (current.uploaded === CURATED_GALLERY_RECORD_COUNT && current.missing === 0 &&
          current.mismatches.length === 0 && current.galleryOnly) {
        setProgress(100);
        setPhase(current.published === CURATED_GALLERY_RECORD_COUNT
          ? (current.renderingReady ? "All 154 approved gallery images are published." : "Public rendering requires verification.")
          : "154 gallery originals staged for publication review.");
      }
    }).catch(() => {
      // A failed initial read never grants permission to publish.
    });
    return () => {
      controller.abort();
      // Invalidate the effect's own request without reading a mutable ref
      // from cleanup; the lifetime guard separately rejects all late replies.
      statusRequest.current = id + 1;
      lifetime.current = null;
    };
  }, []);

  async function publishApprovedBatch() {
    if (busyRef.current) return;
    if (!window.confirm("Publish all 154 owner-approved gallery images now? This will not assign any hero, banner, identity or thumbnail role.")) return;
    busyRef.current = true;
    setBusy(true);
    setPhase("Rechecking gallery staging before publication…");
    let submitted = false;
    try {
      const before = await refreshStatus();
      if (!before || !before.initialized || before.uploaded !== CURATED_GALLERY_RECORD_COUNT ||
          before.missing !== 0 || before.mismatches.length !== 0 || !before.galleryOnly ||
          before.published === CURATED_GALLERY_RECORD_COUNT) {
        throw new Error("Gallery staging changed; publication was not submitted.");
      }
      submitted = true;
      await requestJson("/api/admin/media/curated-gallery/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "PUBLISH_EXACT_OWNER_CURATED_154" }),
      }, 45_000);
      const after = await refreshStatus();
      if (!after || after.published !== CURATED_GALLERY_RECORD_COUNT || !after.renderingReady) {
        throw new Error("Publication or public rendering could not yet be verified.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Curated gallery publication was not verified.";
      if (submitted && lifetime.current && !lifetime.current.signal.aborted) setNeedsReconciliation(true);
      setPhase(submitted
        ? `${message} Check status before retrying; publication may have completed.`
        : message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function run(file: File) {
    if (busyRef.current || needsReconciliation) return;
    busyRef.current = true;
    ++statusRequest.current;
    setBusy(true);
    setProgress(0);
    setStatus(null);
    let started = false;
    const activeController = lifetime.current;
    const ensureActive = () => {
      if (!activeController || activeController.signal.aborted || lifetime.current !== activeController) {
        throw new Error("Gallery import cancelled.");
      }
    };
    try {
      if (file.size !== CURATED_GALLERY_PACKAGE_BYTES) throw new Error("ZIP byte size does not match the approved package.");
      setPhase("Verifying complete ZIP checksum…");
      const buffer = await file.arrayBuffer();
      ensureActive();
      if (await sha256(buffer) !== CURATED_GALLERY_PACKAGE_SHA256) {
        throw new Error("ZIP SHA-256 does not match the owner-approved package.");
      }

      setPhase("Inspecting safe archive structure…");
      const entries = parseCuratedStoredZip(buffer);
      const manifestEntry = entries.get(".curated-media/manifest.json");
      const reportEntry = entries.get(".curated-media/report.json");
      if (!manifestEntry || !reportEntry) throw new Error("ZIP is missing its manifest or verification report.");
      const { manifest, manifestText } = await readApprovedCuratedManifest(manifestEntry.bytes);
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
        ensureActive();
        const entry = entries.get(archivePathForCuratedRecord(record));
        if (!entry || entry.bytes.byteLength !== record.bytes || await sha256(entry.bytes) !== record.sha256) {
          throw new Error(`Image verification failed for ${record.id}.`);
        }
        setProgress(Math.floor(((index + 1) / CURATED_GALLERY_RECORD_COUNT) * 20));
      }

      ensureActive();
      setPhase("Initializing authenticated staging import…");
      started = true;
      await requestJson("/api/admin/media/curated-gallery/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageSha256: CURATED_GALLERY_PACKAGE_SHA256, manifestText }),
      }, 25_000);

      setPhase("Uploading unchanged originals and creating gallery-only drafts…");
      for (const [index, record] of manifest.records.entries()) {
        ensureActive();
        const entry = entries.get(archivePathForCuratedRecord(record));
        if (!entry) throw new Error(`Missing verified entry for ${record.id}.`);
        const uploadBuffer = new ArrayBuffer(entry.bytes.byteLength);
        new Uint8Array(uploadBuffer).set(entry.bytes);
        const body = new FormData();
        body.set("batch", CURATED_GALLERY_BATCH);
        body.set("recordId", record.id);
        body.set("file", new File([uploadBuffer], record.originalName, { type: record.mimeType }));
        await requestJson("/api/admin/media/curated-gallery/upload", {
          method: "POST", body,
        }, 90_000);
        setProgress(20 + Math.floor(((index + 1) / CURATED_GALLERY_RECORD_COUNT) * 80));
        setPhase(`Imported ${index + 1} of ${CURATED_GALLERY_RECORD_COUNT} gallery images…`);
      }

      ensureActive();
      const finalStatus = await refreshStatus();
      if (!finalStatus || finalStatus.uploaded !== CURATED_GALLERY_RECORD_COUNT ||
          finalStatus.missing !== 0 ||
          finalStatus.mismatches.length > 0 ||
          finalStatus.galleryOnly !== true) {
        throw new Error("Staging reconciliation did not account cleanly for all 154 gallery records.");
      }
      setProgress(100);
      setPhase("154 gallery originals are uploaded and attached as unpublished review records. Publication remains a separate audited step.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Curated gallery import failed.";
      if (started && lifetime.current && !lifetime.current.signal.aborted) setNeedsReconciliation(true);
      setPhase(started ? `${message} Progress may have changed on the server; check status before restarting.` : message);
    } finally {
      busyRef.current = false;
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
          disabled={busy || needsReconciliation}
          aria-describedby="curatedGalleryZipInstructions"
          onChange={event => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void run(file);
          }}
        />
        <small id="curatedGalleryZipInstructions">Expected SHA-256: {CURATED_GALLERY_PACKAGE_SHA256}. If a request fails after staging begins, check server status before selecting the package again.</small>
      </div>
      <div style={{ marginTop: "1rem" }} aria-live="polite">
        <strong>{phase}</strong>
        <progress value={progress} max={100} aria-label="Gallery import progress" style={{ width: "100%", marginTop: ".5rem" }}>{progress}%</progress>
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
      {status && (
        <>
          <p className="muted" style={{ marginTop: ".75rem" }}>
            Uploaded {status.uploaded ?? 0}/{status.expected ?? CURATED_GALLERY_RECORD_COUNT} ·
            Published {status.published ?? 0} · Missing {status.missing ?? 0} ·
            Mismatches {status.mismatches.length} ·
            Public render {status.renderingReady === true ? "22/22 verified" : status.renderingReady === false ? "requires review" : "checking"}
          </p>
          {(status.mismatches.length > 0 || !status.galleryOnly) && (
            <p role="alert" className="muted">
              Gallery records differ from the approved package or include an invalid gallery role.
              Publication is blocked until these records are reviewed.
            </p>
          )}
          {status.initiatives?.length ? (
            <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Gallery import records" style={{ marginTop: "1rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Initiative</th>
                    <th>Expected</th>
                    <th>Uploaded</th>
                    <th>Published</th>
                    <th>Public gallery</th>
                    <th>Hero lock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {status.initiatives.map(item => (
                    <tr key={item.slug}>
                      <td>
                        <a href={`/our-work/${item.slug}`} target="_blank" rel="noreferrer">
                          {item.slug}
                        </a>
                      </td>
                      <td>{item.expected}</td>
                      <td>{item.uploaded}</td>
                      <td>{item.published}</td>
                      <td>{item.galleryVisibleCount}</td>
                      <td>{item.curatedHeroSelected || item.curatedHighlightSelected ? "FAIL" : "Locked"}</td>
                      <td><span className="status-badge">{item.ready ? "PASS" : "CHECK"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {!needsReconciliation && status.initialized && status.uploaded === CURATED_GALLERY_RECORD_COUNT &&
           status.published !== CURATED_GALLERY_RECORD_COUNT &&
           status.missing === 0 &&
           (status.mismatches?.length ?? 0) === 0 &&
           status.galleryOnly === true && (
            <div style={{ marginTop: "1rem" }}>
              <button type="button" className="button" disabled={busy} onClick={() => void publishApprovedBatch()}>
                Publish all 154 approved gallery images
              </button>
              <p className="muted" style={{ marginTop: ".5rem" }}>
                Uses the exact verified batch only. Hero, identity, banner and thumbnail assignments remain untouched.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
