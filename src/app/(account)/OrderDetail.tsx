"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  Button,
  ButtonLink,
  Divider,
  ErrorState,
  LoadingState,
  Text,
  formatPrice,
  useToast,
} from "@/design-system";
import { ApiError } from "@/lib/api/client";
import { formatAddress } from "@/lib/api/addresses";
import {
  ORDER_STAGES,
  cancelOrder,
  carrierNameOf,
  getOrder,
  isCancellable,
  orderStageIndex,
  trackOrder,
  trackingNumberOf,
  type Order,
  type ShippingInfo,
} from "@/lib/api/orders";

import { OrderStatusBadge } from "./OrderStatusBadge";

/**
 * One order, with its carrier tracking.
 *
 * Tracking is fetched separately and after the order, because it is a live call
 * out to the carrier: the order should be on screen immediately, with tracking
 * filling in when it arrives. An order with no waybill yet is a normal state,
 * not an error, and says so.
 */
export function OrderDetail({ orderId }: { orderId: string }) {
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<ShippingInfo | null>(null);
  const [trackingState, setTrackingState] =
    useState<"idle" | "loading" | "none" | "unavailable">("idle");
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    setError(null);
    getOrder(orderId)
      .then(setOrder)
      .catch((e: unknown) => {
        setError(
          e instanceof ApiError && e.status === 404
            ? "We could not find that order."
            : "We could not load this order just now."
        );
      });
  }, [orderId]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!order) return;
    let active = true;
    setTrackingState("loading");

    trackOrder(order.id)
      .then((info) => {
        if (!active) return;
        setTracking(info);
        setTrackingState(info ? "idle" : "none");
      })
      .catch(() => {
        // The carrier is unreachable. Say that, rather than implying the parcel
        // is missing.
        if (active) setTrackingState("unavailable");
      });

    return () => {
      active = false;
    };
  }, [order]);

  async function requestCancellation() {
    if (!order) return;
    setCancelling(true);
    try {
      await cancelOrder(order.id);
      toast("Your cancellation request has been sent.", { tone: "success" });
      load();
    } catch (e: unknown) {
      toast(
        e instanceof ApiError
          ? e.message
          : "We could not cancel this order. Please contact us.",
        { tone: "error" }
      );
    } finally {
      setCancelling(false);
    }
  }

  if (error) {
    return (
      <ErrorState
        title="Order unavailable"
        description={error}
        retryLabel="Try again"
        onRetry={load}
      />
    );
  }

  if (!order) return <LoadingState label="Loading your order" />;

  const stage = orderStageIndex(order.status);
  const offPath = stage === -1;
  const shipping = tracking ?? order.shippingInfo ?? null;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-mak-display font-extrabold tracking-[-0.02em] text-mak-ink">
            {order.orderNumber || order.id}
          </h2>
          <Text tone="muted" className="mt-2">
            Placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Progress. Omitted entirely for a cancelled or returned order rather
          than drawn as a stalled bar, which would misdescribe what happened. */}
      {!offPath ? (
        <ol className="flex flex-wrap gap-x-2 gap-y-3" aria-label="Order progress">
          {ORDER_STAGES.map((name, index) => {
            const reached = index <= stage;
            return (
              <li key={name} className="flex flex-1 basis-32 flex-col gap-2">
                <span
                  aria-hidden="true"
                  className={
                    reached ? "h-1 bg-mak-ink" : "h-1 bg-mak-divider/40"
                  }
                />
                <span
                  className={
                    reached
                      ? "font-display text-mak-label font-extrabold uppercase tracking-[0.12em] text-mak-ink"
                      : "font-display text-mak-label font-extrabold uppercase tracking-[0.12em] text-mak-muted"
                  }
                >
                  {name}
                  {index === stage ? <span className="sr-only"> (current)</span> : null}
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}

      <section aria-labelledby="order-tracking">
        <h3
          id="order-tracking"
          className="mb-4 font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-ink"
        >
          Delivery
        </h3>

        <div className="border-2 border-mak-divider p-5">
          {trackingState === "loading" ? (
            <Text size="small" tone="muted">
              Checking with the carrier…
            </Text>
          ) : trackingState === "unavailable" ? (
            <Text size="small" tone="muted">
              We could not reach the carrier for an update just now. Your order
              is unaffected.
            </Text>
          ) : !shipping || !trackingNumberOf(shipping) ? (
            <Text size="small" tone="muted">
              Not dispatched yet. Tracking appears here once the parcel is
              handed to the carrier.
            </Text>
          ) : (
            <dl className="flex flex-col gap-3">
              <Row label="Carrier" value={carrierNameOf(shipping)} />
              <Row label="Tracking no." value={trackingNumberOf(shipping)} />
              {shipping.shipmentStatus ? (
                <Row label="Status" value={shipping.shipmentStatus} />
              ) : null}
              {shipping.currentLocation ? (
                <Row label="Last seen" value={shipping.currentLocation} />
              ) : null}
              {shipping.expectedDelivery ? (
                <Row label="Expected" value={shipping.expectedDelivery} />
              ) : null}
              {shipping.trackingUrl ? (
                <div className="pt-1">
                  <a
                    href={shipping.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mak-small text-mak-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
                  >
                    Track on the carrier&apos;s site
                  </a>
                </div>
              ) : null}
            </dl>
          )}
        </div>
      </section>

      <section aria-labelledby="order-items">
        <h3
          id="order-items"
          className="mb-4 font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-ink"
        >
          Items
        </h3>

        <ul className="flex flex-col">
          {order.items.map((item, index) => (
            <li
              key={`${item.productId}-${item.size ?? ""}-${index}`}
              className="flex flex-wrap items-baseline justify-between gap-3 border-b-[1.5px] border-mak-divider py-3.5 first:pt-0"
            >
              <span className="min-w-0">
                <Link
                  href={`/product/id/${item.productId}`}
                  className="font-display text-mak-small font-extrabold text-mak-ink no-underline hover:text-mak-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
                >
                  {item.productName}
                </Link>
                {item.size ? (
                  <span className="text-mak-small text-mak-muted"> · {item.size}</span>
                ) : null}
                <span className="text-mak-small text-mak-muted"> × {item.quantity}</span>
              </span>
              <span className="shrink-0 text-mak-small text-mak-ink">
                {formatPrice(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-baseline justify-between">
          <span className="font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-ink">
            Total
          </span>
          <span className="font-display text-2xl font-extrabold tracking-[-0.02em] text-mak-ink">
            {formatPrice(order.total)}
          </span>
        </div>
        <Text size="label" tone="subtle" className="mt-2">
          Paid by {order.paymentInfo?.method === "cod" ? "cash on delivery" : "card, UPI or netbanking"}
          {" · "}
          {order.paymentStatus}
        </Text>
      </section>

      <section aria-labelledby="order-address">
        <h3
          id="order-address"
          className="mb-4 font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-ink"
        >
          Delivering to
        </h3>
        <Text size="small" tone="muted">
          {order.shippingAddress?.name}
          {order.shippingAddress ? ` — ${formatAddress(order.shippingAddress)}` : ""}
        </Text>
      </section>

      <Divider />

      <div className="flex flex-wrap items-center gap-4">
        <ButtonLink href="/orders" variant="secondary">
          All orders
        </ButtonLink>
        {isCancellable(order) ? (
          <Button
            variant="ghost"
            onClick={() => void requestCancellation()}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling…" : "Cancel this order"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <dt className="text-mak-small text-mak-muted">{label}</dt>
      <dd className="text-mak-small text-mak-ink">{value}</dd>
    </div>
  );
}
