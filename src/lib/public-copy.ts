
function normalizePublicCopy(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[“”‘’"'.,;:!?()[\]{}—–-]/g, "")
    .trim()
    .toLocaleLowerCase("en");
}

export function heroTeaser(summary: string) {
  const clean = summary.replace(/\s+/g, " ").trim();
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(sentence => sentence.trim()).filter(Boolean) ?? [];
  if (sentences.length === 0) return clean;
  const first = sentences[0];
  if (first.length <= 180) return first;
  const clipped = first.slice(0, 177).replace(/\s+\S*$/, "").trim();
  return `${clipped}…`;
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
  const metricSentence = metric
    ? `Through this work, Amaana's community came together to provide ${metric}${metricLabel ? ` ${metricLabel}` : ""}.`
    : "";
  const statusSentence = status ? `This ${status.toLowerCase()} effort is part of Amaana's continuing record of service.` : "";
  return [metricSentence, statusSentence, `This page shares what we can responsibly document about ${title} while protecting the dignity and privacy of the people involved.`]
    .filter(Boolean)
    .join(" ");
}
