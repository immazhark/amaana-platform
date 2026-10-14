import "server-only";
import { isAbsolute } from "node:path";

/**
 * Single source of truth for dormant receipt PDF activation. Consumed by
 * authorization, redemption and the server-rendered donor download control.
 * A configured path alone does not certify the renderer executable: the
 * bounded renderer independently checks that at invocation time.
 */
export function isPrivateReceiptPdfEnabled(): boolean {
  const binary = process.env.AMAANA_RECEIPT_PDF_RENDERER_BIN;
  return process.env.AMAANA_RECEIPT_PDF_ENABLED === "true"
    && /^[0-9a-fA-F]{64}$/.test(process.env.RECEIPT_DOWNLOAD_ENCRYPTION_KEY ?? "")
    && typeof binary === "string" && isAbsolute(binary);
}
