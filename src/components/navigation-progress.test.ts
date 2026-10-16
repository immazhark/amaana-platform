import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  state: null as { from: string; id: string } | null,
  linkPending: false, id: "link-one", pathname: "/privacy",
  cleanups: [] as (() => void)[],
}));
vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useId: () => hooks.id,
  useState: () => [hooks.state, (update: typeof hooks.state | ((current: typeof hooks.state) => typeof hooks.state)) => {
    hooks.state = typeof update === "function" ? update(hooks.state) : update;
  }],
  useEffect: (effect: () => (() => void) | undefined) => {
    const cleanup = effect();
    if (cleanup) hooks.cleanups.push(cleanup);
  },
}));
vi.mock("next/navigation", () => ({ usePathname: () => hooks.pathname }));
vi.mock("next/link", async importOriginal => ({
  ...await importOriginal<typeof import("next/link")>(),
  useLinkStatus: () => ({ pending: hooks.linkPending }),
}));
import NavigationLink, { NAVIGATION_STATUS_EVENT } from "./navigation-link";
import { NavigationProgress } from "./navigation-progress";

class Anchor {
  href = "https://amaanafoundation.org/terms";
  target = "";
  disabled = false;
  closest() { return this; }
  hasAttribute() { return false; }
  getAttribute() { return this.disabled ? "true" : null; }
  getClientRects() { return [{}]; }
}

function signal(id: string, pending: boolean) {
  window.dispatchEvent(new CustomEvent(NAVIGATION_STATUS_EVENT, { detail: { id, pending, from: "/privacy" } }));
}
function reportLinkStatus() {
  const link = NavigationLink({ href: "/terms", children: "Terms", prefetch: false });
  link.props.children[1].type();
  return link;
}

beforeEach(() => {
  hooks.state = null; hooks.linkPending = false; hooks.id = "link-one"; hooks.pathname = "/privacy";
  const location = { pathname: "/privacy", origin: "https://amaanafoundation.org" };
  const surface = Object.assign(new EventTarget(), { location });
  const classes = new Set<string>();
  vi.stubGlobal("window", surface);
  vi.stubGlobal("location", location);
  vi.stubGlobal("document", Object.assign(new EventTarget(), { body: { classList: {
    add: (name: string) => classes.add(name), remove: (name: string) => classes.delete(name),
  } } }));
  vi.stubGlobal("Element", Anchor);
  NavigationProgress();
});
afterEach(() => {
  hooks.cleanups.splice(0).reverse().forEach(cleanup => cleanup());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("framework navigation feedback", () => {
  it("reports real Next pending state and releases it on completion or unmount", () => {
    hooks.linkPending = true;
    const link = reportLinkStatus();
    expect(link.props.href).toBe("/terms");
    expect(link.props.prefetch).toBe(false);
    expect(hooks.state).toEqual({ from: "/privacy", id: "link-one" });
    hooks.cleanups.pop()?.();
    expect(hooks.state).toBeNull();
  });
  it("does not start feedback for idle, prefetched or cancelled links", () => {
    reportLinkStatus();
    expect(hooks.state).toBeNull();
  });
  it("does not let an older transition completion clear a newer one", () => {
    signal("first", true); signal("second", true); signal("first", false);
    expect(hooks.state?.id).toBe("second");
    signal("second", false);
    expect(hooks.state).toBeNull();
  });
  it("releases abandoned native navigation without trapping page scroll", () => {
    vi.useFakeTimers();
    const event = new Event("click", { cancelable: true });
    Object.defineProperties(event, { target: { value: new Anchor() }, button: { value: 0 } });
    document.dispatchEvent(event);
    expect(hooks.state).toEqual({ from: "/privacy", id: "native" });
    vi.advanceTimersByTime(12_000);
    expect(hooks.state).toBeNull();
  });
  it("keeps a newer transition alive when an old completion arrives", () => {
    vi.useFakeTimers();
    signal("older", true);
    vi.advanceTimersByTime(8_000);
    signal("newer", true);
    signal("older", false);
    expect(hooks.state?.id).toBe("newer");
    vi.advanceTimersByTime(3_999);
    expect(hooks.state?.id).toBe("newer");
    vi.advanceTimersByTime(8_001);
    expect(hooks.state).toBeNull();
  });
  it("ignores stale pending status for a route already left", () => {
    window.dispatchEvent(new CustomEvent(NAVIGATION_STATUS_EVENT, {
      detail: { id: "stale", from: "/other-page", pending: true },
    }));
    expect(hooks.state).toBeNull();
    signal("current", true);
    window.dispatchEvent(new CustomEvent(NAVIGATION_STATUS_EVENT, {
      detail: { id: "stale", from: "/other-page", pending: false },
    }));
    expect(hooks.state).toEqual({ from: "/privacy", id: "current" });
  });
  it("ignores malformed plugin navigation events and invalid native destinations", () => {
    window.dispatchEvent(new CustomEvent(NAVIGATION_STATUS_EVENT));
    window.dispatchEvent(new CustomEvent(NAVIGATION_STATUS_EVENT, {
      detail: { id: "bad", from: "https://external.example", pending: true },
    }));
    window.dispatchEvent(new CustomEvent(NAVIGATION_STATUS_EVENT, {
      detail: { id: "bad", from: "/privacy", pending: "yes" },
    }));
    const anchor = new Anchor();
    anchor.href = "://unparseable";
    const event = new Event("click", { cancelable: true });
    Object.defineProperties(event, { target: { value: anchor }, button: { value: 0 } });
    document.dispatchEvent(event);
    expect(hooks.state).toBeNull();
  });
  it("clears the native-navigation fallback on browser history and pagehide", () => {
    vi.useFakeTimers();
    signal("first", true);
    window.dispatchEvent(new Event("pagehide"));
    expect(hooks.state).toBeNull();
    vi.advanceTimersByTime(15_000);
    expect(hooks.state).toBeNull();
  });
  it("resets feedback when the visitor navigates through browser history", () => {
    signal("first", true);
    window.dispatchEvent(new Event("popstate"));
    expect(hooks.state).toBeNull();
  });
  for (const prevented of [false, true]) {
    it(`retains native-anchor feedback policy (cancelled=${prevented})`, () => {
      const event = new Event("click", { cancelable: true });
      Object.defineProperties(event, { target: { value: new Anchor() }, button: { value: 0 } });
      if (prevented) event.preventDefault();
      document.dispatchEvent(event);
      expect(hooks.state).toEqual(prevented ? null : { from: "/privacy", id: "native" });
    });
  }
});
