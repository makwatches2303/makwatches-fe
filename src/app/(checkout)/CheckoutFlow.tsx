"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Button,
  ButtonLink,
  Checkbox,
  Divider,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  RadioCards,
  Text,
  formatPrice,
  useToast,
} from "@/design-system";
import { useAuth } from "@/context/AuthContext";
import { selectAppliedCoupon, useCartStore } from "@/store/cart";
import { ApiError } from "@/lib/api/client";
import {
  createAddress,
  formatAddress,
  isDeliverable,
  listAddresses,
  type Address,
  type AddressInput,
} from "@/lib/api/addresses";
import {
  checkPincode,
  createRazorpayIntent,
  fetchShippingOptions,
  placeOrder,
  type PaymentMethod,
  type PincodeServiceability,
  type ShippingOption,
  type PlacedOrder,
} from "@/lib/api/checkout";
import { describeAdjustments, syncCartToServer } from "@/lib/cart-sync";
import { openRazorpay } from "@/lib/razorpay";
import {
  trackBeginCheckout,
  trackAddShippingInfo,
  trackAddPaymentInfo,
  trackPurchase,
} from "@/lib/analytics";

import { CheckoutSummary } from "./CheckoutSummary";
import { ShippingOptions } from "./ShippingOptions";
import { OrderPlaced } from "./OrderPlaced";

/**
 * Checkout.
 *
 * The order of operations here is the whole point, so it is worth stating:
 *
 *  1. The bag is pushed to the server (`syncCartToServer`). Everything after
 *     this prices from the server cart, because both `/checkout` and the
 *     Razorpay order do -- a client total is only ever a tripwire.
 *  2. The customer picks or enters an address. The pincode is checked against
 *     the carrier, which also tells us whether COD is possible there.
 *  3. Payment methods are offered based on that answer, never assumed.
 *  4. For an online payment, the gateway is settled *before* `/checkout` is
 *     called; the signature it returns is what the server verifies.
 *
 * The local bag is cleared only once the server has confirmed the order.
 * Clearing it optimistically would lose a cart to any failure after this point.
 */

type Step = "address" | "payment";

const EMPTY_ADDRESS: AddressInput = {
  name: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "India",
  phone: "",
};

/**
 * The delivery confirmation for a serviceable pincode.
 *
 * Not every carrier names the locality -- Shiprocket quotes couriers, not
 * districts -- so the city/state clause is dropped when it is absent rather
 * than rendering "Delivering to ." The fact that we deliver is the part worth
 * saying either way.
 */
function deliveryHint(serviceability: PincodeServiceability): string {
  const place = [serviceability.city, serviceability.state]
    .filter(Boolean)
    .join(", ");
  return place ? `Delivering to ${place}.` : "We deliver to this pincode.";
}

