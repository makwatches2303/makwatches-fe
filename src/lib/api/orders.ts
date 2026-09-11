/** Order reads, tracking and cancellation for the authenticated shopper. */

import { ApiError, http } from "./client";
import type { Address } from "./addresses";
import type { OrderSummary } from "./types";

export interface OrderLine {
  productId: string;
  productName: string;
  brand?: string;
  image?: string;
  price: number;
  size?: string;
  quantity: number;
  subtotal: number;
}

/**
 * Carrier state for an order.
 *
 * Every field is optional because it is filled in as the shipment progresses.
 * An order that has only just been placed has none of it, and the UI must say
 * so rather than inventing a stage.
 */
export interface ShippingInfo {
  /** "shiprocket" | "delhivery". Absent on orders older than the field. */
  provider?: string;
  /** Legacy tracking-number field; still written for every new shipment. */
  waybill?: string;
  /** The current name for the same value. Prefer `trackingNumberOf`. */
  trackingNumber?: string;
  /** The courier actually carrying the parcel, e.g. "Delhivery Surface". */
  courierName?: string;
  trackingUrl?: string;
  shipmentStatus?: string;
  expectedDelivery?: string;
  currentLocation?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  shipmentCreatedAt?: string;
  /** Set when the carrier refused the shipment. Shown to the customer as a
   *  neutral "not dispatched yet", never as raw carrier text. */
  shipmentError?: string;
}

/**
 * The tracking number for a shipment.
 *
 * Reads the modern field first and falls back to the legacy one, because every
 * order booked before the Shiprocket integration carries only `waybill`.
 */
export function trackingNumberOf(shipping?: ShippingInfo | null): string {
  return shipping?.trackingNumber || shipping?.waybill || "";
}

/**
 * What to call the carrier in front of a customer.
 *
 * The courier's own name is the most useful thing to show; the provider slug
 * is a fallback, prettified rather than printed raw.
 */
export function carrierNameOf(shipping?: ShippingInfo | null): string {
  if (shipping?.courierName) return shipping.courierName;
  switch (shipping?.provider) {
    case "shiprocket":
      return "Shiprocket";
    case "delhivery":
      return "Delhivery";
    default:
      // An order with no provider recorded predates the field, and only
      // Delhivery existed then.
      return "Delhivery";
  }
}

/** The full order, as the API returns it. */
export interface Order {
  id: string;
  orderNumber: string;
  items: OrderLine[];
  total: number;
  status: string;
  paymentStatus: string;
  shippingAddress: Address;
  paymentInfo?: { method: string };
  shippingInfo?: ShippingInfo | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * The signed-in user's orders, newest first.
 *
 * Coerced to an array: an endpoint that marshals an empty result as `null`
 * would otherwise leave every caller to discover that for itself, and the list
 * page would sit on its loading state forever for a customer with no orders.
 */
export async function listOrders(): Promise<Order[]> {
  return (await http.get<Order[] | null>("/account/orders")) ?? [];
}

/** One order by id. Scoped to the caller by the API. */
export function getOrder(orderId: string): Promise<Order> {
  return http.get<Order>(`/account/orders/${encodeURIComponent(orderId)}`);
}

/** Request cancellation of an order. */
export function cancelOrder(orderId: string): Promise<void> {
  return http.post<void>(
    `/account/orders/${encodeURIComponent(orderId)}/cancel`
  );
}

/**
 * Live carrier tracking for an order.
 *
 * Resolves to null when there is simply nothing to track yet -- an order placed
 * a minute ago has no waybill, and that is a normal state, not an error. A
 * transport failure still throws.
 */
export async function trackOrder(
  orderId: string
): Promise<ShippingInfo | null> {
  try {
    return await http.get<ShippingInfo>(
      `/shipping/track/order/${encodeURIComponent(orderId)}`
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * The stages an order passes through, in order.
 *
 * Cancelled and returned are deliberately absent: they are terminal states off
 * to the side, not steps on the way to delivery, and drawing them as progress
 * would misrepresent what happened.
 */
export const ORDER_STAGES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
] as const;

export type OrderStage = (typeof ORDER_STAGES)[number];

/** How far along the stages an order is, or -1 if it left the happy path. */
export function orderStageIndex(status: string): number {
  return ORDER_STAGES.indexOf(status.toLowerCase() as OrderStage);
}

/** Whether the customer can still ask for this order to be cancelled. */
export function isCancellable(order: Order): boolean {
  const status = order.status.toLowerCase();
  return status === "pending" || status === "processing";
}

export type { OrderSummary };
