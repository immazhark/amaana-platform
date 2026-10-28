import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
const hooks = vi.hoisted(() => ({ values: [] as unknown[], index: 0 }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = hooks.index++;
    return [index in hooks.values ? hooks.values[index] : initial, vi.fn()];
  },
  useRef: (current: unknown) => ({ current }),
  useEffect: vi.fn(),
  useCallback: (callback: unknown) => callback,
}));
vi.mock("next/link", () => ({ default: "a" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
import { IslamicCompanionPanel } from "./islamic-companion-panel";
import { IslamicCompanion } from "./islamic-companion";
import { AssistanceForm } from "./assistance-form";

function assertNewTabContext(markup: string, expectedCount: number) {
  const links = [...markup.matchAll(/<a\b[^>]*target="_blank"[^>]*>([\s\S]*?)<\/a>/g)];
  expect(links).toHaveLength(expectedCount);
  for (const [link, content] of links) {
    expect(link).toMatch(/rel="[^"]*noreferrer/);
    expect(content?.match(/opens in a new tab/g) ?? []).toHaveLength(1);
    expect(content).toContain('<span class="sr-only"> (opens in a new tab)</span>');
  }
}
function state(values: unknown[]) { hooks.values = values; hooks.index = 0; }
const now = new Date("2026-10-30T04:30:00.000Z");
const moon = { day: 1, month: 1, label: "Synthetic confirmed date", authority: "Synthetic authority", sourceUrl: "https://example.org/synthetic-announcement" };

describe("source and assistance new-tab context", () => {
  it("announces both daily reading source tabs", () => {
    state([]);
    const html = renderToStaticMarkup(IslamicCompanionPanel({ panel: "readings", date: "2026-10-30", now,
      onClose: vi.fn(), onPanelChange: vi.fn(), onMoonChange: vi.fn() }));
    assertNewTabContext(html, 2);
    expect(html).toContain("https://quran.com/");
  });
  it("announces moon and prayer calculation source tabs", () => {
    state([{ today: { date: "2026-10-30", timings: { Fajr: "05:00", Sunrise: "06:15", Dhuhr: "12:30", Asr: "16:00", Maghrib: "18:00", Isha: "20:00" } },
      tomorrow: null, school: "1", method: "Synthetic method", asr: "Hanafi", note: "Synthetic note", moon, eveningMoon: moon }]);
    const html = renderToStaticMarkup(IslamicCompanionPanel({ panel: "prayers", date: "2026-10-30", now,
      onClose: vi.fn(), onPanelChange: vi.fn(), onMoonChange: vi.fn() }));
    assertNewTabContext(html, 2);
    expect(html).toContain(moon.sourceUrl);
    expect(html).toContain("https://aladhan.com/calculation-methods");
  });
  it("announces the current reminder source tab", () => {
    state([null, now]);
    assertNewTabContext(renderToStaticMarkup(IslamicCompanion()), 1);
  });
  it("announces the assistance follow-up contact tab", () => {
    state([4, 4, "Synthetic uncertain response", {}, "followup"]);
    const copy = { heading: "Synthetic heading", descriptionHelp: "Synthetic help", evidenceInstructions: "Synthetic instruction", evidenceHelp: "Synthetic help", privacyNote: "Synthetic privacy", consentHelp: "Synthetic consent", termsNotice: "Synthetic terms" };
    const html = renderToStaticMarkup(AssistanceForm({ copy }));
    assertNewTabContext(html, 1);
    expect(html).toContain('href="/contact"');
  });
});
