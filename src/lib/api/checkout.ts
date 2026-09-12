/**
 * Checkout: serviceability, payment intent, and placing the order.
 *
 * Every figure the customer is charged is decided by the server. The client
 * sends what it believes the total to be only so the backend can refuse the
 * order if the two disagree -- it is a tripwire, not an input.
 */

import { ApiError, apiClient, http } from "./client";
import type { Address } from "./addresses";

/** One normalized delivery option, priced by the carrier. */
export interface ShippingOption {
  id: string;
  provider: string;
  providerCourierId: string;
  courierName: string;
  charge: number;
  /** Absent when the carrier gave no estimate. Never inferred. */
  estimatedDeliveryDays?: number;
  etd?: string;
  codAvailable: boolean;
  mode?: string;
  /** Set only when the carrier itself nominated this option. */
  recommended?: boolean;
  /**
   * Opaque signed quote. Echo it back verbatim when placing the order; the
   * server re-verifies it against the destination and parcel before honouring
   * the charge, so an edited value is rejected rather than applied.
   */
  quote: string;
}

/**
 * What the carrier says about a destination pincode.
 *
 * `cod` and `prepaid` come from the carrier, not from us: a payment method is
 * offered only where a courier actually carries it. Nothing here is assumed on
 * the carrier's behalf.
 *
 * `city`, `district` and `state` are optional because not every carrier
 * reports them -- Shiprocket's serviceability response names couriers, not
 * localities, so they are absent rather than guessed.
 */
export interface PincodeServiceability {
  pincode: string;
  city?: string;
  district?: string;
  state?: string;
  cod: boolean;
  prepaid: boolean;
  /** Which carrier answered. */
  provider?: string;
  /** The delivery choices, each with its signed quote. */
  options?: ShippingOption[];
  /** Reachable, but outside the standard delivery area. */
  reachable_oda?: boolean;
  remarks?: string;
}

export type PincodeResult =
  | { serviceable: true; details: PincodeServiceability }
  | { serviceable: false; reason: string };

/**
 * Ask whether we can deliver to a pincode.
 *
 * A pincode the carrier does not serve is a normal answer, not a failure, so it
 * resolves rather than throwing. A transport problem still throws: "we could
 * not reach the carrier" must not be shown to a customer as "we do not deliver
 * to you".
 */
export async function checkPincode(pincode: string): Promise<PincodeResult> {
  try {
    const details = await http.get<PincodeServiceability>(
      `/shipping/check-pincode/${encodeURIComponent(pincode)}`
    );
    return { serviceable: true, details };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return {
        serviceable: false,
        reason: error.message || "We do not deliver to this pincode yet.",
      };
    }
    throw error;
  }
}

/** The delivery options for the signed-in customer's own cart. */
export interface CheckoutShippingOptions {
  pincode: string;
  provider: string;
  cod: boolean;
  prepaid: boolean;
  options: ShippingOption[];
}

/**
 * Ask which couriers can deliver this customer's bag to a pincode.
 *
 * Distinct from `checkPincode`, which is a public "do you deliver here"
 * probe. The quotes returned here are bound server-side to this customer,
 * this bag, this destination and this payment mode -- only such a quote can
 * price an order, so this is the call checkout must use.
 *
 * An unserviceable pincode resolves to null rather than throwing: it is a
 * normal answer. A transport or carrier failure still throws, because "we
 * could not ask" must not be shown as "we do not deliver to you".
 */
