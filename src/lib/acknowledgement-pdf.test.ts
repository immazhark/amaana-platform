import { describe, expect, it } from "vitest";
import { NOT_A_TAX_RECEIPT, acknowledgementLines, buildAcknowledgementPdf, isLatin1Printable, type AcknowledgementPdfInput } from "./acknowledgement-pdf";

const base: AcknowledgementPdfInput = {
  referenceNumber: "AFD-2026-37563771", receiptNumber: "AFR-2026-000123", donorName: "Synthetic Donor", amount: 1250,
  refundedAmount: 0, feeContributionAmount: 0, recordDate: new Date("2026-11-22T02:20:00Z"), purposeLines: ["Foundation Operations Fund"],
};
const asText = (pdf: Buffer) => pdf.toString("latin1");
const shown = (input: Partial<AcknowledgementPdfInput> = {}) => acknowledgementLines({ ...base, ...input }).map(line => line.text);

describe("PDF structure", () => {
  const pdf = buildAcknowledgementPdf(base);
  const text = asText(pdf);

  it("is a complete, well-formed PDF 1.4 file", () => {
    expect(text.startsWith("%PDF-1.4\n")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(text).toContain("/Type /Catalog");
    expect(text).toContain("/BaseFont /Helvetica ");
  });

  it("has a cross-reference table whose offsets point at the objects they name", () => {
    const startxref = Number(/startxref\n(\d+)\n%%EOF/.exec(text)![1]);
    expect(text.slice(startxref, startxref + 4)).toBe("xref");
    const entries = [...text.slice(startxref).matchAll(/^(\d{10}) 00000 n $/gm)].map(match => Number(match[1]));
    expect(entries).toHaveLength(7);
    entries.forEach((offset, index) => expect(text.slice(offset, offset + `${index + 1} 0 obj`.length)).toBe(`${index + 1} 0 obj`));
    expect(/trailer\n<< \/Size 8 \/Root 1 0 R/.test(text)).toBe(true);
  });

  it("declares a content length that matches the stream", () => {
    const length = Number(/\/Length (\d+) >>\nstream\n/.exec(text)![1]);
    const start = text.indexOf("stream\n") + "stream\n".length;
    expect(text.slice(start, start + length).endsWith("Tj ET")).toBe(true);
    expect(text.slice(start + length, start + length + "\nendstream".length)).toBe("\nendstream");
  });

  it("is deterministic and carries no timestamp or identifier that varies between runs", () => {
    expect(buildAcknowledgementPdf(base).equals(buildAcknowledgementPdf(base))).toBe(true);
    expect(text).not.toMatch(/CreationDate|ModDate|\/ID/);
  });
});

describe("what the page says", () => {
  it("states the reference, date, donor, amount, purpose and verified status", () => {
    const lines = shown();
    expect(lines).toContain("Reference: AFD-2026-37563771");
    expect(lines).toContain("Acknowledgement number: AFR-2026-000123");
    expect(lines).toContain("Date recorded: 22 November 2026");
    expect(lines).toContain("Donor: Synthetic Donor");
    expect(lines).toContain("Contribution received: INR 1,250.00");
    expect(lines).toContain("Payment status: verified");
    expect(lines).toContain("Foundation Operations Fund");
  });

  it("uses Indian digit grouping and never the rupee sign, which the built-in font cannot show", () => {
    expect(shown({ amount: 1234567.5 })).toContain("Contribution received: INR 12,34,567.50");
    expect(shown().join("")).not.toContain("₹");
  });

  it("always states plainly that it is not a tax receipt, an 80G certificate or Form 10BE", () => {
    const body = shown().join(" ");
    expect(NOT_A_TAX_RECEIPT).toMatch(/not a tax receipt/);
    expect(NOT_A_TAX_RECEIPT).toMatch(/not a Section 80G certificate/);
    expect(NOT_A_TAX_RECEIPT).toMatch(/not Form 10BE/);
    expect(body.replace(/\s+/g, " ")).toContain(NOT_A_TAX_RECEIPT.replace(/\s+/g, " "));
  });

  it("carries no registration, PAN, 12A or 80G number, which are not verified here", () => {
    expect(shown().join(" ")).not.toMatch(/\bPAN\b|12A|12AB|registration (no|number)|\b[A-Z]{5}\d{4}[A-Z]\b/i);
  });

  it("omits the receipt number, fee and refund lines unless they apply, and shows them when they do", () => {
    const plain = shown({ receiptNumber: null });
    expect(plain.some(line => line.startsWith("Acknowledgement number"))).toBe(false);
    expect(plain.some(line => line.startsWith("Refunded to you"))).toBe(false);
    expect(plain.some(line => line.startsWith("Payment processing cost"))).toBe(false);
    const full = shown({ refundedAmount: 100, feeContributionAmount: 29.5 });
    expect(full).toContain("Refunded to you: INR 100.00");
    expect(full).toContain("Payment processing cost you chose to cover: INR 29.50");
  });

  it("never prints a name it cannot show correctly", () => {
    for (const name of ["మహ్మద్ ఖాన్", "محمد خان", "Muhammad 🙂"]) {
      const lines = shown({ donorName: name });
      expect(lines).toContain("Donor: the name on your private record (not shown in this format)");
      expect(lines.join("")).not.toContain("?");
    }
    expect(shown({ donorName: "José Müller" })).toContain("Donor: José Müller");
    expect(shown({ donorName: null }).some(line => line.startsWith("Donor: the name on your private record"))).toBe(true);
  });

  it("wraps a long purpose inside the page and keeps every line on it", () => {
    const long = "Taleem sponsorship: 2 units of Qur'an Nazira for 3 months at INR 1,200 per unit per month, a gift to the programme that does not name or reserve a student and is paid once. ".repeat(3);
    const lines = acknowledgementLines({ ...base, purposeLines: [long] });
    for (const line of lines) {
      expect(line.text.length, line.text).toBeLessThanOrEqual(82);
      expect(line.y).toBeGreaterThan(40);
    }
    const ys = lines.map(line => line.y);
    expect([...ys].sort((a, b) => b - a)).toEqual(ys);
  });
});

describe("escaping", () => {
  it("escapes parentheses and backslashes so a name cannot break out of its text string", () => {
    const text = asText(buildAcknowledgementPdf({ ...base, donorName: String.raw`A\B (C) )) Tj ET BT (injected` }));
    expect(text).toContain(String.raw`(Donor: A\\B \(C\) \)\) Tj ET BT \(injected) Tj ET`);
    // With every correctly escaped string literal removed, only genuine operators remain: one text object per line.
    const stream = text.slice(text.indexOf("stream\n") + 7, text.indexOf("\nendstream"));
    const operators = stream.replace(/\((?:\\.|[^\\)])*\)/g, "()");
    expect((operators.match(/ Tj ET/g) ?? []).length).toBe(acknowledgementLines({ ...base, donorName: "x" }).length);
    expect(operators).not.toContain("injected");
  });
});

describe("isLatin1Printable", () => {
  it("accepts ASCII and Latin-1 letters and rejects anything the font cannot draw", () => {
    expect(isLatin1Printable("Ahmed Khan-O'Neil")).toBe(true);
    expect(isLatin1Printable("Zoë Çelik")).toBe(true);
    for (const bad of ["₹100", "名前", "tab\there", "line\nbreak", "é"]) expect(isLatin1Printable(bad), bad).toBe(false);
  });
});
