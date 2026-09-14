import { apiClient } from "./client";

export interface SubscribeWhatsAppPayload {
  phone: string;
  name?: string;
  source?: string;
}

export interface SubscribeWhatsAppResponse {
  success: boolean;
  message: string;
  phone?: string;
}

/**
 * Subscribe customer phone to WhatsApp updates and dispatch VIP welcome template
 */
export async function subscribeWhatsApp(
  payload: SubscribeWhatsAppPayload
): Promise<SubscribeWhatsAppResponse> {
  const response = await apiClient().post<SubscribeWhatsAppResponse>(
    "/api/v1/subscribers/whatsapp",
    payload
  );
  return response.data;
}

export interface SubscribeEmailPayload {
  email: string;
  name?: string;
  source?: string;
}

/**
 * Add an email address to the marketing list.
 *
 * Distinct from subscribeWhatsApp on purpose: that one dispatches a WhatsApp
 * welcome template, which must never fire for someone who only gave an email
 * address. The backend keeps them apart for the same reason.
 */
export async function subscribeEmail(
  payload: SubscribeEmailPayload
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient().post<{ success: boolean; message: string }>(
    "/api/v1/subscribers/email",
    payload
  );
  return response.data;
}

export interface TrackCartPayload {
  cartToken?: string;
  phone: string;
  customerName?: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
  }>;
  total: number;
}

/**
 * Record active cart items and customer phone for recovery reminders
 */
export async function trackCartActivity(
  payload: TrackCartPayload
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient().post<{ success: boolean; message: string }>(
    "/api/v1/cart/track",
    payload
  );
  return response.data;
}
