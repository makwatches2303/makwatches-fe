"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { MediaRef, Product } from "@/lib/api/types";
import { resolveProductImage } from "@/lib/media";

/**
 * Cart state.
 *
 * The store is the single source of truth for what is in the bag, for guests
 * and signed-in shoppers alike. A guest cart lives here and is persisted to
 * localStorage; a signed-in cart is mirrored to the API.
 *
 * Phase 1 scope: the guest cart is fully functional and the merge path is
 * scaffolded but deliberately not wired to the API. Server synchronisation
 * lands with the rebuilt cart in Phase 5, and doing it now would mean writing
 * to a live cart from a UI nothing renders yet.
 */

/** A line in the bag. Denormalized so the drawer renders without a refetch. */
export interface CartLine {
  productId: string;
  name: string;
  /** Unit price at the time it was added. */
  price: number;
  quantity: number;
  image: MediaRef | null;
  /** Category or collection, shown as the line's secondary label. */
  meta?: string;
  /** Variant discriminator. Part of the line identity. */
  size?: string;
  slug?: string;
  /** Stock known at add time, used to cap quantity increases. */
  maxQuantity?: number;
}

/**
 * Lines are identified by product *and* variant: the same watch on two
 * different straps is two lines, not one with quantity 2.
 */
function lineKey(productId: string, size?: string): string {
  return size ? `${productId}::${size}` : productId;
}

export interface AppliedCoupon {
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
}

interface CartState {
  lines: CartLine[];
  appliedCoupon: AppliedCoupon | null;
  /** True once the persisted cart has been read, so the UI can avoid a flash. */
  hydrated: boolean;

  addLine: (product: Product, quantity?: number, size?: string) => void;
  removeLine: (productId: string, size?: string) => void;
  setQuantity: (productId: string, quantity: number, size?: string) => void;
  increment: (productId: string, size?: string) => void;
  decrement: (productId: string, size?: string) => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  clear: () => void;

  /**
   * Replace the local cart with the server's.
   *
   * Called after sign-in once server sync exists. Kept here so the merge
   * decision lives with the state rather than in a component.
   */
  replaceAll: (lines: CartLine[]) => void;
}

/** Derive a cart line from a product record. */
function toLine(product: Product, quantity: number, size?: string): CartLine {
  return {
    productId: product.id,
    name: product.name,
    price: product.price,
    quantity,
    image: resolveProductImage(product),
    meta: product.collection || product.category,
    size,
    slug: product.slug,
    maxQuantity: product.stock,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      appliedCoupon: null,
      hydrated: false,

      addLine: (product, quantity = 1, size) =>
        set((state) => {
          const key = lineKey(product.id, size);
          const existing = state.lines.find(
            (l) => lineKey(l.productId, l.size) === key
          );

          if (!existing) {
            return { lines: [...state.lines, toLine(product, quantity, size)] };
          }

          // Cap at known stock so the bag can never exceed what is purchasable.
          const cap = existing.maxQuantity ?? Number.POSITIVE_INFINITY;
          const next = Math.min(existing.quantity + quantity, cap);

          return {
            lines: state.lines.map((l) =>
              lineKey(l.productId, l.size) === key ? { ...l, quantity: next } : l
            ),
          };
        }),

      removeLine: (productId, size) =>
        set((state) => ({
          lines: state.lines.filter(
            (l) => lineKey(l.productId, l.size) !== lineKey(productId, size)
          ),
        })),

      setQuantity: (productId, quantity, size) =>
        set((state) => {
          const key = lineKey(productId, size);

          // Setting a line to zero removes it, which is what the quantity
          // stepper's minus button does at 1.
          if (quantity <= 0) {
            return {
              lines: state.lines.filter(
                (l) => lineKey(l.productId, l.size) !== key
              ),
            };
          }

          return {
            lines: state.lines.map((l) => {
              if (lineKey(l.productId, l.size) !== key) return l;
              const cap = l.maxQuantity ?? Number.POSITIVE_INFINITY;
              return { ...l, quantity: Math.min(quantity, cap) };
            }),
          };
        }),

      increment: (productId, size) =>
        set((state) => ({
          lines: state.lines.map((l) => {
            if (lineKey(l.productId, l.size) !== lineKey(productId, size)) return l;
            const cap = l.maxQuantity ?? Number.POSITIVE_INFINITY;
            return { ...l, quantity: Math.min(l.quantity + 1, cap) };
          }),
        })),

      decrement: (productId, size) =>
        set((state) => {
          const key = lineKey(productId, size);
          const line = state.lines.find((l) => lineKey(l.productId, l.size) === key);
          if (!line) return state;

          if (line.quantity <= 1) {
            return {
              lines: state.lines.filter(
                (l) => lineKey(l.productId, l.size) !== key
              ),
            };
          }

          return {
            lines: state.lines.map((l) =>
              lineKey(l.productId, l.size) === key
                ? { ...l, quantity: l.quantity - 1 }
                : l
            ),
          };
        }),

      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),

      removeCoupon: () => set({ appliedCoupon: null }),

      clear: () => set({ lines: [], appliedCoupon: null }),

      replaceAll: (lines) => set({ lines }),
    }),
    {
      name: "mak-cart",
      storage: createJSONStorage(() => localStorage),
      // Persist lines and applied coupon across reloads
      partialize: (state) => ({ lines: state.lines, appliedCoupon: state.appliedCoupon }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

// ── Selectors ───────────────────────────────────────────────────────────────
//
// Exported as standalone functions so components subscribe to a derived value
// rather than the whole store, which keeps re-renders narrow.

export const selectCartCount = (state: CartState): number =>
  state.lines.reduce((total, line) => total + line.quantity, 0);

export const selectCartSubtotal = (state: CartState): number =>
  state.lines.reduce((total, line) => total + line.price * line.quantity, 0);

export const selectAppliedCoupon = (state: CartState) => state.appliedCoupon;

export const selectCartDiscount = (state: CartState): number =>
  state.appliedCoupon?.discountAmount ?? 0;

export const selectCartTotal = (state: CartState): number => {
  const subtotal = selectCartSubtotal(state);
  const discount = selectCartDiscount(state);
  return Math.max(0, subtotal - discount);
};

export const selectCartIsEmpty = (state: CartState): boolean =>
  state.lines.length === 0;

/** The line total for one row. */
export function lineTotal(line: CartLine): number {
  return line.price * line.quantity;
}
