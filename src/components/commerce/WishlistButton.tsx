"use client";

import { cn } from "@/lib/utils";
import { HeartIcon } from "@/design-system";
import type { Product } from "@/lib/api/types";
import { useWishlistStore, selectIsWishlisted } from "@/store/wishlist";

/**
 * Toggle a product in the wishlist.
 *
 * Reads and writes the wishlist store directly, so any instance anywhere in the
 * tree reflects the same state -- the heart on a card and the heart on the
 * product page stay in sync without prop threading.
 *
 * Accessibility: this is a toggle button, so it carries `aria-pressed` and its
 * label states the action rather than just naming the icon.
 */

export interface WishlistButtonProps {
  product: Product;
  /**
   * `xs` is the product-card overlay: a smaller visible box that keeps a full
   * 44px tap target through an expanded hit area, so shrinking it costs
   * nothing on touch.
   */
  size?: "xs" | "sm" | "md";
  /** `overlay` sits on top of a product image; `plain` sits in a text row. */
  variant?: "overlay" | "plain";
  className?: string;
}

export function WishlistButton({
  product,
  size = "sm",
  variant = "overlay",
  className,
}: WishlistButtonProps) {
  // Subscribing to this product's membership only, so adding an unrelated
  // product does not re-render every card on the page.
  const wished = useWishlistStore(selectIsWishlisted(product.id));
  const toggle = useWishlistStore((state) => state.toggle);

  return (
    <button
      type="button"
      aria-pressed={wished}
      aria-label={
        wished
          ? `Remove ${product.name} from wishlist`
          : `Add ${product.name} to wishlist`
      }
      onClick={(event) => {
        // Cards wrap the whole tile in a link; without this the toggle would
        // also navigate to the product.
        event.preventDefault();
        event.stopPropagation();
        toggle(product);
      }}
      className={cn(
        "relative inline-flex items-center justify-center border-2 transition-colors duration-200 ease-mak",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent",
        /*
          44px on touch, tightening only where a fine pointer is present.

          `xs` breaks that rule visually and not functionally. On a product tile
          the heart sits over the photograph, and at 44px it was taking a
          noticeable bite out of the image. The box shrinks to 32px, and the
          `after:` pseudo-element extends the *hit* area back past 44px without
          occupying any layout space -- so the control is smaller to look at and
          exactly as easy to hit.
        */
        size === "xs"
          ? "size-8 after:absolute after:-inset-1.5 after:content-[''] [@media(pointer:fine)]:size-7 [@media(pointer:fine)]:after:inset-0"
          : size === "sm"
            ? "size-11 [@media(pointer:fine)]:size-9"
            : "size-11",
        wished
          ? "border-mak-accent bg-mak-accent text-mak-on-accent"
          : variant === "overlay"
            ? "border-mak-line bg-mak-bg text-mak-ink hover:bg-mak-ink hover:text-mak-bg"
            : "border-transparent bg-transparent text-mak-ink hover:text-mak-accent",
        className
      )}
    >
      <HeartIcon size={size === "xs" ? 14 : 16} filled={wished} />
    </button>
  );
}
