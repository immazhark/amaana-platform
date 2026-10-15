import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: null as string | null }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
vi.mock("@/components/navigation-link", () => ({ default: "a" }));
import Link from "./navigation-link";
import { SiteHeader } from "./site-header";
import { FooterNavGroup } from "./footer-nav-group";

afterEach(() => { navigation.pathname = null; });

describe("navigation while the router pathname is unavailable", () => {
  it("renders the header with a closed mobile menu and no invented current route", () => {
    const html = renderToStaticMarkup(<SiteHeader />);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('href="/donate"');
    expect(html).not.toContain('aria-current="page"');
    expect(html).not.toContain('aria-label="Close navigation menu"');
  });

  it("keeps footer links available without calling string methods on null", () => {
    const html = renderToStaticMarkup(<FooterNavGroup label="Giving">
      <Link href="/donate">Donate</Link><Link href="/appeals">Appeals</Link>
    </FooterNavGroup>);
    expect(html).toContain('href="/donate"');
    expect(html).not.toContain('aria-current="page"');
  });

  for (const pathname of ["/donate", "/donate/education"]) {
    it(`retains current-section feedback for ${pathname}`, () => {
      navigation.pathname = pathname;
      const html = renderToStaticMarkup(<FooterNavGroup label="Giving"><Link href="/donate">Donate</Link><Link href="/appeals">Appeals</Link></FooterNavGroup>);
      expect(html).toContain('href="/donate" aria-current="page"');
      expect(html).not.toContain('href="/appeals" aria-current');
    });
  }

  it("does not mistake a sibling prefix for the current footer section", () => {
    navigation.pathname = "/donate-other";
    expect(renderToStaticMarkup(<FooterNavGroup label="Giving"><Link href="/donate">Donate</Link></FooterNavGroup>))
      .not.toContain('aria-current="page"');
  });
});
