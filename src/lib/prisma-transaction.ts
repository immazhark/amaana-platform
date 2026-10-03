import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const DEFAULT_MAX_ATTEMPTS = 3;

export function isPrismaSerializableConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

export async function withSerializableTransactionRetry<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError("maxAttempts must be a positive integer");
  }

  let lastConflict: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (!isPrismaSerializableConflict(error)) throw error;
      lastConflict = error;
    }
  }

  throw lastConflict ?? new Error("Serializable transaction retry exhausted");
}
