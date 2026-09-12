"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { Badge, Price, Text } from "@/design-system";
import type { Product } from "@/lib/api/types";
import { resolveProductImage, IMAGE_SIZES } from "@/lib/media";
import { effectivePrice } from "@/lib/pricing";
import { useUIStore } from "@/store/ui";

import { ProductImage } from "./ProductImage";
import { WishlistButton } from "./WishlistButton";
import { AddToBagButton } from "./AddToBagButton";

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

  const image = resolveProductImage(product);
  const label = product.collection || product.subcategory || product.category;
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
          className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
        >
          {/* The card name is the accessible name for this link. */}
          <span className="sr-only">{product.name}</span>
          <ProductImage
            media={image}
            alt={product.name}
            sizes={IMAGE_SIZES.productGrid}
            priority={priority}
            hoverZoom
          />
        </Link>

        {label ? (
          <Badge className="pointer-events-none absolute left-2 top-2 sm:left-2.5 sm:top-2.5 max-w-[calc(100%-2.75rem)] truncate border px-1.5 py-0.5 text-[9px] sm:text-[10px]">
            {label}
          </Badge>
        ) : null}

        <WishlistButton
          product={product}
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
              onClick={() => openQuickView(product.id)}
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

      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-1.5 p-3 sm:p-4 pb-3.5 sm:pb-5">
        {/* Title: 2-line clamp, clean responsive size, uniform height */}
        <h3
          className="font-display text-[13px] sm:text-sm md:text-[15px] font-bold leading-snug tracking-[-0.01em] text-mak-ink break-words line-clamp-2 min-h-[2.6em]"
          title={product.name}
        >
          {/*
            A second link to the same product, and the visible one. No
            full-card ::after overlay here: that would sit above the wishlist
            toggle and the action bar and swallow their clicks.
          */}
          <Link
            href={productHref(product)}
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
          <p className="text-[11px] sm:text-xs text-mak-ink-subtle uppercase tracking-[0.05em] truncate">
            {product.specs.movement}
          </p>
        ) : secondaryLabel ? (
          <p className="text-[11px] sm:text-xs text-mak-ink-subtle uppercase tracking-[0.05em] truncate">
            {secondaryLabel}
          </p>
        ) : (
          <p className="text-[11px] sm:text-xs text-transparent select-none" aria-hidden="true">
            &nbsp;
          </p>
        )}

        <Price
          value={price}
          compareAt={compareAt}
          size="sm"
          className="mt-auto pt-2 sm:pt-3 !text-sm sm:!text-base md:!text-lg font-bold"
        />
      </div>
    </article>
  );
}
