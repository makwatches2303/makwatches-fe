import type { Product } from "@/lib/api/types";
import type { CartLine } from "@/store/cart";
import type { PlacedOrder } from "@/lib/api/checkout";
import { effectivePrice } from "@/lib/pricing";

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-0PCMRM07FW";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Low-level safe event dispatcher to Google Analytics / dataLayer.
 * Defensively queues into dataLayer if gtag is not yet initialized.
 */
export function gtagEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params);
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(["event", name, params]);
    }
  } catch (error) {
    console.warn("[GA4] Failed to record event:", name, error);
  }
}

/**
 * Standard pageview tracker for SPA client-side route changes.
 */
export function pageview(url: string, title?: string): void {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.gtag === "function") {
      window.gtag("config", GA_MEASUREMENT_ID, {
        page_path: url,
        page_title: title || (typeof document !== "undefined" ? document.title : ""),
      });
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(["config", GA_MEASUREMENT_ID, {
        page_path: url,
        page_title: title || (typeof document !== "undefined" ? document.title : ""),
      }]);
    }
  } catch (error) {
    console.warn("[GA4] Failed to record pageview:", url, error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// E-commerce Event Transformers
// ─────────────────────────────────────────────────────────────────────────────

export interface GAItem {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  currency?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price?: number;
  quantity?: number;
}

export function productToGAItem(product: Product, index?: number, quantity = 1, size?: string): GAItem {
  const { price } = effectivePrice(product);
  return {
    item_id: product.id,
    item_name: product.name,
    item_brand: product.brand?.trim() || "MAK Watches",
    item_category: product.mainCategory?.trim() || product.category || "",
    item_category2: product.subcategory?.trim() || "",
    item_variant: size || "",
    price,
    quantity,
    index,
  };
}

export function cartLineToGAItem(line: CartLine, index?: number): GAItem {
  return {
    item_id: line.productId,
    item_name: line.name,
    item_brand: "MAK Watches",
    item_category: line.meta || "",
    item_variant: line.size || "",
    price: line.price,
    quantity: line.quantity,
    index,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommended GA4 E-Commerce Events
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. view_item_list - Viewing a collection / category / search results grid
 */
export function trackViewItemList(listName: string, products: Product[]): void {
  if (!products || products.length === 0) return;
  gtagEvent("view_item_list", {
    item_list_id: listName.toLowerCase().replace(/\s+/g, "_"),
    item_list_name: listName,
    items: products.slice(0, 30).map((p, idx) => productToGAItem(p, idx + 1)),
  });
}

/**
 * 2. select_item - Clicking a product from a list
 */
export function trackSelectItem(product: Product, listName = "Catalog"): void {
  gtagEvent("select_item", {
    item_list_name: listName,
    items: [productToGAItem(product, 1)],
  });
}

/**
 * 3. view_item - Viewing product detail page or quick view modal
 */
export function trackViewItem(product: Product): void {
  const { price } = effectivePrice(product);
  gtagEvent("view_item", {
    currency: "INR",
    value: price,
    items: [productToGAItem(product, 1, 1)],
  });
}

/**
 * 4. add_to_cart - Adding product to bag
 */
export function trackAddToCart(product: Product, quantity = 1, size?: string): void {
  const { price } = effectivePrice(product);
  gtagEvent("add_to_cart", {
    currency: "INR",
    value: price * quantity,
    items: [productToGAItem(product, 1, quantity, size)],
  });
}

/**
 * 5. remove_from_cart - Removing item from bag
 */
export function trackRemoveFromCart(line: CartLine): void {
  gtagEvent("remove_from_cart", {
    currency: "INR",
    value: line.price * line.quantity,
    items: [cartLineToGAItem(line, 1)],
  });
}

/**
 * 6. view_cart - Opening bag drawer or visiting cart page
 */
export function trackViewCart(lines: CartLine[], subtotal: number): void {
  gtagEvent("view_cart", {
    currency: "INR",
    value: subtotal,
    items: lines.map((l, idx) => cartLineToGAItem(l, idx + 1)),
  });
}

/**
 * 7. begin_checkout - Proceeding to checkout
 */
export function trackBeginCheckout(lines: CartLine[], total: number, coupon?: string): void {
  gtagEvent("begin_checkout", {
    currency: "INR",
    value: total,
    coupon: coupon || undefined,
    items: lines.map((l, idx) => cartLineToGAItem(l, idx + 1)),
  });
}

/**
 * 8. add_shipping_info - Selecting delivery options
 */
export function trackAddShippingInfo(
  option: { courierName?: string; charge?: number; provider?: string },
  total: number,
  lines: CartLine[],
  coupon?: string
): void {
  gtagEvent("add_shipping_info", {
    currency: "INR",
    value: total,
    coupon: coupon || undefined,
    shipping_tier: option.courierName || option.provider || "Standard Shipping",
    items: lines.map((l, idx) => cartLineToGAItem(l, idx + 1)),
  });
}

/**
 * 9. add_payment_info - Selecting payment method (COD or Razorpay)
 */
export function trackAddPaymentInfo(
  paymentMethod: string,
  total: number,
  lines: CartLine[],
  coupon?: string
): void {
  gtagEvent("add_payment_info", {
    currency: "INR",
    value: total,
    coupon: coupon || undefined,
    payment_type: paymentMethod.toUpperCase(),
    items: lines.map((l, idx) => cartLineToGAItem(l, idx + 1)),
  });
}

/**
 * 10. purchase - Order successfully created and verified
 */
export function trackPurchase(order: PlacedOrder): void {
  gtagEvent("purchase", {
    transaction_id: order.orderNumber || order.id,
    value: order.total,
    currency: "INR",
    tax: 0,
    shipping: order.shippingCharge || 0,
    coupon: order.couponCode || undefined,
    items: (order.items || []).map((item, idx) => ({
      item_id: item.productId,
      item_name: item.productName,
      item_brand: item.brand || "MAK Watches",
      item_variant: item.size || "",
      price: item.price,
      quantity: item.quantity,
      index: idx + 1,
    })),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// User Engagement & Custom Events
// ─────────────────────────────────────────────────────────────────────────────

/**
 * search - Searching catalog
 */
export function trackSearch(searchTerm: string, resultsCount?: number): void {
  if (!searchTerm.trim()) return;
  gtagEvent("search", {
    search_term: searchTerm.trim(),
    results_count: resultsCount,
  });
}

/**
 * add_to_wishlist - Toggling wishlist
 */
export function trackAddToWishlist(product: Product): void {
  const { price } = effectivePrice(product);
  gtagEvent("add_to_wishlist", {
    currency: "INR",
    value: price,
    items: [productToGAItem(product, 1)],
  });
}

/**
 * apply_coupon - Customer applies a promo/discount code
 */
export function trackApplyCoupon(couponCode: string, discountAmount = 0): void {
  gtagEvent("apply_coupon", {
    coupon_code: couponCode,
    discount_amount: discountAmount,
  });
}

/**
 * generate_lead - WhatsApp subscriber modal, newsletter, etc.
 */
export function trackLeadCapture(source: "whatsapp_modal" | "newsletter" | string, identifier?: string): void {
  gtagEvent("generate_lead", {
    lead_source: source,
    has_contact: Boolean(identifier),
  });
}

/**
 * contact_click - WhatsApp / Call / Email direct contact clicks
 */
export function trackContactClick(channel: "whatsapp" | "phone" | "email", label?: string): void {
  gtagEvent("contact_click", {
    channel,
    label: label || channel,
  });
}
