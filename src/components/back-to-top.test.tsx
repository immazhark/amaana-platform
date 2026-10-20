import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useState: () => [true, vi.fn()],
  useEffect: vi.fn(),
}));

import { BackToTop } from "./back-to-top";

afterEach(() => vi.unstubAllGlobals());

describe("BackToTop keyboard destination", () => {
  it.each([false, true])("focuses main before scrolling, reduced motion=%s", reduced => {
    const order: string[] = [];
    const focus = vi.fn(() => order.push("focus"));
    const scrollTo = vi.fn(() => order.push("scroll"));
    const querySelector = vi.fn(() => ({ focus }));
    vi.stubGlobal("document", { querySelector });
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: reduced })),
      scrollTo,
    });

    const button = BackToTop();
    if (!button) throw new Error("Expected visible back-to-top button");
    button.props.onClick();

    expect(querySelector).toHaveBeenCalledWith("main#main");
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: reduced ? "auto" : "smooth" });
    expect(order).toEqual(["focus", "scroll"]);
  });

  it("still scrolls when the main landmark is unavailable", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("document", { querySelector: vi.fn(() => null) });
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: false })),
      scrollTo,
    });

    const button = BackToTop();
    if (!button) throw new Error("Expected visible back-to-top button");
    expect(() => button.props.onClick()).not.toThrow();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
