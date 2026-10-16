
"use client";
import { UIIcon } from "./ui-icon";
/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { getPublicImageDimensions } from "@/lib/public-image-dimensions";
import { getPublicImageOptimizationUrl, getPublicImagePlaceholder } from "@/lib/public-media";
import { adjacentGalleryId } from "@/lib/gallery-selection";
import { selectSafeGalleryImages } from "@/lib/gallery-publication";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "./campaign-media-gallery.module.css";

export type CampaignGalleryItem = {
  id: string;
  url: string;
  alt: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  blurDataURL?: string | null;
};

const NO_ADDITIONAL_IMAGE_ORIGINS: readonly string[] = [];

export function CampaignMediaGallery({ items, approvedImageOrigins = NO_ADDITIONAL_IMAGE_ORIGINS }: {
  items: CampaignGalleryItem[];
  approvedImageOrigins?: readonly string[];
}) {
  const safeItems = useMemo(
    () => selectSafeGalleryImages(items, approvedImageOrigins),
    [items, approvedImageOrigins],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogTitleId = `gallery-dialog-${useId().replaceAll(":", "")}`;
  const dialogCaptionId = `${dialogTitleId}-caption`;
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const openingId = useRef<string | null>(null);

  const activeIndex = safeItems.findIndex(item => item.id === activeId);
  const active = activeIndex < 0 ? null : safeItems[activeIndex] ?? null;
  const isOpen = active !== null;
  const activeImageUrl = active ? getPublicImageOptimizationUrl(active.url) : null;
  const activeBlur = active ? getPublicImagePlaceholder(active.blurDataURL) : null;
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

  // Modal keyboard handlers must use the newest approved-gallery order without
  // tearing down the modal effect or stealing focus after a content reorder.
  const modalActions = useRef({ close, previous, next });
  const latestItems = useRef(safeItems);
  useEffect(() => {
    modalActions.current = { close, previous, next };
    latestItems.current = safeItems;
  }, [close, previous, next, safeItems]);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const triggerNodes = triggerRefs.current;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        modalActions.current.close();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        modalActions.current.previous();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        modalActions.current.next();
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
      // If an unrelated script moves focus outside the dialog, Tab must
      // recover containment instead of continuing into the obscured page.
      if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    // Read the latest dialog when the deferred restoration actually runs.
    const hasOpenDialog = () => dialogRef.current?.isConnected;
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (!dialog?.isConnected) requestAnimationFrame(() => {
        // Reordering or removal changes the opener's array position. Resolve
        // by stable media ID only after the final gallery DOM has committed.
        // A newer lightbox may already be mounted after a quick close/reopen.
        // Never move focus out of that dialog to an old thumbnail.
        if (dialog?.isConnected || hasOpenDialog()) return;
        // Preserve a new deliberate focus choice made before this animation frame.
        const focused = document.activeElement;
        if (focused && focused !== document.body && focused.isConnected) return;
        const items = latestItems.current;
        const triggers = triggerNodes;
        const opener = triggers[items.findIndex(item => item.id === openingId.current)];
        const target = opener?.isConnected ? opener : triggers.find(node => node?.isConnected);
        target?.focus();
      });
    };
  }, [isOpen]);

  if (!safeItems.length) return null;

  return (
    <>
      <div className={styles.grid} role="group" aria-label="Programme photographs">
        {safeItems.map((item, index) => {
          const descriptor = `${item.alt ?? ""} ${item.caption ?? ""}`;
          const graphicAsset = /(graphic|announcement|campaign cover|results update|infographic|carousel)/i.test(descriptor);
          const { width, height } = getPublicImageDimensions(item);
          const imageUrl = getPublicImageOptimizationUrl(item.url);
          const blur = getPublicImagePlaceholder(item.blurDataURL);
          return (
          <figure className={`${styles.card} ${graphicAsset ? styles.graphicCard : ""}`} key={item.id}>
            <button
              ref={node => { triggerRefs.current[index] = node; }}
              type="button"
              className={styles.trigger}
              onClick={() => {
                openingId.current = item.id;
                setActiveId(item.id);
              }}
              aria-label={`Enlarge image ${index + 1} of ${safeItems.length}: ${item.alt ?? "programme photograph"}`}
            >
              {imageUrl ? <Image src={imageUrl} alt={item.alt ?? ""} width={width} height={height} sizes="auto, (max-width: 360px) calc(100vw - 2rem), (max-width: 900px) calc(50vw - 1.5rem), (max-width: 1440px) calc(33.333vw - 1.3rem), 29rem" loading="lazy" placeholder={blur ? "blur" : "empty"} blurDataURL={blur ?? undefined} /> : <img src={item.url} alt={item.alt ?? ""} width={width} height={height} loading="lazy" decoding="async" />}
              <span className={styles.openLabel}>Enlarge</span>
            </button>
            {item.caption ? <figcaption>{item.caption}</figcaption> : null}
          </figure>
          );
        })}
      </div>

      {active ? (() => {
        const { width, height } = getPublicImageDimensions(active);
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
            aria-describedby={active.caption ? dialogCaptionId : undefined}
            tabIndex={-1}
          >
            <div className={styles.dialogTop}>
              <span id={dialogTitleId}>Image {activeIndex + 1} of {safeItems.length}: {active.alt ?? "programme photograph"}</span>
              <button ref={closeRef} type="button" onClick={close}>Close</button>
            </div>
            {activeImageUrl ? <Image className={styles.fullImage} src={activeImageUrl} alt={active.alt ?? ""} width={width} height={height} sizes="(max-width: 1200px) 90vw, 1120px" loading="eager" placeholder={activeBlur ? "blur" : "empty"} blurDataURL={activeBlur ?? undefined} /> : <img className={styles.fullImage} src={active.url} alt={active.alt ?? ""} width={width} height={height} decoding="async" />}
            {active.caption ? <p id={dialogCaptionId} className={styles.caption}>{active.caption}</p> : null}
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
