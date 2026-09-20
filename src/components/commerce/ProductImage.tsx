"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { getImageProps, IMAGE_SIZES, type MediaRef } from "@/lib/media";

/**
 * A product image with a guaranteed fallback.
 *
 * Never renders a broken image: a missing reference, or one that fails to load,
 * falls back to the branded MAK placeholder. The placeholder is styled as a
 * placeholder -- it must not read as product photography.
 *
 * `fallback` sits between the two. A listing draws the small rendition the API
 * advertises, but the API advertises it by naming convention rather than by
 * checking the bucket, so a product whose rendition was never generated points
 * at a URL that 403s. Handing the full-size original as the fallback means that
 * product shows its photograph rather than the placeholder.
 *
 * Takes a MediaRef rather than a URL string so the storage layer stays
 * swappable, per the media architecture.
 */

export interface ProductImageProps {
  media: MediaRef | string | null | undefined;
  /**
   * Tried when `media` fails to load, before the placeholder. Supply the
   * full-size original when `media` is a small rendition.
   */
  fallback?: MediaRef | string | null;
  /** Falls back to this when the media carries no alt of its own. */
  alt: string;
  /** Responsive `sizes`. Pick the preset matching the layout. */
  sizes?: string;
  /** Aspect ratio of the frame. Products are square throughout the system. */
  ratio?: "square" | "portrait" | "landscape" | "auto";
  /**
   * How the image fills the frame.
   *
   * `cover` crops to fill and suits imagery chosen for its frame. `contain`
   * shows the whole photograph letterboxed against the frame's white ground --
   * the correct choice for a product shot, which must never be cropped.
   */
  fit?: "cover" | "contain";
  /** Prioritize loading. Use only for above-the-fold imagery. */
  priority?: boolean;
  /** Apply the reference's black-and-white treatment. */
  grayscale?: boolean;
  /** Scale on hover. Only takes effect on fine-pointer devices. */
  hoverZoom?: boolean;
  /**
   * Notified when the image fails to load.
   *
   * The placeholder is still shown either way -- this is additive, for callers
   * that have a second source worth trying (an order line falling back from a
   * stale snapshot URL to the live product).
   */
  onError?: () => void;
  className?: string;
  imageClassName?: string;
}

const RATIO = {
  square: "aspect-square",
  portrait: "aspect-4/5",
  landscape: "aspect-video",
  auto: "",
} as const;

export function ProductImage({
  media,
  fallback,
  alt,
  sizes = IMAGE_SIZES.productGrid,
  ratio = "square",
  fit = "cover",
  priority = false,
  grayscale = false,
  hoverZoom = false,
  onError,
  className,
  imageClassName,
}: ProductImageProps) {
  const resolved = getImageProps(media, alt);
  const resolvedFallback = getImageProps(fallback, alt);

  // Which source is being attempted. 0 is `media`; 1 is `fallback` where there
  // is a distinct one to try; past the end of the chain is the placeholder.
  const [attempt, setAttempt] = useState(0);

  const chain = [resolved];
  if (!resolvedFallback.isPlaceholder && resolvedFallback.src !== resolved.src) {
    chain.push(resolvedFallback);
  }

  const current = chain[attempt];
  // Exhausting the chain is treated exactly like a missing reference.
  const isPlaceholder = !current || current.isPlaceholder;
  const src = isPlaceholder ? "/mak-placeholder.svg" : current.src;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white",
        RATIO[ratio],
        className
      )}
    >
      <Image
        // Keyed on the source so swapping to the fallback remounts the element
        // rather than leaving next/image on its already-errored state.
        key={src}
        src={src}
        alt={isPlaceholder ? "" : current.alt}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => {
          // Stop at the placeholder: incrementing past the chain when the
          // placeholder itself fails would re-render forever.
          setAttempt((n) => (n < chain.length ? n + 1 : n));
          onError?.();
        }}
        className={cn(
          // The placeholder overrides this below; it is always contained.
          fit === "contain" ? "object-contain" : "object-cover",
          // The placeholder is contained and inset so it reads as a marker
          // rather than as a cropped photograph.
          isPlaceholder && "scale-[0.55] object-contain opacity-70",
          !isPlaceholder && grayscale && "mak-grayscale",
          hoverZoom &&
            !isPlaceholder &&
            "transition-transform duration-700 ease-mak [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.08]",
          imageClassName
        )}
      />
    </div>
  );
}
