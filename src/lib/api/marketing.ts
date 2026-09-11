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
