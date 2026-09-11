"use client";

import { Text, formatPrice } from "@/design-system";
import type { ShippingOption } from "@/lib/api/checkout";

/**
 * The delivery courier picker.
 *
 * Every figure shown here comes from the carrier via our backend -- nothing is
 * computed or assumed locally. An option the carrier gave no delivery estimate
 * for simply shows no estimate: printing a guessed range would be a promise
 * nothing backs.
 *
 * The selected option is identified by its opaque `quote`, which is what the
 * server verifies. The displayed price is presentation only.
 */

export interface ShippingOptionsProps {
  options: ShippingOption[];
  /** The `quote` of the selected option, or null when none is chosen yet. */
  selectedQuote: string | null;
  onSelect: (option: ShippingOption) => void;
  loading?: boolean;
  /** A customer-safe explanation of why options could not be loaded. */
  error?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
}

/** The delivery estimate, or null when the carrier supplied none. */
function etaLabel(option: ShippingOption): string | null {
  if (option.estimatedDeliveryDays && option.estimatedDeliveryDays > 0) {
    const days = option.estimatedDeliveryDays;
    return days === 1 ? "Delivery in 1 day" : `Delivery in ${days} days`;
  }
  if (option.etd) return `Delivery by ${option.etd}`;
  return null;
}

export function ShippingOptions({
  options,
  selectedQuote,
  onSelect,
  loading = false,
  error = null,
  onRetry,
  disabled = false,
}: ShippingOptionsProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border-2 border-mak-divider bg-mak-surface p-4"
      >
        <Text size="small" tone="muted">
          Finding delivery options…
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="border-2 border-mak-error p-4 flex flex-wrap items-center justify-between gap-3"
      >
        <Text size="small" className="text-mak-error font-semibold">
          {error}
        </Text>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="border-2 border-mak-error px-3 py-1.5 font-display text-mak-label font-extrabold uppercase tracking-[0.12em] text-mak-error transition-colors hover:bg-mak-error hover:text-mak-bg"
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="border-2 border-mak-divider bg-mak-surface p-4">
        <Text size="small" tone="muted">
          No courier can deliver to this address right now. Try a different
          pincode or payment method.
        </Text>
      </div>
    );
  }

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-3 font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-ink">
        Delivery option
      </legend>

      <div role="radiogroup" aria-label="Delivery option" className="flex flex-col gap-2.5">
        {options.map((option) => {
          const selected = option.quote === selectedQuote;
          const eta = etaLabel(option);
          return (
            <label
              key={option.id}
              // The whole card is the control, so a thumb on a phone does not
              // have to find a small radio dot.
              className={[
                "flex cursor-pointer items-start gap-3 border-2 p-3.5 transition-colors",
                selected
                  ? "border-mak-ink bg-mak-ink/[0.04]"
                  : "border-mak-divider bg-mak-surface hover:border-mak-line",
                disabled ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <input
                type="radio"
                name="shippingOption"
                value={option.id}
                checked={selected}
                onChange={() => onSelect(option)}
                disabled={disabled}
                className="mt-1 size-4 shrink-0 accent-mak-ink"
              />

              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="font-display text-mak-small font-extrabold tracking-[0.02em] text-mak-ink">
                    {option.courierName}
                  </span>
                  {/* tabular-nums so prices line up down the column. */}
                  <span className="font-display text-mak-small font-extrabold tabular-nums text-mak-ink">
                    {option.charge > 0 ? formatPrice(option.charge) : "Free"}
                  </span>
                </span>

                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  {eta ? (
                    <span className="text-mak-label text-mak-ink-subtle">{eta}</span>
                  ) : null}
                  {option.recommended ? (
                    <span className="border border-mak-line px-1.5 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-mak-ink-subtle">
                      Recommended
                    </span>
                  ) : null}
                  {option.mode ? (
                    <span className="text-mak-label text-mak-ink-subtle">
                      {option.mode}
                    </span>
                  ) : null}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
