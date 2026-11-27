import { describe, expect, it } from "vitest";
import { assistanceActionReturnHref, assistanceCaseHref, assistanceQueueContext, assistanceQueueHref, assistanceReturnFilters } from "./assistance-queue-navigation";

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

describe("assistance action return context", () => {
  it("retains valid queue filters and original notices and fragments", () => {
    const filters = { status: "SUBMITTED", view: "tests", page: "3", sort: "oldest", assignment: "mine" };
    const data = new FormData();
    for (const [key, value] of Object.entries(assistanceQueueContext(filters))) data.append(key, value);
    for (const href of ["/admin/requests/synthetic?approve=done&o=approved&r=APPROVED_PUBLIC#approve-heading", "/admin/requests/synthetic?reject=error&e=reason%2Cconfirmation#reject-errors", "/admin/requests/synthetic"]) {
      const before = new URL(href, "https://example.test");
      const after = new URL(assistanceActionReturnHref(href, data), "https://example.test");
      expect(after.pathname).toBe(before.pathname);
      expect(after.hash).toBe(before.hash);
      for (const [key, value] of before.searchParams) expect(after.searchParams.get(key)).toBe(value);
      expect(assistanceQueueHref(assistanceReturnFilters(Object.fromEntries(after.searchParams)))).toBe(assistanceQueueHref(filters));
    }
  });
  it("ignores unsafe values, repeated or non-text fields, and unrelated private form data", () => {
    const data = new FormData();
    for (const [key, value] of Object.entries({ queueStatus: "SUBMITTED", queuePage: "-1", queueSort: "oldest", queueAssignment: "staff-id", queueView: "//evil.test", returnTo: "https://evil.test", reason: "private", approve: "done" })) data.append(key, value);
    data.append("queueStatus", "APPROVED");
    data.append("queueSort", new Blob(["oldest"]), "x.txt");
    const href = "/admin/requests/synthetic?reject=error#reject-errors";
    expect(assistanceActionReturnHref(href, data)).toBe(href);
    expect(assistanceQueueContext({ status: ["SUBMITTED"], view: "invalid", assignment: "someone" })).toEqual({});
  });
  it("leaves existing notices byte-for-byte unchanged without queue context", () => {
    const href = "/admin/requests/synthetic?approve=error&e=a%2Cb#approve-errors";
    expect(assistanceActionReturnHref(href, new FormData())).toBe(href);
  });
});

describe("requested-category queue navigation", () => {
  it.each(["MEDICAL", "EDUCATION", "LIVELIHOOD", "FOOD_HARDSHIP", "HOUSING", "EMERGENCY", "OTHER"])("retains %s through case and action links", category => {
    const filters = { status: "SUBMITTED", view: "tests", page: "3", sort: "oldest", assignment: "mine", category };
    const detail = new URL(assistanceCaseHref("synthetic", filters), "https://example.test");
    expect(detail.searchParams.get("queueCategory")).toBe(category);
    const returned = assistanceReturnFilters(Object.fromEntries(detail.searchParams));
    expect(returned).toEqual(filters);
    const form = new FormData();
    for (const [key, value] of Object.entries(assistanceQueueContext(returned))) form.append(key, value);
    const result = new URL(assistanceActionReturnHref("/admin/requests/synthetic?reject=done#review", form), "https://example.test");
    expect(result.searchParams.get("reject")).toBe("done");
    expect(result.hash).toBe("#review");
    expect(result.searchParams.get("queueCategory")).toBe(category);
    expect(assistanceQueueHref(assistanceReturnFilters(Object.fromEntries(result.searchParams)))).toBe(assistanceQueueHref(filters));
  });
  it.each(["medical", "__proto__", "https://evil.test", "PRIVATE_SYNTHETIC", ["MEDICAL"], ["MEDICAL", "OTHER"]].map(category => ({ category })))("rejects invalid category $category", ({ category }) => {
    expect(assistanceQueueHref({ category })).toBe("/admin");
    expect(assistanceReturnFilters({ queueCategory: category })).toEqual({});
  });
  it("ignores repeated category and unrelated form data", () => {
    const form = new FormData();
    form.append("queueCategory", "MEDICAL");
    form.append("queueCategory", "OTHER");
    form.append("reason", "PRIVATE_SYNTHETIC");
    expect(assistanceActionReturnHref("/admin/requests/synthetic#review", form)).toBe("/admin/requests/synthetic#review");
  });
});
