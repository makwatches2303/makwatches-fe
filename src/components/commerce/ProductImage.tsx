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
 * Takes a MediaRef rather than a URL string so the storage layer stays
 * swappable, per the media architecture.
 */

export interface ProductImageProps {
  media: MediaRef | string | null | undefined;
  /** Falls back to this when the media carries no alt of its own. */
  alt: string;
  /** Responsive `sizes`. Pick the preset matching the layout. */
  sizes?: string;
  /** Aspect ratio of the frame. Products are square throughout the system. */
  ratio?: "square" | "portrait" | "landscape" | "auto";
  /** Prioritize loading. Use only for above-the-fold imagery. */
  priority?: boolean;
  /** Apply the reference's black-and-white treatment. */
  grayscale?: boolean;
  /** Scale on hover. Only takes effect on fine-pointer devices. */
  hoverZoom?: boolean;
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
  alt,
  sizes = IMAGE_SIZES.productGrid,
  ratio = "square",
  priority = false,
  grayscale = false,
  hoverZoom = false,
  className,
  imageClassName,
}: ProductImageProps) {
  const resolved = getImageProps(media, alt);
  const [failed, setFailed] = useState(false);

  // A load failure is treated exactly like a missing reference.
  const isPlaceholder = resolved.isPlaceholder || failed;
  const src = failed ? "/mak-placeholder.svg" : resolved.src;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white",
        RATIO[ratio],
        className
      )}
    >
      <Image
        src={src}
        alt={isPlaceholder ? "" : resolved.alt}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => setFailed(true)}
        className={cn(
          "object-cover",
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
