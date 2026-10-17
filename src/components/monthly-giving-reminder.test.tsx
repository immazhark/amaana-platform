import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MonthlyGivingReminder } from "./monthly-giving-reminder";

describe("monthly calendar planner disclosure", () => {
  it("renders the date choice and direct download, never a payment form", () => {
    const html = renderToStaticMarkup(<MonthlyGivingReminder/>);
    expect(html).toContain("up to ten");
    expect(html).toContain("every Friday");
    expect(html).toContain("Day of each month");
    expect(html).toContain("Day 28");
    expect(html).toContain('<option value="last">Last day of the month</option>');
    expect(html).toContain("Download one-date reminder");
    expect(html).toContain("not a subscription");
    expect(html).toContain("does not collect donor information");
    expect((html.match(/action="\/api\/giving-reminder"/g) ?? [])).toHaveLength(4);
    expect(html).not.toContain('name="email"');
    expect(html).toContain("confirm dates with your local masjid");
  });
});

it("renders a recoverable schedule error without reflecting query text", () => {
  const html = renderToStaticMarkup(<MonthlyGivingReminder invalid />);
  expect(html).toContain('role="alert"');
  expect(html).toContain("Choose a valid schedule below");
});

it("keeps calendar serialization and browser download scripting out of the client surface", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(new URL("./monthly-giving-reminder.tsx", import.meta.url), "utf8");
  expect(source).not.toContain('"use client"');
  expect(source).not.toContain("createObjectURL");
  expect(source).not.toContain("document.createElement");
});
