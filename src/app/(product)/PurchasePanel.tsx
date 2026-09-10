"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  Button,
  MinusIcon,
  PlusIcon,
  Price,
  Text,
  formatPrice,
} from "@/design-system";
import { StockBadge, WishlistButton } from "@/components/commerce";
import type { Product } from "@/lib/api/types";
import { effectivePrice } from "@/lib/pricing";
import { useCartStore } from "@/store/cart";
import { useUIStore } from "@/store/ui";

/**
 * The purchase controls: quantity, add to bag, wishlist.
 *
 * Rendered twice — once inline in the product information column, and once in
 * the sticky bar that appears on mobile after the inline one scrolls away. Both
 * share this component so they can never disagree about stock or quantity.
 */

export interface PurchasePanelProps {
  product: Product;
}

/** Quantity stepper, capped at known stock. */
function QuantityStepper({
  quantity,
  max,
  onChange,
  compact = false,
}: {
  quantity: number;
  max: number;
  onChange: (next: number) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center border-2 border-mak-line">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        className={cn(
          "inline-flex items-center justify-center text-mak-ink transition-colors",
          "hover:bg-mak-surface disabled:opacity-40",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mak-accent",
          compact ? "size-11" : "size-12"
        )}
      >
        <MinusIcon size={16} />
      </button>

      <span
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "text-center font-display font-extrabold text-mak-ink",
          compact ? "w-10 text-mak-small" : "w-12"
        )}
      >
        <span className="sr-only">Quantity: </span>
        {quantity}
      </span>

      <button
        type="button"
        aria-label="Increase quantity"
        disabled={quantity >= max}
        onClick={() => onChange(quantity + 1)}
        className={cn(
          "inline-flex items-center justify-center text-mak-ink transition-colors",
          "hover:bg-mak-surface disabled:opacity-40",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mak-accent",
          compact ? "size-11" : "size-12"
        )}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}

export function PurchasePanel({ product }: PurchasePanelProps) {
  const [quantity, setQuantity] = useState(1);
  const addLine = useCartStore((state) => state.addLine);
  const openCart = useUIStore((state) => state.openCart);

  const soldOut = product.stock <= 0;
  const max = Math.max(1, product.stock);
  const { price, compareAt } = effectivePrice(product);

  const addToBag = () => {
    addLine(product, quantity);
    openCart();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4">
        <Price value={price} compareAt={compareAt} size="xl" />
        <StockBadge stock={product.stock} />
      </div>

      {soldOut ? (
        <>
          <Button variant="secondary" size="lg" block disabled>
            Sold out
          </Button>
          <Text size="small" tone="muted">
            This piece is currently unavailable.
          </Text>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <QuantityStepper
              quantity={quantity}
              max={max}
              onChange={setQuantity}
            />
            <Button
              variant="primary"
              size="lg"
              onClick={addToBag}
              className="min-w-[200px] flex-1"
            >
              Add to bag
            </Button>
            <WishlistButton product={product} variant="overlay" size="md" />
          </div>

          {quantity >= max ? (
            <Text size="small" tone="muted">
              Only {max} {max === 1 ? "piece is" : "pieces are"} available.
            </Text>
          ) : null}
        </>
      )}
    </div>
  );
}

/**
 * The sticky mobile purchase bar.
 *
 * Appears below the lg breakpoint only. Kept deliberately minimal — price,
 * quantity, add — because it sits over content and must not swallow the screen.
 *
 * `pb-[env(safe-area-inset-bottom)]` keeps it clear of the iOS home indicator.
 */
export function StickyPurchaseBar({ product }: PurchasePanelProps) {
  const [quantity, setQuantity] = useState(1);
  const addLine = useCartStore((state) => state.addLine);
  const openCart = useUIStore((state) => state.openCart);

  const soldOut = product.stock <= 0;
  const max = Math.max(1, product.stock);
  const { price } = effectivePrice(product);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-70 border-t-2 border-mak-line bg-mak-bg lg:hidden",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-mak-micro uppercase tracking-[0.12em] text-mak-subtle">
            {product.name}
          </div>
          <div className="font-display text-lg font-extrabold text-mak-ink">
            {formatPrice(price)}
          </div>
        </div>

        {soldOut ? (
          <Button variant="secondary" size="md" disabled>
            Sold out
          </Button>
        ) : (
          <>
            <QuantityStepper
              quantity={quantity}
              max={max}
              onChange={setQuantity}
              compact
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                addLine(product, quantity);
                openCart();
              }}
            >
              Add
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
