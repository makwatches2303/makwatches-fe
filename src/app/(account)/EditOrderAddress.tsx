"use client";

import { useState } from "react";

import { Button, Field, Input, Text } from "@/design-system";
import { ApiError } from "@/lib/api/client";
import {
  updateOrderAddress,
  type Order,
  type OrderAddressInput,
} from "@/lib/api/orders";

function draftFrom(order: Order): OrderAddressInput {
  const a = order.shippingAddress;
  return {
    name: a?.name ?? order.customerName ?? "",
    street: a?.street ?? "",
    city: a?.city ?? "",
    state: a?.state ?? "",
    zipCode: a?.zipCode ?? "",
    country: a?.country || "India",
    phone: a?.phone ?? order.customerPhone ?? "",
  };
}

/**
 * Let a customer correct the address on their own order.
 *
 * The case this is for: the parcel cannot be booked because the address is
 * wrong — most often a pincode that does not exist — and the person who can
 * fix it fastest is the one who typed it. Previously they could see the
 * order sitting there and do nothing about it but phone up.
 *
 * Validation is the server's, not a second copy of it here: it is the only
 * side that can ask a courier whether it actually delivers to a pincode, and
 * a client-side guess would either reject good addresses or accept
 * undeliverable ones. Field-level replies are shown against the fields they
 * name.
 */
export function EditOrderAddress({
  order,
  onSaved,
  onCancel,
}: {
  order: Order;
  onSaved: (message: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<OrderAddressInput>(() => draftFrom(order));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(key: keyof OrderAddressInput, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
    // Drop this field's error the moment it is edited. Leaving the old
    // message under a box someone just corrected reads as "still wrong".
    setFieldErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setFieldErrors({});

    try {
      await updateOrderAddress(order.id, draft);
      onSaved("Delivery address updated. We'll dispatch to the new address.");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
          setFieldErrors(error.fieldErrors);
        }
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {formError ? (
        <p
          role="alert"
          className="border-2 border-mak-error p-3 text-mak-small font-semibold text-mak-error"
        >
          {formError}
        </p>
      ) : null}

      <Field label="Full name" required error={fieldErrors.name}>
        <Input
          value={draft.name}
          autoComplete="name"
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>

      <Field label="Street address" required error={fieldErrors.street}>
        <Input
          value={draft.street}
          autoComplete="street-address"
          onChange={(e) => set("street", e.target.value)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Pincode" required error={fieldErrors.zipCode}>
          <Input
            value={draft.zipCode}
            inputMode="numeric"
            maxLength={6}
            autoComplete="postal-code"
            onChange={(e) => set("zipCode", e.target.value)}
          />
        </Field>

        <Field
          label="Phone"
          required
          error={fieldErrors.phone}
          hint="The courier calls this number on delivery."
        >
          <Input
            value={draft.phone}
            type="tel"
            autoComplete="tel"
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="City" required error={fieldErrors.city}>
          <Input
            value={draft.city}
            autoComplete="address-level2"
            onChange={(e) => set("city", e.target.value)}
          />
        </Field>

        <Field label="State" required error={fieldErrors.state}>
          <Input
            value={draft.state}
            autoComplete="address-level1"
            onChange={(e) => set("state", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={saving}>
          {saving ? "Checking delivery…" : "Save address"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>

      <Text size="label" tone="subtle">
        We check that a courier delivers to the new pincode before saving.
      </Text>
    </form>
  );
}
