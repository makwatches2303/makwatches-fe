"use client";

import { cn } from "@/lib/utils";
import { ButtonLink, Divider, formatPrice } from "@/design-system";
import { selectAppliedCoupon, useCartStore } from "@/store/cart";
import { PromoCodeBox } from "./PromoCodeBox";

export interface CartSummaryProps {
  subtotal: number;
  /** Set once a real shipping rate is available. */
  shipping?: number | null;
  showPromoInput?: boolean;
  className?: string;
}

export function CartSummary({
  subtotal,
  shipping = null,
  showPromoInput = true,
  className,
}: CartSummaryProps) {
  const appliedCoupon = useCartStore(selectAppliedCoupon);
  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = Math.max(0, subtotal - discount) + (shipping ?? 0);

  return (
    <div className={cn(className)}>
      {showPromoInput && (
        <div className="mb-3.5">
          <PromoCodeBox subtotal={subtotal} />
        </div>
      )}

      <dl className="flex flex-col gap-1.5">
        <div className="flex justify-between text-mak-small text-mak-muted">
          <dt>Subtotal</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-mak-small text-emerald-600 font-medium">
            <dt>Discount ({appliedCoupon.code})</dt>
            <dd>-{formatPrice(appliedCoupon.discountAmount)}</dd>
          </div>
        )}
        <div className="flex justify-between text-mak-small text-mak-muted">
          <dt>Shipping</dt>
          <dd>
            {shipping === null ? "Calculated at checkout" : formatPrice(shipping)}
          </dd>
        </div>
      </dl>

      <Divider weight="hairline" className="my-3.5" />

      <div className="flex items-baseline justify-between">
        <span className="font-display text-base font-extrabold text-mak-ink">
          Total
        </span>
        <span className="font-display text-2xl font-extrabold tracking-[-0.01em] text-mak-ink">
          {formatPrice(total)}
        </span>
      </div>

      <ButtonLink href="/checkout" variant="primary" size="lg" block className="mt-4">
        Checkout
      </ButtonLink>
    </div>
  );
}
