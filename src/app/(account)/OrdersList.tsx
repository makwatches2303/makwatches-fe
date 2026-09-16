"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ButtonLink,
  EmptyState,
  ErrorState,
  LoadingState,
  Text,
  formatPrice,
} from "@/design-system";
import { listOrders, type Order } from "@/lib/api/orders";

import { OrderItemImage } from "./OrderItemImage";
import { OrderStatusBadge } from "./OrderStatusBadge";

/**
 * Every order the customer has placed, newest first.
 *
 * Each row is a link to its own page: an order someone is chasing is the most
 * linkable thing in the account, and the previous tabbed implementation made
 * that impossible.
 */
export function OrdersList() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listOrders()
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch(() => {
        if (active) setError("We could not load your orders just now.");
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <ErrorState
        title="Your orders are not available."
        description={error}
        retryLabel="Try again"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!orders) return <LoadingState label="Loading your orders" />;

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet."
        description="When you place an order it will appear here, with its tracking."
        action={<ButtonLink href="/shop">Browse the collection</ButtonLink>}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => {
        const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);

        return (
          <li key={order.id}>
            <Link
              href={`/orders/${order.id}`}
              className="block border-2 border-mak-divider p-5 no-underline transition-colors duration-200 ease-mak hover:border-mak-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display text-mak-body font-extrabold tracking-[-0.01em] text-mak-ink">
                    {order.orderNumber || order.id}
                  </p>
                  <p className="mt-1 text-mak-small text-mak-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {" · "}
                    {pieces} {pieces === 1 ? "piece" : "pieces"}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <span className="font-display text-mak-body font-extrabold text-mak-ink">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              {/*
                The pieces themselves, not just their names.

                An order is recognised by what is in it, and this row was a
                comma-joined string of product names clipped to one line. Up to
                four thumbnails, with the remainder counted -- enough to
                identify the order at a glance without turning the list into a
                gallery.
              */}
              {order.items.length > 0 ? (
                <div className="mt-3.5 flex items-center gap-2">
                  {order.items.slice(0, 4).map((item, index) => (
                    <OrderItemImage
                      key={`${item.productId}-${index}`}
                      image={item.image}
                      productId={item.productId}
                      productName={item.productName}
                      className="size-14"
                      sizes="56px"
                    />
                  ))}
                  {order.items.length > 4 ? (
                    <span className="text-mak-label text-mak-subtle">
                      +{order.items.length - 4} more
                    </span>
                  ) : null}
                </div>
              ) : null}

              <Text size="small" tone="muted" className="mt-3 line-clamp-1">
                {order.items.map((item) => item.productName).join(", ")}
              </Text>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
