import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Invalidate every derived financial view after a committed capture/refund.
 * A single cache adapter failure must never prevent later invalidations.
 *
 * Throw the first failure after attempting all paths: replayable callers can
 * retry invalidation, while donor-facing confirmation handles this separately
 * from the already-persisted payment status.
 */
export function expireDonationViews() {
  let failed = false;
  let firstFailure: unknown;
  const attempt = (invalidate: () => void) => {
    try {
      invalidate();
    } catch (error) {
      if (!failed) {
        failed = true;
        firstFailure = error;
      }
    }
  };

  attempt(() => revalidateTag("appeals", { expire: 0 }));
  for (const path of ["/", "/appeals", "/admin/donations", "/admin/giving-funds"]) {
    attempt(() => revalidatePath(path));
  }
  if (failed) throw firstFailure;
}
