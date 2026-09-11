export interface OrderItem {
  productId: string;
  productName: string;
  brand?: string;
  image?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentInfo {
  method: string;
  cardNumber?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

export interface ShippingInfo {
  /**
   * Which carrier holds the parcel: "shiprocket" | "delhivery". Absent on
   * orders written before the field existed, which are Delhivery by
   * definition.
   */
  provider?: string;
  /**
   * Legacy tracking-number field. Still written for every new shipment, so
   * existing readers keep working; `trackingNumber` is the current name.
   */
  waybill?: string;
  trackingNumber?: string;
  /** Carrier order/shipment ids -- distinct from each other and from the AWB. */
  providerOrderId?: string;
  providerShipmentId?: string;
  courierCompanyId?: string;
  courierName?: string;
  shipmentStatus?: string;
  statusReason?: string;
  currentLocation?: string;
  expectedDelivery?: string;
  trackingUrl?: string;
  shipmentError?: string;
  errorCode?: string;
  shippingCharge?: number;
  pickupLocation?: string;
}

/** The carrier's display name for a shipment, however old the record is. */
export function carrierLabel(info?: ShippingInfo | null): string {
  if (info?.courierName) return info.courierName;
  switch (info?.provider) {
    case "shiprocket":
      return "Shiprocket";
    case "delhivery":
      return "Delhivery";
    default:
      // No provider recorded means the order predates the field, and only
      // Delhivery existed then.
      return "Delhivery";
  }
}

/** The tracking number for a shipment, tolerating the legacy field name. */
export function trackingNumberOf(info?: ShippingInfo | null): string {
  return info?.trackingNumber || info?.waybill || "";
}

export interface PickupDetails {
  locationName?: string;
  sellerName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  country?: string;
  gstNumber?: string;
}

export type TrackingScan = {
  scan_datetime: string;
  scan_type: string;
  scanned_location: string;
  instructions?: string;
  status_detail?: string;
};

export type TrackingData = {
  waybill: string;
  status: string;
  status_location: string;
  expected_delivery?: string;
  scans: TrackingScan[];
};

export interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  customerName?: string;
  items: OrderItem[];
  total: number;
  status: string;
  paymentStatus?: string;
  shippingAddress: Address;
  paymentInfo: PaymentInfo;
  shippingInfo?: ShippingInfo;
  pickupDetails?: PickupDetails;
  createdAt: string;
  updatedAt: string;
}
