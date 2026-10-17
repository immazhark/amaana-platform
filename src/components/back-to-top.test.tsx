import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: () => [true, vi.fn()],
  useEffect: () => {},
}));
import { BackToTop } from "./back-to-top";

afterEach(() => vi.unstubAllGlobals());

describe("back-to-top respects browser motion availability", () => {
  it("uses native non-animated scrolling when matchMedia is unavailable", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { scrollTo });
    BackToTop()?.props.onClick();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });
  it("honors reduced-motion preference when supported", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("window", {
      scrollTo,
      matchMedia: () => ({ matches: true }),
    });
    BackToTop()?.props.onClick();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });
  it("preserves smooth scrolling for visitors without a reduced-motion preference", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("window", {
      scrollTo,
      matchMedia: () => ({ matches: false }),
    });
    BackToTop()?.props.onClick();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
