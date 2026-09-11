"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  ExpandIcon,
  IconButton,
  Modal,
} from "@/design-system";
import { IMAGE_SIZES, type MediaRef } from "@/lib/media";

import { ProductImage } from "./ProductImage";

/**
 * The product-detail image gallery.
 *
 * Supports thumbnails, keyboard navigation, a full-screen viewer, and native
 * swipe on touch. The main frame is a scroll-snap track rather than a JS
 * carousel, so swiping is the browser's own gesture -- smooth, interruptible,
 * and correct on every device without a gesture library.
 *
 * Falls back gracefully: a product with one image renders no controls, and a
 * product with none renders the branded placeholder.
 */

export interface ProductGalleryProps {
  images: MediaRef[];
  /** Product name, used for image alt text. */
  productName: string;
  className?: string;
}

export function ProductGallery({
  images,
  productName,
  className,
}: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const count = images.length;
  const hasMultiple = count > 1;

  /** Scroll the snap track to an index and mark it active. */
  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      const next = (index + count) % count;
      setActive(next);

      const track = trackRef.current;
      if (track) {
        track.scrollTo({ left: track.clientWidth * next, behavior: "smooth" });
      }
    },
    [count]
  );

  // Keep `active` in step when the user swipes the track directly.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !hasMultiple) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const index = Math.round(track.scrollLeft / track.clientWidth);
        setActive((current) => (current === index ? current : index));
      });
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
    };
  }, [hasMultiple]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!hasMultiple) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(active + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(active - 1);
    }
  };

  // No media at all: one placeholder frame, no controls.
  if (count === 0) {
    return (
      <div className={cn("min-w-0 max-w-full border-2 border-mak-line", className)}>
        <ProductImage media={null} alt={productName} sizes={IMAGE_SIZES.half} />
      </div>
    );
  }

  return (
    // min-w-0 is load-bearing, not defensive.
    //
    // The gallery is a grid item, and a grid item's automatic minimum size is
    // its min-content width -- which the thumbnail strip below drives to
    // (thumb count x 80px) + gaps. With six images that is 520px, so on a
    // 390px phone the item refused to shrink and pushed 210px of horizontal
    // scroll onto the whole document. Letting the item shrink puts the
    // strip's own overflow-x-auto back in charge of the overflow.
    <div className={cn("min-w-0 max-w-full", className)}>
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`${productName} images`}
        onKeyDown={onKeyDown}
        tabIndex={0}
        className="relative border-2 border-mak-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
      >
        <div
          ref={trackRef}
          className={cn(
            "flex w-full overflow-x-auto overscroll-x-contain",
            "snap-x snap-mandatory",
            // The scrollbar is redundant here: thumbnails and arrows already
            // communicate position.
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          {images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="w-full shrink-0 snap-center"
              aria-hidden={index !== active}
            >
              <ProductImage
                media={image}
                alt={`${productName} — image ${index + 1} of ${count}`}
                sizes={IMAGE_SIZES.half}
                priority={index === 0}
                grayscale={false}
              />
            </div>
          ))}
        </div>

        <IconButton
          label="View full screen"
          onClick={() => setZoomed(true)}
          className="absolute bottom-3 right-3 bg-mak-bg"
        >
          <ExpandIcon />
        </IconButton>

        {hasMultiple && (
          <>
            <IconButton
              label="Previous image"
              onClick={() => goTo(active - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-mak-bg"
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              label="Next image"
              onClick={() => goTo(active + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-mak-bg"
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}
      </div>

      {hasMultiple && (
        <div
          role="tablist"
          aria-label="Product images"
          className={cn(
            "mt-3 flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1",
            // Touch devices get momentum scrolling; the scrollbar itself is
            // redundant beside the arrows and the active-thumb border.
            "overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          {images.map((image, index) => (
            <button
              key={`thumb-${image.url}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Show image ${index + 1}`}
              onClick={() => goTo(index)}
              className={cn(
                "size-20 shrink-0 border-2 transition-colors duration-200 ease-mak",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent",
                index === active
                  ? "border-mak-accent"
                  : "border-mak-divider hover:border-mak-line"
              )}
            >
              <ProductImage
                media={image}
                alt=""
                sizes={IMAGE_SIZES.thumbnail}
                grayscale={false}
              />
            </button>
          ))}
        </div>
      )}

      <Modal
        open={zoomed}
        onClose={() => setZoomed(false)}
        title={`${productName} — full screen`}
        titleVisible={false}
        size="lg"
        hideClose
      >
        <div className="relative">
          <ProductImage
            media={images[active]}
            alt={`${productName} — image ${active + 1} of ${count}`}
            sizes={IMAGE_SIZES.full}
            ratio="square"
            grayscale={false}
          />

          <IconButton
            label="Close full screen"
            onClick={() => setZoomed(false)}
            className="absolute right-3 top-3 bg-mak-bg"
          >
            <CloseIcon />
          </IconButton>

          {hasMultiple && (
            <>
              <IconButton
                label="Previous image"
                onClick={() => setActive((a) => (a - 1 + count) % count)}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-mak-bg"
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                label="Next image"
                onClick={() => setActive((a) => (a + 1) % count)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-mak-bg"
              >
                <ChevronRightIcon />
              </IconButton>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
