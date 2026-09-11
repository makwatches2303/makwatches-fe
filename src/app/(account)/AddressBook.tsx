"use client";

import { useEffect, useState } from "react";

import {
  Button,
  Checkbox,
  Divider,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Text,
  useToast,
} from "@/design-system";
import { ApiError } from "@/lib/api/client";
import {
  createAddress,
  deleteAddress,
  formatAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
  type Address,
  type AddressInput,
} from "@/lib/api/addresses";
import { checkPincode } from "@/lib/api/checkout";

/**
 * The address book.
 *
 * The same addresses checkout offers, edited here. The pincode is checked
 * against the carrier as it is entered -- the point is to find out an address
 * cannot be delivered to *now*, rather than at the moment someone is trying to
 * pay.
 */

const EMPTY: AddressInput = {
  name: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "India",
  phone: "",
};

export function AddressBook() {
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<AddressInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressInput, string>>>({});
  const [pincodeNote, setPincodeNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setError(null);
    listAddresses()
      .then(setAddresses)
      .catch(() => setError("We could not load your addresses just now."));
  }

  useEffect(load, []);

  function startNew() {
    setDraft(EMPTY);
    setErrors({});
    setPincodeNote(null);
    setEditing("new");
  }

  function startEdit(address: Address) {
    setDraft({
      name: address.name,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone,
      isDefault: address.isDefault,
    });
    setErrors({});
    setPincodeNote(null);
    setEditing(address.id);
  }

  function validate(input: AddressInput) {
    const found: Partial<Record<keyof AddressInput, string>> = {};
    if (!input.name.trim()) found.name = "Enter the recipient's name.";
    if (!input.street.trim()) found.street = "Enter the street address.";
    if (!input.city.trim()) found.city = "Enter the city.";
    if (!input.state.trim()) found.state = "Enter the state.";
    if (!/^\d{6}$/.test(input.zipCode.trim()))
      found.zipCode = "Enter a 6-digit pincode.";
    if (!input.country.trim()) found.country = "Enter the country.";
    if (!/^[\d+\-\s]{8,15}$/.test(input.phone.trim()))
      found.phone = "Enter a phone number the courier can reach.";
    return found;
  }

  async function onPincodeBlur(pincode: string) {
    if (pincode.trim().length < 6) return;
    try {
      const result = await checkPincode(pincode.trim());
      if (!result.serviceable) {
        setPincodeNote(result.reason);
        return;
      }
      // Not every carrier names the locality, so the place clause is dropped
      // when absent rather than rendering "Delivering to ."
      const place = [result.details.city, result.details.state]
        .filter(Boolean)
        .join(", ");
      setPincodeNote(
        place ? `Delivering to ${place}.` : "We deliver to this pincode."
      );
      setDraft((current) => ({
        ...current,
        city: current.city.trim() || result.details.city || "",
        state: current.state.trim() || result.details.state || "",
      }));
    } catch {
      setPincodeNote(
        "We could not check delivery for this pincode right now. You can still save it."
      );
    }
  }

  async function save() {
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      if (editing === "new") {
        await createAddress({ ...draft, isDefault: (addresses?.length ?? 0) === 0 });
        toast("Address saved.", { tone: "success" });
      } else if (editing) {
        await updateAddress(editing, draft);
        toast("Address updated.", { tone: "success" });
      }
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast(
        e instanceof ApiError ? e.message : "We could not save that address.",
        { tone: "error" }
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(address: Address) {
    try {
      await deleteAddress(address.id);
      toast("Address removed.", { tone: "success" });
      load();
    } catch {
      toast("We could not remove that address.", { tone: "error" });
    }
  }

  async function makeDefault(address: Address) {
    try {
      await setDefaultAddress(address.id);
      load();
    } catch {
      toast("We could not change your default address.", { tone: "error" });
    }
  }

  if (error) {
    return (
      <ErrorState
        title="Addresses unavailable"
        description={error}
        retryLabel="Try again"
        onRetry={load}
      />
    );
  }

  if (!addresses) return <LoadingState label="Loading your addresses" />;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-mak-display font-extrabold tracking-[-0.02em] text-mak-ink">
          Addresses
        </h2>
        {editing === null ? (
          <Button variant="secondary" size="sm" onClick={startNew}>
            Add an address
          </Button>
        ) : null}
      </div>

      {addresses.length === 0 && editing === null ? (
        <Text tone="muted">
          You have not saved an address yet. Adding one now makes checkout a
          step shorter.
        </Text>
      ) : null}

      <ul className="flex flex-col gap-4">
        {addresses.map((address) => (
          <li key={address.id} className="border-2 border-mak-divider p-5">
            {editing === address.id ? (
              <AddressForm
                draft={draft}
                errors={errors}
                pincodeNote={pincodeNote}
                saving={saving}
                onChange={setDraft}
                onPincodeBlur={onPincodeBlur}
                onSave={save}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display text-mak-small font-extrabold text-mak-ink">
                    {address.name}
                    {address.isDefault ? (
                      <span className="ml-3 border-2 border-mak-divider px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-mak-muted">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1.5 text-mak-small text-mak-muted">
                    {formatAddress(address)}
                  </p>
                  {address.phone ? (
                    <p className="mt-1 text-mak-label text-mak-subtle">
                      {address.phone}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {!address.isDefault ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void makeDefault(address)}
                    >
                      Make default
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(address)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void remove(address)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {editing === "new" ? (
        <div className="border-2 border-mak-line p-5">
          <h3 className="mb-5 font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-ink">
            New address
          </h3>
          <AddressForm
            draft={draft}
            errors={errors}
            pincodeNote={pincodeNote}
            saving={saving}
            onChange={setDraft}
            onPincodeBlur={onPincodeBlur}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : null}
    </div>
  );
}

function AddressForm({
  draft,
  errors,
  pincodeNote,
  saving,
  onChange,
  onPincodeBlur,
  onSave,
  onCancel,
}: {
  draft: AddressInput;
  errors: Partial<Record<keyof AddressInput, string>>;
  pincodeNote: string | null;
  saving: boolean;
  onChange: (next: AddressInput) => void;
  onPincodeBlur: (pincode: string) => void | Promise<void>;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Recipient" required error={errors.name}>
        <Input
          value={draft.name}
          autoComplete="name"
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
        />
      </Field>

      <Field label="Street address" required error={errors.street}>
        <Input
          value={draft.street}
          autoComplete="street-address"
          onChange={(e) => onChange({ ...draft, street: e.target.value })}
        />
      </Field>

      <Field
        label="Pincode"
        required
        error={errors.zipCode}
        hint={pincodeNote ?? undefined}
      >
        <Input
          value={draft.zipCode}
          inputMode="numeric"
          maxLength={6}
          autoComplete="postal-code"
          onChange={(e) => onChange({ ...draft, zipCode: e.target.value })}
          onBlur={(e) => void onPincodeBlur(e.target.value)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="City" required error={errors.city}>
          <Input
            value={draft.city}
            autoComplete="address-level2"
            onChange={(e) => onChange({ ...draft, city: e.target.value })}
          />
        </Field>
        <Field label="State" required error={errors.state}>
          <Input
            value={draft.state}
            autoComplete="address-level1"
            onChange={(e) => onChange({ ...draft, state: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Country" required error={errors.country}>
          <Input
            value={draft.country}
            autoComplete="country-name"
            onChange={(e) => onChange({ ...draft, country: e.target.value })}
          />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <Input
            value={draft.phone}
            type="tel"
            autoComplete="tel"
            onChange={(e) => onChange({ ...draft, phone: e.target.value })}
          />
        </Field>
      </div>

      <Checkbox
        checked={Boolean(draft.isDefault)}
        onChange={(e) => onChange({ ...draft, isDefault: e.target.checked })}
        label="Use this as my default delivery address"
      />

      <Divider weight="hairline" />

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => void onSave()} disabled={saving}>
          {saving ? "Saving…" : "Save address"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
