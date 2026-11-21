/**
 * Public copy is plain text. Editors and the master copy sometimes carry
 * Markdown emphasis (`**bold**`, `*italic*`), which would otherwise print as
 * literal asterisks. This keeps the words and drops the markers.
 *
 * It is deliberately narrow: only a balanced `*word*` whose opening star is not
 * glued to a preceding word character and whose contents do not start with a
 * space, so arithmetic (`5 * 3 * 2`), star bullets and footnote stars are left
 * alone. No HTML is produced; React still escapes the result.
 */
export function plainPublicText(text: string): string {
  return text
    .replace(/\*\*([^*\n]+?)\*\*/g, "$1")
    .replace(/(^|[^*\w])\*([^*\s][^*\n]*?)\*(?![*\w])/g, "$1$2")
    .replace(/\*\*/g, "");
}
