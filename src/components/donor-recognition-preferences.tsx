"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { DONOR_RECOGNITION_MAX_NAME, parseDonorRecognitionName } from "@/lib/donor-recognition";
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
export function DonorRecognitionPreferences({ reference, getToken }: {
  reference: string; getToken: () => string | null;
}) {
  const [state, setState] = useState<State>("loading");
  const [name, setName] = useState("");
  const [revocable, setRevocable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const communicate = useCallback(async (
    action: "status" | "request" | "withdraw", displayName?: string, signal?: AbortSignal,
  ): Promise<ResponseBody> => {
    const token = getToken();
    if (!token) throw new Error("The private acknowledgement token is unavailable.");
    const response = await fetch("/api/donations/recognition", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reference, token, ...(action === "request" ? { name: displayName } : {}) }),
      cache: "no-store", signal,
    });
    const payload: unknown = await response.json();
    if (!response.ok || !isValidReply(payload)) throw new Error(
      response.status === 429 ? "Too many requests. Try again later."
      : response.status === 409 ? "Donation eligibility changed. Reopen your private record before trying again."
      : "Recognition preferences are temporarily unavailable.",
    );
    return payload;
  }, [reference, getToken]);

  useEffect(() => {
    const controller = new AbortController();
    void communicate("status", undefined, controller.signal).then(reply => {
      if (!controller.signal.aborted) { setState(reply.state); setName(reply.name); setRevocable(reply.revocable); }
    }).catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, [communicate]);

  async function act(action: "request" | "withdraw", event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (busy) return;
    setError("");
    const prepared = action === "request" ? parseDonorRecognitionName(name) : null;
    if (action === "request" && !prepared) {
      setError("Enter a short name without contact details, account information or website addresses.");
      return;
    }
    setBusy(true);
    try {
      const result = await communicate(action, prepared ?? undefined);
      setState(result.state);
      setName(result.name);
      setRevocable(result.revocable);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to update recognition. Try again.");
    } finally { setBusy(false); }
  }

  return <section className={styles.panel} aria-label="Optional donor Shukr recognition">
    <h3>Optional Shukr recognition</h3>
    <p>Every donation is valued, including anonymous support. No name is published merely because you gave. A separate request and staff review are required, and you may withdraw later using this private acknowledgement.</p>
    {state === "loading" && <p role="status">Checking recognition preferences…</p>}
    {state === "error" && <p role="alert">Recognition preferences could not be retrieved. Your donation is unaffected. Contact Amaana privately for help.</p>}
    {state === "unavailable" && <p>Public name recognition is unavailable for this record. Your private receipt remains unaffected. You may still withdraw a past request below.</p>}
    {(state === "pending" || state === "published") && <p role="status">
      <strong>{state === "pending" ? "Awaiting staff review" : "Name approved for public display"}:</strong> {name}
    </p>}
    {revocable && <button className={styles.withdraw} type="button" disabled={busy}
      onClick={() => void act("withdraw")}>Withdraw recognition request/name</button>}
    {state === "inactive" && <form onSubmit={event => void act("request", event)}>
      <label>Display name (optional)
        <input value={name} onChange={event => setName(event.target.value)}
          maxLength={DONOR_RECOGNITION_MAX_NAME} autoComplete="off" placeholder="Name to display if approved"
          aria-describedby="recognition-name-help"/>
      </label>
      <p id="recognition-name-help">Use only a name you freely choose to show. Do not enter email, phone, payment reference, beneficiary details or other sensitive information.</p>
      <button className="v2-button" type="submit" disabled={busy}>Request name recognition</button>
    </form>}
    {error && <p role="alert">{error}</p>}
    <p className={styles.privacy}>Your choice has no effect on donation processing, receipts or assistance. Staff may reject a request; approved names appear without amounts or transaction details. Withdrawing removes permission for continued display.</p>
  </section>;
}
