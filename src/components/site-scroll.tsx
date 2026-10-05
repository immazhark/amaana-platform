"use client";

import { useEffect } from "react";
import type Lenis from "lenis";

const nested = "[data-carousel-mode], .mobile-menu, .amaana-companion-panel, [data-native-scroll], [role='dialog'], dialog, textarea, select, input, iframe";

/** Wheel-only enhancement; native touch, anchors, focus and history retain their semantics. */
export function useSiteScroll(pathname: string) {
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: fine)");
    let instance: Lenis | undefined;
    let loading = false;
    let disposed = false;
    let frame: number | undefined;
    const tick = (time: number) => {
      frame = undefined;
      instance?.raf(time);
      if (frame === undefined && instance?.isScrolling === "smooth" && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const destroy = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      instance?.destroy(); instance = undefined;
    };
    const eligible = () => !disposed && !preference.matches && pointer.matches && !document.hidden;
    const wake = () => { if (instance && frame === undefined) frame = requestAnimationFrame(tick); };
    const initialize = async (event: WheelEvent) => {
      if (!eligible() || event.ctrlKey || event.defaultPrevented || loading || instance) return;
      if (event.target instanceof Element && event.target.closest(nested)) return;
      loading = true;
      try {
        const { default: SmoothScroll } = await import("lenis");
        if (!eligible()) return;
        instance = new SmoothScroll({
          lerp: 0.16, smoothWheel: true, syncTouch: false,
          prevent: node => node.matches(nested),
          virtualScroll: ({ event: input }) => !input.ctrlKey
            && !document.body.matches(".af-menu-lock,.af-navigation-lock")
            && !document.querySelector("[role='dialog'][aria-modal='true'],dialog[open]"),
        });
        instance.on("scroll", wake);
      } finally { loading = false; }
    };
    const wheel = (event: WheelEvent) => {
      if (document.body.matches(".af-menu-lock,.af-navigation-lock")) {
        event.preventDefault();
        return;
      }
      wake();
      void initialize(event);
    };
    const native = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      instance?.scrollTo(window.scrollY, { immediate: true });
    };
    const key = (event: KeyboardEvent) => {
      if (["Tab", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) native();
    };
    const click = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a[href], button, summary")) native();
    };
    const sync = () => { if (!eligible()) destroy(); };
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key, true);
    window.addEventListener("click", click, true);
    window.addEventListener("popstate", native);
    window.addEventListener("hashchange", native);
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", sync); pointer.addEventListener("change", sync);
    return () => {
      disposed = true; destroy();
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("click", click, true);
      window.removeEventListener("popstate", native); window.removeEventListener("hashchange", native);
      document.removeEventListener("visibilitychange", sync);
      preference.removeEventListener("change", sync); pointer.removeEventListener("change", sync);
    };
  }, [pathname]);
}
