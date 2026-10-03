import test from "node:test";
import assert from "node:assert/strict";
import { normalizeHostedVideoPublication } from "../prisma/reviewed-campaign-video-normalization.mjs";

test("hosted video publication is forced back to private state", async () => {
  let received;
  const tx = {
    $executeRaw: async () => 1,
    mediaAsset: {
      updateMany: async args => {
        received = args;
        return { count: 3 };
      },
    },
  };
  const prisma = { $transaction: async callback => callback(tx) };
  assert.equal(await normalizeHostedVideoPublication(prisma), 3);
  assert.equal(received.where.kind, "VIDEO");
  assert.deepEqual(received.data, { isPublic: false, privacyApprovedAt: null });
});
