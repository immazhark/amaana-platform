"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSiteScroll } from "./site-scroll";

type Playback = Animation;
const actions = "a[href], button, summary";
const hoverEvents = ["pointerover", "pointerout", "focusin", "focusout"];
const pressEvents = ["pointerdown", "pointerup", "pointercancel", "keydown", "keyup"];
const introductions = "[data-section-heading], .v2-section-head, .v3-section-head";
const easing = "cubic-bezier(0.2, 0.8, 0.2, 1)";

/** One delegated enhancement; server content stays readable before hydration. */
export function SiteMotion() {
  const pathname = usePathname();
  useSiteScroll(pathname);
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || typeof window.matchMedia !== "function") return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const running = new Map<HTMLElement, Playback>();
    const owned = new Set<HTMLElement>();
    const originals = new Map<HTMLElement, { translate: string; scale: string; opacity: string }>();
    const own = (element: HTMLElement) => {
      if (owned.has(element)) return;
      originals.set(element, {
        translate: element.style.translate, scale: element.style.scale, opacity: element.style.opacity,
      });
      owned.add(element);
    };
    let pointerOwner: HTMLElement | null = null;
    const keyOwners = new Map<string, HTMLElement>();
    const isPressed = (element: HTMLElement) => pointerOwner === element || [...keyOwners.values()].includes(element);
    let disposed = false;
    const clear = (element: HTMLElement) => {
      running.get(element)?.cancel();
      running.delete(element);
      const original = originals.get(element);
      if (original) {
        element.style.translate = original.translate;
        element.style.scale = original.scale;
        element.style.opacity = original.opacity;
      }
      originals.delete(element);
      owned.delete(element);
    };
    const feedback = (element: HTMLElement, pressed = false) => {
      if (preference.matches) { clear(element); return; }
      if (disposed || !element.isConnected || typeof element.animate !== "function") return;
      // Snapshot the displayed frame before cancelling a running animation.
      // Otherwise rapid hover/press transitions jump back to the base style.
      const rendered = getComputedStyle(element);
      const fromTranslate = rendered.translate;
      const fromScale = rendered.scale;
      running.get(element)?.cancel();
      const raised = element.matches(":hover, :focus-visible");
      own(element);
      const endTranslate = raised && !pressed ? "0 -1px" : "0 0px";
      const endScale = pressed ? "0.98" : "1";
      let animation: Playback;
      try {
        animation = element.animate({
          translate: [fromTranslate, endTranslate],
          scale: [fromScale, endScale],
        }, { duration: pressed ? 100 : 220, easing, fill: "forwards" });
      } catch {
        clear(element);
        return;
      }
      running.set(element, animation);
      void animation.finished.then(() => {
        if (running.get(element) !== animation) return;
        element.style.translate = endTranslate;
        element.style.scale = endScale;
        animation.cancel();
        running.delete(element);
        if (!raised && !pressed) clear(element);
      }).catch(() => {});

    };
    const target = (event: Event) => {
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>(actions) : null;
      return element && !element.matches(":disabled, [aria-disabled='true']") ? element : null;
    };
    const hover = (event: Event) => {
      if (typeof PointerEvent !== "undefined" && event instanceof PointerEvent && event.pointerType !== "mouse") return;
      const element = target(event);
      if (!element) return;
      const related = (event as PointerEvent | FocusEvent).relatedTarget;
      if (related instanceof Node && element.contains(related)) return;
      feedback(element, isPressed(element));
    };
    const press = (event: Event) => {
      if (typeof PointerEvent !== "undefined" && event instanceof PointerEvent) {
        if (event.type === "pointerdown") {
          if (event.button !== 0 || !event.isPrimary) return;
          const previous = pointerOwner;
          pointerOwner = target(event);
          if (previous && previous !== pointerOwner) feedback(previous, isPressed(previous));
          if (pointerOwner) feedback(pointerOwner, true);
        } else {
          if (!event.isPrimary) return;
          const element = pointerOwner;
          pointerOwner = null;
          if (element) feedback(element, isPressed(element));
        }
      } else if (typeof KeyboardEvent !== "undefined" && event instanceof KeyboardEvent) {
        if (event.repeat || !["Enter", " "].includes(event.key)) return;
        if (event.type === "keydown") {
          const element = target(event);
          if (element) { keyOwners.set(event.key, element); feedback(element, true); }
        } else {
          const element = keyOwners.get(event.key);
          keyOwners.delete(event.key);
          if (element) feedback(element, isPressed(element));
        }
      }
    };
    // Introductory motion is optional. When IO or Web Animations is missing,
    // section headings remain fully visible and usable without polyfills.
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
        const element = entry.target;
        observer?.unobserve(element);
        if (preference.matches || entry.boundingClientRect.top < 80 ||
            disposed || !element.isConnected || typeof element.animate !== "function") continue;
        own(element);
        let animation: Playback;
        try {
          animation = element.animate(
            { opacity: [0.86, 1], translate: ["0 8px", "0 0px"] },
            { duration: 380, easing, fill: "forwards" },
          );
        } catch {
          clear(element);
          continue;
        }
        running.set(element, animation);
        void animation.finished.then(() => {
          if (running.get(element) === animation) clear(element);
        }).catch(() => {});
      }
    }, { threshold: 0.12 });
    const main = document.getElementById("main");
    if (observer && main) {
      for (const element of main.querySelectorAll<HTMLElement>(introductions)) observer.observe(element);
    }
    const reset = () => {
      if (!preference.matches) return;
      pointerOwner = null;
      keyOwners.clear();
      for (const element of owned) clear(element);
    };
    const release = () => {
      const elements = new Set(keyOwners.values());
      if (pointerOwner) elements.add(pointerOwner);
      pointerOwner = null;
      keyOwners.clear();
      for (const element of elements) feedback(element);
    };
    for (const event of hoverEvents) document.addEventListener(event, hover);
    for (const event of pressEvents) document.addEventListener(event, press);
    if (typeof preference.addEventListener === "function") preference.addEventListener("change", reset);
    else preference.addListener(reset);
    window.addEventListener("blur", release);
    return () => {
      disposed = true;
      observer?.disconnect();
      if (typeof preference.removeEventListener === "function") preference.removeEventListener("change", reset);
      else preference.removeListener(reset);
      window.removeEventListener("blur", release);
      for (const event of hoverEvents) document.removeEventListener(event, hover);
      for (const event of pressEvents) document.removeEventListener(event, press);
      for (const element of owned) clear(element);
    };
  }, [pathname]);
  return null;
}
