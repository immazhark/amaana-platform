import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("private acknowledgement bundle isolation", () => {
  const source = readFileSync(new URL("../components/donation-acknowledgement-client.tsx", import.meta.url), "utf8");
  it("does not eagerly import dormant opt-in donor workflows", () => {
    expect(source).toContain('const DonorRecognitionPreferences = lazy(');
    expect(source).toContain('const DonorDataRights = lazy(');
    expect(source).not.toContain('import { DonorRecognitionPreferences }');
    expect(source).not.toContain('import { DonorDataRights }');
  });
  it("guards both optional features behind independent server-provided booleans", () => {
    expect(source).toContain('recognitionEnabled && (presentation.tone');
    expect(source).toContain('rightsEnabled && <Suspense');
    expect(source).toContain('getToken={recognitionToken}');
  });
});
