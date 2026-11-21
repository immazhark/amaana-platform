const DEFAULT_LIMIT = 155;
// A sentence that ends earlier than this leaves a description too thin to be useful.
const MIN_SENTENCE_LENGTH = 70;

/**
 * Clamp a page summary to a search-snippet-sized description.
 *
 * Prefers the last complete sentence that fits. A decimal point is not a
 * boundary (it must be followed by whitespace or the end of the text), so a
 * published value such as 2.5 is never cut to 2. Otherwise clips at a word
 * boundary and adds an ellipsis. Never splits a surrogate pair.
 */
export function metaDescription(text: string, limit = DEFAULT_LIMIT) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;

  const window = clean.slice(0, limit);
  const sentenceEnds = [...window.matchAll(/[.!?](?=\s|$)/g)];
  const lastEnd = sentenceEnds.at(-1);
  if (lastEnd?.index !== undefined && lastEnd.index + 1 >= Math.min(MIN_SENTENCE_LENGTH, limit)) {
    return window.slice(0, lastEnd.index + 1);
  }

  const prefix = clean.slice(0, limit - 1);
  const safe = /[\uD800-\uDBFF]$/.test(prefix) ? prefix.slice(0, -1) : prefix;
  const atWord = clean[safe.length] === " " ? safe : safe.replace(/\s+\S*$/, "");
  const trimmed = atWord.replace(/[\s,;:–—-]+$/, "");
  return `${trimmed}…`;
}
