import "server-only";
import { revalidatePath } from "next/cache";

/** The privacy decision is committed by the caller's database transaction.
 * A cache-invalidation service failure must NEVER tell donors that their
 * already-recorded withdrawal or request failed. Public /shukr is
 * force-dynamic/no-store; these refreshes only shorten incidental stale
 * UI state and must not be part of the consent mutation's success signal.
 */
export function refreshShukrViewsAfterConsent(): void {
  for (const path of ["/shukr", "/admin/donations/recognition"] as const) {
    try {
      revalidatePath(path);
    } catch {
      // No donor identity, receipt token or chosen name is logged here.
      // The no-store Shukr route must render directly from the database.
    }
  }
}
