import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MonthlyGivingReminder } from "./monthly-giving-reminder";

describe("monthly calendar planner disclosure", () => {
  it("renders the date choice and direct download, never a payment form", () => {
    const html = renderToStaticMarkup(<MonthlyGivingReminder/>);
    expect(html).toContain("Reminder frequency");
    expect(html).toContain("Every Friday");
    expect(html).toContain("Day of each month");
    expect(html).toContain("Day 28");
    expect(html).toContain("Download calendar reminder");
    expect(html).toContain("not a subscription");
    expect(html).toContain("does not collect donor information");
    expect(html).not.toContain('action="/api/');
  });
});
