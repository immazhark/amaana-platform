import { describe, expect, it } from "vitest";
import { classifyAssistanceResponse } from "./assistance-feedback";

const credentials = { referenceNumber: "AF-2026-123456", trackingToken: "a".repeat(32) };

describe("assistance submission outcomes", () => {
  it("accepts a created request only with usable private credentials", () => {
    expect(classifyAssistanceResponse(201, credentials)).toEqual({ kind: "accepted", ...credentials });
  });

  it.each([
    null, [], {}, { ...credentials, trackingToken: "short" },
    { ...credentials, trackingToken: 123 }, { ...credentials, referenceNumber: "../admin" },
    { ...credentials, referenceNumber: "a".repeat(81) },
    { ...credentials, trackingToken: "a".repeat(129) },
  ])("keeps malformed acknowledgements locked: %j", body => {
    expect(classifyAssistanceResponse(201, body)).toEqual({ kind: "uncertain" });
  });

  it.each([200, 202, 409, 500, 502, 503])("does not treat HTTP %s as proof of a safe retry", status => {
    expect(classifyAssistanceResponse(status, { error: "Try again" })).toEqual({ kind: "uncertain" });
    expect(classifyAssistanceResponse(status, credentials)).toEqual({ kind: "uncertain" });
  });

  it.each([400, 403, 413, 429])("allows correction after an explicit pre-write rejection: %s", status => {
    expect(classifyAssistanceResponse(status, { error: "Please review the files", fields: { documents: ["Choose a valid file"] } }))
      .toEqual({ kind: "rejected", message: "Please review the files", fields: { documents: ["Choose a valid file"] } });
    expect(classifyAssistanceResponse(status, {})).toEqual({ kind: "uncertain" });
  });

  it("gives uncertainty precedence over otherwise valid credentials or rejection fields", () => {
    expect(classifyAssistanceResponse(201, { ...credentials, submissionUncertain: true })).toEqual({ kind: "uncertain" });
    expect(classifyAssistanceResponse(400, { error: "Retry", submissionUncertain: true })).toEqual({ kind: "uncertain" });
  });

  it("drops unknown fields, rejects malformed messages and bounds feedback", () => {
    expect(classifyAssistanceResponse(400, {
      error: "a".repeat(1000), fields: {
        phone: [null, " ", "Enter a phone number"], documents: ["b".repeat(1000)],
        city: "invalid", trackingToken: ["private"], internalNotes: ["private"],
      },
    })).toEqual({ kind: "rejected", message: "a".repeat(500), fields: { phone: ["Enter a phone number"], documents: ["b".repeat(300)] } });
    expect(classifyAssistanceResponse(400, { error: "Correct the form", fields: [] }))
      .toEqual({ kind: "rejected", message: "Correct the form", fields: {} });
  });
});
