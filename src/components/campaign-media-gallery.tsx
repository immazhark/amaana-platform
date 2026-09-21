
"use client";
/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./campaign-media-gallery.module.css";
import { ScrollCarousel } from "./scroll-carousel";

export type CampaignGalleryItem = {
  id: string;
  url: string;
  alt: string | null;
  caption?: string | null;
};

function canOptimizeLocally(url: string) {
  return url.startsWith("/media/") || url.startsWith("/brand/");
}

export function CampaignMediaGallery({ items }: { items: CampaignGalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const active = activeIndex === null ? null : items[activeIndex];

  const close = useCallback(() => {
    const previousIndex = activeIndex;
    setActiveIndex(null);
    if (previousIndex !== null) requestAnimationFrame(() => triggerRefs.current[previousIndex]?.focus());
  }, [activeIndex]);

  const previous = useCallback(() => {
    setActiveIndex(index => index === null ? 0 : (index - 1 + items.length) % items.length);
  }, [items.length]);

  const next = useCallback(() => {
    setActiveIndex(index => index === null ? 0 : (index + 1) % items.length);
  }, [items.length]);

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
  }, [activeIndex, close, next, previous]);

  if (!items.length) return null;

  return (
    <>
      <ScrollCarousel label="Programme photographs" mode="gallery" className={styles.carousel}>
        {items.map((item, index) => {
          const descriptor = `${item.alt ?? ""} ${item.caption ?? ""}`;
          const privacyProtected = /(privacy|blurred|identit(?:y|ies) protected)/i.test(descriptor);
          const graphicAsset = /(graphic|announcement|campaign cover|results update|infographic|carousel)/i.test(descriptor);
          return (
          <figure className={`${styles.card} ${graphicAsset ? styles.graphicCard : ""}`} key={item.id}>
            <button
              ref={node => { triggerRefs.current[index] = node; }}
              type="button"
              className={styles.trigger}
              onClick={() => setActiveIndex(index)}
              aria-label={`Open image ${index + 1} of ${items.length}: ${item.alt ?? "programme photograph"}`}
            >
              {canOptimizeLocally(item.url) ? <Image src={item.url} alt={item.alt ?? ""} width={1600} height={1200} sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw" loading="lazy" /> : <img src={item.url} alt={item.alt ?? ""} width={1600} height={1200} loading="lazy" decoding="async" />}
              {privacyProtected ? <span className={styles.privacyLabel}>Privacy protected</span> : null}
              <span className={styles.openLabel}>Enlarge</span>
            </button>
            {item.caption ? <figcaption>{item.caption}</figcaption> : null}
          </figure>
          );
        })}
      </ScrollCarousel>

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
            {canOptimizeLocally(active.url) ? <Image className={styles.fullImage} src={active.url} alt={active.alt ?? ""} width={1600} height={1200} sizes="90vw" /> : <img className={styles.fullImage} src={active.url} alt={active.alt ?? ""} width={1600} height={1200} />}
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
