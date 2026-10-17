/** Browser-side assistance evidence guardrails.
 * These mirror the API's five files / five MiB limits. They are advisory:
 * the private upload service revalidates every file and its content. */
export const MAX_ASSISTANCE_DOCUMENTS = 5;
export const MAX_ASSISTANCE_DOCUMENT_BYTES = 5 * 1024 * 1024;

type Candidate = { name: string; size: number; type?: string };

export function assistanceDocumentSelectionIssue(files: readonly Candidate[]): string | null {
  if (files.length > MAX_ASSISTANCE_DOCUMENTS) return "Choose no more than five supporting documents.";
  for (const file of files) {
    if (!Number.isSafeInteger(file.size) || file.size <= 0)
      return "A supporting document is empty or invalid. Choose a non-empty file.";
    if (file.size > MAX_ASSISTANCE_DOCUMENT_BYTES)
      return "Each supporting document must be 5 MB or smaller.";
    const supportedExtension = /\.(?:pdf|jpe?g|png|webp)$/i.test(file.name);
    const supportedType = ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type ?? "");
    if (!supportedExtension && !supportedType)
      return "Choose a PDF, JPG, PNG or WEBP supporting document.";
  }
  return null;
}
