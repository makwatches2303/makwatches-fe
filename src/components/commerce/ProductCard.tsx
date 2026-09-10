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

/**
 * The product's canonical URL.
 *
 * Prefers the slug route, which only exists for records that have been through
 * the additive slug backfill. Records without one keep resolving by id, so an
 * unmigrated catalog still links correctly.
 */
export function productHref(product: Product): string {
  return product.slug ? `/product/${product.slug}` : `/product/id/${product.id}`;
}

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
      className={cn("group relative flex min-w-0 flex-col bg-mak-bg", className)}
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
          <Badge className="pointer-events-none absolute left-3 top-3">
            {label}
          </Badge>
        ) : null}

        <WishlistButton
          product={product}
          className="absolute right-3 top-3"
        />

        {soldOut ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-mak-bg/70">
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
                "min-h-11 flex-1 border-t-2 border-mak-line bg-mak-bg px-3 py-3",
                "font-display text-mak-micro font-extrabold uppercase tracking-[0.06em] text-mak-ink",
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
              className="min-h-11 flex-1 border-x-0 border-b-0 border-t-2 !px-3 text-mak-micro uppercase tracking-[0.06em]"
            />
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4 pb-5">
        {/* break-words so catalog SKUs wrap instead of overflowing the cell. */}
        <h3 className="font-display text-mak-heading font-extrabold leading-tight tracking-[-0.01em] text-mak-ink break-words">
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
          Movement is shown only when the product actually records one. There is
          no placeholder here on purpose: inventing "Quartz" for a product whose
          movement is unknown would be a fabricated specification.

          The brand is the fallback, but only when it adds something: most
          catalog names already begin with the brand ("Fastrack Streetwear…"),
          and repeating it underneath reads as a rendering error.
        */}
        {product.specs?.movement ? (
          <Text size="small" tone="muted">
            {product.specs.movement}
          </Text>
        ) : secondaryLabel ? (
          <Text size="small" tone="muted">
            {secondaryLabel}
          </Text>
        ) : null}

        <Price
          value={price}
          compareAt={compareAt}
          size="md"
          className="mt-auto pt-3"
        />
      </div>
    </article>
  );
}
