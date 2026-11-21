import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PublicFundRow } from "@/lib/public-fund-ledger";
import { PublicFundLedgerView } from "./public-fund-ledger-view";

const entry = (n: number, pool: "ZAKAT" | "NON_ZAKAT" = "NON_ZAKAT") => ({ id: `e${n}`, fundId: "f", title: `Entry ${n}`, publicSummary: n === 1 ? "Kits for 25 children" : null, amountPaise: 5_000_000, spentOn: "2026-11-1" + n, pool });
const row = (over: Partial<PublicFundRow> = {}): PublicFundRow => ({ slug: "orphan", name: "Orphan Fund", summary: "s", zakatPolicy: "ACCEPTED", receivedPaise: 10_000_000, spentPaise: 5_000_000, heldPaise: 5_000_000, spentShare: 0.5, entries: [entry(1)], ...over });
const render = (rows: PublicFundRow[], years = ["2026-27"]) => renderToStaticMarkup(<PublicFundLedgerView rows={rows} totals={{ receivedPaise: 10_000_000, spentPaise: 5_000_000, heldPaise: 5_000_000 }} year="2026-27" years={years} />);

describe("public fund ledger view", () => {
  it("shows received, spent and held in Indian-format rupees, with the method note", () => {
    const html = render([row()]);
    expect(html).toContain("₹1,00,000");
    expect(html).toContain("₹50,000");
    expect(html).toContain("Held for this fund");
    expect(html).toContain("Payments still waiting for bank verification are never counted");
  });
  it("states the share spent in text so the meter is never the only signal", () => {
    expect(render([row()])).toContain("50% of what was received this year has been spent and published.");
    expect(render([row({ receivedPaise: 0, spentPaise: 0, heldPaise: 0, spentShare: 0, entries: [] })])).toContain("No gifts recorded in this financial year yet.");
  });
  it("lists published spending with its date, summary and Zakat pool label", () => {
    const html = render([row({ entries: [entry(1), entry(2, "ZAKAT")] })]);
    expect(html).toContain("Kits for 25 children");
    expect(html).toContain("Paid from Zakat funds");
    expect(html).toMatch(/datetime="2026-11-11"/i);
  });
  it("previews three entries and keeps the rest in a native disclosure", () => {
    const html = render([row({ entries: [1, 2, 3, 4, 5].map(n => entry(n)) })]);
    expect(html).toContain("Show 2 more entries");
    expect(html).toContain("<details");
    expect(render([row({ entries: [1, 2, 3, 4].map(n => entry(n)) })])).toContain("Show 1 more entry");
    expect(render([row({ entries: [1, 2, 3].map(n => entry(n)) })])).not.toContain("<details");
  });
  it("says plainly when nothing has been published for a fund", () => {
    expect(render([row({ entries: [] })])).toContain("Nothing has been published as spent from this fund in 2026-27 yet.");
  });
  it("offers a year switch only when there is more than one year, marking the current page", () => {
    expect(render([row()])).not.toContain('aria-label="Financial year"');
    const html = render([row()], ["2027-28", "2026-27"]);
    expect(html).toContain('aria-label="Financial year"');
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*>2026-27<\/a>|<a[^>]*href="\/funds\?fy=2026-27"[^>]*aria-current="page"/);
  });
  it("links each fund to its giving page and shows its Zakat position as text", () => {
    const html = render([row(), row({ slug: "dates", name: "Dates Fund", zakatPolicy: "NOT_ACCEPTED" })]);
    expect(html).toContain('href="/give?fund=orphan"');
    expect(html).toContain('href="/give?fund=dates"');
    expect(html).toContain("Zakat accepted");
    expect(html).toContain("Non-Zakat only");
  });
  it("escapes public text rather than injecting markup", () => {
    expect(render([row({ entries: [{ ...entry(1), title: "<img src=x onerror=alert(1)>" }] })])).not.toContain("<img src=x");
  });
});
