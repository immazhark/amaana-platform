import "server-only";
import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";
import { promisify } from "node:util";
import type { AcknowledgementRecord } from "@/lib/private-record-response";
import { renderPrivateReceiptHtml } from "@/lib/private-receipt-pdf-html";

const run = promisify(execFile);
const MAX_PDF_BYTES = 2 * 1024 * 1024;
const RENDER_DEADLINE_MS = 15_000;
let activeRenders = 0;

/** Selectable, tagged PDF/UA via a pre-provisioned pinned WeasyPrint binary
 * with Unicode Arabic/Telugu fallback fonts. No remote URL access.
 * Feature/auth gates MUST run before calling this module. */
export async function renderPrivateReceiptPdf(record: AcknowledgementRecord): Promise<Uint8Array> {
  if (activeRenders >= 2) throw new Error("Private PDF renderer capacity reached");
  const binary = process.env.AMAANA_RECEIPT_PDF_RENDERER_BIN;
  if (!binary || !isAbsolute(binary)) throw new Error("Private PDF renderer not configured");
  const html = renderPrivateReceiptHtml(record);
  await access(binary);
  activeRenders++;
  let directory: string | undefined;
  try {
    directory = await mkdtemp(join(tmpdir(), "amaana-receipt-"));
    const input = join(directory, "private.html");
    const output = join(directory, "private.pdf");
    await writeFile(input, html, { encoding: "utf8", mode: 0o600, flag: "wx" });
    await run(binary, [
      "--pdf-variant=pdf/ua-1", "--allowed-protocols=file",
      "--no-http-redirects", "--fail-on-http-errors", "--quiet",
      input, output,
    ], {
      timeout: RENDER_DEADLINE_MS, killSignal: "SIGKILL",
      maxBuffer: 64 * 1024, windowsHide: true, cwd: directory,
      env: { NODE_ENV: process.env.NODE_ENV ?? "production", PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: directory,
        TMPDIR: directory, LANG: "C.UTF-8" },
    });
    const size = (await stat(output)).size;
    if (!Number.isSafeInteger(size) || size < 16 || size > MAX_PDF_BYTES) {
      throw new Error("Private PDF output exceeded verified bounds");
    }
    const bytes = await readFile(output);
    if (bytes.byteLength !== size) throw new Error("Private PDF output changed during read");
    return Uint8Array.from(bytes);
  } finally {
    try {
      // Privacy invariant: a failed cleanup must reject the download rather
      // than silently leaving donor identity or payment data on local disk.
      if (directory) await rm(directory, { recursive: true, force: true });
    } finally {
      activeRenders--;
    }
  }
}
