"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { Badge, Price, Text } from "@/design-system";
import type { Product } from "@/lib/api/types";
import {
  resolveProductImage,
  resolveProductThumbnail,
  IMAGE_SIZES,
} from "@/lib/media";
import { effectivePrice } from "@/lib/pricing";
import { useUIStore } from "@/store/ui";

import { ProductImage } from "./ProductImage";
import { WishlistButton } from "./WishlistButton";
import { AddToBagButton } from "./AddToBagButton";
import { trackSelectItem } from "@/lib/analytics";

/**
 * A product tile.
 *
 * Geometry follows the reference: a square image well, a bordered category
 * badge top-left, the wishlist toggle top-right, and an overlay action bar that
 * slides in on hover with Quick view and Add.
 *
 * Touch behaviour is deliberately different from hover behaviour. On a
 * fine-pointer device the action bar appears on hover; on touch there is no
 * hover state to reveal it, so the bar is always visible instead. Hiding
 * actions behind a hover a touch device cannot produce would make them
 * unreachable.
 */

export interface ProductCardProps {
  product: Product;
  /** Prioritize the image. Use for the first row of the first grid only. */
  priority?: boolean;
  /** Show the Quick view / Add overlay. */
  showActions?: boolean;
  className?: string;
}

import { productHref } from "@/lib/product-href";
export { productHref };