export function CheckoutFlow() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const hydrated = useCartStore((state) => state.hydrated);
  const lines = useCartStore((state) => state.lines);
  const appliedCoupon = useCartStore(selectAppliedCoupon);
  const replaceAll = useCartStore((state) => state.replaceAll);
  const clearCart = useCartStore((state) => state.clear);

  const [step, setStep] = useState<Step>("address");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [adjustmentNotes, setAdjustmentNotes] = useState<string[]>([]);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AddressInput>(EMPTY_ADDRESS);
  const [saveAddress, setSaveAddress] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressInput, string>>>({});

  const [serviceability, setServiceability] =
    useState<PincodeServiceability | null>(null);
  const [pincodeMessage, setPincodeMessage] = useState<string | null>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  // Delivery options are fetched per (pincode, payment mode), because the
  // carrier prices COD differently and the server binds each quote to the mode
  // it was issued for.
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  const signedIn = Boolean(user);

  // --- GA4: Track begin_checkout once bag is ready -----------------------
  const beginCheckoutTrackedRef = useRef(false);
  useEffect(() => {
    if (hydrated && lines.length > 0 && !beginCheckoutTrackedRef.current) {
      beginCheckoutTrackedRef.current = true;
      const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
      trackBeginCheckout(lines, subtotal, appliedCoupon?.code);
    }
  }, [hydrated, lines, appliedCoupon]);

  // --- 1. Push the bag to the server ------------------------------------
  //
  // Runs once the bag has rehydrated and we know who the customer is. Guarded
  // by a ref rather than a dependency on `lines`, which changes identity as
  // adjustments are folded back in and would otherwise loop.
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || !signedIn || syncedRef.current || placed) return;
    if (lines.length === 0) return;

    syncedRef.current = true;
    setSyncing(true);
    setSyncError(null);

    const nameFor = (productId: string, size?: string) =>
      lines.find(
        (line) => line.productId === productId && (line.size ?? "") === (size ?? "")
      )?.name;

    syncCartToServer(lines)
      .then((outcome) => {
        setServerTotal(outcome.total);
        if (outcome.adjustments.length > 0) {
          replaceAll(outcome.lines);
          // Shown inline and left on the page rather than toasted. A change to
          // what someone is about to pay for must still be on screen when they
          // reach for the pay button, and a toast will have faded by then.
          setAdjustmentNotes(describeAdjustments(outcome.adjustments, nameFor));
        }
      })
      .catch((error: unknown) => {
        syncedRef.current = false;
        setSyncError(
          error instanceof ApiError
            ? error.message
            : "We could not confirm your bag against live stock. Please try again."
        );
      })
      .finally(() => setSyncing(false));
  }, [hydrated, signedIn, lines, replaceAll, placed]);

  // --- Saved addresses --------------------------------------------------
  useEffect(() => {
    if (!signedIn) return;
    let active = true;

    listAddresses()
      .then((saved) => {
        if (!active) return;
        setAddresses(saved);
        const preferred = saved.find((a) => a.isDefault) ?? saved[0];
        if (preferred) setSelectedAddressId(preferred.id);
      })
      .catch(() => {
        // An empty address book and an unreachable one look the same to the
        // customer here: either way they type an address. No error shown.
        if (active) setAddresses([]);
      });

    return () => {
      active = false;
    };
  }, [signedIn]);

  const usingSaved = selectedAddressId !== null && selectedAddressId !== "new";
  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  );

  /** The address the order will actually ship to, whichever way it was given. */
  const effectiveAddress: AddressInput | null = usingSaved
    ? selectedAddress
      ? {
          name: selectedAddress.name,
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          country: selectedAddress.country,
          phone: selectedAddress.phone,
        }
      : null
    : draft;

  // --- 2. Serviceability -------------------------------------------------
  const verifyPincode = useCallback(
    async (pincode: string): Promise<PincodeServiceability | null> => {
      const trimmed = pincode.trim();
      if (trimmed.length < 6) return null;

      setCheckingPincode(true);
      setPincodeMessage(null);
      try {
        const result = await checkPincode(trimmed);
        if (!result.serviceable) {
          setServiceability(null);
          setPincodeMessage(result.reason);
          return null;
        }
        setServiceability(result.details);
        return result.details;
      } catch {
        // Could not reach the carrier. That is not the same as "we do not
        // deliver here", and must not be presented as one.
        setServiceability(null);
        setPincodeMessage(
          "We could not check delivery for this pincode right now. You can still continue; we will confirm before dispatch."
        );
        return null;
      } finally {
        setCheckingPincode(false);
      }
    },
    []
  );

  const onPincodeBlur = async (pincode: string) => {
    const details = await verifyPincode(pincode);
    // The carrier knows the city and state for a pincode, so filling them in
    // saves typing and avoids a mismatch between the two.
    if (details) {
      setDraft((current) => ({
        ...current,
        city: current.city.trim() || details.city || details.district || "",
        state: current.state.trim() || details.state || "",
      }));
    }
  };

  /**
   * Load the courier options for the current address and payment mode.
   *
   * Any previous selection is dropped first: a quote is bound to the mode and
   * destination it was issued for, so keeping a stale one would only fail
   * server-side at the last step.
   */
  const loadShippingOptions = useCallback(
    async (pincode: string, cod: boolean) => {
      setLoadingShipping(true);
      setShippingError(null);
      setSelectedShipping(null);
      setShippingOptions([]);
      try {
        const result = await fetchShippingOptions(pincode.trim(), cod);
        const options = result?.options ?? [];
        setShippingOptions(options);
        // Preselect the carrier's own recommendation, else the cheapest. The
        // customer can change it; this only avoids an empty required field.
        if (options.length > 0) {
          const recommended = options.find((option) => option.recommended);
          const cheapest = [...options].sort((a, b) => a.charge - b.charge)[0];
          const initial = recommended ?? cheapest;
          setSelectedShipping(initial);
          trackAddShippingInfo(
            initial,
            (serverTotal ?? 0) + initial.charge,
            lines,
            appliedCoupon?.code
          );
        }
      } catch {
        // Never fall back to a zero charge: that would ship at our expense and
        // hide the failure. The customer is told, and can retry.
        setShippingError(
          "We could not load delivery options just now. Please try again."
        );
      } finally {
        setLoadingShipping(false);
      }
    },
    [lines, serverTotal, appliedCoupon]
  );

  // Re-quote whenever the destination or the payment mode changes.
  useEffect(() => {
    if (step !== "payment" || !method) return;
    const pincode = effectiveAddress?.zipCode?.trim();
    if (!pincode || !/^\d{6}$/.test(pincode)) return;
    void loadShippingOptions(pincode, method === "cod");
    // effectiveAddress is derived each render; the pincode is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, method, effectiveAddress?.zipCode, loadShippingOptions]);

  const shippingCharge = selectedShipping?.charge ?? null;
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const displayTotal =
    serverTotal === null
      ? null
      : Math.max(0, serverTotal - discountAmount) + (shippingCharge ?? 0);

  function validate(address: AddressInput) {
    const next: Partial<Record<keyof AddressInput, string>> = {};
    if (!address.name.trim()) next.name = "Enter the recipient's name.";
    if (!address.street.trim()) next.street = "Enter the street address.";
    if (!address.city.trim()) next.city = "Enter the city.";
    if (!address.state.trim()) next.state = "Enter the state.";
    if (!/^\d{6}$/.test(address.zipCode.trim()))
      next.zipCode = "Enter a 6-digit pincode.";
    if (!address.country.trim()) next.country = "Enter the country.";
    if (!/^[\d+\-\s]{8,15}$/.test(address.phone.trim()))
      next.phone = "Enter a phone number the courier can reach.";
    return next;
  }

  async function continueToPayment() {
    if (!effectiveAddress) {
      setErrors({ street: "Choose or enter a delivery address." });
      return;
    }

    if (!usingSaved) {
      const found = validate(draft);
      setErrors(found);
      if (Object.keys(found).length > 0) return;
    } else if (!isDeliverable(effectiveAddress)) {
      setErrors({ street: "This saved address is incomplete. Enter a new one." });
      return;
    }

    // Save phone for abandoned cart recovery tracking if user drops off
    if (effectiveAddress.phone) {
      try {
        localStorage.setItem("mak_user_phone", effectiveAddress.phone);
        if (effectiveAddress.name) {
          localStorage.setItem("mak_user_name", effectiveAddress.name);
        }
      } catch {
        // Ignore storage errors
      }
    }

    const details =
      serviceability ?? (await verifyPincode(effectiveAddress.zipCode));

    // COD is offered only where the carrier confirms it. Where we could not
    // reach the carrier at all, only prepaid is offered -- promising cash on
    // delivery we cannot fulfil is worse than not offering it.
    const chosenMethod: PaymentMethod = details?.cod ? "cod" : "razorpay";
    setMethod(chosenMethod);
    trackAddPaymentInfo(
      chosenMethod,
      displayTotal ?? 0,
      lines,
      appliedCoupon?.code
    );

    if (!usingSaved && saveAddress) {
      try {
        const created = await createAddress({
          ...draft,
          isDefault: addresses.length === 0,
        });
        setAddresses((current) => [...current, created]);
        setSelectedAddressId(created.id);
      } catch {
        // Saving to the address book is a convenience, not part of the order.
        // The order still carries the address that was typed.
        toast(
          "We could not save this address to your account, but your order will still use it.",
          { tone: "warning" }
        );
      }
    }

    setStep("payment");
  }

  // --- 3 & 4. Pay, then place -------------------------------------------
  async function submitOrder() {
    if (!effectiveAddress || !method) return;
    // A delivery option is required: without one the server has no charge to
    // verify, and shipping would silently be free.
    if (!selectedShipping) {
      setPlaceError("Please choose a delivery option.");
      return;
    }

    setPlacing(true);
    setPlaceError(null);

    try {
      let paymentInfo: Parameters<typeof placeOrder>[0]["paymentInfo"] = {
        method: "cod",
      };

      if (method === "razorpay") {
        // The intent must be raised for goods + delivery, or the amount
        // captured would not match the order the server prices.
        const intent = await createRazorpayIntent(
          {
            quote: selectedShipping.quote,
            pincode: effectiveAddress.zipCode.trim(),
            cod: false,
          },
          appliedCoupon?.code
        );
        const outcome = await openRazorpay({
          key: intent.key,
          amount: intent.amount,
          currency: intent.currency,
          orderId: intent.orderId,
          name: "MAK Watches",
          description: `${lines.length} ${lines.length === 1 ? "piece" : "pieces"}`,
          prefill: {
            name: effectiveAddress.name,
            email: user?.email,
            contact: effectiveAddress.phone,
          },
        });

        if (outcome.status === "dismissed") {
          // Not an error. Nothing has been charged and nothing is lost.
          setPlacing(false);
          return;
        }
        if (outcome.status === "failed") {
          setPlaceError(outcome.message);
          setPlacing(false);
          return;
        }

        paymentInfo = {
          method: "razorpay",
          razorpayOrderId: outcome.payment.razorpay_order_id,
          razorpayPaymentId: outcome.payment.razorpay_payment_id,
          razorpaySignature: outcome.payment.razorpay_signature,
        };
      }

      const order = await placeOrder({
        shippingAddress: effectiveAddress,
        paymentInfo,
        customerName: effectiveAddress.name,
        customerEmail: user?.email,
        customerPhone: effectiveAddress.phone,
        couponCode: appliedCoupon?.code,
        clientTotal: displayTotal ?? undefined,
        // Opaque: the server reads the courier and the charge out of this
        // after re-verifying it. No amount is sent from here.
        shippingQuote: selectedShipping.quote,
      });

      // Track successful purchase in GA4
      trackPurchase(order);

      // Only now: the server holds the order, so the bag can go.
      setPlaced(order);
      clearCart();
    } catch (error: unknown) {
      setPlaceError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : "We could not place your order. Nothing has been charged."
      );
    } finally {
      setPlacing(false);
    }
  }

  // --- Render ------------------------------------------------------------

  if (placed) {
    return <OrderPlaced order={placed} />;
  }

  if (authLoading || !hydrated) {
    return <LoadingState label="Preparing checkout" />;
  }

  if (!signedIn) {
    return (
      <EmptyState
        title="Sign in to check out."
        description="Your bag is saved on this device. Signing in lets us confirm stock, deliver to your saved addresses and keep a record of the order."
        action={<ButtonLink href="/login?redirect=/checkout">Sign in</ButtonLink>}
      />
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        title="There is nothing to check out."
        description="Your bag is empty."
        action={<ButtonLink href="/shop">Browse the collection</ButtonLink>}
      />
    );
  }

  if (syncError) {
    return (
      <ErrorState
        title="We could not confirm your bag."
        description={syncError}
        retryLabel="Try again"
        onRetry={() => {
          syncedRef.current = false;
          setSyncError(null);
        }}
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
      <div className="min-w-0">
        <Steps current={step} />

        {adjustmentNotes.length > 0 ? (
          <div
            role="status"
            className="mb-8 border-2 border-mak-warning p-4"
          >
            <p className="font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-warning">
              Your bag changed
            </p>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {adjustmentNotes.map((note) => (
                <li key={note} className="text-mak-small text-mak-ink">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {step === "address" ? (
          <section aria-labelledby="checkout-address">
            <h2
              id="checkout-address"
              className="mb-6 font-display text-mak-display font-extrabold tracking-[-0.02em] text-mak-ink"
            >
              Where is it going?
            </h2>

            {addresses.length > 0 ? (
              <RadioCards
                legend="Saved addresses"
                name="address"
                value={selectedAddressId}
                onChange={(value) => {
                  setSelectedAddressId(value);
                  setErrors({});
                  setServiceability(null);
                  setPincodeMessage(null);
                }}
                options={[
                  ...addresses.map((address) => ({
                    value: address.id,
                    label: address.name,
                    description: formatAddress(address),
                    meta: address.isDefault ? "Default" : undefined,
                  })),
                  {
                    value: "new",
                    label: "Deliver somewhere else",
                    description: "Enter a new address.",
                  },
                ]}
                className="mb-8"
              />
            ) : null}

            {!usingSaved ? (
              <div className="flex flex-col gap-5">
                <Field label="Recipient" required error={errors.name}>
                  <Input
                    value={draft.name}
                    autoComplete="name"
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                </Field>

                <Field label="Street address" required error={errors.street}>
                  <Input
                    value={draft.street}
                    autoComplete="street-address"
                    onChange={(e) =>
                      setDraft({ ...draft, street: e.target.value })
                    }
                  />
                </Field>

                <Field
                  label="Pincode"
                  required
                  error={errors.zipCode}
                  hint={
                    checkingPincode
                      ? "Checking delivery…"
                      : serviceability
                        ? deliveryHint(serviceability)
                        : pincodeMessage ?? undefined
                  }
                >
                  <Input
                    value={draft.zipCode}
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="postal-code"
                    onChange={(e) => {
                      setDraft({ ...draft, zipCode: e.target.value });
                      setServiceability(null);
                      setPincodeMessage(null);
                    }}
                    onBlur={(e) => void onPincodeBlur(e.target.value)}
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="City" required error={errors.city}>
                    <Input
                      value={draft.city}
                      autoComplete="address-level2"
                      onChange={(e) =>
                        setDraft({ ...draft, city: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="State" required error={errors.state}>
                    <Input
                      value={draft.state}
                      autoComplete="address-level1"
                      onChange={(e) =>
                        setDraft({ ...draft, state: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Country" required error={errors.country}>
                    <Input
                      value={draft.country}
                      autoComplete="country-name"
                      onChange={(e) =>
                        setDraft({ ...draft, country: e.target.value })
                      }
                    />
                  </Field>

                  <Field
                    label="Phone"
                    required
                    error={errors.phone}
                    hint="The courier calls this number on delivery."
                  >
                    <Input
                      value={draft.phone}
                      type="tel"
                      autoComplete="tel"
                      onChange={(e) =>
                        setDraft({ ...draft, phone: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <Checkbox
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  label="Save this address to my account"
                />
              </div>
            ) : null}

            <Divider className="my-9" />

            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={() => void continueToPayment()}
                disabled={syncing || checkingPincode}
              >
                {syncing ? "Confirming your bag…" : "Continue to payment"}
              </Button>
              <ButtonLink href="/cart" variant="ghost">
                Back to bag
              </ButtonLink>
            </div>
          </section>
        ) : (
          <section aria-labelledby="checkout-payment">
            <h2
              id="checkout-payment"
              className="mb-6 font-display text-mak-display font-extrabold tracking-[-0.02em] text-mak-ink"
            >
              How would you like to pay?
            </h2>

            {effectiveAddress ? (
              <div className="mb-8 border-2 border-mak-divider p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-ink">
                    Delivering to
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep("address")}
                    className="text-mak-small text-mak-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
                  >
                    Change
                  </button>
                </div>
                <Text size="small" tone="muted" className="mt-2">
                  {effectiveAddress.name} — {formatAddress(effectiveAddress)}
                </Text>
              </div>
            ) : null}

            <RadioCards
              legend="Payment method"
              name="payment"
              value={method}
              onChange={(nextMethod) => {
                setMethod(nextMethod);
                trackAddPaymentInfo(
                  nextMethod,
                  displayTotal ?? 0,
                  lines,
                  appliedCoupon?.code
                );
              }}
              options={[
                {
                  value: "razorpay",
                  label: "Pay online",
                  description:
                    "Card, UPI, netbanking or wallet, through Razorpay. You pay before the order is confirmed.",
                },
                {
                  value: "cod",
                  label: "Cash on delivery",
                  description: serviceability?.cod
                    ? "Pay the courier when your watch arrives."
                    : "Not available for this pincode.",
                  disabled: !serviceability?.cod,
                },
              ]}
            />

            <div className="mt-8">
              <ShippingOptions
                options={shippingOptions}
                selectedQuote={selectedShipping?.quote ?? null}
                onSelect={(option) => {
                  setSelectedShipping(option);
                  trackAddShippingInfo(
                    option,
                    displayTotal ?? 0,
                    lines,
                    appliedCoupon?.code
                  );
                }}
                loading={loadingShipping}
                error={shippingError}
                onRetry={() => {
                  const pincode = effectiveAddress?.zipCode?.trim();
                  if (pincode && method) {
                    void loadShippingOptions(pincode, method === "cod");
                  }
                }}
                disabled={placing}
              />
            </div>

            {placeError ? (
              <p
                role="alert"
                className="mt-6 border-2 border-mak-error p-4 text-mak-small font-semibold text-mak-error"
              >
                {placeError}
              </p>
            ) : null}

            <Divider className="my-9" />

            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={() => void submitOrder()}
                disabled={placing || !method || !selectedShipping}
              >
                {placing
                  ? "Placing your order…"
                  : method === "cod"
                    ? "Place order"
                    : `Pay ${formatPrice(displayTotal ?? 0)}`}
              </Button>
              <Button variant="ghost" onClick={() => setStep("address")}>
                Back
              </Button>
            </div>

            <Text size="label" tone="subtle" className="mt-6">
              Your card details are entered in Razorpay&apos;s window and are
              never sent to or stored by MAK Watches.
            </Text>
          </section>
        )}
      </div>

      <CheckoutSummary
        lines={lines}
        serverTotal={serverTotal}
        shippingCharge={shippingCharge}
        shippingLabel={selectedShipping?.courierName}
        className="lg:sticky lg:top-24 lg:self-start"
      />
    </div>
  );
}

/** The two-step progress indicator. */
function Steps({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "address", label: "Delivery" },
    { id: "payment", label: "Payment" },
  ];

  return (
    <ol className="mb-9 flex items-center gap-3" aria-label="Checkout progress">
      {steps.map((step, index) => {
        const active = step.id === current;
        const done = current === "payment" && step.id === "address";
        return (
          <li key={step.id} className="flex items-center gap-3">
            <span
              className={
                active || done
                  ? "flex size-7 items-center justify-center border-2 border-mak-ink bg-mak-ink font-display text-[11px] font-extrabold text-mak-bg"
                  : "flex size-7 items-center justify-center border-2 border-mak-divider font-display text-[11px] font-extrabold text-mak-muted"
              }
            >
              {index + 1}
            </span>
            <span
              aria-current={active ? "step" : undefined}
              className={
                active
                  ? "font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-ink"
                  : "font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-muted"
              }
            >
              {step.label}
            </span>
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className="ml-1 h-0.5 w-8 bg-mak-divider sm:w-12"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
