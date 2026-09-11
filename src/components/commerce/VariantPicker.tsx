import Link from "next/link";

import { cn } from "@/lib/utils";
import type { Product } from "@/lib/api/types";
import type { ProductVariant } from "@/lib/api/server";

import { productHref } from "@/lib/product-href";

/**
 * The color/variant picker on a product page.
 *
 * Each chip is a real navigation, not a client-side image swap: every
 * colorway is its own product with its own price, stock, slug and SEO
 * identity, matching how the catalog already stores and links them
 * (see models.Product's VariantGroupID). Renders nothing when there is
 * nothing to pick between.
 */

export interface VariantPickerProps {
  current: Pick<Product, "id" | "slug" | "name" | "variantLabel">;
  /** Siblings only -- already excludes `current` (see fetchProductVariants). */
  variants: ProductVariant[];
  className?: string;
}

const chipBase =
  "inline-flex min-h-11 items-center gap-2 border-2 px-4 py-2 " +
  "font-display text-mak-small font-extrabold tracking-[0.03em] " +
  "transition-colors duration-200 ease-mak " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent";

export function VariantPicker({ current, variants, className }: VariantPickerProps) {
  if (variants.length === 0) return null;

  return (
    <div role="group" aria-label="Colour" className={cn("flex flex-wrap gap-2.5", className)}>
      <span
        aria-current="true"
        className={cn(chipBase, "border-mak-accent bg-mak-accent text-mak-on-accent")}
      >
        {current.variantLabel || current.name}
      </span>
      {variants.map((variant) => (
        <Link
          key={variant.id}
          href={productHref(variant)}
          className={cn(
            chipBase,
            "border-mak-line bg-mak-bg text-mak-ink hover:bg-mak-ink hover:text-mak-bg",
            !variant.inStock && "opacity-50"
          )}
        >
          {variant.variantLabel || variant.name}
        </Link>
      ))}
    </div>
  );
}
