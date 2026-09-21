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

type CarouselMode = "hero" | "gallery" | "cards";

type ScrollCarouselProps = {
  children: ReactNode;
  label: string;
  mode?: CarouselMode;
  className?: string;
  startAt?: number;
};

export function ScrollCarousel({
  children,
  label,
  mode = "cards",
  className = "",
  startAt = 0,
}: ScrollCarouselProps) {
  const slides = Children.toArray(children);
  const viewportRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(() => Math.min(Math.max(startAt, 0), Math.max(slides.length - 1, 0)));
  const id = useId().replaceAll(":", "");
  const viewportId = `carousel-${id}`;
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { prefersReducedMotion.current = media.matches; };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const updateActiveFromScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || slides.length < 2) return;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      slideRefs.current.forEach((slide, index) => {
        if (!slide) return;
        const distance = Math.abs(slide.offsetLeft - viewport.scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      setActiveIndex(closestIndex);
    });
  }, [slides.length]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const goTo = useCallback((index: number) => {
    if (!slides.length) return;
    const bounded = Math.min(Math.max(index, 0), slides.length - 1);
    const viewport = viewportRef.current;
    const slide = slideRefs.current[bounded];
    if (!viewport || !slide) return;
    viewport.scrollTo({
      left: slide.offsetLeft,
      behavior: prefersReducedMotion.current ? "auto" : "smooth",
    });
    setActiveIndex(bounded);
  }, [slides.length]);

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
      goTo(slides.length - 1);
    }
  };

  if (!slides.length) return null;

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
    >
      {slides.length > 1 ? (
        <div className={styles.toolbar}>
          <span className={styles.status} aria-live="polite" aria-atomic="true">
            <span className={styles.srOnly}>Slide </span>{activeIndex + 1} / {slides.length}
          </span>
          <div className={styles.controls}>
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
              disabled={activeIndex === slides.length - 1}
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
        tabIndex={slides.length > 1 ? 0 : -1}
        onScroll={updateActiveFromScroll}
        onKeyDown={onKeyDown}
        aria-label={slides.length > 1 ? `${label}. Use left and right arrow keys to move between slides.` : label}
      >
        <div className={styles.track}>
          {slides.map((slide, index) => (
            <div
              className={styles.slide}
              key={index}
              ref={node => { slideRefs.current[index] = node; }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
