
"use client";
import { UIIcon } from "./ui-icon";
/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { getPublicImageDimensions } from "@/lib/public-image-dimensions";
import { getPublicImageOptimizationUrl } from "@/lib/public-media";
import { adjacentGalleryId } from "@/lib/gallery-selection";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "./campaign-media-gallery.module.css";

export type CampaignGalleryItem = {
  id: string;
  url: string;
  alt: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
};

export function CampaignMediaGallery({ items }: { items: CampaignGalleryItem[] }) {
  const safeItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter(item => {
      const url = item.url.trim();
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  }, [items]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogTitleId = `gallery-dialog-${useId().replaceAll(":", "")}`;
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeIndex = safeItems.findIndex(item => item.id === activeId);
  const active = activeIndex < 0 ? null : safeItems[activeIndex] ?? null;
  // Clear a removed selection during render so it cannot reopen if reinserted.
  if (activeId !== null && !active) setActiveId(null);

  const close = useCallback(() => {
    setActiveId(null);
  }, []);

  const previous = useCallback(() => {
    setActiveId(id => adjacentGalleryId(safeItems, id, -1));
  }, [safeItems]);

  const next = useCallback(() => {
    setActiveId(id => adjacentGalleryId(safeItems, id, 1));
  }, [safeItems]);

  useEffect(() => {
    if (!active) return;
    const dialog = dialogRef.current;
    const triggers = triggerRefs.current;
    const trigger = triggers[activeIndex];
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
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (!first || !last) return;
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
      if (!dialog?.isConnected) requestAnimationFrame(() => {
        const target = trigger?.isConnected ? trigger : triggers.find(node => node?.isConnected);
        target?.focus();
      });
    };
  }, [active, activeIndex, close, next, previous]);

  if (!safeItems.length) return null;

  return (
    <>
      <div className={styles.grid} role="group" aria-label="Programme photographs">
        {safeItems.map((item, index) => {
          const descriptor = `${item.alt ?? ""} ${item.caption ?? ""}`;
          const privacyProtected = /(privacy|blurred|identit(?:y|ies) protected)/i.test(descriptor);
          const graphicAsset = /(graphic|announcement|campaign cover|results update|infographic|carousel)/i.test(descriptor);
          const { width, height } = getPublicImageDimensions(item);
          const optimizedUrl = getPublicImageOptimizationUrl(item.url);
          return (
          <figure className={`${styles.card} ${graphicAsset ? styles.graphicCard : ""}`} key={item.id}>
            <button
              ref={node => { triggerRefs.current[index] = node; }}
              type="button"
              className={styles.trigger}
              onClick={() => setActiveId(item.id)}
              aria-label={`Enlarge image ${index + 1} of ${safeItems.length}: ${item.alt ?? "programme photograph"}`}
            >
              {optimizedUrl ? <Image src={optimizedUrl} alt={item.alt ?? ""} width={width} height={height} sizes="(max-width: 900px) 50vw, 33vw" loading="lazy" /> : <img src={item.url} alt={item.alt ?? ""} width={width} height={height} loading="lazy" decoding="async" />}
              {privacyProtected ? <span className={styles.privacyLabel}>Privacy protected</span> : null}
              <span className={styles.openLabel}>Enlarge</span>
            </button>
            {item.caption ? <figcaption>{item.caption}</figcaption> : null}
          </figure>
          );
        })}
      </div>

      {active ? (() => {
        const { width, height } = getPublicImageDimensions(active);
        const optimizedUrl = getPublicImageOptimizationUrl(active.url);
        return (
        <div className={styles.backdrop} role="presentation" onPointerDown={event => {
          if (event.currentTarget === event.target) close();
        }}>
          <div
            ref={dialogRef}
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            tabIndex={-1}
          >
            <div className={styles.dialogTop}>
              <span id={dialogTitleId}>Image {activeIndex + 1} of {safeItems.length}: {active.alt ?? "programme photograph"}</span>
              <button ref={closeRef} type="button" onClick={close}>Close</button>
            </div>
            {optimizedUrl ? <Image className={styles.fullImage} src={optimizedUrl} alt={active.alt ?? ""} width={width} height={height} sizes="90vw" /> : <img className={styles.fullImage} src={active.url} alt={active.alt ?? ""} width={width} height={height} />}
            {active.caption ? <p className={styles.caption}>{active.caption}</p> : null}
            {safeItems.length > 1 ? (
              <div className={styles.controls}>
                <button type="button" onClick={previous}><UIIcon name="previous" />Previous</button>
                <button type="button" onClick={next}>Next<UIIcon name="next" /></button>
              </div>
            ) : null}
          </div>
        </div>
        );
      })() : null}
    </>
  );
}
