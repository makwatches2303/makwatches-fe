export interface ShippingMethod {
  name: string;
  description: string;
  cost: number;
  enabled: boolean;
}

export interface PaymentGateway {
  name: string;
  description: string;
  enabled: boolean;
}

export interface SocialMedia {
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
}

export interface Settings {
  id?: string;
  storeName: string;
  storeDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  logo: string;
  currency: string;
  taxRate: number;
  shippingMethods: ShippingMethod[];
  paymentGateways: PaymentGateway[];
  socialMedia: SocialMedia;
  privacyPolicy: string;
  termsOfService: string;
  refundPolicy: string;
  enableRegistration: boolean;
  maintenanceMode: boolean;
}

export const TABS = [
  "general",
  "store",
  "financial",
  "shipping",
  "payment",
  "legal",
  "social",
  "security",
] as const;

export type TabId = (typeof TABS)[number];