export function ProductCard({
  product,
  priority = false,
  showActions = true,
  className,
}: ProductCardProps) {
  const openQuickView = useUIStore((state) => state.openQuickView);

  // The card draws a small square: the grid rendition is the right asset,
  // and falls back to the full-size image when a product has no rendition.
  const image = resolveProductThumbnail(product);
  // The API names the rendition by convention without checking that it was
  // ever generated, so some products advertise a thumbnail URL that 403s.
  // The original is the fallback, which is why those tiles show the watch
  // rather than the placeholder.
  const original = resolveProductImage(product);
  const soldOut = product.stock <= 0;
  const { price, compareAt } = effectivePrice(product);

  // Suppress a brand line the product name already opens with.
  const brand = product.brand?.trim();
  const secondaryLabel =
    brand && !product.name.trim().toLowerCase().startsWith(brand.toLowerCase())
      ? brand
      : undefined;

  return (
    <article
      // min-w-0: a grid item defaults to min-width:auto, so a long unbroken
      // token in a product name ("…Men-FV30014YM01W") would widen the column
      // and push the whole grid past the viewport.
      className={cn("group relative flex min-w-0 flex-col bg-white", className)}
    >
      <div className="relative">
        {/*
          The whole image well is the link target. It sits beneath the overlay
          controls in the stacking order, so the wishlist and action buttons
          stay clickable.
        */}
        <Link
          href={productHref(product)}
          onClick={() => trackSelectItem(product)}
          className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
        >
          {/* The card name is the accessible name for this link. */}
          <span className="sr-only">{product.name}</span>
          {/*
            A 4:5 well on mobile, square from `sm`.

            Two things make the photograph dominate the tile rather than share
            it with the text:

            **A taller frame.** At 390px the card is 172px wide, so the well is
            172x215px against a description block of roughly 85px plus the
            36px action bar -- the image is now comfortably the larger half,
            which it was not when both were square.

            **`cover` rather than `contain`.** The catalogue is shot at
            1000x1000, and a *contained* square image is constrained by the
            shorter side of its frame: in a taller frame the watch would stay
            at the column's width and the extra height would be dead white
            band. Covering lets it scale to fill, which renders it ~25% larger.
            The overflow is (k-1)/2k = 10% of the source trimmed from each
            side, and the studio shots carry 18.9%-35.7% of blank margin around
            the watch -- so that 10% is margin, and no watch is cut.

            Desktop is untouched by the fit change: for a square source in the
            square `sm` frame, cover and contain produce exactly the same
            result (scale 1, no crop either way).
          */}
          <ProductImage
            media={image}
            fallback={original}
            alt={product.name}
            sizes={IMAGE_SIZES.productGrid}
            ratio="portrait"
            className="sm:aspect-square"
            fit="cover"
            priority={priority}
            hoverZoom
          />
        </Link>

        {/*
          The category badge is gone.

          It rendered `product.collection || product.subcategory ||
          product.category`, which for this catalogue meant every tile was
          stamped "METAL WATCH" or "LEATHER WATCH" -- a strap material presented
          as if it were the product's identity, directly over the photograph.
          The brand and the product name below already say what the piece is.

          Only the badge is removed. `product.subcategory` and `category` are
          untouched in the data and still drive category routing, filters and
          the breadcrumb on the product page.
        */}
        <WishlistButton
          product={product}
          size="xs"
          className="absolute right-2 top-2 sm:right-2.5 sm:top-2.5"
        />

        {soldOut ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70">
            <Badge tone="ink">Sold out</Badge>
          </div>
        ) : null}

        {showActions && !soldOut ? (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 flex",
              // Always visible on touch; revealed on hover/focus where a fine
              // pointer exists.
              "[@media(hover:hover)_and_(pointer:fine)]:opacity-0",
              "[@media(hover:hover)_and_(pointer:fine)]:transition-opacity",
              "[@media(hover:hover)_and_(pointer:fine)]:duration-300",
              "[@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100",
              "[@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100"
            )}
          >
            <button
              type="button"
              onClick={() => {
                trackSelectItem(product);
                openQuickView(product.id);
              }}
              className={cn(
                "min-h-9 sm:min-h-10 flex-1 border-t-2 border-mak-line bg-white px-2 py-2 sm:px-3 sm:py-2.5",
                "font-display text-[10px] sm:text-mak-micro font-bold uppercase tracking-[0.04em] text-mak-ink truncate",
                "transition-colors duration-200 ease-mak hover:bg-mak-surface",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mak-accent"
              )}
            >
              Quick view
            </button>

            <AddToBagButton
              product={product}
              buttonSize="sm"
              label="Add +"
              className="min-h-9 sm:min-h-10 flex-1 border-x-0 border-b-0 border-t-2 !px-2 sm:!px-3 text-[10px] sm:text-mak-micro font-bold uppercase tracking-[0.04em]"
            />
          </div>
        ) : null}
      </div>

      {/*
        The description block, trimmed on mobile only -- roughly 13px back to
        the image above it. Every reduction is a `base` value with the previous
        one restored at `sm`, so tablet and desktop keep the spacing they had.
        Nothing is removed: title, brand line, price and the struck-through
        compare-at all still render at a legible size.
      */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:gap-1.5 p-2 sm:p-4 pb-2.5 sm:pb-5">
        {/* Title: 2-line clamp, clean responsive size, uniform height */}
        <h3
          // leading-[1.3] on mobile is tighter and it is also what keeps the
          // row aligned: 2 x 1.3 = 2.6em is exactly the reserved min-height, so
          // a one-line and a two-line card are the same height instead of 2px
          // apart. `sm` keeps leading-snug, unchanged.
          className="font-display text-[13px] sm:text-sm md:text-[15px] font-bold leading-[1.3] sm:leading-snug tracking-[-0.01em] text-mak-ink break-words line-clamp-2 min-h-[2.6em]"
          title={product.name}
        >
          {/*
            A second link to the same product, and the visible one. No
            full-card ::after overlay here: that would sit above the wishlist
            toggle and the action bar and swallow their clicks.
          */}
          <Link
            href={productHref(product)}
            onClick={() => trackSelectItem(product)}
            className="transition-colors duration-200 ease-mak hover:text-mak-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
          >
            {product.name}
          </Link>
        </h3>

        {/*
          Movement is shown only when the product actually records one.
          The brand is the fallback.
        */}
        {product.specs?.movement ? (
          <p className="text-[10px] sm:text-xs text-mak-ink-subtle uppercase tracking-[0.05em] truncate">
            {product.specs.movement}
          </p>
        ) : secondaryLabel ? (
          <p className="text-[10px] sm:text-xs text-mak-ink-subtle uppercase tracking-[0.05em] truncate">
            {secondaryLabel}
          </p>
        ) : (
          <p className="text-[10px] sm:text-xs text-transparent select-none" aria-hidden="true">
            &nbsp;
          </p>
        )}

        <Price
          value={price}
          compareAt={compareAt}
          size="sm"
          className="mt-auto pt-1 sm:pt-3 !text-sm sm:!text-base md:!text-lg font-bold"
        />
      </div>
    </article>
  );
}
