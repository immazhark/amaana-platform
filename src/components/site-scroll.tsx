"use client";

import { useEffect } from "react";
import type Lenis from "lenis";

const nested = "[data-carousel-mode], .mobile-menu, .amaana-companion-panel, [data-native-scroll], [role='dialog'], dialog, textarea, select, input, iframe";
const nativeKeyboardNavigation = ["Tab", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];

/** Wheel-only enhancement; native touch, keyboard, anchors, focus and history retain their semantics. */
export function useSiteScroll(pathname: string | null) {
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: fine)");
    let instance: Lenis | undefined;
    let loading = false;
    let disposed = false;
    let generation = 0;
    let frame: number | undefined;
    const tick = (time: number) => {
      frame = undefined;
      instance?.raf(time);
      if (frame === undefined && instance?.isScrolling === "smooth" && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const destroy = () => {
      // Also invalidate an import still in flight when native scrolling takes over.
      generation += 1;
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
      const initializationGeneration = generation;
      try {
        const { default: SmoothScroll } = await import("lenis");
        if (!eligible() || initializationGeneration !== generation) return;
        instance = new SmoothScroll({
          lerp: 0.16, smoothWheel: true, syncTouch: false,
          prevent: node => node.matches(nested),
          virtualScroll: ({ event: input }) => !input.ctrlKey
            && !document.body.matches(".af-menu-lock,.af-navigation-lock")
            && !document.querySelector("[role='dialog'][aria-modal='true'],dialog[open]"),
        });
        instance.on("scroll", wake);
      } catch {
        // Optional progressive enhancement must never surface an unhandled
        // rejection or break native scrolling when the chunk fails to load.
        // Resetting loading allows a later wheel gesture to retry.
        destroy();
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
      // Anchor navigation, focus actions and history are browser-owned.
      // A Lenis scrollTo(immediate) call can leave the instance active and
      // race the browser's subsequent native scroll/focus adjustment.
      // Invalidating in-flight imports also prevents a late Lenis mount.
      destroy();
    };
    const key = (event: KeyboardEvent) => {
      if (!nativeKeyboardNavigation.includes(event.key)) return;
      // Lenis is deliberately a wheel-only progressive enhancement. Destroy it
      // before native keyboard navigation so Home/End/Page/Arrow/Space and focus
      // movement retain the browser's exact scrolling semantics. A later wheel
      // gesture can initialize a fresh instance at the browser's current offset.
      const smoothingWasActive = Boolean(instance);
      destroy();
      // The default Home/End action can be swallowed on the same keydown
      // when Lenis releases a mid-flight animated wheel gesture. Preserve the
      // browser's standard document destinations without hijacking inputs,
      // carousels, dialogs or other separately scrollable controls.
      if (!smoothingWasActive || event.defaultPrevented ||
          event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
          (event.key !== "Home" && event.key !== "End") ||
          (event.target instanceof Element &&
            event.target.closest(`${nested}, [contenteditable], [role='textbox']`))) return;
      const top = event.key === "Home" ? 0 : (document.documentElement?.scrollHeight ?? document.body.scrollHeight ?? 0);
      window.scrollTo?.({ top, behavior: "instant" });
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
