import { Children, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlobalError from "./global-error";

function recoveryDestinations(node: ReactNode): { type: unknown; href: string; onClick: unknown }[] {
  return Children.toArray(node).flatMap(child => {
    if (!isValidElement<{ children?: ReactNode; href?: string; onClick?: unknown }>(child)) return [];
    const destination = child.props.href ? [{ type: child.type, href: child.props.href, onClick: child.props.onClick }] : [];
    return [...destination, ...recoveryDestinations(child.props.children)];
  });
}

describe("root error boundary recovery", () => {
  it("leaves recovery navigation to the browser when the client router has failed", () => {
    const page = GlobalError({ error: new Error("Synthetic root failure"), reset: vi.fn() });
    expect(recoveryDestinations(page)).toEqual([
      { type: "a", href: "/", onClick: undefined },
      { type: "a", href: "/contact", onClick: undefined },
    ]);
  });
  it("provides usable internal escape links when the root app cannot recover", () => {
    const markup = renderToStaticMarkup(<GlobalError error={new Error("Synthetic failure")} reset={vi.fn()} />);
    expect(markup).toContain('href="/"');
    expect(markup).toContain('href="/contact"');
    expect(markup).toContain(">Return home</a>");
    expect(markup).toContain(">Contact Amaana</a>");
  });

  it("keeps the failure message and digest out of public error markup", () => {
    const error = Object.assign(new Error("SYNTHETIC_PRIVATE_FAILURE"), { digest: "SYNTHETIC_PRIVATE_DIGEST" });
    const markup = renderToStaticMarkup(<GlobalError error={error} reset={vi.fn()} />);
    expect(markup).not.toContain("SYNTHETIC_PRIVATE_FAILURE");
    expect(markup).not.toContain("SYNTHETIC_PRIVATE_DIGEST");
    expect(markup).toContain("Try again");
  });
});
