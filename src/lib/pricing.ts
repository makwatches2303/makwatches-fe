import type { Product } from "@/lib/api/types";

type DiscountableProduct = Pick<
  Product,
  | "price"
  | "compareAtPrice"
  | "discountPercentage"
  | "discountAmount"
  | "discountStartDate"
  | "discountEndDate"
>;

/**
 * A product's displayable price: the amount to show big, and -- only when
 * there's an active discount -- the higher reference price to show struck
 * through.
 *
 * The backend's Product model carries a discount two different ways:
 * `compareAtPrice` (the newer field -- `price` is already the final,
 * current price, and `compareAtPrice` is just the pre-discount reference to
 * strike through) or the older `discountPercentage`/`discountAmount` pair
 * (`price` is the pre-discount original, and the discount is applied here,
 * on read, mirroring the backend's own Product.GetFinalPrice()). A product
 * only ever uses one or the other; `compareAtPrice` wins if somehow both are
 * set.
 */
export function effectivePrice(product: DiscountableProduct): {
  price: number;
  compareAt?: number;
} {
  if (product.compareAtPrice) {
    return { price: product.price, compareAt: product.compareAtPrice };
  }

  const now = Date.now();
  if (product.discountStartDate && now < Date.parse(product.discountStartDate)) {
    return { price: product.price };
  }
  if (product.discountEndDate && now > Date.parse(product.discountEndDate)) {
    return { price: product.price };
  }

  if (product.discountPercentage && product.discountPercentage > 0) {
    const discounted = product.price * (1 - product.discountPercentage / 100);
    return { price: Math.round(discounted), compareAt: product.price };
  }
  if (product.discountAmount && product.discountAmount > 0) {
    return { price: Math.max(0, product.price - product.discountAmount), compareAt: product.price };
  }

  return { price: product.price };
}
