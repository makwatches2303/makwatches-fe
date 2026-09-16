"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button, Drawer, EmptyState } from "@/design-system";
import {
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
} from "@/store/cart";
import { selectCartOpen, useUIStore } from "@/store/ui";
import { trackViewCart } from "@/lib/analytics";

import { CartLineItem } from "./CartLineItem";
import { CartSummary } from "./CartSummary";

/**
 * The slide-in bag.
 *
 * Reads open state from the UI store rather than taking props, so any
 * "add to bag" anywhere in the tree can open it without prop threading. Drawer
 * supplies the accessibility contract: focus trap, Escape, scroll lock.
 */

export function CartDrawer() {
  const open = useUIStore(selectCartOpen);
  const close = useUIStore((state) => state.close);

  const lines = useCartStore((state) => state.lines);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);

  useEffect(() => {
    if (open && lines.length > 0) {
      trackViewCart(lines, subtotal);
    }
  }, [open]);

  /*
    Close whenever the route changes.

    "Checkout" in the summary is an ordinary <Link>. It navigated, but nothing
    told the UI store, so the drawer stayed mounted over the checkout page with
    its scroll lock still applied.

    Closing from the link's own onClick looks like the obvious fix and is not:
    it unmounts the anchor while the click is still being handled, which
    cancels the navigation outright -- measured, the path never left /shop.
    Reacting to the committed route change instead leaves the link alone, and
    covers every other way out of the drawer (a line item's product link, the
    empty-state button) rather than just this one.

    Mirrors the pattern MobileNav already uses for the same problem.
  */
  const pathname = usePathname();
  useEffect(() => {
    if (open) close();
    // Only pathname should trigger this: including `open` would close the
    // drawer the moment it opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isEmpty = lines.length === 0;

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Your bag"
      titleAside={count > 0 ? count : undefined}
      footer={isEmpty ? undefined : <CartSummary subtotal={subtotal} />}
    >
      {isEmpty ? (
        <EmptyState
          bordered={false}
          title="Your bag is empty."
          description="Add a timepiece to get started."
          action={
            <Button variant="primary" onClick={close}>
              Browse the collection
            </Button>
          }
          className="py-16"
        />
      ) : (
        <ul className="list-none">
          {lines.map((line) => (
            <li key={`${line.productId}-${line.size ?? ""}`}>
              <CartLineItem line={line} />
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
