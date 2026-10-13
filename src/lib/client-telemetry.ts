/** Noncritical first-party telemetry; rejection must never break a page transition. */
export type TelemetryTransport = {
  beacon?: (endpoint: string, body: Blob) => boolean;
  post: (endpoint: string, options: RequestInit) => Promise<unknown>;
};

export function sendBestEffortTelemetry(
  endpoint: `/api/analytics/${string}`,
  payload: Readonly<Record<string, string | number>>,
  transport: TelemetryTransport,
): void {
  const body = JSON.stringify(payload);
  try {
    if (transport.beacon?.(endpoint, new Blob([body], { type: "application/json" }))) return;
  } catch {
    // Some privacy extensions throw on Beacon access/use; fall back to fetch.
  }
  try {
    void transport.post(endpoint, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {
      // Telemetry is best effort; no navigation or donation flow may depend on it.
    });
  } catch {
    // A synchronous transport failure must be equally nonfatal.
  }
}
