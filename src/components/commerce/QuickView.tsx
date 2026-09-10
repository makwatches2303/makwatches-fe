"use client";

import Link from "next/link";

import {
  Badge,
  Modal,
  Price,
  RuleGrid,
  Text,
} from "@/design-system";
import type { Product } from "@/lib/api/types";
import { presentSpecs } from "@/lib/specs";
import { resolveProductImage, IMAGE_SIZES } from "@/lib/media";
import { effectivePrice } from "@/lib/pricing";

import { ProductImage } from "./ProductImage";
import { AddToBagButton } from "./AddToBagButton";
import { WishlistButton } from "./WishlistButton";
import { StockBadge } from "./StockBadge";
import { productHref } from "./ProductCard";

/**
 * The quick-view modal.
 *
 * Shows enough to decide without leaving the grid: image, name, the
 * specifications that exist, price and add-to-bag. Accessible, keyboard
 * dismissible and focus-trapped by Modal.
 *
 * Specifications are rendered only where the product records them. There is
 * deliberately no fallback text and no default value -- an unknown movement or
 * water resistance is simply absent from the table rather than filled with a
 * plausible-looking guess.
 */

export interface QuickViewProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export function QuickView({ product, open, onClose }: QuickViewProps) {
  if (!product) return null;

  const image = resolveProductImage(product);
  const specs = presentSpecs(product.specs);
  const label = product.collection || product.subcategory || product.category;
  const { price, compareAt } = effectivePrice(product);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product.name}
      titleVisible={false}
      size="lg"
    >
      <div className="grid md:grid-cols-2">
        <div className="border-b-2 border-mak-line md:border-b-0 md:border-r-2">
          <ProductImage
            media={image}
            alt={product.name}
            sizes={IMAGE_SIZES.half}
            grayscale={false}
          />
        </div>

        <div className="flex flex-col p-6 md:p-8">
          <div className="flex items-start justify-between gap-3">
            {label ? <Badge>{label}</Badge> : <span />}
            <StockBadge stock={product.stock} onlyWhenNotable />
          </div>

          <h2 className="mt-4 font-display text-mak-title font-extrabold leading-tight tracking-[-0.02em] text-mak-ink">
            {product.name}
          </h2>

          {product.specs?.movement ? (
            <Text size="small" tone="muted" className="mt-1">
              {product.specs.movement}
            </Text>
          ) : null}

          {product.shortDescription || product.description ? (
            <Text size="small" tone="muted" className="mt-4 line-clamp-4">
              {product.shortDescription || product.description}
            </Text>
          ) : null}

          {specs.length > 0 ? (
            <RuleGrid
              cols={{ base: 2, md: 2, lg: 2 }}
              className="mt-6 border-[1.5px]"
            >
              {specs.slice(0, 4).map((spec) => (
                <div key={spec.label} className="p-3">
                  <div className="text-mak-micro uppercase tracking-[0.12em] text-mak-subtle">
                    {spec.label}
                  </div>
                  <div className="mt-0.5 font-display text-mak-small font-extrabold text-mak-ink">
                    {spec.value}
                  </div>
                </div>
              ))}
            </RuleGrid>
          ) : null}

          <div className="mt-auto pt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Price
                value={price}
                compareAt={compareAt}
                size="xl"
              />
              <div className="flex items-center gap-2">
                <WishlistButton product={product} variant="overlay" size="md" />
                <AddToBagButton product={product} label="Add to bag +" />
              </div>
            </div>

            <Link
              href={productHref(product)}
              onClick={onClose}
              className="mt-4 inline-block font-display text-mak-small font-extrabold tracking-[0.04em] text-mak-accent underline underline-offset-4 hover:text-mak-accent-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
            >
              View full details
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
