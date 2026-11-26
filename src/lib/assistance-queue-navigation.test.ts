import { describe, expect, it } from "vitest";
import { assistanceCaseHref, assistanceQueueHref, assistanceReturnFilters } from "./assistance-queue-navigation";

describe("assistance queue navigation", () => {
  it("round trips only accepted filters through case and duplicate links", () => {
    const filters = { status: "SUBMITTED", view: "tests", sort: "oldest", page: "3", assignment: "mine" };
    const detail = assistanceCaseHref("synthetic-request", filters);
    expect(detail).toBe("/admin/requests/synthetic-request?queueStatus=SUBMITTED&queueView=tests&queuePage=3&queueSort=oldest&queueAssignment=mine");
    const parsed = Object.fromEntries(new URL(detail, "https://example.test").searchParams);
    expect(assistanceQueueHref(assistanceReturnFilters(parsed))).toBe(assistanceQueueHref(filters));
    expect(assistanceCaseHref("synthetic-duplicate", assistanceReturnFilters(parsed))).toBe(detail.replace("synthetic-request", "synthetic-duplicate"));
  });
  it("never accepts external destinations, repeated parameters, arbitrary staff IDs or action notices", () => {
    expect(assistanceQueueHref(assistanceReturnFilters({
      queueStatus: ["SUBMITTED"], queueAssignment: "other-user", queuePage: "-1",
      queueSort: ["oldest"], queueView: "//evil.example", returnTo: "https://evil.example", status: "APPROVED",
    }))).toBe("/admin");
    expect(assistanceCaseHref("synthetic-request", {})).toBe("/admin/requests/synthetic-request");
    expect(assistanceCaseHref("a/b?c", {})).toBe("/admin/requests/a%2Fb%3Fc");
  });
});
