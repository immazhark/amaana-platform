
function normalizePublicCopy(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[“”‘’"'.,;:!?()[\]{}—–-]/g, "")
    .trim()
    .toLocaleLowerCase("en");
}

export function distinctStoryParagraphs(summary: string, story: string) {
  const normalizedSummary = normalizePublicCopy(summary);
  return story
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .filter(paragraph => normalizePublicCopy(paragraph) !== normalizedSummary);
}

export const publicRecordFallback =
  "This page preserves the documented public record for this initiative. Additional context is shown through published metrics, approved media and updates where those records are available.";
