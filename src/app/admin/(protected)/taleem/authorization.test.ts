import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookie: vi.fn(), user: vi.fn(), revalidate: vi.fn(),
  createLearner: vi.fn(), setLearnerStatus: vi.fn(), startEnrolment: vi.fn(), createPlace: vi.fn(), setPlaceStatus: vi.fn(),
  assignLearner: vi.fn(), endAssignment: vi.fn(), recordHifdhCompletion: vi.fn(), confirmHifdhEvidence: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error("Synthetic redirect: " + path); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findFirst: mocks.user } } }));
vi.mock("@/lib/taleem-roster-service", () => {
  class RosterError extends Error {}
  return {
    RosterError,
    createLearner: mocks.createLearner, setLearnerStatus: mocks.setLearnerStatus, startEnrolment: mocks.startEnrolment,
    createPlace: mocks.createPlace, setPlaceStatus: mocks.setPlaceStatus, assignLearner: mocks.assignLearner,
    endAssignment: mocks.endAssignment, recordHifdhCompletion: mocks.recordHifdhCompletion, confirmHifdhEvidence: mocks.confirmHifdhEvidence,
  };
});

import {
  assignLearnerAction, confirmHifdhEvidenceAction, createLearnerAction, createPlaceAction, endAssignmentAction, recordHifdhCompletionAction,
  setLearnerStatusAction, setPlaceStatusAction, startEnrolmentAction,
} from "./actions";
import { RosterError } from "@/lib/taleem-roster-service";

const token = Buffer.alloc(32, 0x5a).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const serviceCalls = () => [mocks.createLearner, mocks.setLearnerStatus, mocks.startEnrolment, mocks.createPlace, mocks.setPlaceStatus, mocks.assignLearner, mocks.endAssignment, mocks.recordHifdhCompletion, mocks.confirmHifdhEvidence];

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

const actions = [
  ["createLearner", createLearnerAction, { fullName: "Synthetic Learner" }],
  ["setLearnerStatus", setLearnerStatusAction, { learnerId: "l", status: "LEFT" }],
  ["startEnrolment", startEnrolmentAction, { learnerId: "l", programme: "NAZIRA", startedOn: "2026-01-01" }],
  ["createPlace", createPlaceAction, { approvedOn: "2026-01-01" }],
  ["setPlaceStatus", setPlaceStatusAction, { placeId: "p", status: "SUSPENDED" }],
  ["assignLearner", assignLearnerAction, { placeId: "p", learnerId: "l", startedOn: "2026-01-01" }],
  ["endAssignment", endAssignmentAction, { assignmentId: "a", endedOn: "2026-01-02" }],
  ["recordHifdhCompletion", recordHifdhCompletionAction, { learnerId: "l", completedOn: "2026-06-01", verified: "yes", supportAssociated: "yes" }],
  ["confirmHifdhEvidence", confirmHifdhEvidenceAction, { learnerId: "l", verified: "on" }],
] as const;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: token });
  mocks.user.mockResolvedValue({ id: "synthetic-editor", status: "ACTIVE", roles: [{ role: { permissions: [{ permission: { key: "content.update" } }] } }] });
  for (const fn of serviceCalls()) fn.mockResolvedValue({ id: "x", publicAlias: "TL-ABCDEFGH", placeCode: "TP-ABCDEF" });
});

