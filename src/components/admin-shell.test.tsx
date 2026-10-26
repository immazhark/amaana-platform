import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("@/components/admin-navigation", () => ({ AdminNavigation: () => <nav aria-label="Admin navigation"><a href="/admin/media">Media</a></nav> }));
import { AdminShell } from "./admin-shell";

describe("admin task content bypass", () => {
  it("provides a focusable content target after the repeated sidebar", () => {
    const html = renderToStaticMarkup(<AdminShell userName="Synthetic staff" roleNames={[]} permissions={[]}><button>Task action</button></AdminShell>);
    expect(html).toContain('<a class="v2-skip-link" href="#admin-content">Skip to admin content</a>');
    expect(html).toMatch(/<\/aside><div id="admin-content" class="admin-content" tabindex="-1"><button>Task action<\/button>/);
    expect(html.indexOf('href="#admin-content"')).toBeLessThan(html.indexOf('<aside'));
    expect([...html.matchAll(/id="admin-content"/g)]).toHaveLength(1);
    expect(html).not.toContain('<main');
  });
});
