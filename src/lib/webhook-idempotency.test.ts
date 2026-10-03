import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { isPrismaUniqueConstraintError } from "./webhook-idempotency";

describe("webhook idempotency error classification", () => {
  it("recognizes Prisma unique constraint violations", () => {
    const error = new Prisma.PrismaClientKnownRequestError("duplicate provider event", {
      code: "P2002",
      clientVersion: "6.12.0",
      meta: { target: ["providerEventId"] },
    });

    expect(isPrismaUniqueConstraintError(error)).toBe(true);
  });

  it("does not swallow unrelated Prisma failures", () => {
    const error = new Prisma.PrismaClientKnownRequestError("record missing", {
      code: "P2025",
      clientVersion: "6.12.0",
    });

    expect(isPrismaUniqueConstraintError(error)).toBe(false);
  });

  it("does not classify arbitrary errors as duplicate delivery", () => {
    expect(isPrismaUniqueConstraintError(new Error("boom"))).toBe(false);
    expect(isPrismaUniqueConstraintError(null)).toBe(false);
  });
});
