import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));

import { AppealSearchForm } from "./appeal-search-form";

const render = (query = "", invalid = false, active = false) =>
  renderToStaticMarkup(<AppealSearchForm query={query} invalid={invalid} active={active} />);

describe("public appeal search semantics", () => {
  it("exposes a named search landmark with an associated visible field label", () => {
    const html = render();
    expect(html.match(/<form\b[^>]*>/)?.[0]).toContain('role="search"');
    expect(html).toContain('aria-label="Search active appeals"');
    expect(html).toContain('for="appeal-search"');
    expect(html).toContain('id="appeal-search"');
  });

  it("advertises the mobile search action while preserving native bounded GET submission", () => {
    const html = render();
    expect(html.match(/<input\b[^>]*>/)?.[0]).toContain('enterKeyHint="search"');
    expect(html).toContain('type="search"');
    expect(html).toContain('name="q"');
    expect(html).toContain('maxLength="80"');
    expect(html).toContain('method="get"');
    expect(html).toContain('action="/appeals#current-appeals"');
    expect(html).toContain('type="submit"');
  });

  it("escapes accepted search text and retains the active clear-search destination", () => {
    const html = render('synthetic "<tag>&', false, true);
    expect(html).toContain('value="synthetic &quot;&lt;tag&gt;&amp;"');
    expect(html).not.toContain("<tag>");
    expect(html).toContain('href="/appeals#current-appeals"');
    expect(html).toContain("Clear appeal search");
  });

  it("associates rejected-search recovery with the empty field", () => {
    const html = render("", true);
    expect(html).toContain('value=""');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="appeal-search-help appeal-search-error"');
    expect(html).toContain('id="appeal-search-error" role="status"');
    expect(html).toContain("Do not enter personal or case details.");
  });

  it("does not announce an error or expose a clear-search action before a search", () => {
    const html = render();
    expect(html).toContain('aria-describedby="appeal-search-help"');
    expect(html).not.toContain('aria-invalid="true"');
    expect(html).not.toContain('id="appeal-search-error"');
    expect(html).not.toContain("Clear appeal search");
  });
});
