"use client";

import type { ReactNode } from "react";

import { AlertIcon, Button, Modal, Text } from "@/design-system";

/**
 * "We cannot deliver to this pincode" -- said so it cannot be missed.
 *
 * A wrong pincode used to surface only as a line of hint text under the
 * field, which is easy to scroll past; the shopper then waited on a parcel
 * that was never going to be booked. The same explanation is used at
 * checkout, when correcting an order's address, and when an order could not
 * be booked, so a customer hears one consistent story wherever they meet it.
 */
export function PincodeProblemModal({
  open,
  onClose,
  onFix,
  pincode,
  reason,
  title = "Please check your pincode",
  fixLabel = "Fix the pincode",
  closeLabel = "Not now",
  headline,
  body,
}: {
  open: boolean;
  onClose: () => void;
  /** Takes the shopper to the field that needs correcting. */
  onFix?: () => void;
  pincode?: string;
  /** The server's own explanation, when it gave one. */
  reason?: string | null;
  title?: string;
  fixLabel?: string;
  closeLabel?: string;
  /** Replaces "No courier delivers to …" when the cause is less certain. */
  headline?: ReactNode;
  /** Replaces the default "this is almost always a typo" explanation. */
  body?: ReactNode;
}) {
  const code = pincode?.trim();

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-start gap-4 border-2 border-mak-error bg-mak-surface p-4">
          <AlertIcon size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-mak-error" />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-display text-mak-small font-extrabold text-mak-ink">
              {headline ??
                (code ? (
                  <>
                    No courier delivers to{" "}
                    <span className="whitespace-nowrap tracking-[0.08em] text-mak-error">
                      {code}
                    </span>
                  </>
                ) : (
                  "No courier delivers to this pincode"
                ))}
            </p>
            {reason ? (
              <Text size="small" tone="muted">
                {reason}
              </Text>
            ) : null}
          </div>
        </div>

        <Text tone="muted">
          {body ?? (
            <>
          This almost always means the pincode was mistyped or does not
          exist. Check it against a recent letter, bill or your phone&apos;s
          maps app — a single wrong digit sends a parcel nowhere.
            </>
          )}
        </Text>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            {closeLabel}
          </Button>
          {onFix ? (
            <Button
              onClick={() => {
                onClose();
                onFix();
              }}
            >
              {fixLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
