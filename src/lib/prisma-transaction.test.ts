import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const transaction = vi.hoisted(() => vi.fn());
vi.mock("./prisma", () => ({ prisma: { $transaction: transaction } }));

import { withSerializableTransactionRetry } from "./prisma-transaction";

const conflict = () => new Prisma.PrismaClientKnownRequestError("Synthetic serializable conflict", { code: "P2034", clientVersion: "test" });

describe("serializable transaction retry", () => {
  beforeEach(() => vi.resetAllMocks());

  it("lets a competing transaction finish before the next attempt rechecks the domain invariant", async () => {
    let winnerCommitted = false;
    const refused = new Error("capacity_full");
    transaction.mockImplementation(async (operation: () => Promise<never>, options: { isolationLevel: string }) => {
      expect(options.isolationLevel).toBe("Serializable");
      if (!winnerCommitted) throw conflict();
      return operation();
    });
    const beforeRetry = vi.fn(async () => { winnerCommitted = true; });
    await expect(withSerializableTransactionRetry(async () => { throw refused; }, 5, beforeRetry)).rejects.toBe(refused);
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(beforeRetry.mock.calls).toEqual([[1]]);
  });

  it("keeps the existing default of three attempts and immediately propagates non-conflict errors", async () => {
    const failure = conflict();
    transaction.mockRejectedValue(failure);
    await expect(withSerializableTransactionRetry(async () => undefined)).rejects.toBe(failure);
    expect(transaction).toHaveBeenCalledTimes(3);
    transaction.mockClear();
    const invalid = new Error("invalid");
    transaction.mockRejectedValue(invalid);
    const beforeRetry = vi.fn(async () => undefined);
    await expect(withSerializableTransactionRetry(async () => undefined, 5, beforeRetry)).rejects.toBe(invalid);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(beforeRetry).not.toHaveBeenCalled();
  });

  it("bounds persistent contention and never waits after the last attempt", async () => {
    const failure = conflict();
    transaction.mockRejectedValue(failure);
    const beforeRetry = vi.fn(async () => undefined);
    await expect(withSerializableTransactionRetry(async () => undefined, 5, beforeRetry)).rejects.toBe(failure);
    expect(transaction).toHaveBeenCalledTimes(5);
    expect(beforeRetry.mock.calls).toEqual([[1], [2], [3], [4]]);
  });
});
