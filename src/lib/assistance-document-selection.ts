/** Browser-only evidence admission. The server independently validates
 * size, count, MIME and file signatures before private storage. */
export const MAX_ASSISTANCE_DOCUMENTS = 5;
export const MAX_ASSISTANCE_DOCUMENT_BYTES = 5 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

type EvidenceCandidate = Pick<File, "name" | "size" | "type">;

export function assistanceDocumentSelectionIssue(files: readonly EvidenceCandidate[]): string | null {
  if (files.length > MAX_ASSISTANCE_DOCUMENTS) return "Choose no more than five supporting documents.";
  for (const file of files) {
    if (!Number.isSafeInteger(file.size) || file.size <= 0)
      return "A supporting document is empty or invalid. Choose a non-empty file.";
    if (file.size > MAX_ASSISTANCE_DOCUMENT_BYTES)
      return "Each supporting document must be 5 MB or smaller.";
    if (!SUPPORTED_TYPES.has(file.type))
      return "Choose a PDF, JPEG, PNG or WebP supporting document.";
  }
  return null;
}
