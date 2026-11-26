// A paginated PDF of an ordinary donation acknowledgement (brief v1.1 section 12). Hand-written PDF 1.4 using the
// built-in Helvetica faces, so there is no font file, no library and no network call: the output is a pure function of its
// input. It states what Amaana received and for what purpose, and says plainly that it is NOT a tax receipt, NOT an 80G
// certificate and NOT Form 10BE. It carries no registration or tax identifier, because none is verified here.

export type AcknowledgementPdfInput = {
  referenceNumber: string;
  receiptNumber: string | null;
  donorName: string | null;
  /** Whole donation in rupees (excludes any covered gateway fee). */
  amount: number;
  /** The donation's own refunded share, in rupees. */
  refundedAmount: number;
  /** Gateway fee the donor chose to cover, in rupees. */
  feeContributionAmount: number;
  recordDate: Date;
  /** What the gift was for, one line each, already in plain words. */
  purposeLines: string[];
};

export const NOT_A_TAX_RECEIPT =
  "This is an ordinary donation acknowledgement. It is not a tax receipt, not a Section 80G certificate and not Form 10BE, and it does not state that any deduction is available.";

const PAGE = { width: 595, height: 842, margin: 56 };
const LEFT = PAGE.margin;
const WRAP_COLUMNS = 82;

/** Standard-font text can only show Latin-1. Anything else is dropped, never guessed at, and the caller is told. */
export function isLatin1Printable(value: string): boolean {
  return [...value].every(char => {
    const code = char.codePointAt(0)!;
    return (code >= 32 && code <= 126) || (code >= 160 && code <= 255);
  });
}

function escapeText(value: string): string {
  return value.replace(/[\\()]/g, match => `\\${match}`);
}

// Upper bounds for ASCII glyph advances in Helvetica and Helvetica-Bold, in 1/1000 em.
// The Latin-1 WinAnsi range has no advance wider than the conservative 1015-unit bound.
const ASCII_ADVANCES = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  1015, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
] as const;
const glyphAdvance = (char: string) => ASCII_ADVANCES[char.charCodeAt(0) - 32] ?? 1015;

function wrap(text: string, size: number): string[] {
  const lines: string[] = [];
  const limit = Math.floor((PAGE.width - 2 * PAGE.margin) * 1000 / size);
  let current = "";
  let width = 0;
  const flush = () => {
    if (current) lines.push(current);
    current = "";
    width = 0;
  };
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    const word = raw.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
    let advance = 0;
    for (const char of word) advance += glyphAdvance(char);
    if (current && (width + 278 + advance > limit || current.length + 1 + word.length > WRAP_COLUMNS)) flush();
    if (current) { current += " "; width += 278; }
    for (const char of word) {
      const step = glyphAdvance(char);
      if (width + step > limit || current.length >= WRAP_COLUMNS) flush();
      current += char;
      width += step;
    }
  }
  flush();
  return lines;
}

