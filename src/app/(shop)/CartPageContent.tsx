"use client";

import { useEffect } from "react";
import {
  ButtonLink,
  Divider,
  EmptyState,
  LoadingState,
  Text,
  formatPrice,
} from "@/design-system";
import { CartLineItem, PromoCodeBox } from "@/components/commerce";
import {
  selectAppliedCoupon,
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
} from "@/store/cart";
import { trackViewCart, trackBeginCheckout } from "@/lib/analytics";

/**
 * The cart page body.
 *
 * Reads the same store the drawer does, so the two are always in agreement.
 *
 * Renders a loading state until the persisted cart has rehydrated: without it
 * the first paint would show "your bag is empty" to someone who has items,
 * because localStorage is not available during server render.
 *
 * The page heading lives in the server component, not here, so the page always
 * has an <h1> even before this hydrates.
 */
export function CartPageContent() {
  const hydrated = useCartStore((state) => state.hydrated);
  const lines = useCartStore((state) => state.lines);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const appliedCoupon = useCartStore(selectAppliedCoupon);
  const clear = useCartStore((state) => state.clear);

  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = Math.max(0, subtotal - discount);

  useEffect(() => {
    if (hydrated && lines.length > 0) {
      trackViewCart(lines, subtotal);
    }
  }, [hydrated]);

  if (!hydrated) {
    return <LoadingState label="Loading your bag" />;
  }

  if (lines.length === 0) {
    return (
      <>
        <EmptyState
          title="Nothing saved to your bag yet."
          description="Browse the collection and add a piece to get started."
          action={
            <ButtonLink href="/shop" variant="primary" size="lg">
              Browse the collection
            </ButtonLink>
          }
        />
      </>
    );
  }

  return (
    <>
      <Text size="lead" tone="muted" aria-live="polite">
        {count} {count === 1 ? "piece" : "pieces"} in your bag.
      </Text>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
        <div className="min-w-0 border-2 border-mak-line">
          <ul className="list-none">
            {lines.map((line) => (
              <li key={`${line.productId}-${line.size ?? ""}`}>
                <CartLineItem line={line} />
              </li>
            ))}
          </ul>
        </div>

        {/* Sticky on desktop so the total stays visible down a long bag. */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border-2 border-mak-line p-6">
            <Text size="label" tone="ink" className="mb-5">
              Order summary
            </Text>

            <div className="mb-4">
              <PromoCodeBox subtotal={subtotal} />
            </div>

            <dl className="flex flex-col gap-2">
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
                {/*
                  Not quoted here. Rates come from the courier against a real
                  pincode at checkout; stating a number now would be a promise
                  the storefront cannot keep.
                */}
                <dd>Calculated at checkout</dd>
              </div>
            </dl>

            <Divider weight="hairline" className="my-4" />

            <div className="flex items-baseline justify-between">
              <span className="font-display text-base font-extrabold text-mak-ink">
                Total
              </span>
              <span className="font-display text-2xl font-extrabold tracking-[-0.01em] text-mak-ink">
                {formatPrice(total)}
              </span>
            </div>

            <ButtonLink
              href="/checkout"
              variant="primary"
              size="lg"
              block
              className="mt-5"
              onClick={() => trackBeginCheckout(lines, total, appliedCoupon?.code)}
            >
              Checkout
            </ButtonLink>

            <ButtonLink
              href="/shop"
              variant="secondary"
              size="md"
              block
              className="mt-3"
            >
              Continue shopping
            </ButtonLink>

            <button
              type="button"
              onClick={clear}
              className="mt-5 w-full text-mak-small text-mak-subtle underline underline-offset-4 transition-colors hover:text-mak-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
            >
              Empty bag
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
