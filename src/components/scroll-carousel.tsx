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
import { animate } from "framer-motion/dom/mini";
import styles from "./scroll-carousel.module.css";

type CarouselMode = "hero" | "gallery" | "cards" | "focus";

type ScrollCarouselProps = {
  children: ReactNode;
  label: string;
  mode?: CarouselMode;
  className?: string;
  startAt?: number;
  autoAdvanceMs?: number;
  heading?: ReactNode;
};

export function ScrollCarousel({
  children,
  label,
  mode = "cards",
  className = "",
  startAt = 0,
  autoAdvanceMs = 0,
  heading,
}: ScrollCarouselProps) {
  const slides = Children.toArray(children);
  const slideCount = slides.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const navigation = useRef<number | null>(null);
  const drag = useRef<{x:number; scroll:number; moved:boolean} | null>(null);
  const suppressClick = useRef(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.min(Math.max(startAt, 0), Math.max(slideCount - 1, 0)));
  const activeIndexRef = useRef(activeIndex);
  const id = useId().replaceAll(":", "");
  const viewportId = `carousel-${id}`;
  const prefersReducedMotion = useRef(false);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      prefersReducedMotion.current = media.matches;
      setReducedMotion(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const updateActiveFromScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || slideCount < 2) return;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const pending = navigation.current;
      if (pending !== null && Math.abs(viewport.scrollLeft - pending) > 2) return;
      navigation.current = null;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      slideRefs.current.forEach((slide, index) => {
        if (!slide) return;
        const target = slide.offsetLeft;
        const distance = Math.abs(target - viewport.scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      activeIndexRef.current = closestIndex;
      setActiveIndex(closestIndex);
    });
  }, [slideCount]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => {
      const slide = slideRefs.current[activeIndexRef.current];
      if (slide) viewport.scrollTo({ left: slide.offsetLeft, behavior: "auto" });
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!progressRef.current) return;
    const animation = animate(progressRef.current, { transform: `scaleX(${(activeIndex + 1) / Math.max(slideCount, 1)})` }, { duration: reducedMotion ? 0 : .24 });
    return () => animation.stop();
  }, [activeIndex, slideCount, reducedMotion]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const goTo = useCallback((index: number) => {
    if (!slideCount) return;
    const bounded = ((index % slideCount) + slideCount) % slideCount;
    const viewport = viewportRef.current;
    const slide = slideRefs.current[bounded];
    if (!viewport || !slide) return;
    navigation.current = slide.offsetLeft;
    activeIndexRef.current = bounded;
    viewport.scrollTo({
      left: slide.offsetLeft,
      behavior: prefersReducedMotion.current ? "auto" : "smooth",
    });
    setActiveIndex(bounded);
  }, [slideCount]);

  useEffect(() => {
    if (!autoAdvanceMs || slideCount < 2 || paused || interacting || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) goTo(activeIndex + 1);
    }, autoAdvanceMs);
    return () => window.clearInterval(timer);
  }, [autoAdvanceMs, activeIndex, goTo, paused, interacting, reducedMotion, slideCount]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndexRef.current - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndexRef.current + 1);
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
      onMouseEnter={() => autoAdvanceMs && setInteracting(true)}
      onMouseLeave={() => autoAdvanceMs && setInteracting(false)}
      onFocusCapture={() => autoAdvanceMs && setInteracting(true)}
      onBlurCapture={event => {
        if (!autoAdvanceMs) return;
        const nextFocus = event.relatedTarget;
        if (!(nextFocus instanceof Node) || !event.currentTarget.contains(nextFocus)) setInteracting(false);
      }}
    >
      <div className={styles.header}>{heading ? <div className={styles.heading}>{heading}</div> : null}
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
              onClick={() => goTo(activeIndexRef.current - 1)}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              aria-controls={viewportId}
              aria-label="Next slide"
              onClick={() => goTo(activeIndexRef.current + 1)}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      ) : null}

      </div>
      <div
        ref={viewportRef}
        className={styles.viewport}
        id={viewportId}
        tabIndex={slideCount > 1 ? 0 : -1}
        onPointerDown={event => {
          navigation.current = null;
          if (mode === "hero" || event.pointerType !== "mouse" || event.button !== 0 || (event.target instanceof Element && event.target.closest("button,video,input"))) return;
          drag.current = {x:event.clientX, scroll:event.currentTarget.scrollLeft, moved:false};
          suppressClick.current = false;
          setInteracting(true);
        }}
        onPointerMove={event => {
          const state = drag.current;
          if (!state || !(event.buttons & 1)) return;
          const delta = event.clientX - state.x;
          if (Math.abs(delta) > 6) { state.moved = true; event.currentTarget.setPointerCapture(event.pointerId); }
          if (!state.moved) return;
          event.preventDefault();
          event.currentTarget.style.scrollSnapType = "none";
          event.currentTarget.scrollLeft = state.scroll - delta;
        }}
        onPointerUp={event => {
          suppressClick.current = Boolean(drag.current?.moved);
          drag.current = null;
          event.currentTarget.style.removeProperty("scroll-snap-type");
          setInteracting(false);
        }}
        onPointerCancel={event => { drag.current = null; event.currentTarget.style.removeProperty("scroll-snap-type"); setInteracting(false); }}
        onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}
        onDragStart={event => { if (mode !== "hero") event.preventDefault(); }}
        onWheel={() => { navigation.current = null; }}
        onScroll={updateActiveFromScroll}
        onKeyDown={onKeyDown}
        aria-label={slideCount > 1 ? `Slide viewport. ${label}. Use left and right arrow keys to move between slides.` : `Slide viewport. ${label}`}
      >
        <div className={styles.track}>
          {slides.map((slide, index) => (
            <div
              className={`${styles.slide} ${mode === "focus" && index === activeIndex ? styles.activeSlide : ""}`}
              data-body-card={mode !== "hero" ? "" : undefined}
              data-active={index === activeIndex ? "true" : undefined}
              key={index}
              ref={node => { slideRefs.current[index] = node; }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slideCount}`}
              aria-current={mode === "focus" && index === activeIndex ? "true" : undefined}
              aria-hidden={mode === "hero" && index !== activeIndex ? true : undefined}
              inert={mode === "hero" && index !== activeIndex ? true : undefined}

            >
              {slide}
            </div>
          ))}
        </div>
      </div>
      {mode !== "hero" && slideCount > 1 ? <div className={styles.progress} role="progressbar" aria-label="Carousel progress" aria-valuemin={1} aria-valuemax={slideCount} aria-valuenow={activeIndex + 1}><span ref={progressRef} /></div> : null}
    </section>
  );
}
