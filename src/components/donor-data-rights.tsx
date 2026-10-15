"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DONOR_RIGHTS_KINDS, DONOR_RIGHTS_LABELS, isDonorRightsKind, isDonorRightsStatus,
  type DonorRightsKind, type DonorRightsStatus,
} from "@/lib/donor-rights";
import { boundedPrivateRequest } from "@/lib/bounded-private-request";
import styles from "./donor-data-rights.module.css";

type RequestState = { kind: DonorRightsKind; status: DonorRightsStatus; requestedAt: string };
function isRequest(value: unknown): value is RequestState {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return isDonorRightsKind(row.kind) && isDonorRightsStatus(row.status) &&
    typeof row.requestedAt === "string" && Number.isFinite(Date.parse(row.requestedAt));
}
function isStatusResponse(value: unknown): value is { requests: RequestState[] } {
  if (!value || typeof value !== "object") return false;
  const rows = (value as Record<string, unknown>).requests;
  return Array.isArray(rows) && rows.length <= DONOR_RIGHTS_KINDS.length && rows.every(isRequest) &&
    new Set(rows.map(row => row.kind)).size === rows.length;
}

export function DonorDataRights(props: { reference: string; getToken: () => string | null }) {
  return <ReceiptDataRights key={props.reference} {...props}/>;
}

function ReceiptDataRights({ reference, getToken }: {
  reference: string; getToken: () => string | null;
}) {
  const [kind, setKind] = useState<DonorRightsKind>("ACCESS");
  const [requests, setRequests] = useState<RequestState[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const busyRef = useRef(false);
  const lifetime = useRef<AbortController | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const request = useCallback(async (action: "status" | "request", selected?: DonorRightsKind, signal?: AbortSignal) => {
    const token = getToken();
    if (!token) throw new Error("Your private acknowledgement credential is unavailable.");
    return boundedPrivateRequest(async boundedSignal => {
      const response = await fetch("/api/donations/data-rights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store", signal: boundedSignal,
        body: JSON.stringify({
          action, reference, token, ...(action === "request" ? { kind: selected } : {}),
        }),
      });
      if (!response.ok) throw new Error(response.status === 429
        ? "Too many attempts. Try again later."
        : "The request service is unavailable. Your donation is unaffected.");
      return response.json() as Promise<unknown>;
    }, action === "status" ? 8_000 : 15_000, signal);
  }, [getToken, reference]);

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    void request("status", undefined, controller.signal).then(result => {
      if (!isStatusResponse(result)) throw new Error("Unexpected private response");
      if (!controller.signal.aborted) { setRequests(result.requests); setNeedsRefresh(false); }
    }).catch(() => {
      if (!controller.signal.aborted) { setError("The private request status could not be loaded. Check status to try again."); setNeedsRefresh(true); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [request, attempt]);

  async function submit() {
    if (busyRef.current || loading || needsRefresh || !lifetime.current || lifetime.current.signal.aborted) return;
    const signal = lifetime.current.signal;
    busyRef.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const result = await request("request", kind, signal);
      if (signal.aborted) return;
      if (!result || typeof result !== "object") throw new Error();
      const row = result as Record<string, unknown>;
      if (row.kind !== kind || !isDonorRightsStatus(row.status) ||
          typeof row.requestedAt !== "string" || !Number.isFinite(Date.parse(row.requestedAt))) {
        throw new Error();
      }
      setRequests(previous => [
        { kind, status: row.status as DonorRightsStatus, requestedAt: row.requestedAt as string },
        ...previous.filter(item => item.kind !== kind),
      ]);
      setNotice("Your donation-specific request has been recorded for staff review. No payment or personal record was changed.");
    } catch {
      if (!signal.aborted) {
        setNeedsRefresh(true);
        setError("We could not confirm whether your request was recorded. Check status before submitting again, or contact Amaana privately.");
      }
    } finally {
      if (!signal.aborted) { busyRef.current = false; setBusy(false); }
    }
  }

  return <section className={styles.panel} aria-label="Private donor information requests">
    <h3>Questions about your donation information</h3>
    <p>Use your private receipt to request access, correction or a deletion/retention review for <strong>this donation only</strong>. This does not identify every donation linked to your email or automatically release or erase accounting information.</p>
    <label className={styles.field}>Choose a request
      <select disabled={loading || busy || needsRefresh} value={kind} onChange={event => {
        if (isDonorRightsKind(event.target.value)) setKind(event.target.value);
      }}>
        {DONOR_RIGHTS_KINDS.map(option => <option key={option} value={option}>{DONOR_RIGHTS_LABELS[option]}</option>)}
      </select>
    </label>
    <button className="v2-button" type="button" disabled={loading || busy || needsRefresh}
      onClick={() => void submit()}>{busy ? "Recording request…" : "Submit private review request"}</button>
    {needsRefresh && !loading && <button className="text-button" type="button" onClick={() => {
      setLoading(true); setError(""); setNotice(""); setAttempt(value => value + 1);
    }}>Check status</button>}
    {loading && <p role="status">Loading this receipt&apos;s request status…</p>}
    {!!requests.length && <div className={styles.history}>
      <h4>Latest request status for this donation</h4>
      <ul>{requests.map(item => <li key={item.kind}>
        <strong>{DONOR_RIGHTS_LABELS[item.kind]}</strong>
        <span>{item.status === "OPEN" ? "Received" : item.status === "IN_REVIEW" ? "In staff review" : "Review closed"}</span>
      </li>)}</ul>
    </div>}
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert">{error}</p>}
    <p className={styles.caution}>No response deadline or deletion outcome is promised here. Applicable payment, accounting, audit and safeguarding retention rules may limit changes. Do not share receipt tokens, documents or account details in a public review; contact Amaana through the privacy notice if you need help.</p>
  </section>;
}
