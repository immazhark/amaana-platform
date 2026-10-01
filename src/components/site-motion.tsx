"use client";

import { useEffect } from "react";
import { animate } from "framer-motion/dom/mini";

// One delegated motion policy covers server-rendered cards and actions on every route.
// Content stays visible before hydration; native scrolling remains browser-owned.
export function SiteMotion() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const selector = '[data-body-card], .v2-button, .v3-btn, .page-hero__button, .af-support-cta';
    const running = new Map<HTMLElement, ReturnType<typeof animate>>();
    const move = (element: HTMLElement, raised: boolean) => {
      running.forEach((animation, node) => { if (!node.isConnected) { animation.stop(); running.delete(node); } });
      running.get(element)?.stop();
      if (preference.matches) { element.style.removeProperty("transform"); return; }
      running.set(element, animate(element, { transform: raised ? "translateY(-3px)" : "translateY(0px)" }, {
        duration: .22, ease: [.2, .8, .2, 1],
      }));
    };
    const target = (event: Event) => event.target instanceof Element ? event.target.closest<HTMLElement>(selector) : null;
    const enter = (event: Event) => {
      const element = target(event);
      if (!element) return;
      const related = (event as PointerEvent | FocusEvent).relatedTarget;
      if (related instanceof Node && element.contains(related)) return;
      if (event instanceof PointerEvent && event.pointerType !== "mouse") return;
      move(element, true);
    };
    const leave = (event: Event) => {
      const element = target(event);
      if (!element) return;
      const related = (event as PointerEvent | FocusEvent).relatedTarget;
      if (related instanceof Node && element.contains(related)) return;
      if (element.matches(":hover, :focus-within")) return;
      move(element, false);
    };
    const reset = () => {
      if (!preference.matches) return;
      running.forEach((animation, element) => { animation.stop(); element.style.removeProperty("transform"); });
      running.clear();
    };
    document.addEventListener("pointerover", enter);
    document.addEventListener("pointerout", leave);
    document.addEventListener("focusin", enter);
    document.addEventListener("focusout", leave);
    preference.addEventListener("change", reset);
    return () => {
      document.removeEventListener("pointerover", enter);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("focusin", enter);
      document.removeEventListener("focusout", leave);
      preference.removeEventListener("change", reset);
      running.forEach(animation => animation.stop());
    };
  }, []);
  return null;
}
