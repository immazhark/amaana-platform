import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/get-involved/sponsor-education" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: () => null }));
import { FooterNavGroup } from "./footer-nav-group";
import { SiteHeader } from "./site-header";

it("renders native mobile header navigation when JavaScript is unavailable", () => {
  route.pathname = "/about";
  const markup = renderToStaticMarkup(<SiteHeader />);
  const fallback = markup.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1];
  expect(fallback).toBeDefined();
  expect(fallback).toContain('<details class="mobile-nav-noscript"');
  expect(fallback).toContain('<summary>Site navigation</summary>');
  expect(fallback).toContain('href="/our-work"');
  expect(fallback).toContain('href="/transparency"');
  expect(fallback).not.toContain('id="mobile-navigation"');

  const css = readFileSync(join(process.cwd(), "src/app/experience-finish.css"), "utf8");
  expect(css).toContain('.site-header>noscript>.mobile-nav-noscript{display:none}');
  expect(css).toMatch(/\.site-header>noscript>\.mobile-nav-noscript\s*\{display:block/);
});

it("announces only the actual footer destination as the current page", () => {
  route.pathname = "/get-involved/sponsor-education";
  const html = renderToStaticMarkup(<FooterNavGroup label="Take part"><a href="/get-involved">Get Involved</a><a href="/get-involved/sponsor-education">Sponsor Education</a></FooterNavGroup>);
  expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  expect(html).toContain('href="/get-involved/sponsor-education" aria-current="page"');
  expect(html).not.toContain('href="/get-involved" aria-current="page"');
});

it("does not call a footer parent the current page when no exact destination exists", () => {
  route.pathname = "/contact/feedback";
  const html = renderToStaticMarkup(<FooterNavGroup label="Contact"><a href="/contact">Contact</a></FooterNavGroup>);
  expect(html).not.toContain('aria-current="page"');
});

it("retains the header section highlight without announcing its parent as the current page", () => {
  route.pathname = "/get-involved/sponsor-education";
  const html = renderToStaticMarkup(<SiteHeader />);
  const [scriptedHtml, noScriptHtml] = html.split("<noscript>");
  const parents = [...html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]).filter(anchor => anchor.includes('href="/get-involved"'));
  expect(parents).toHaveLength(3);
  expect(scriptedHtml?.match(/href="\/get-involved"/g)).toHaveLength(2);
  expect(noScriptHtml?.match(/href="\/get-involved"/g)).toHaveLength(1);
  for (const parent of parents) {
    expect(parent).toContain('aria-current="location"');
    expect(parent).toMatch(/class="[^"]*active/);
  }
});

it("still announces an exact header destination as the current page", () => {
  route.pathname = "/get-involved";
  const html = renderToStaticMarkup(<SiteHeader />);
  const [scriptedHtml, noScriptHtml] = html.split("<noscript>");
  const parents = [...html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]).filter(anchor => anchor.includes('href="/get-involved"'));
  expect(parents).toHaveLength(3);
  expect(scriptedHtml?.match(/href="\/get-involved"/g)).toHaveLength(2);
  expect(noScriptHtml?.match(/href="\/get-involved"/g)).toHaveLength(1);
  for (const parent of parents) expect(parent).toContain('aria-current="page"');
});
