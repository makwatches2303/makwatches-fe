"use client";

import { useEffect } from "react";
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
