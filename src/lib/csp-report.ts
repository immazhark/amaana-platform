export const MAX_CSP_REPORT_BYTES = 4096;
const directives = new Set(["script-src", "script-src-elem", "script-src-attr"]);

type Diagnostic = { directive: string; source: "inline" | "eval" | "same-origin" | "razorpay" | "other" };

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function configuredCspReportOrigin(value: string | undefined, allowLoopback = false): string | null {
  try {
    const url = new URL(value?.trim() ?? "");
    if (url.username || url.password) return null;
    if (url.protocol !== "https:" && !(allowLoopback && url.protocol === "http:"
      && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) return null;
    return url.origin;
  } catch { return null; }
}

/** Construct a new coarse record; never copy URLs, tokens, selectors, source
 * text, referrers, policy strings or user agents from untrusted browser JSON.
 */
export function summarizeCspReports(payload: unknown, origin: string): Diagnostic[] {
  const reports = Array.isArray(payload) ? payload.slice(0, 3).filter(item => record(item) && item.type === "csp-violation").map(item => item.body)
    : record(payload) ? [payload["csp-report"]] : [];
  const output: Diagnostic[] = [];
  for (const body of reports) {
    if (!record(body) || body.disposition !== "report") continue;
    const directive = body["effective-directive"] ?? body.effectiveDirective;
    const documentUrl = body["document-uri"] ?? body.documentURL;
    const blocked = body["blocked-uri"] ?? body.blockedURL;
    if (typeof directive !== "string" || !directives.has(directive) || typeof documentUrl !== "string" || typeof blocked !== "string") continue;
    try { if (new URL(documentUrl).origin !== origin) continue; } catch { continue; }
    let source: Diagnostic["source"] = "other";
    if (blocked === "inline" || blocked === "eval") source = blocked;
    else {
      try {
        const blockedOrigin = new URL(blocked).origin;
        if (blockedOrigin === origin) source = "same-origin";
        else if (["https://checkout.razorpay.com", "https://api.razorpay.com"].includes(blockedOrigin)) source = "razorpay";
      } catch { /* Unrecognized sources stay coarse. */ }
    }
    output.push({ directive, source });
  }
  return output;
}

/** Per-instance diagnostic budget, not an authentication/security rate limit.
 * No identifiers or database counters; untrusted reports are never proof of attack.
 */
export function createCspReportBudget() {
  let start = 0;
  let used = 0;
  return (now = Date.now()) => {
    if (now - start >= 60_000 || now < start) { start = now; used = 0; }
    if (used >= 20) return false;
    used += 1;
    return true;
  };
}
