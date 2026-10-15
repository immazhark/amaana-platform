"use server";
import { requirePermission } from "@/lib/auth";
import { IndexNowInputError } from "@/lib/indexnow";
import { submitIndexNowPaths } from "@/lib/indexnow-submission";

export type IndexNowActionState = { state: "idle" | "success" | "error" | "uncertain"; message: string };
export async function submitIndexNowAction(_previous: IndexNowActionState, form: FormData): Promise<IndexNowActionState> {
  const actor = await requirePermission("content.approve");
  if (form.get("confirmPublic") !== "true") return { state: "error", message: "Confirm that these pages are approved for public search discovery." };
  try {
    const result = await submitIndexNowPaths(actor.id, form.get("paths"));
    const auditNotice = result.auditRecorded ? "" : " The submission attempt was recorded, but its outcome audit could not be saved. Ask an administrator to reconcile it before retrying.";
    if (result.state === "received" || result.state === "validation_pending") return {
      state: "success", message: `${result.count} URLs received by IndexNow${result.state === "validation_pending" ? "; ownership validation remains pending" : ""}. Receipt does not guarantee crawling or indexing.${auditNotice}`,
    };
    if (result.state === "throttled") return { state: "error", message: "A submission was attempted in the last minute. Review its outcome before submitting again." };
    if (result.state === "rejected") return { state: "error", message: `IndexNow rejected the request. Review ownership configuration and provider limits before retrying.${auditNotice}` };
    return { state: "uncertain", message: `Delivery could not be confirmed. IndexNow may have received the URLs. Do not immediately resubmit.${auditNotice}` };
  } catch (error) {
    return { state: "error", message: error instanceof IndexNowInputError ? error.message
      : "Search discovery could not start safely. Check configuration and audit availability before retrying." };
  }
}
