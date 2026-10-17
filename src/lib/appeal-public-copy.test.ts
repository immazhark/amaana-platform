import { describe, expect, it } from "vitest";
import { getAppealPublicCopy, SENSITIVE_APPEAL_DESCRIPTION, SENSITIVE_APPEAL_TITLE } from "./appeal-public-copy";

describe("appeal public search and sharing copy", () => {
  const originalTitle = "A private beneficiary identity";
  const originalSummary = "Sensitive details that should not be put into search metadata or shares.";

  it("redacts highly sensitive appeal identity in all outward-facing copy", () => {
    const result = getAppealPublicCopy(originalTitle, originalSummary, true);
    expect(result).toEqual({
      title: SENSITIVE_APPEAL_TITLE,
      description: SENSITIVE_APPEAL_DESCRIPTION,
    });
    expect(JSON.stringify(result)).not.toContain(originalTitle);
    expect(JSON.stringify(result)).not.toContain(originalSummary);
  });

  it("preserves approved public content for standard appeals", () => {
    expect(getAppealPublicCopy(originalTitle, originalSummary, false)).toEqual({
      title: originalTitle,
      description: originalSummary,
    });
  });

  it("does not interpolate a sensitive identity even with markup or control characters", () => {
    const sensitive = "<script>\u2028test\u2029</script> & private reference";
    const outward = getAppealPublicCopy(sensitive, sensitive, true);
    expect(outward.title).toBe(SENSITIVE_APPEAL_TITLE);
    expect(outward.description).toBe(SENSITIVE_APPEAL_DESCRIPTION);
  });
});
