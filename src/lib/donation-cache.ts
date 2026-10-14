import { revalidatePath, revalidateTag } from "next/cache";

/** Route-handler invalidation after committed financial changes.
 * Verified replays may retry this without repeating monetary effects.
 */
export function expireDonationViews() {
  revalidateTag("appeals", { expire: 0 });
  for (const path of ["/", "/appeals", "/admin/donations", "/admin/giving-funds"]) {
    revalidatePath(path);
  }
}
