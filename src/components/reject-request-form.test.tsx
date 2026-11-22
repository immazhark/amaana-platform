import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RejectionFormState } from "@/app/admin/(protected)/requests/[id]/rejection-actions";
import { RejectRequestFormView } from "./reject-request-form";

const props = { requestId: "req-1", referenceNumber: "AF-2026-123456", requestVersion: "2026-11-22T04:00:00.000Z", verificationVersion: "" };
const view = (state: RejectionFormState, pending = false) => renderToStaticMarkup(<RejectRequestFormView {...props} state={state} formAction={() => undefined} pending={pending} />);
const idle: RejectionFormState = { kind: "idle", message: "" };

describe("initial form", () => {
  const html = view(idle);

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

  it("is a form that reports errors itself rather than through the browser's own bubbles", () => {
    expect(html).toMatch(/<form[^>]*novalidate/i);
  });
});

describe("error state", () => {
  const error: RejectionFormState = {
    kind: "error", message: "Fix the highlighted fields to reject this request.", values: { reason: "no" },
    fieldErrors: { reason: "Explain the reason in at least 3 characters, using letters or numbers.", confirmation: "Confirm the rejection to continue." },
  };
  const html = view(error);

  it("lists every problem together in a summary that links to the fields and is announced", () => {
    expect(html).toMatch(/role="alert"[^>]*tabindex="-1"|tabindex="-1"[^>]*role="alert"/);
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
    const onlyReason = view({ ...error, fieldErrors: { reason: "Enter the reason for rejecting this request." } });
    expect(onlyReason).toMatch(/<textarea[^>]*aria-invalid="true"/);
    expect(onlyReason).not.toMatch(/<input[^>]*id="reject-confirm"[^>]*aria-invalid/);
    expect(onlyReason).not.toContain("reject-confirm-error");
  });

  it("shows a conflict or a refusal as a form-level message and still keeps the reason", () => {
    const conflict = view({ kind: "error", message: "This request changed while you were reviewing it. Refresh the page and check it before rejecting.", values: { reason: "Keep this reason" }, code: "stale_request" });
    expect(conflict).toContain("This could not be rejected");
    expect(conflict).toContain("This request changed while you were reviewing it.");
    expect(conflict).toMatch(/<textarea[^>]*>Keep this reason<\/textarea>/);
    expect(conflict).not.toContain("aria-invalid");
  });
});

describe("pending state", () => {
  it("disables the button and says so, so a double click cannot send the decision twice", () => {
    const html = view(idle, true);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Recording rejection…<\/button>/);
    expect(html).toContain('aria-busy="true"');
  });

  it("is enabled when nothing is pending", () => {
    expect(view(idle)).toMatch(/<button[^>]*type="submit"[^>]*>Confirm rejection<\/button>/);
    expect(view(idle)).not.toMatch(/<button[^>]*disabled/);
  });
});

describe("success state", () => {
  const success = (result: NonNullable<RejectionFormState["result"]>): RejectionFormState => ({ kind: "success", message: "ok", result });

  it("shows the outcome, the recorded reviewer and time, that the reason stays private, and a route back to the queue", () => {
    const html = view(success({ outcome: "rejected", rejectedAt: "2026-11-22T04:10:00.000Z", reviewerName: "Synthetic Approver" }));
    expect(html).toContain('role="status"');
    expect(html).toContain("Request rejected");
    expect(html).toContain("AF-2026-123456 is now <strong>Rejected</strong>");
    expect(html).toContain("Recorded by Synthetic Approver on 22 November 2026");
    expect(html).toContain("not sent to the applicant");
    expect(html).toContain('href="/admin"');
    expect(html).toContain("Back to the queue");
    expect(html).not.toContain("<textarea");
  });

  it("says a repeat was already rejected, without claiming a second decision", () => {
    const html = view(success({ outcome: "already_rejected", rejectedAt: "2026-11-22T03:00:00.000Z", reviewerName: "Earlier Reviewer" }));
    expect(html).toContain("This request was already rejected");
    expect(html).toContain("Recorded by Earlier Reviewer");
  });

  it("never invents a time or a reviewer for a legacy rejection", () => {
    const html = view(success({ outcome: "already_rejected", rejectedAt: null, reviewerName: null }));
    expect(html).toContain("The earlier decision has no recorded time or reviewer.");
    expect(html).not.toContain("Recorded by");
    expect(html).not.toMatch(/Recorded on/);
  });
});
