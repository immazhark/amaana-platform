"use client";

import {
  Children,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import styles from "./scroll-carousel.module.css";

type CarouselMode = "hero" | "gallery" | "cards" | "focus";

type ScrollCarouselProps = {
  children: ReactNode;
  label: string;
  mode?: CarouselMode;
  className?: string;
  startAt?: number;
  autoAdvanceMs?: number;
};

export function ScrollCarousel({
  children,
  label,
  mode = "cards",
  className = "",
  startAt = 0,
  autoAdvanceMs = 0,
}: ScrollCarouselProps) {
  const slides = Children.toArray(children);
  const slideCount = Children.count(children);
  const viewportRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(() => Math.min(Math.max(startAt, 0), Math.max(slideCount - 1, 0)));
  const id = useId().replaceAll(":", "");
  const viewportId = `carousel-${id}`;
  const prefersReducedMotion = useRef(false);
  const [paused, setPaused] = useState(false);\n  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {\n      prefersReducedMotion.current = media.matches;\n      setReducedMotion(media.matches);\n    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const updateActiveFromScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || slideCount < 2) return;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      slideRefs.current.forEach((slide, index) => {
        if (!slide) return;
        const target = mode === "focus" ? slide.offsetLeft - (viewport.clientWidth - slide.clientWidth) / 2 : slide.offsetLeft;
        const distance = Math.abs(target - viewport.scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      setActiveIndex(closestIndex);
    });
  }, [mode, slideCount]);

  useEffect(() => {
    if (mode !== "focus") return;
    const viewport = viewportRef.current;
    const slide = slideRefs.current[activeIndex];
    if (!viewport || !slide) return;
    const center = () => viewport.scrollTo({ left: slide.offsetLeft - (viewport.clientWidth - slide.clientWidth) / 2, behavior: "auto" });
    const frame = requestAnimationFrame(center);
    const observer = new ResizeObserver(center);
    observer.observe(viewport);
    observer.observe(slide);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [activeIndex, mode]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const goTo = useCallback((index: number) => {
    if (!slideCount) return;
    const bounded = Math.min(Math.max(index, 0), slideCount - 1);
    const viewport = viewportRef.current;
    const slide = slideRefs.current[bounded];
    if (!viewport || !slide) return;
    viewport.scrollTo({
      left: mode === "focus" ? slide.offsetLeft - (viewport.clientWidth - slide.clientWidth) / 2 : slide.offsetLeft,
      behavior: prefersReducedMotion.current ? "auto" : "smooth",
    });
    setActiveIndex(bounded);
  }, [mode, slideCount]);

  useEffect(() => {
    if (!autoAdvanceMs || slideCount < 2 || paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex(current => {
        const next = (current + 1) % slideCount;
        const viewport = viewportRef.current;
        const slide = slideRefs.current[next];
        if (viewport && slide) viewport.scrollTo({ left: mode === "focus" ? slide.offsetLeft - (viewport.clientWidth - slide.clientWidth) / 2 : slide.offsetLeft, behavior: "smooth" });
        return next;
      });
    }, autoAdvanceMs);
    return () => window.clearInterval(timer);
  }, [autoAdvanceMs, mode, paused, reducedMotion, slideCount]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndex + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(slideCount - 1);
    }
  };

  if (!slideCount) return null;

  const rootClasses = [
    styles.root,
    styles[mode],
    className,
  ].filter(Boolean).join(" ");

  return (
    <section
      className={rootClasses}
      aria-label={label}
      aria-roledescription="carousel"
      data-carousel-mode={mode}
      onMouseEnter={() => autoAdvanceMs && setPaused(true)}
      onMouseLeave={() => autoAdvanceMs && setPaused(false)}
      onFocusCapture={() => autoAdvanceMs && setPaused(true)}
      onBlurCapture={() => autoAdvanceMs && setPaused(false)}
    >
      {slideCount > 1 ? (
        <div className={styles.toolbar}>
          <span className={styles.status} aria-live="polite" aria-atomic="true">
            <span className={styles.srOnly}>Slide </span>{activeIndex + 1} / {slideCount}
          </span>
          <div className={styles.controls}>
            {autoAdvanceMs && !reducedMotion ? <button type="button" aria-label={paused ? "Resume automatic slides" : "Pause automatic slides"} onClick={() => setPaused(value => !value)}><span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span></button> : null}
            <button
              type="button"
              aria-controls={viewportId}
              aria-label="Previous slide"
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              aria-controls={viewportId}
              aria-label="Next slide"
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex === slideCount - 1}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      ) : null}

      <div
        ref={viewportRef}
        className={styles.viewport}
        id={viewportId}
        tabIndex={slideCount > 1 ? 0 : -1}
        onScroll={updateActiveFromScroll}
        onKeyDown={onKeyDown}
        aria-label={slideCount > 1 ? `${label}. Use left and right arrow keys to move between slides.` : label}
      >
        <div className={styles.track}>
          {slides.map((slide, index) => (
            <div
              className={`${styles.slide} ${mode === "focus" && index === activeIndex ? styles.activeSlide : ""}`}
              data-active={index === activeIndex ? "true" : undefined}
              key={index}
              ref={node => { slideRefs.current[index] = node; }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slideCount}`}
              aria-current={mode === "focus" && index === activeIndex ? "true" : undefined}
              aria-hidden={mode === "hero" && index !== activeIndex ? true : undefined}
              inert={mode === "hero" && index !== activeIndex ? true : undefined}
              onClick={event => {
                if (mode !== "focus" || index === activeIndex) return;
                const target = event.target;
                if (target instanceof Element && target.closest("button, input, select, textarea, [role=\"button\"]")) return;
                event.preventDefault();
                goTo(index);
              }}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
