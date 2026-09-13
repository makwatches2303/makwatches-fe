"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { MediaRef, Product } from "@/lib/api/types";
import { resolveProductImage } from "@/lib/media";
import { trackAddToWishlist } from "@/lib/analytics";

/**
 * Wishlist state.
 *
 * Same shape as the cart store: guests get a persisted local wishlist, and the
 * signed-in path mirrors to the API. Server sync lands in Phase 5 along with
 * the rebuilt wishlist surface.
 */

export interface WishlistLine {
  productId: string;
  name: string;
  price: number;
  image: MediaRef | null;
  meta?: string;
  slug?: string;
  /** Availability at the time it was saved; refreshed when the list is fetched. */
  inStock: boolean;
}

interface WishlistState {
  lines: WishlistLine[];
  hydrated: boolean;

  toggle: (product: Product) => void;
  add: (product: Product) => void;
  remove: (productId: string) => void;
  clear: () => void;
  replaceAll: (lines: WishlistLine[]) => void;
}

function toLine(product: Product): WishlistLine {
  return {
    productId: product.id,
    name: product.name,
    price: product.price,
    image: resolveProductImage(product),
    meta: product.collection || product.category,
    slug: product.slug,
    inStock: product.stock > 0,
  };
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      lines: [],
      hydrated: false,

      toggle: (product) => {
        const exists = get().lines.some((l) => l.productId === product.id);
        if (exists) {
          set((state) => ({
            lines: state.lines.filter((l) => l.productId !== product.id),
          }));
        } else {
          trackAddToWishlist(product);
          set((state) => ({ lines: [...state.lines, toLine(product)] }));
        }
      },

      add: (product) => {
        if (!get().lines.some((l) => l.productId === product.id)) {
          trackAddToWishlist(product);
          set((state) => ({ lines: [...state.lines, toLine(product)] }));
        }
      },

      remove: (productId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.productId !== productId),
        })),

      clear: () => set({ lines: [] }),

      replaceAll: (lines) => set({ lines }),
    }),
    {
      name: "mak-wishlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

// ── Selectors ───────────────────────────────────────────────────────────────

export const selectWishlistCount = (state: WishlistState): number =>
  state.lines.length;

/**
 * Whether a product is wishlisted.
 *
 * Returns a selector rather than taking the store directly so callers can pass
 * it to `useWishlistStore(...)` and re-render only when *this* product's
 * membership changes.
 */
export const selectIsWishlisted =
  (productId: string) =>
  (state: WishlistState): boolean =>
    state.lines.some((l) => l.productId === productId);
