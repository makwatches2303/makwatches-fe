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
  waybill?: string;
  shipmentStatus?: string;
  currentLocation?: string;
  expectedDelivery?: string;
  trackingUrl?: string;
  shipmentError?: string;
  courierName?: string;
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
