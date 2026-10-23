"use client";

import {
  Children,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import styles from "./scroll-carousel.module.css";
import { UIIcon } from "./ui-icon";

type CarouselMode = "hero" | "gallery" | "cards" | "focus";

type ScrollCarouselProps = {
  children: ReactNode;
  label: string;
  mode?: CarouselMode;
  className?: string;
  startAt?: number;
  autoAdvanceMs?: number;
  heading?: ReactNode;
  cinematic?: boolean;
};

export function ScrollCarousel({
  children,
  label,
  mode = "cards",
  className = "",
  startAt = 0,
  autoAdvanceMs = 0,
  heading,
  cinematic = false,
}: ScrollCarouselProps) {
  const slides = Children.toArray(children);
  const slideCount = slides.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const navigation = useRef<number | null>(null);
  const drag = useRef<{pointerId:number; x:number; scroll:number; moved:boolean} | null>(null);
  const suppressClick = useRef(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.min(Math.max(startAt, 0), Math.max(slideCount - 1, 0)));
  const visibleIndex = Math.min(activeIndex, Math.max(0, slideCount - 1));
  const activeIndexRef = useRef(activeIndex);
  const activeSlideRef = useRef<HTMLDivElement | null>(null);
  const inView = useRef(false);
  const id = useId().replaceAll(":", "");
  const viewportId = `carousel-${id}`;
  const [paused, setPaused] = useState(false);
  const rotationPointerIntent = useRef<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReducedMotion(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const updateActiveFromScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || slideCount < 2) return;
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
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
      activeSlideRef.current = slideRefs.current[closestIndex] ?? null;
      setActiveIndex(closestIndex);
    });
  }, [slideCount]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => {
      navigation.current = null;
      const slide = slideRefs.current[activeIndexRef.current];
      if (slide) viewport.scrollTo({ left: slide.offsetLeft, behavior: "auto" });
    });
    observer.observe(viewport);
    // Browser-managed scrolling can interrupt a smooth navigation.
    const onScrollEnd = (event: Event) => {
      if (event.target !== viewport) return;
      navigation.current = null;
      updateActiveFromScroll();
    };
    viewport.addEventListener("scrollend", onScrollEnd);
    const visibility = autoAdvanceMs ? new IntersectionObserver(([entry]) => {
      inView.current = entry?.isIntersecting ?? false;
    }) : null;
    visibility?.observe(viewport);
    return () => {
      observer.disconnect();
      viewport.removeEventListener("scrollend", onScrollEnd);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      visibility?.disconnect();
      inView.current = false;
    };
  }, [autoAdvanceMs, slideCount, updateActiveFromScroll]);

  // Keyed slide nodes survive reordering. Keep the selected node, or use the
  // nearest remaining position if it was removed, even during a smooth move.
  useEffect(() => {
    const retainedIndex = activeSlideRef.current ? slideRefs.current.indexOf(activeSlideRef.current) : -1;
    const index = retainedIndex < 0 ? Math.min(activeIndexRef.current, Math.max(0, slideCount - 1)) : retainedIndex;
    if (slideCount && retainedIndex === activeIndexRef.current) return;
    activeIndexRef.current = index;
    activeSlideRef.current = slideRefs.current[index] ?? null;
    navigation.current = null;
    drag.current = null;
    suppressClick.current = false;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    setActiveIndex(index);
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.style.removeProperty("scroll-snap-type");
      viewport.scrollTo({
        left: activeSlideRef.current?.offsetLeft ?? 0,
        behavior: "auto",
      });
    }
  }, [children, slideCount]);

  const goTo = useCallback((index: number) => {
    if (!slideCount) return;
    const bounded = ((index % slideCount) + slideCount) % slideCount;
    const viewport = viewportRef.current;
    const slide = slideRefs.current[bounded];
    if (!viewport || !slide) return;
    const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const target = Math.min(Math.max(0, slide.offsetLeft), maxScrollLeft);
    navigation.current = target;
    activeIndexRef.current = bounded;
    activeSlideRef.current = slide;
    viewport.scrollTo({
      left: target,
      behavior: reducedMotion ? "auto" : "smooth",
    });
    setActiveIndex(bounded);
  }, [reducedMotion, slideCount]);

  useEffect(() => {
    if (!autoAdvanceMs || slideCount < 2 || paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (inView.current && !document.hidden && !drag.current && !viewportRef.current?.closest("section")?.matches(":hover, :focus-within")) goTo(activeIndexRef.current + 1);
    }, autoAdvanceMs);
    return () => window.clearInterval(timer);
  }, [autoAdvanceMs, activeIndex, goTo, paused, reducedMotion, slideCount]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.currentTarget !== event.target) return;
    const target = {
      ArrowLeft: activeIndexRef.current - 1,
      ArrowRight: activeIndexRef.current + 1,
      Home: 0,
      End: slideCount - 1,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    goTo(target);
  };

  const releaseDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    if (state.moved) suppressClick.current = true;
    drag.current = null;
    event.currentTarget.style.removeProperty("scroll-snap-type");
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
      data-cinematic={cinematic || undefined}
      onFocusCapture={() => { if (autoAdvanceMs) setPaused(true); }}
    >
      <div className={styles.header}>{heading ? <div className={styles.heading}>{heading}</div> : null}
      {slideCount > 1 ? (
        <div className={`${styles.toolbar}${cinematic ? " hero-toolbar" : ""}`}>
          <span className={styles.status} aria-live={autoAdvanceMs && !paused && !reducedMotion ? "off" : "polite"} aria-atomic="true">
            <span className={styles.srOnly}>Slide </span>{visibleIndex + 1} / {slideCount}
          </span>
          <div className={`${styles.controls}${cinematic ? " hero-controls" : ""}`}>
            {autoAdvanceMs && !reducedMotion ? <button type="button" aria-label={paused ? "Resume automatic slides" : "Pause automatic slides"}
              onPointerDown={event => { if (event.button === 0) rotationPointerIntent.current = !paused; }}
              onPointerCancel={() => { rotationPointerIntent.current = null; }}
              onClick={event => {
                // Focus pauses rotation before a pointer click. Preserve the
                // action shown when the press began; keyboard uses the new label.
                setPaused(event.detail > 0 ? (rotationPointerIntent.current ?? !paused) : !paused);
                rotationPointerIntent.current = null;
              }}><UIIcon name={paused ? "play" : "pause"} /></button> : null}
            <button
              type="button"
              aria-controls={viewportId}
              className={cinematic ? "hero-prev" : undefined}
              aria-label="Previous slide"
              onClick={() => goTo(activeIndexRef.current - 1)}
            >
              <UIIcon name="previous" />
            </button>
            <button
              type="button"
              aria-controls={viewportId}
              className={cinematic ? "hero-next" : undefined}
              aria-label="Next slide"
              onClick={() => goTo(activeIndexRef.current + 1)}
            >
              <UIIcon name="next" />
            </button>
          </div>
        </div>
      ) : null}

      </div>
      <div
        ref={viewportRef}
        className={styles.viewport}
        id={viewportId}
        role="group"
        tabIndex={slideCount > 1 ? 0 : -1}
        onPointerDown={event => {
          navigation.current = null;
          if (mode === "hero" || event.pointerType !== "mouse" || event.button !== 0 || (event.target instanceof Element && event.target.closest("button,video,input,textarea,select,[contenteditable]"))) return;
          if (drag.current) return;
          drag.current = {pointerId:event.pointerId, x:event.clientX, scroll:event.currentTarget.scrollLeft, moved:false};
          suppressClick.current = false;
        }}
        onPointerMove={event => {
          const state = drag.current;
          if (!state || event.pointerId !== state.pointerId || !(event.buttons & 1)) return;
          const delta = event.clientX - state.x;
          if (!state.moved && Math.abs(delta) > 6) {
            state.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.style.scrollSnapType = "none";
          }
          if (!state.moved) return;
          event.preventDefault();
          event.currentTarget.scrollLeft = state.scroll - delta;
        }}
        onPointerUp={releaseDrag}
        onPointerLeave={event => {
          // Without capture, pointerup may occur outside this viewport.
          if (event.currentTarget.hasPointerCapture(event.pointerId)) return;
          releaseDrag(event);
        }}
        onLostPointerCapture={releaseDrag}
        onPointerCancel={releaseDrag}
        onClickCapture={event => {
          const dragged = suppressClick.current;
          suppressClick.current = false;
          // Keyboard and assistive activations have no pointer click count.
          if (dragged && event.detail > 0) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onDragStart={event => { if (mode !== "hero") event.preventDefault(); }}
        onWheel={() => { navigation.current = null; }}
        onScroll={updateActiveFromScroll}
        onKeyDown={onKeyDown}
        aria-label={slideCount > 1 ? `Slide viewport. ${label}. Use left and right arrow keys to move between slides.` : `Slide viewport. ${label}`}
      >
        <div className={styles.track}>
          {slides.map((slide, index) => (
            <div
              className={`${styles.slide} ${mode === "focus" && index === visibleIndex ? styles.activeSlide : ""}`}
              data-body-card={mode !== "hero" ? "" : undefined}
              data-active={index === visibleIndex ? "true" : undefined}
              key={isValidElement(slide) ? (slide.key ?? index) : index}
              ref={node => { slideRefs.current[index] = node; }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slideCount}`}
              aria-current={mode === "focus" && index === visibleIndex ? "true" : undefined}
              aria-hidden={mode === "hero" && index !== visibleIndex ? true : undefined}
              inert={mode === "hero" && index !== visibleIndex ? true : undefined}

            >
              {slide}
            </div>
          ))}
        </div>
      </div>
      {cinematic && slideCount > 1 ? <div className="hero-dots" role="group" aria-label="Choose a banner slide">{slides.map((_, index) => <button key={index} type="button" aria-label={`Show slide ${index + 1} of ${slideCount}`} aria-current={index === visibleIndex ? "true" : undefined} aria-controls={viewportId} onClick={() => goTo(index)}><span aria-hidden="true" /></button>)}</div> : null}
      {mode !== "hero" && slideCount > 1 ? <div className={styles.progress} role="progressbar" aria-label="Carousel progress" aria-valuemin={1} aria-valuemax={slideCount} aria-valuenow={visibleIndex + 1}><span style={{ transform: `scaleX(${(visibleIndex + 1) / slideCount})`, transition: reducedMotion ? "none" : "transform .24s ease" }} /></div> : null}
    </section>
  );
}
