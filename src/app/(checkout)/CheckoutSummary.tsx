"use client";

import { cn } from "@/lib/utils";
import { Divider, Text, formatPrice } from "@/design-system";
import { ProductImage } from "@/components/commerce";
import type { CartLine } from "@/store/cart";

/**
 * The order summary rail.
 *
 * Shows the server's total once the cart has been synced, and the bag's own
 * arithmetic before that. The two agree in the ordinary case; when they do not,
 * the server is right, and the difference is what the adjustment notice
 * upstream is there to explain.
 *
 * Shipping is shown once the customer has chosen a courier, and not before:
 * until then there is no charge to state, and printing "Free" or "₹0" would be
 * a claim we have not earned. Tax is still not configured in this system, so
 * it stays absent rather than being shown as zero.
 */

export interface CheckoutSummaryProps {
  lines: CartLine[];
  /** The server-priced goods total. Falls back to the bag's own sum when unsynced. */
  serverTotal: number | null;
  /** The chosen delivery charge, or null while no courier is selected. */
  shippingCharge?: number | null;
  /** The chosen courier's name, shown beside the charge. */
  shippingLabel?: string;
  className?: string;
}

export function CheckoutSummary({
  lines,
  serverTotal,
  shippingCharge = null,
  shippingLabel,
  className,
}: CheckoutSummaryProps) {
  const localTotal = lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0
  );
  const subtotal = serverTotal ?? localTotal;
  const total = subtotal + (shippingCharge ?? 0);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    // min-w-0 is load-bearing.
    //
    // This is a grid item, and a grid item's automatic minimum size is its
    // min-content width. The product name below is `truncate`, i.e.
    // white-space: nowrap, so its min-content width is the *whole* untruncated
    // title -- which pushed this panel to 543px and put 173px of horizontal
    // scroll on the checkout page at 390px. Letting the item shrink is what
    // allows truncate to actually truncate instead of forcing width.
    <aside
      className={cn("min-w-0", className)}
      aria-label="Order summary"
    >
      <div className="border-2 border-mak-line bg-mak-surface p-6">
        <h2 className="mb-5 font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-ink">
          Your order
        </h2>

        <ul className="flex flex-col gap-4">
          {lines.map((line) => (
            <li
              key={line.size ? `${line.productId}::${line.size}` : line.productId}
              className="flex min-w-0 gap-3.5"
            >
              <div className="relative size-16 shrink-0 border-2 border-mak-divider bg-mak-bg">
                <ProductImage
                  media={line.image}
                  alt={line.name}
                  ratio="square"
                  sizes="64px"
                />
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center bg-mak-ink px-1 font-display text-[10px] font-extrabold leading-none text-mak-bg"
                >
                  {line.quantity}
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-display text-mak-small font-extrabold tracking-[0.02em] text-mak-ink">
                  {line.name}
                </span>
                {line.size ? (
                  <span className="text-mak-label text-mak-muted">
                    {line.size}
                  </span>
                ) : null}
                <span className="text-mak-small text-mak-muted">
                  {formatPrice(line.price)} each
                </span>
              </div>

              <span className="shrink-0 font-display text-mak-small font-extrabold text-mak-ink">
                {formatPrice(line.price * line.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <Divider weight="hairline" className="my-5" />

        <dl className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <dt className="text-mak-small text-mak-muted">
              Subtotal ({count} {count === 1 ? "piece" : "pieces"})
            </dt>
            <dd className="text-mak-small tabular-nums text-mak-ink">
              {formatPrice(subtotal)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="min-w-0 text-mak-small text-mak-muted">
              Delivery
              {shippingLabel ? (
                <span className="block truncate text-mak-label text-mak-ink-subtle">
                  {shippingLabel}
                </span>
              ) : null}
            </dt>
            {/*
              A number only once the customer has chosen a courier. Before
              that the honest answer is that it is not decided yet -- "Free"
              or "₹0" would be a claim we have not earned.
            */}
            {shippingCharge === null ? (
              <dd className="shrink-0 text-mak-small text-mak-muted">
                Chosen at payment
              </dd>
            ) : (
              <dd className="shrink-0 text-mak-small tabular-nums text-mak-ink">
                {shippingCharge > 0 ? formatPrice(shippingCharge) : "Free"}
              </dd>
            )}
          </div>
        </dl>

        <Divider className="my-5" />

        <div className="flex items-baseline justify-between">
          <span className="font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-ink">
            Total
          </span>
          <span className="font-display text-2xl font-extrabold tracking-[-0.02em] text-mak-ink">
            {formatPrice(total)}
          </span>
        </div>

        {serverTotal === null ? (
          <Text size="label" tone="subtle" className="mt-3">
            Confirmed against live stock and pricing at the next step.
          </Text>
        ) : null}
      </div>
    </aside>
  );
}
