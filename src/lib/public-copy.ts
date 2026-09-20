
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

export function buildPublicRecordFallback({
  title,
  status,
  metric,
  metricLabel,
}: {
  title: string;
  status?: string | null;
  metric?: string | null;
  metricLabel?: string | null;
}) {
  const statusSentence = status
    ? `This ${status.toLowerCase()} record remains part of Amaana's published programme history.`
    : `This record remains part of Amaana's published programme history.`;
  const metricSentence = metric
    ? `The documented public outcome is ${metric}${metricLabel ? ` — ${metricLabel}` : ""}.`
    : "";
  return [statusSentence, metricSentence, `Approved evidence and programme details for ${title} are shown on this page where those records are available.`]
    .filter(Boolean)
    .join(" ");
}
