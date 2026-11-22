import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RejectionNotice } from "@/lib/assistance-rejection";
import { RejectRequestForm } from "./reject-request-form";

const props = { action: () => undefined, requestId: "req-1", referenceNumber: "AF-2026-123456", requestVersion: "2026-11-22T04:00:00.000Z", verificationVersion: "" };
type ErrorNotice = Extract<RejectionNotice, { kind: "error" }>;
const view = (notice: ErrorNotice | null = null, draftReason = "") => renderToStaticMarkup(<RejectRequestForm {...props} notice={notice} draftReason={draftReason} />);

describe("initial form", () => {
  const html = view();

  it("asks for exactly a reason and a confirmation, labelled, with requiredness stated in words", () => {
    expect(html).toContain('for="reject-reason">Reason for rejection');
    expect(html).toContain("Required to reject");
    expect(html).toMatch(/<textarea[^>]*id="reject-reason"[^>]*name="reason"/);
    expect(html).toMatch(/<input[^>]*id="reject-confirm"[^>]*type="checkbox"[^>]*name="confirmRejection"/);
    expect(html).toContain("I confirm I am rejecting request AF-2026-123456");
    expect(html).toContain("Confirm rejection");
  });

  it("carries no approval field of any kind, so none can block or travel with a rejection", () => {
    const names = [...html.matchAll(/\bname="([^"]+)"/g)].map(match => match[1]).sort();
    expect(names).toEqual(["confirmRejection", "expectedRequestUpdatedAt", "expectedVerificationUpdatedAt", "id", "reason"]);
  });

  it("sends the versions the page showed, so a later change is a conflict rather than an overwrite", () => {
    expect(html).toContain('name="expectedRequestUpdatedAt" value="2026-11-22T04:00:00.000Z"');
    expect(html).toContain('name="expectedVerificationUpdatedAt" value=""');
    expect(html).toContain('name="id" value="req-1"');
  });

  it("describes the reason field and says what happens, accurately, before the reviewer confirms", () => {
    expect(html).toContain('aria-describedby="reject-reason-hint"');
    expect(html).toContain("Kept privately; not sent to the applicant.");
    expect(html).toContain("queued is not the same as delivered");
    expect(html).toContain("does not include your reason");
    expect(html).not.toContain("aria-invalid");
    expect(html).not.toContain('role="alert"');
  });

  it("reports errors itself rather than through the browser's own bubbles", () => {
    expect(html).toMatch(/<form[^>]*novalidate/i);
  });

  it("is plain server-rendered HTML: no client component, no hook, so it adds nothing to the JavaScript budget", () => {
    const source = readFileSync(new URL("./reject-request-form.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/^["']use client["']/m);
    expect(source).not.toMatch(/\buse(State|Effect|ActionState|Ref|FormStatus)\b/);
  });
});

describe("a recoverable error", () => {
  const both: ErrorNotice = { kind: "error", problems: ["reason-short", "confirmation"], code: null };
  const html = view(both, "no");

  it("lists every problem together in a summary that links to the fields and can take focus from the address fragment", () => {
    expect(html).toMatch(/id="reject-errors"[^>]*role="alert"[^>]*tabindex="-1"|role="alert"[^>]*id="reject-errors"|tabindex="-1"[^>]*id="reject-errors"/);
    expect(html).toContain("There is a problem");
    expect(html).toContain('<a href="#reject-reason">Explain the reason in at least 3 characters');
    expect(html).toContain('<a href="#reject-confirm">Confirm the rejection to continue.</a>');
  });

  it("marks the invalid fields, connects their errors, and keeps what was typed", () => {
    expect(html).toMatch(/<textarea[^>]*aria-invalid="true"[^>]*aria-describedby="reject-reason-hint reject-reason-error"/);
    expect(html).toContain('id="reject-reason-error"');
    expect(html).toMatch(/<input[^>]*id="reject-confirm"[^>]*aria-invalid="true"[^>]*aria-describedby="reject-confirm-error"/);
    expect(html).toContain('id="reject-confirm-error"');
    expect(html).toMatch(/<textarea[^>]*>no<\/textarea>/);
  });

  it("marks only the field that is wrong", () => {
    const onlyReason = view({ kind: "error", problems: ["reason-missing"], code: null });
    expect(onlyReason).toMatch(/<textarea[^>]*aria-invalid="true"/);
    expect(onlyReason).not.toMatch(/<input[^>]*id="reject-confirm"[^>]*aria-invalid/);
    expect(onlyReason).not.toContain("reject-confirm-error");
    const onlyConfirm = view({ kind: "error", problems: ["confirmation"], code: null }, "Duplicate");
    expect(onlyConfirm).not.toMatch(/<textarea[^>]*aria-invalid/);
    expect(onlyConfirm).toMatch(/<textarea[^>]*>Duplicate<\/textarea>/);
  });

  it("uses the wording for each reason problem", () => {
    expect(view({ kind: "error", problems: ["reason-missing"], code: null })).toContain("Enter the reason for rejecting this request.");
    expect(view({ kind: "error", problems: ["reason-long"], code: null })).toContain("Keep the reason to 2000 characters or fewer.");
  });

  it("escapes what the reviewer typed, so it cannot become markup", () => {
    const markup = view({ kind: "error", problems: ["confirmation"], code: null }, '</textarea><script>alert(1)</script>');
    // Only the typed text is under test: React's own form-replay script is not part of the draft.
    expect(markup).not.toContain("<script>alert(1)");
    expect(markup).not.toContain("</textarea><script>");
    expect(markup).toContain("&lt;/textarea&gt;&lt;script&gt;");
  });
});

describe("a refused decision", () => {
  it.each([
    ["stale_request", "This request changed while you were reviewing it. Refresh the page and check it before rejecting."],
    ["stale_verification", "The review changed while you were reviewing it."],
    ["linked_appeal", "This request has a linked appeal. Open the appeal to manage its status."],
    ["forbidden", "Approval permission is required to reject a request."],
    ["form", "The form was not submitted correctly. Refresh the page and try again."],
    ["version", "The version of this request is missing or invalid. Refresh the page before rejecting."],
  ])("shows the message for %s as a form-level notice and keeps the reason", (code, message) => {
    const html = view({ kind: "error", problems: [], code }, "Keep this reason");
    expect(html).toContain("This could not be rejected");
    expect(html).toContain(message);
    expect(html).toMatch(/<textarea[^>]*>Keep this reason<\/textarea>/);
    expect(html).not.toContain("aria-invalid");
  });

  it("falls back to a safe message for a code it does not know", () => {
    expect(view({ kind: "error", problems: [], code: null })).toContain("The form was not submitted correctly.");
  });
});
