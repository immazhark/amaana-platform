"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { DONOR_RECOGNITION_MAX_NAME, parseDonorRecognitionName } from "@/lib/donor-recognition";
import { boundedPrivateRequest } from "@/lib/bounded-private-request";
import styles from "./donor-recognition-preferences.module.css";

type State = "loading" | "inactive" | "pending" | "published" | "unavailable" | "error";
type ResponseBody = { state: "inactive" | "pending" | "published" | "unavailable"; name: string; revocable: boolean };

function isValidReply(value: unknown): value is ResponseBody {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.state === "string"
    && ["inactive", "pending", "published", "unavailable"].includes(row.state)
    && typeof row.name === "string" && row.name.length <= DONOR_RECOGNITION_MAX_NAME
    && typeof row.revocable === "boolean";
}

/** Receipt capability is only transmitted in same-origin POST bodies. */
export function DonorRecognitionPreferences(props: { reference: string; getToken: () => string | null }) {
  return <ReceiptRecognitionPreferences key={props.reference} {...props}/>;
}

function ReceiptRecognitionPreferences({ reference, getToken }: {
  reference: string; getToken: () => string | null;
}) {
  const [state, setState] = useState<State>("loading");
  const [name, setName] = useState("");
  const [revocable, setRevocable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  const lifetime = useRef<AbortController | null>(null);
  const [attempt, setAttempt] = useState(0);
  const communicate = useCallback(async (
    action: "status" | "request" | "withdraw", displayName?: string, signal?: AbortSignal,
  ): Promise<ResponseBody> => {
    const token = getToken();
    if (!token) throw new Error("The private acknowledgement token is unavailable.");
    return boundedPrivateRequest(async boundedSignal => {
      const response = await fetch("/api/donations/recognition", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reference, token, ...(action === "request" ? { name: displayName } : {}) }),
        cache: "no-store", signal: boundedSignal,
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isValidReply(payload)) throw new Error(
        response.status === 429 ? "Too many requests. Try again later."
        : response.status === 409 ? "Your donation or recognition preferences changed. Refresh your private receipt before trying again."
        : "Recognition preferences are temporarily unavailable.",
      );
      return payload;
    }, action === "status" ? 8_000 : 15_000, signal);
  }, [reference, getToken]);

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    void communicate("status", undefined, controller.signal).then(reply => {
      if (!controller.signal.aborted) { setState(reply.state); setName(reply.name); setRevocable(reply.revocable); }
    }).catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, [communicate, attempt]);

  async function act(action: "request" | "withdraw", event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (locked.current || state === "loading" || state === "error" || !lifetime.current || lifetime.current.signal.aborted) return;
    const signal = lifetime.current.signal;
    setError("");
    const prepared = action === "request" ? parseDonorRecognitionName(name) : null;
    if (action === "request" && !prepared) {
      setError("Enter a short name without contact details, account information or website addresses.");
      return;
    }
    locked.current = true; setBusy(true);
    try {
      const result = await communicate(action, prepared ?? undefined, signal);
      if (signal.aborted) return;
      setState(result.state);
      setName(result.name);
      setRevocable(result.revocable);
    } catch {
      if (!signal.aborted) {
        setState("error"); setRevocable(false);
        setError("We could not confirm whether your recognition preference changed. Check status before making another change, or contact Amaana privately.");
      }
    } finally { if (!signal.aborted) { locked.current = false; setBusy(false); } }
  }

  return <section className={styles.panel} aria-label="Optional donor Shukr recognition">
    <h3>Optional Shukr recognition</h3>
    <p>Every donation is valued, including anonymous support. No name is published merely because you gave. A separate request and staff review are required, and you may withdraw later using this private acknowledgement.</p>
    {state === "loading" && <p role="status">Checking recognition preferences…</p>}
    {state === "error" && <p role="alert">{error || "Recognition preferences could not be retrieved. Check status to try again. Your donation is unaffected."}</p>}
    {state === "unavailable" && <p>Public name recognition is unavailable for this record. Your private receipt remains unaffected. You may still withdraw a past request below.</p>}
    {(state === "pending" || state === "published") && <p role="status">
      <strong>{state === "pending" ? "Awaiting staff review" : "Name approved for public display"}:</strong> {name}
    </p>}
    {state === "error" && <button className={styles.withdraw} type="button" onClick={() => {
      setState("loading"); setError(""); setAttempt(value => value + 1);
    }}>Check status</button>}
    {revocable && state !== "error" && state !== "loading" && <button className={styles.withdraw} type="button" disabled={busy}
      onClick={() => void act("withdraw")}>Withdraw recognition request/name</button>}
    {state === "inactive" && <form onSubmit={event => void act("request", event)}>
      <label>Display name (optional)
        <input disabled={busy} value={name} onChange={event => setName(event.target.value)}
          maxLength={DONOR_RECOGNITION_MAX_NAME} autoComplete="off" placeholder="Name to display if approved"
          aria-describedby="recognition-name-help"/>
      </label>
      <p id="recognition-name-help">Use only a name you freely choose to show. Do not enter email, phone, payment reference, beneficiary details or other sensitive information.</p>
      <button className="v2-button" type="submit" disabled={busy}>Request name recognition</button>
    </form>}
    {error && state !== "error" && <p role="alert">{error}</p>}
    <p className={styles.privacy}>Your choice has no effect on donation processing, receipts or assistance. Staff may reject a request; approved names appear without amounts or transaction details. Withdrawing removes permission for continued display.</p>
  </section>;
}
