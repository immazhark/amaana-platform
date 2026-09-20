
"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import styles from "./campaign-media-gallery.module.css";

export type CampaignGalleryItem = {
  id: string;
  url: string;
  alt: string | null;
  caption?: string | null;
};

export function CampaignMediaGallery({ items }: { items: CampaignGalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const active = activeIndex === null ? null : items[activeIndex];

  function close() {
    const previous = activeIndex;
    setActiveIndex(null);
    if (previous !== null) requestAnimationFrame(() => triggerRefs.current[previous]?.focus());
  }

  function previous() {
    setActiveIndex(index => index === null ? 0 : (index - 1 + items.length) % items.length);
  }

  function next() {
    setActiveIndex(index => index === null ? 0 : (index + 1) % items.length);
  }

  useEffect(() => {
    if (activeIndex === null) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, items.length]);

  if (!items.length) return null;

  return (
    <>
      <div className={styles.grid} aria-label="Programme photographs">
        {items.map((item, index) => (
          <figure className={styles.card} key={item.id}>
            <button
              ref={node => { triggerRefs.current[index] = node; }}
              type="button"
              className={styles.trigger}
              onClick={() => setActiveIndex(index)}
              aria-label={`Open image ${index + 1} of ${items.length}: ${item.alt ?? "programme photograph"}`}
            >
              <img src={item.url} alt={item.alt ?? ""} loading="lazy" decoding="async" />
              <span className={styles.openLabel}>Enlarge</span>
            </button>
            {item.caption ? <figcaption>{item.caption}</figcaption> : null}
          </figure>
        ))}
      </div>

      {active ? (
        <div className={styles.backdrop} onMouseDown={event => {
          if (event.currentTarget === event.target) close();
        }}>
          <div
            ref={dialogRef}
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label={`Image ${activeIndex! + 1} of ${items.length}: ${active.alt ?? "programme photograph"}`}
          >
            <div className={styles.dialogTop}>
              <span>{activeIndex! + 1} / {items.length}</span>
              <button ref={closeRef} type="button" onClick={close}>Close</button>
            </div>
            <img className={styles.fullImage} src={active.url} alt={active.alt ?? ""} />
            {active.caption ? <p className={styles.caption}>{active.caption}</p> : null}
            {items.length > 1 ? (
              <div className={styles.controls}>
                <button type="button" onClick={previous}>← Previous</button>
                <button type="button" onClick={next}>Next →</button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