describe.each(actions)("%s", (_name, action, entries) => {
  it("denies anonymous access before any session lookup or roster change", async () => {
    mocks.cookie.mockReturnValue(undefined);
    await expect(action(form(entries))).rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.user).not.toHaveBeenCalled();
    for (const fn of serviceCalls()) expect(fn).not.toHaveBeenCalled();
  });

  it("denies a forged cookie before any user lookup", async () => {
    mocks.cookie.mockReturnValue({ value: "forged-session" });
    await expect(action(form(entries))).rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.user).not.toHaveBeenCalled();
    for (const fn of serviceCalls()) expect(fn).not.toHaveBeenCalled();
  });

  it("denies an unresolvable or expired session", async () => {
    mocks.user.mockResolvedValue(null);
    await expect(action(form(entries))).rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "ACTIVE", sessions: { some: { tokenHash, expiresAt: { gt: expect.any(Date) } } } } }));
    for (const fn of serviceCalls()) expect(fn).not.toHaveBeenCalled();
  });

  it("denies a signed-in editor without assistance.approve", async () => {
    await expect(action(form(entries))).rejects.toThrow("Synthetic redirect: /admin/forbidden");
    for (const fn of serviceCalls()) expect(fn).not.toHaveBeenCalled();
  });

  it("lets an approver through to the roster service and returns to the roster page with a notice", async () => {
    mocks.user.mockResolvedValue({ id: "synthetic-approver", status: "ACTIVE", roles: [{ role: { permissions: [{ permission: { key: "assistance.approve" } }] } }] });
    await expect(action(form(entries))).rejects.toThrow(/^Synthetic redirect: \/admin\/taleem\?notice=/);
    expect(serviceCalls().filter(fn => fn.mock.calls.length > 0)).toHaveLength(1);
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin/taleem");
  });
});

describe("error handling", () => {
  const approver = () => mocks.user.mockResolvedValue({ id: "synthetic-approver", status: "ACTIVE", roles: [{ role: { permissions: [{ permission: { key: "assistance.approve" } }] } }] });

  it("shows an operator-safe roster refusal as the notice", async () => {
    approver();
    mocks.assignLearner.mockRejectedValue(new RosterError("That place already has a current assignment."));
    await expect(assignLearnerAction(form({ placeId: "p", learnerId: "l", startedOn: "2026-01-01" }))).rejects.toThrow("notice=That%20place%20already%20has%20a%20current%20assignment.");
  });

  it("never turns an unexpected failure into a notice, so internals cannot leak", async () => {
    approver();
    mocks.assignLearner.mockRejectedValue(new Error("connection string postgres://secret"));
    await expect(assignLearnerAction(form({ placeId: "p", learnerId: "l", startedOn: "2026-01-01" }))).rejects.toThrow("connection string postgres://secret");
  });

  it("rejects a repeated field instead of guessing which value was meant", async () => {
    approver();
    const data = new FormData();
    data.append("learnerId", "l1"); data.append("learnerId", "l2"); data.set("status", "LEFT");
    await expect(setLearnerStatusAction(data)).rejects.toThrow("Repeated learnerId fields are not accepted.");
    expect(mocks.setLearnerStatus).not.toHaveBeenCalled();
  });

  it("passes the signed-in user as the audit actor and the typed fields through unchanged", async () => {
    approver();
    await expect(recordHifdhCompletionAction(form({ learnerId: "l", completedOn: "2026-06-01", verified: "yes", supportAssociated: "no" }))).rejects.toThrow("Synthetic redirect");
    expect(mocks.recordHifdhCompletion).toHaveBeenCalledWith("l", "2026-06-01", { supportAssociated: false, verified: true }, "synthetic-approver");
  });
});

it("passes positive evidence confirmation and the authenticated actor only, rejecting unsupported values", async () => {
  mocks.user.mockResolvedValue({ id: "synthetic-approver", status: "ACTIVE", roles: [{ role: { permissions: [{ permission: { key: "assistance.approve" } }] } }] });
  mocks.confirmHifdhEvidence.mockResolvedValue("confirmed");
  await expect(confirmHifdhEvidenceAction(form({ learnerId: "l", verified: "on" }))).rejects.toThrow("Synthetic redirect");
  expect(mocks.confirmHifdhEvidence).toHaveBeenCalledWith("l", { verified: true, supportAssociated: false }, "synthetic-approver");
  mocks.confirmHifdhEvidence.mockClear();
  await expect(confirmHifdhEvidenceAction(form({ learnerId: "l", verified: "yes" }))).rejects.toThrow("notice=Choose%20valid%20evidence%20confirmations.");
  expect(mocks.confirmHifdhEvidence).not.toHaveBeenCalled();
});
