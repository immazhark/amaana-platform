
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
    .filter(paragraph => {
      const normalizedParagraph = normalizePublicCopy(paragraph);
      if (!normalizedSummary || !normalizedParagraph) return true;
      if (normalizedParagraph === normalizedSummary) return false;
      const shorter = Math.min(normalizedParagraph.length, normalizedSummary.length);
      const longer = Math.max(normalizedParagraph.length, normalizedSummary.length);
      const substantiallySameLength = shorter / longer >= 0.75;
      return !(substantiallySameLength && (
        normalizedParagraph.includes(normalizedSummary) ||
        normalizedSummary.includes(normalizedParagraph)
      ));
    });
}

export function buildPublicRecordFallback({
  metric,
  metricLabel,
}: {
  metric?: string | null;
  metricLabel?: string | null;
}) {
  const metricSentence = metric
    ? `The documented outcome for this work is ${metric}${metricLabel ? ` ${metricLabel}` : ""}.`
    : "";
  const privacySentence = `Only information suitable for public sharing is included here; personal documents and sensitive details remain private.`;
  return [metricSentence, privacySentence].filter(Boolean).join(" ");
}

/** The hero displays a teaser; the detail section must retain the complete record. */
export function programmeStoryParagraphs(summary: string, story?: string | null) {
  const text = story?.trim() || summary.trim();
  const seen = new Set<string>();
  return text.split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(paragraph => {
    if (!paragraph) return false;
    const normalized = normalizePublicCopy(paragraph);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}