const rupees = (value: number) => `INR ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateText = (value: Date) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(value);

type Draw = { x: number; y: number; size: number; bold: boolean; text: string };

/** Positioned lines for each page, with a reserved disclaimer/footer on every page. */
export function acknowledgementPages(input: AcknowledgementPdfInput): Draw[][] {
  const pages: Draw[][] = [[]];
  let out = pages[0]!;
  const footer = [
    ...wrap(NOT_A_TAX_RECEIPT, 10).map(text => ({ text, bold: true })),
    ...wrap("Thank you for your trust. Please keep this document for your own records. Do not share your private acknowledgement link or this document with anyone you do not trust.", 10).map(text => ({ text, bold: false })),
  ];
  const footerTop = PAGE.margin + 20 + (footer.length - 1) * 16;
  const bodyFloor = footerTop + 24;
  let y = PAGE.height - PAGE.margin - 20;
  const startContinuation = () => {
    out = [];
    pages.push(out);
    y = PAGE.height - PAGE.margin - 20;
    out.push({ x: LEFT, y, size: 14, bold: true, text: "Amaana Foundation" });
    y -= 24;
    out.push({ x: LEFT, y, size: 11, bold: false, text: "Donation acknowledgement (continued)" });
    y -= 24;
    // Real receipt references are bounded by the private route's existing contract.
    if (/^[A-Za-z0-9-]{8,80}$/.test(input.referenceNumber)) {
      for (const text of wrap(`Reference: ${input.referenceNumber}`, 11)) {
        out.push({ x: LEFT, y, size: 11, bold: false, text });
        y -= 17;
      }
    }
  };
  const add = (text: string, size = 11, bold = false, gap = size + 6) => {
    for (const line of wrap(text, size)) {
      if (y < bodyFloor) startContinuation();
      out.push({ x: LEFT, y, size, bold, text: line });
      y -= gap;
    }
  };

  add("Amaana Foundation", 20, true, 30);
  add("Donation acknowledgement", 14, false, 30);
  add(`Reference: ${input.referenceNumber}`, 12, true);
  if (input.receiptNumber) add(`Acknowledgement number: ${input.receiptNumber}`);
  add(`Date recorded: ${dateText(input.recordDate)}`);
  const nameShown = input.donorName && isLatin1Printable(input.donorName.trim()) ? input.donorName.trim() : null;
  add(nameShown ? `Donor: ${nameShown}` : "Donor: the name on your private record (not shown in this format)");
  y -= 8;
  add(`Contribution received: ${rupees(input.amount)}`, 13, true, 22);
  if (input.feeContributionAmount > 0) add(`Payment processing cost you chose to cover: ${rupees(input.feeContributionAmount)}`);
  if (input.refundedAmount > 0) add(`Refunded to you: ${rupees(input.refundedAmount)}`);
  add("Payment status: verified");
  y -= 8;
  add("Purpose", 12, true, 20);
  for (const line of input.purposeLines) add(line);
  for (const [index, page] of pages.entries()) {
    footer.forEach((line, i) => page.push({ x: LEFT, y: footerTop - i * 16, size: 10, ...line }));
    if (pages.length > 1) page.push({ x: LEFT, y: PAGE.margin, size: 10, bold: false, text: `Page ${index + 1} of ${pages.length}` });
  }
  return pages;
}

/** Flat layout inspection retained for existing consumers. */
export function acknowledgementLines(input: AcknowledgementPdfInput): Draw[] {
  return acknowledgementPages(input).flat();
}

const latin1 = (text: string) => Buffer.from(text, "latin1");

/** A complete PDF file for the given acknowledgement. */
export function buildAcknowledgementPdf(input: AcknowledgementPdfInput): Buffer {
  const pages = acknowledgementPages(input);
  // Keep the original object numbering for one-page receipts; append page/stream pairs as needed.
  const pageId = (index: number) => index === 0 ? 3 : 8 + (index - 1) * 2;
  const pageObjects = (lines: Draw[], index: number): [Buffer, Buffer] => {
    const content = lines
      .map(line => `BT /${line.bold ? "F2" : "F1"} ${line.size} Tf ${line.x} ${line.y} Td (${escapeText(line.text)}) Tj ET`)
      .join("\n");
    const stream = latin1(content);
    return [
      latin1(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents ${pageId(index) + 1} 0 R >>`),
      Buffer.concat([latin1(`<< /Length ${stream.length} >>\nstream\n`), stream, latin1("\nendstream")]),
    ];
  };
  const kids = pages.map((_, index) => `${pageId(index)} 0 R`).join(" ");
  const objects: Buffer[] = [
    latin1("<< /Type /Catalog /Pages 2 0 R >>"),
    latin1(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`),
    ...pageObjects(pages[0]!, 0),
    latin1("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),
    latin1("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"),
    latin1("<< /Title (Amaana Foundation donation acknowledgement) /Producer (Amaana Foundation) >>"),
  ];
  for (let index = 1; index < pages.length; index++) objects.push(...pageObjects(pages[index]!, index));

  const parts: Buffer[] = [latin1("%PDF-1.4\n")];
  const offsets: number[] = [];
  let position = parts[0]!.length;
  objects.forEach((body, index) => {
    offsets.push(position);
    const chunk = Buffer.concat([latin1(`${index + 1} 0 obj\n`), body, latin1("\nendobj\n")]);
    parts.push(chunk);
    position += chunk.length;
  });
  const xrefAt = position;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  parts.push(latin1(xref));
  return Buffer.concat(parts);
}

export type AcknowledgementPurposeInput = {
  givingIntentLabel: string;
  appeal: { title: string } | null;
  fund: { name: string } | null;
  campaign: { title: string; units: number; unitLabel: string; unitPrice: number } | null;
  sponsorship: { programme: string; units: number; months: number; monthlyRate: number } | null;
};

/** The purpose lines, worded as the on-screen acknowledgement words them, from the figures recorded on the donation
 * itself (never today's catalogue or campaign price). */
export function acknowledgementPurposeLines(input: AcknowledgementPurposeInput): string[] {
  const lines: string[] = [];
  if (input.appeal) lines.push(`Appeal: ${input.appeal.title}`);
  else if (input.fund) lines.push(`Fund: ${input.fund.name}`);
  if (input.campaign) lines.push(`${input.campaign.title}: ${input.campaign.units} ${input.campaign.unitLabel} x ${rupees(input.campaign.unitPrice)}`);
  if (input.sponsorship) {
    const { programme, units, months, monthlyRate } = input.sponsorship;
    lines.push(`${programme}: ${units} ${units === 1 ? "unit" : "units"} x ${months} ${months === 1 ? "month" : "months"} x ${rupees(monthlyRate)} a month. A gift to the programme: it does not name or reserve a student, and it is paid once.`);
  }
  lines.push(`Giving intention: ${input.givingIntentLabel}`);
  return lines;
}
