// A plain, single-page PDF of an ordinary donation acknowledgement (brief v1.1 section 12). Hand-written PDF 1.4 using the
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

function wrap(text: string, columns = WRAP_COLUMNS): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (current && (current + " " + word).length > columns) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const rupees = (value: number) => `INR ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateText = (value: Date) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(value);

type Draw = { x: number; y: number; size: number; bold: boolean; text: string };

/** Everything the page shows, as positioned lines. Exported so the layout can be tested without parsing a PDF. */
export function acknowledgementLines(input: AcknowledgementPdfInput): Draw[] {
  const out: Draw[] = [];
  let y = PAGE.height - PAGE.margin;
  const add = (text: string, size = 11, bold = false, gap = size + 6) => {
    out.push({ x: LEFT, y, size, bold, text });
    y -= gap;
  };
  const block = (text: string, size = 11, bold = false) => { for (const line of wrap(text)) add(line, size, bold); };

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
  for (const line of input.purposeLines) block(line);
  y -= 10;
  block(NOT_A_TAX_RECEIPT, 10, true);
  y -= 6;
  block("Thank you for your trust. Please keep this page for your own records. Do not share your private acknowledgement link or this document with anyone you do not trust.", 10);
  return out;
}

const latin1 = (text: string) => Buffer.from(text, "latin1");

/** A complete PDF file for the given acknowledgement. */
export function buildAcknowledgementPdf(input: AcknowledgementPdfInput): Buffer {
  const content = acknowledgementLines(input)
    .map(line => `BT /${line.bold ? "F2" : "F1"} ${line.size} Tf ${line.x} ${line.y} Td (${escapeText(line.text.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?"))}) Tj ET`)
    .join("\n");
  const stream = latin1(content);

  const objects: Buffer[] = [
    latin1("<< /Type /Catalog /Pages 2 0 R >>"),
    latin1("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    latin1(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`),
    Buffer.concat([latin1(`<< /Length ${stream.length} >>\nstream\n`), stream, latin1("\nendstream")]),
    latin1("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),
    latin1("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"),
    latin1("<< /Title (Amaana Foundation donation acknowledgement) /Producer (Amaana Foundation) >>"),
  ];

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
