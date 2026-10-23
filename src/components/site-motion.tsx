"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSiteScroll } from "./site-scroll";

const actions = "a[href], button, summary";
const hoverEvents = ["pointerover", "pointerout", "focusin", "focusout"];
const pressEvents = ["pointerdown", "pointerup", "pointercancel", "keydown", "keyup"];
const introductions = "[data-section-heading], .v2-section-head, .v3-section-head";
const easing = "cubic-bezier(0.2, 0.8, 0.2, 1)";

/** One delegated progressive enhancement. Native Web Animations avoids
 * loading a site-wide motion runtime for small link/button interactions.
 * Content remains fully readable with JavaScript off or reduced motion on. */
export function SiteMotion() {
  const pathname = usePathname();
  useSiteScroll(pathname);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const running = new Map<HTMLElement, Animation>();
    const owned = new Set<HTMLElement>();
    let disposed = false;

    const clear = (element: HTMLElement) => {
      running.get(element)?.cancel();
      running.delete(element);
      element.style.translate = element.style.scale = element.style.opacity = "";
      owned.delete(element);
    };

    const feedback = (element: HTMLElement, pressed = false) => {
      if (preference.matches) { clear(element); return; }
      if (disposed || !element.isConnected || typeof element.animate !== "function") return;
      // Capture the current animated state before canceling to avoid flicker
      // during rapid hover, keyboard focus and press changes.
      const current = getComputedStyle(element);
      const fromTranslate = current.translate === "none" ? "0px 0px" : current.translate;
      const fromScale = current.scale === "none" ? "1" : current.scale;
      running.get(element)?.cancel();
      const raised = !element.matches(":disabled, [aria-disabled='true']") && element.matches(":hover, :focus-visible");
      owned.add(element);
      const animation = element.animate([
        { translate: fromTranslate, scale: fromScale },
        { translate: raised && !pressed ? "0px -1px" : "0px 0px", scale: pressed ? "0.98" : "1" },
      ], { duration: pressed ? 100 : 220, easing, fill: "forwards" });
      running.set(element, animation);
      // Keep a finished hover animation until it is replaced so the
      // stable raised state persists without mutating the inline style.
      void animation.finished.then(() => {
        if (running.get(element) === animation && !raised && !pressed) clear(element);
      }).catch(() => undefined);
    };

    const target = (event: Event, includeDisabled = false) => {
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>(actions) : null;
      return element && (includeDisabled || !element.matches(":disabled, [aria-disabled='true']")) ? element : null;
    };
    const hover = (event: Event) => {
      if (event instanceof PointerEvent && event.pointerType !== "mouse") return;
      const element = target(event);
      if (!element) return;
      const related = (event as PointerEvent | FocusEvent).relatedTarget;
      if (related instanceof Node && element.contains(related)) return;
      feedback(element);
    };
    const press = (event: Event) => {
      const pressed = event.type === "pointerdown" || event.type === "keydown";
      // Cancellation/release must restore feedback even when the browser no
      // longer reports a primary button or the control became disabled.
      if (event instanceof PointerEvent && pressed && event.button !== 0) return;
      if (event instanceof KeyboardEvent && (event.repeat || !["Enter", " "].includes(event.key))) return;
      const element = target(event, !pressed);
      if (element) feedback(element, pressed);
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
        const element = entry.target;
        observer.unobserve(element);
        if (preference.matches || entry.boundingClientRect.top < 80 ||
            disposed || !element.isConnected || typeof element.animate !== "function") continue;
        owned.add(element);
        const animation = element.animate([
          { opacity: 0.86, translate: "0px 8px" },
          { opacity: 1, translate: "0px 0px" },
        ], { duration: 380, easing, fill: "forwards" });
        running.set(element, animation);
        void animation.finished.then(() => {
          if (running.get(element) === animation) clear(element);
        }).catch(() => undefined);
      }
    }, { threshold: 0.12 });

    if (!pathname.startsWith("/admin")) {
      const main = document.getElementById("main");
      if (main) for (const element of main.querySelectorAll<HTMLElement>(introductions)) {
        observer.observe(element);
      }
    }
    const reset = () => { if (preference.matches) for (const element of owned) clear(element); };
    for (const event of hoverEvents) document.addEventListener(event, hover);
    for (const event of pressEvents) document.addEventListener(event, press);
    preference.addEventListener("change", reset);
    return () => {
      disposed = true;
      observer.disconnect();
      preference.removeEventListener("change", reset);
      for (const event of hoverEvents) document.removeEventListener(event, hover);
      for (const event of pressEvents) document.removeEventListener(event, press);
      for (const element of owned) clear(element);
    };
  }, [pathname]);
  return null;
}
