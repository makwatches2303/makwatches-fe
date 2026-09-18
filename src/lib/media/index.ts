/**
 * Media abstraction for MAK Watches.
 *
 * Components work with a `MediaRef`, never a bare URL string, so the storage
 * backend can change without touching the UI. Firebase Storage is the only
 * write target today; the resolution rules below are the client-side mirror of
 * makwatches-be/internal/imageurl.
 *
 * Deliberately not here:
 *   - No `/uploads` reconstruction. Legacy references are normalized onto the
 *     bucket, never back onto an API host.
 *   - No hardcoded bucket URL. The bucket is a build-time constant supplied by
 *     the environment, matching next.config.ts remotePatterns.
 */

import type { MediaRef, Product } from "@/lib/api/types";

export type { MediaRef };

const GCS_HOST = "https://storage.googleapis.com";
const FIREBASE_HOST = "https://firebasestorage.googleapis.com";

/**
 * The Firebase Storage bucket product media lives in.
 *
 * Optional, unlike the API origin: media resolution degrades to the placeholder
 * rather than failing the render, and every URL the API returns is already
 * absolute. The bucket is only needed to normalize bare object keys.
 */
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";

/** The branded stand-in shown when an image is missing or fails to load. */
export const PLACEHOLDER_SRC = "/mak-placeholder.svg";

/**
 * Resolve a stored image reference to a URL that can be rendered.
 *
 * Returns null when nothing usable can be derived, so callers render the
 * placeholder explicitly rather than emitting a broken <img>.
 */
export function resolveMediaUrl(ref: string | null | undefined): string | null {
  const value = ref?.trim();
  if (!value) return null;

  // Already-canonical storage URLs pass through untouched. This includes
  // Firebase download URLs carrying an ?alt=media&token=… query, which must
  // keep their query string to remain fetchable.
  if (value.startsWith(`${GCS_HOST}/`) || value.startsWith(`${FIREBASE_HOST}/`)) {
    return value;
  }

  // gs://bucket/object — the URI form the Firebase console and CLI emit. Not
  // fetchable by a browser, so it is rewritten onto the public HTTPS path.
  if (value.startsWith("gs://")) {
    const withoutScheme = value.slice("gs://".length);
    const separator = withoutScheme.indexOf("/");
    if (separator > 0) {
      const bucket = withoutScheme.slice(0, separator);
      const object = withoutScheme.slice(separator + 1);
      if (bucket && object) return `${GCS_HOST}/${bucket}/${encodeObjectPath(object)}`;
    }
    return null;
  }

  // Local public assets.
  if (value.startsWith("/") && !value.includes("/uploads/")) {
    return value;
  }

  // Legacy "/uploads/<object>" reference, relative or against any host. The
  // object name is the same key the bucket holds, so it is rewritten onto the
  // bucket rather than back onto an API origin.
  const uploadsIndex = value.indexOf("/uploads/");
  if (uploadsIndex >= 0) {
    const object = value.slice(uploadsIndex + "/uploads/".length).replace(/^\/+/, "");
    if (object && BUCKET) return `${GCS_HOST}/${BUCKET}/${encodeObjectPath(object)}`;
    return null;
  }

  // Any other absolute URL (CDN, external asset) is left as-is.
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  // A bare object name is assumed to live in the bucket root.
  if (BUCKET) return `${GCS_HOST}/${BUCKET}/${encodeObjectPath(value)}`;

  return null;
}

/**
 * Percent-encode an object name for use in a URL path.
 *
 * Object names come from the database and can contain spaces, "#" or "?" --
 * any of which would truncate or corrupt the URL if interpolated raw. Path
 * separators are preserved so nested object names keep their structure, and
 * already-encoded input is left alone rather than double-encoded.
 */
function encodeObjectPath(object: string): string {
  return object
    .split("/")
    .map((segment) => {
      // decodeURIComponent throws on a malformed sequence; if it round-trips
      // unchanged the segment was not encoded and needs encoding now.
      try {
        if (decodeURIComponent(segment) !== segment) return segment;
      } catch {
        // Malformed encoding: treat as literal and encode it.
      }
      return encodeURIComponent(segment);
    })
    .join("/");
}

