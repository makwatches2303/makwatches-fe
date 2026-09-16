import type { ShippingOption } from "@/lib/api/checkout";

/**
 * How carrier rate options are presented to a customer.
 *
 * ## Why this exists
 *
 * The rates endpoint returns whatever the carriers quoted: a provider key, an
 * internal courier name ("Xpressbees Air", "Blue Dart Air"), a mode, and a
 * signed quote. None of the first three mean anything to a shopper, and two of
 * them name companies MAK has a commercial relationship with rather than
 * anything the customer is buying.
 *
 * This module is presentation only. It never rewrites, re-signs or reorders the
 * contents of an option — `ShippingOption` objects pass through untouched, so
 * whatever the customer selects carries the original `quote`, `id`,
 * `providerCourierId` and `charge` back to the server exactly as issued. The
 * server re-verifies that signature against the customer, bag, destination and
 * payment mode, so a presentation layer *cannot* affect what is charged or
 * booked even if it wanted to.
 *
 * ## Deliberately not here
 *
 * No delivery promise is invented. A label is derived from the carrier's own
 * ETA, and where the carrier gave no estimate the option is described in the
 * most neutral terms available rather than being assigned a speed.
 */

/**
 * The only provider whose options are shown to customers today.
 *
 * Delhivery remains fully wired on the backend -- provider, credentials,
 * webhooks, tracking and shipment creation are all untouched, and the service
 * still registers it as a secondary. This is a customer-facing restriction, so
 * it lives here and nowhere else; lifting it later is this one constant.
 */
export const CUSTOMER_FACING_PROVIDER = "shiprocket";

/** Whether an option may be shown to, and therefore chosen by, a customer. */
export function isCustomerFacingOption(option: ShippingOption): boolean {
  return (
    (option.provider ?? "").trim().toLowerCase() === CUSTOMER_FACING_PROVIDER
  );
}

/**
 * A customer-facing name for a delivery speed.
 *
 * Derived from the carrier's own estimate, never from the courier's brand. An
 * option with no estimate is called "Standard Delivery": it is the neutral
 * description, where "Economy" would imply a slowness the carrier never stated
 * and "Express" a speed it never promised.
 */
export function deliveryLabel(option: ShippingOption): string {
  const days = option.estimatedDeliveryDays;

  if (typeof days !== "number" || days <= 0) return "Standard Delivery";
  if (days <= 2) return "Express Delivery";
  if (days <= 5) return "Standard Delivery";
  return "Economy Delivery";
}

/**
 * The delivery estimate in plain words, or null when the carrier gave none.
 *
 * Mirrors the wording the checkout already used, so nothing about how an ETA
 * reads to a customer changes with this module.
 */
export function deliveryEstimate(option: ShippingOption): string | null {
  if (option.estimatedDeliveryDays && option.estimatedDeliveryDays > 0) {
    const days = option.estimatedDeliveryDays;
    return days === 1 ? "Arrives in 1 day" : `Arrives in ${days} days`;
  }
  if (option.etd) return `Arrives by ${option.etd}`;
  return null;
}

/** One option, paired with how it should read. The option is never mutated. */
export interface PresentedShippingOption {
  /** The original, unmodified option -- this is what gets selected and sent. */
  option: ShippingOption;
  label: string;
  estimate: string | null;
}

/**
 * Identity for de-duplication.
 *
 * Carriers routinely quote the same lane twice under different internal courier
 * names at an identical price and identical ETA -- the live response for this
 * catalogue returns "Xpressbees Air" and "Xpressbees Surface" both at the same
 * charge and the same one-day estimate. Once the courier names are hidden,
 * those render as two rows a customer cannot tell apart and has no basis to
 * choose between. Collapsing them on exactly (label, days, charge) removes only
 * genuinely indistinguishable rows; anything differing in speed or price is
 * kept, because that is a real choice.
 */
function presentationKey(presented: PresentedShippingOption): string {
  const days = presented.option.estimatedDeliveryDays ?? -1;
  return `${presented.label}|${days}|${presented.option.charge}`;
}

/**
 * Rank for display: the carrier's recommendation, then faster, then cheaper.
 *
 * Array order is deliberately ignored. `recommended` is set only when the
 * carrier itself nominated an option, and is the only trustworthy signal of
 * preference in the payload.
 */
function compare(a: PresentedShippingOption, b: PresentedShippingOption): number {
  // Boolean() first: `recommended` is optional, and Number(undefined) is NaN,
  // not 0. A NaN from a comparator makes Array.prototype.sort's result
  // implementation-defined -- which showed up as the carrier's recommended
  // option not sorting to the top at all.
  const recommended =
    Number(Boolean(b.option.recommended)) - Number(Boolean(a.option.recommended));
  if (recommended !== 0) return recommended;

  // An option with no estimate sorts after ones that have a stated speed,
  // rather than being treated as instant.
  const aDays = a.option.estimatedDeliveryDays ?? Number.POSITIVE_INFINITY;
  const bDays = b.option.estimatedDeliveryDays ?? Number.POSITIVE_INFINITY;
  if (aDays !== bDays) return aDays - bDays;

  return a.option.charge - b.option.charge;
}

/**
 * The options a customer may see and choose, in the order they should read.
 *
 * Filters to the customer-facing provider, drops indistinguishable duplicates,
 * and sorts. Returning an empty array is a meaningful answer -- the caller
 * renders its "no courier can deliver here" state rather than an empty section.
 *
 * **Call this before storing options in state, not only before rendering.**
 * Checkout preselects the carrier's recommendation from whatever list it holds,
 * so filtering only at render time would leave a hidden option silently
 * selected and submitted.
 */
export function presentShippingOptions(
  options: ShippingOption[]
): PresentedShippingOption[] {
  const seen = new Set<string>();

  return (
    options
      .filter(isCustomerFacingOption)
      .map((option) => ({
        option,
        label: deliveryLabel(option),
        estimate: deliveryEstimate(option),
      }))
      /*
        Sort *before* de-duplicating, not after.

        De-duplication keeps the first of each indistinguishable group, so the
        order it runs in decides which one survives. Running it on the raw array
        order would keep whichever the carrier happened to list first -- for the
        live response that is three couriers at an identical price and identical
        one-day ETA, and the carrier's own recommended option is not always
        first among them. Sorting first means the survivor is the best-ranked
        one: recommended, then fastest, then cheapest.
      */
      .sort(compare)
      .filter((presented) => {
        const key = presentationKey(presented);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
  );
}

/**
 * The raw options a customer may choose from, in display order.
 *
 * The same pipeline as `presentShippingOptions`, returning the untouched
 * `ShippingOption` objects so checkout can hold exactly what it will submit.
 */
export function selectableShippingOptions(
  options: ShippingOption[]
): ShippingOption[] {
  return presentShippingOptions(options).map((presented) => presented.option);
}
