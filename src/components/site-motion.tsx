"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { animate } from "framer-motion/dom/mini";
import { useSiteScroll } from "./site-scroll";

type Playback = ReturnType<typeof animate>;
const actions = "a[href], button, summary";
const hoverEvents = ["pointerover", "pointerout", "focusin", "focusout"];
const pressEvents = ["pointerdown", "pointerup", "pointercancel", "keydown", "keyup"];
const introductions = "[data-section-heading], .v2-section-head, .v3-section-head";
const easing = [0.2, 0.8, 0.2, 1] as const;

/** One delegated enhancement; server content stays readable before hydration. */
export function SiteMotion() {
  const pathname = usePathname();
  useSiteScroll(pathname);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const running = new Map<HTMLElement, Playback>();
    const owned = new Set<HTMLElement>();
    const seen = new WeakSet<HTMLElement>();
    let disposed = false;
    const clear = (element: HTMLElement) => {
      running.get(element)?.cancel();
      running.delete(element);
      element.style.translate = element.style.scale = element.style.opacity = "";
      owned.delete(element);
    };
    const feedback = (element: HTMLElement, pressed = false) => {
      if (preference.matches) { clear(element); return; }
      if (disposed || !element.isConnected) return;
      running.get(element)?.cancel();
      const raised = element.matches(":hover, :focus-visible");
      owned.add(element);
      const animation = animate(element, { translate: raised && !pressed ? "0 -1px" : "0 0px", scale: pressed ? "0.98" : "1" }, { duration: pressed ? 0.1 : 0.22, ease: easing });
      running.set(element, animation);
      void animation.then(() => {
        if (running.get(element) !== animation) return;
        running.delete(element);
        if (!raised && !pressed) clear(element);
      });
    };
    const target = (event: Event) => {
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>(actions) : null;
      return element && !element.matches(":disabled, [aria-disabled='true']") ? element : null;
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
      if (event instanceof PointerEvent && event.button !== 0) return;
      if (event instanceof KeyboardEvent && (event.repeat || !["Enter", " "].includes(event.key))) return;
      const element = target(event);
      if (element) feedback(element, event.type === "pointerdown" || event.type === "keydown");
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
        const element = entry.target;
        observer.unobserve(element);
        if (preference.matches || entry.boundingClientRect.top < 80 || disposed || !element.isConnected) continue;
        owned.add(element);
        const animation = animate(element, { opacity: [0.86, 1], translate: ["0 8px", "0 0px"] }, { duration: 0.38, ease: easing });
        running.set(element, animation);
        void animation.then(() => {
          if (running.get(element) === animation) clear(element);
        });
      }
    }, { threshold: 0.12 });
    if (!pathname.startsWith("/admin")) {
      const main = document.getElementById("main");
      if (main) for (const element of main.querySelectorAll<HTMLElement>(introductions)) {
        if (seen.has(element)) continue;
        seen.add(element);
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