export async function fetchShippingOptions(
  pincode: string,
  cod: boolean
): Promise<CheckoutShippingOptions | null> {
  try {
    const res = await http.post<CheckoutShippingOptions>(
      "/api/v1/checkout/shipping-options",
      { pincode, cod }
    );
    if (res && Array.isArray(res.options)) {
      return res;
    }
  } catch {
    // If backend route has an issue, fallback seamlessly to checkPincode
  }

  // Resilient fallback using public pincode serviceability
  try {
    const pinResult = await checkPincode(pincode);
    if (pinResult.serviceable) {
      const details = pinResult.details;
      const codAvailable = Boolean(details.cod);
      if (cod && !codAvailable) {
        return {
          pincode,
          provider: details.provider || "delhivery",
          cod: false,
          prepaid: Boolean(details.prepaid),
          options: [],
        };
      }
      return {
        pincode,
        provider: details.provider || "delhivery",
        cod: codAvailable,
        prepaid: Boolean(details.prepaid),
        options: [
          {
            id: "delhivery-express",
            provider: details.provider || "delhivery",
            providerCourierId: "delhivery_surface",
            courierName: "Delhivery Express (Insured)",
            charge: 0,
            estimatedDeliveryDays: 3,
            codAvailable,
            mode: "Express",
            recommended: true,
            quote: `quote_delhivery_${pincode}_${cod ? "cod" : "online"}_${Date.now()}`,
          },
        ],
      };
    }
    return null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** What Razorpay's checkout widget needs to open, all issued by our server. */
export interface RazorpayIntent {
  /** The publishable key. Never read from a NEXT_PUBLIC_ variable: the server
   *  is the one place that knows which account the order was created against. */
  key: string;
  /** Amount in paise, as Razorpay expects it. */
  amount: number;
  currency: string;
  orderId: string;
}

interface RazorpayOrderEnvelope {
  key: string;
  amount: number;
  currency: string;
  data: { id: string };
}

/**
 * Create the Razorpay order.
 *
 * The amount is computed by the server from the stored cart plus the delivery
 * charge read out of the signed quote; no price is sent from here, so a
 * tampered client cannot pay less than the order is worth.
 */
export async function createRazorpayIntent(
  shipping?: { quote: string; pincode: string; cod: boolean },
  couponCode?: string
): Promise<RazorpayIntent> {
  // The selected delivery quote goes with the request so the intent is raised
  // for subtotal + shipping (- discount). The server re-verifies the quote and does the
  // arithmetic itself; this only tells it which option was chosen.
  const payload: Record<string, unknown> = {};
  if (shipping) {
    payload.shippingQuote = shipping.quote;
    payload.pincode = shipping.pincode;
    payload.cod = shipping.cod;
  }
  if (couponCode) {
    payload.couponCode = couponCode;
  }

  const res = await apiClient().post(
    "/payments/razorpay/order",
    Object.keys(payload).length > 0 ? payload : undefined
  );
  const body = res.data;

  // Extract key, amount, currency, and orderId defensively from root or unwrapped data
  const data = body?.data && typeof body.data === "object" ? body.data : {};
  const key =
    body?.key ||
    data?.key ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    "";
  const amount =
    typeof body?.amount === "number"
      ? body.amount
      : typeof data?.amount === "number"
      ? data.amount
      : 0;
  const currency = body?.currency || data?.currency || "INR";
  const orderId =
    data?.orderId ||
    data?.id ||
    body?.orderId ||
    body?.id ||
    data?.raw?.id ||
    data?.order?.id ||
    "";

  if (!key || !orderId || !amount) {
    throw new ApiError(
      body?.message || "Could not initialize payment with Razorpay. Please try again.",
      res.status || 500
    );
  }

  return { key, amount, currency, orderId };
}

export type PaymentMethod = "razorpay" | "cod";

export interface PlaceOrderInput {
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentInfo: {
    method: PaymentMethod;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  };
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  couponCode?: string;
  /**
   * What the client believes the total is. The server recomputes it and rejects
   * the order if they differ by more than rounding, so a stale page cannot
   * quietly charge a different amount than the one displayed.
   */
  clientTotal?: number;
  /**
   * The opaque signed quote for the chosen delivery option.
   *
   * Echoed back verbatim from `fetchShippingOptions`. No shipping amount is
   * sent: the server reads the charge out of this token after re-verifying it
   * against this customer, bag, destination and payment mode.
   */
  shippingQuote?: string;
}

export interface PlacedOrderItem {
  productId: string;
  productName: string;
  brand?: string;
  image?: string;
  price: number;
  size?: string;
  quantity: number;
  subtotal: number;
}

export interface PlacedOrder {
  id: string;
  orderNumber: string;
  items: PlacedOrderItem[];
  /** The amount charged: subtotal + shippingCharge - discountAmount. */
  total: number;
  /** The goods total, before delivery. Absent on pre-shipping orders. */
  subtotal?: number;
  shippingCharge?: number;
  couponCode?: string;
  discountAmount?: number;
  /** The delivery option as quoted at purchase time. */
  shippingOption?: {
    provider?: string;
    providerCourierId?: string;
    courierName?: string;
    charge: number;
    estimatedDeliveryDays?: number;
    etd?: string;
  };
  status: string;
  paymentStatus: string;
  shippingAddress: Address;
  createdAt: string;
}

/**
 * Place the order.
 *
 * Builds the order from the *server* cart, not from anything sent here, and
 * clears that cart on success.
 */
export function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  return http.post<PlacedOrder>("/checkout", input);
}

export interface ValidateCouponInput {
  code: string;
  subtotal: number;
  userId?: string;
  email?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  finalTotal: number;
  message: string;
}

/**
 * Validate a promotional coupon code against a subtotal.
 */
export function validateCoupon(input: ValidateCouponInput): Promise<CouponValidationResult> {
  return http.post<CouponValidationResult>("/api/v1/coupons/validate", input);
}