/** Normalize a loose reference into a MediaRef, or null if unusable. */
export function toMediaRef(
  ref: string | MediaRef | null | undefined,
  alt?: string
): MediaRef | null {
  if (!ref) return null;

  if (typeof ref === "string") {
    const url = resolveMediaUrl(ref);
    return url ? { url, alt, kind: "image" } : null;
  }

  const url = resolveMediaUrl(ref.url);
  return url ? { ...ref, url, alt: ref.alt ?? alt } : null;
}

/**
 * Every renderable image for a product, in display order.
 *
 * Prefers the structured `media` array; falls back to the legacy `images` list
 * and then the single `imageUrl`, which is what un-migrated records carry.
 * Returns an empty array rather than a placeholder entry, so callers can
 * distinguish "no images" from "one image".
 */
export function resolveProductImages(
  product: Pick<Product, "name" | "media" | "images" | "imageUrl">
): MediaRef[] {
  const alt = product.name;

  if (product.media?.length) {
    return product.media
      .map((m) => toMediaRef(m, alt))
      .filter((m): m is MediaRef => m !== null);
  }

  if (product.images?.length) {
    return product.images
      .map((src) => toMediaRef(src, alt))
      .filter((m): m is MediaRef => m !== null);
  }

  const single = toMediaRef(product.imageUrl, alt);
  return single ? [single] : [];
}

/**
 * The primary image for a product, or null when it has none.
 */
export function resolveProductImage(
  product: Pick<Product, "name" | "media" | "images" | "imageUrl">
): MediaRef | null {
  return resolveProductImages(product)[0] ?? null;
}

/**
 * The image to draw in a grid, card or cart line.
 *
 * Prefers the small rendition the API sends for listings, falling back to the
 * full-size primary image for anything uploaded before renditions existed.
 * Worth the separate function: with edge image optimization switched off, a
 * card that reaches for the full-size image downloads the whole photograph to
 * fill a thumbnail, twenty times over on a listing page.
 */
export function resolveProductThumbnail(
  product: Pick<Product, "name" | "media" | "images" | "imageUrl" | "thumbnail">
): MediaRef | null {
  const thumbnail = toMediaRef(product.thumbnail, product.name);
  return thumbnail ?? resolveProductImage(product);
}

/** Props ready to spread onto a next/image component. */
export interface ImageProps {
  src: string;
  alt: string;
  /** True when `src` is the placeholder rather than real media. */
  isPlaceholder: boolean;
  width?: number;
  height?: number;
}

/**
 * Build next/image props from a media reference.
 *
 * Always returns something renderable: when the reference is missing, the
 * branded placeholder is returned with `isPlaceholder` set, so the caller can
 * style it as a placeholder rather than passing it off as product photography.
 */
export function getImageProps(
  ref: string | MediaRef | null | undefined,
  fallbackAlt = ""
): ImageProps {
  const media = toMediaRef(ref, fallbackAlt);

  if (!media) {
    return {
      src: PLACEHOLDER_SRC,
      // An empty alt keeps the placeholder out of the accessibility tree; it
      // carries no information a screen reader needs.
      alt: "",
      isPlaceholder: true,
    };
  }

  return {
    src: media.url,
    alt: media.alt ?? fallbackAlt,
    isPlaceholder: false,
    width: media.width,
    height: media.height,
  };
}

/** Standard `sizes` strings for the grid densities the design system uses. */
export const IMAGE_SIZES = {
  /** 2-up mobile, 3-up tablet, 4-up desktop. */
  productGrid: "(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw",
  /** 1-up mobile, 2-up tablet, 3-up desktop. */
  categoryTile: "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw",
  /** Full-bleed hero and editorial imagery. */
  full: "100vw",
  /** Half-width editorial split. */
  half: "(max-width: 1023px) 100vw, 50vw",
  /** Cart line items and small thumbnails. */
  thumbnail: "96px",
} as const;
