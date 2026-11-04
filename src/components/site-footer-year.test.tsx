import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/contact" }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: () => null }));

import { SiteFooter } from "./site-footer";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

it.each([
  { instant: "2026-12-31T18:29:59.000Z", expectedYear: "2026" },
  { instant: "2026-12-31T18:30:00.000Z", expectedYear: "2027" },
  { instant: "2027-01-01T00:00:00.000Z", expectedYear: "2027" },
])("renders the Hyderabad copyright year at $instant", ({ instant, expectedYear }) => {
  vi.stubEnv("TZ", "UTC");
  vi.useFakeTimers();
  vi.setSystemTime(new Date(instant));

  const markup = renderToStaticMarkup(<SiteFooter />);
  expect(markup).toContain(`© ${expectedYear} Amaana Foundation · Hyderabad, Telangana`);
});

it("renders the five approved official social channels, including LinkedIn and Threads", () => {
  const markup = renderToStaticMarkup(<SiteFooter />);
  expect(markup).toContain('href="https://www.linkedin.com/company/amaanafoundation"');
  expect(markup).toContain('href="https://www.threads.com/@amaanafoundation"');
  expect(markup).not.toContain('href="https://www.threads.net/@amaanafoundation"');
  expect(markup.match(/class="footer-social-icon"/g)).toHaveLength(5);
  expect(markup).toContain('aria-label="LinkedIn — opens in a new tab"');
});
