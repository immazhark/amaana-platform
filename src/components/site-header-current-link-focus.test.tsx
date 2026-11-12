import { isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ pathname: "/our-work", writes: vi.fn(), focus: vi.fn(), ref: 0 }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: () => [state.pathname, state.writes],
  useRef: () => ({ current: state.ref++ === 0 ? { focus: state.focus } : null }),
  useEffect: () => undefined,
}));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("next/link", () => ({ default: () => null }));
vi.mock("next/image", () => ({ default: () => null }));
import { SiteHeader } from "./site-header";

afterEach(() => { state.writes.mockClear(); state.focus.mockClear(); state.ref = 0; });

type LinkProps = { href: string; onClick: (event: object) => void; children?: ReactNode; id?: string };
function links(node: ReactNode): ReactElement<LinkProps>[] {
  if (Array.isArray(node)) return node.flatMap(links);
  if (!isValidElement<LinkProps>(node)) return [];
  if (node.props.href && node.props.onClick) return [node];
  return links(node.props.children);
}
function mobileLinks(pathname: string) {
  state.pathname = pathname;
  const root = SiteHeader();
  const header = (root.props.children as ReactElement<{ children?: ReactNode }>[])[0];
  const nav = (header?.props.children as ReactElement<LinkProps>[]).find(child => child.props.id === "mobile-navigation");
  if (!nav) throw new Error("Expected the mobile navigation");
  return links(nav);
}
function click(link: ReactElement<LinkProps>, modifiers: object = {}) {
  link.props.onClick({ currentTarget: { pathname: link.props.href }, button: 0, ...modifiers });
}

it.each(["/our-work", "/contact", "/donate"])("restores toggle focus when the current mobile destination %s is selected", pathname => {
  const link = mobileLinks(pathname).find(item => item.props.href === pathname);
  if (!link) throw new Error("Expected current mobile link");
  click(link);
  expect(state.writes).toHaveBeenCalledWith(null);
  expect(state.focus).toHaveBeenCalledOnce();
});

it("leaves destination focus management to Next when a mobile link changes the pathname", () => {
  const link = mobileLinks("/our-work").find(item => item.props.href === "/contact");
  if (!link) throw new Error("Expected mobile Contact link");
  click(link);
  expect(state.writes).toHaveBeenCalledWith(null);
  expect(state.focus).not.toHaveBeenCalled();
});

it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }])(
  "does not steal focus from a browser-owned current-route activation with %j", modifiers => {
    const link = mobileLinks("/contact").find(item => item.props.href === "/contact");
    if (!link) throw new Error("Expected mobile Contact link");
    click(link, modifiers);
    expect(state.focus).not.toHaveBeenCalled();
  },
);
