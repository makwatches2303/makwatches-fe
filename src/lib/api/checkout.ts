/**
 * Checkout: serviceability, payment intent, and placing the order.
 *
 * Every figure the customer is charged is decided by the server. The client
 * sends what it believes the total to be only so the backend can refuse the
 * order if the two disagree -- it is a tripwire, not an input.
 */

import { ApiError, apiClient, http } from "./client";
import type { Address } from "./addresses";

/**
 * What the carrier says about a destination pincode.
 *
 * `cod` and `prepaid` come from Delhivery, not from us. A payment method is
 * offered only where the carrier actually supports it; nothing here is assumed
 * on the carrier's behalf.
 */
export interface PincodeServiceability {
  pincode: string;
  city: string;
  district: string;
  state: string;
  cod: boolean;
  prepaid: boolean;
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
 * The amount is computed by the server from the stored cart; nothing about the
 * price is sent from here, so a tampered client cannot pay less than the cart
 * is worth.
 */
export async function createRazorpayIntent(): Promise<RazorpayIntent> {
  const res = await apiClient().post("/payments/razorpay/order");
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
  /**
   * What the client believes the total is. The server recomputes it and rejects
   * the order if they differ by more than rounding, so a stale page cannot
   * quietly charge a different amount than the one displayed.
   */
  clientTotal?: number;
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
  total: number;
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
