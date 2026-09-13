"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";
import { Button, Text } from "@/design-system";
import { trackLeadCapture } from "@/lib/analytics";

/**
 * Email capture.
 *
 * Submission is delegated to the caller via `onSubmit`. There is no default
 * endpoint and no built-in "success" path that pretends to have stored the
 * address: without an `onSubmit` the form is rendered disabled, because a
 * signup box that silently discards addresses is worse than none.
 *
 * Validation is deliberately shallow -- `type="email"` plus a non-empty check.
 * Anything stricter rejects valid addresses.
 */

export interface NewsletterProps {
  label?: string;
  placeholder?: string;
  submitLabel?: string;
  /** Small print beneath the field. */
  note?: string;
  /**
   * Handles the address. Resolve to confirm, reject to show an error.
   * When omitted the form renders disabled.
   */
  onSubmit?: (email: string) => Promise<void>;
  className?: string;
}

type Status = "idle" | "submitting" | "done" | "error";

export function Newsletter({
  label = "Your email",
  placeholder = "you@example.com",
  submitLabel = "Notify me",
  note,
  onSubmit,
  className,
}: NewsletterProps) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const disabled = !onSubmit;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onSubmit || status === "submitting") return;

    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus("submitting");
    setMessage("");

    try {
      await onSubmit(trimmed);
      trackLeadCapture("email_newsletter", "newsletter_block");
      setStatus("done");
      setMessage("You are on the list.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Something went wrong. Try again."
      );
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-mak-line bg-mak-bg p-7 text-mak-ink",
        className
      )}
    >
      <form onSubmit={handleSubmit}>
        <label
          htmlFor={id}
          className="block text-mak-micro font-semibold uppercase tracking-[0.16em] text-mak-accent"
        >
          {label}
        </label>

        <input
          id={id}
          type="email"
          name="email"
          autoComplete="email"
          required
          disabled={disabled || status === "submitting"}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={placeholder}
          aria-describedby={message ? `${id}-message` : note ? `${id}-note` : undefined}
          className={cn(
            "mt-2.5 min-h-12 w-full border-[1.5px] border-mak-line bg-mak-bg px-3.5",
            "text-mak-body text-mak-ink outline-none",
            "placeholder:text-mak-subtle",
            "focus-visible:border-mak-accent",
            "disabled:opacity-50"
          )}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          block
          disabled={disabled || status === "submitting"}
          className="mt-3.5"
        >
          {status === "submitting" ? "Submitting…" : submitLabel}
        </Button>
      </form>

      {message ? (
        <p
          id={`${id}-message`}
          role="status"
          aria-live="polite"
          className={cn(
            "mt-3 text-mak-small",
            status === "error" ? "text-mak-error" : "text-mak-success"
          )}
        >
          {message}
        </p>
      ) : null}

      {note ? (
        <Text
          id={`${id}-note`}
          size="small"
          tone="subtle"
          className="mt-3"
        >
          {note}
        </Text>
      ) : null}

      {disabled ? (
        <Text size="small" tone="subtle" className="mt-3">
          Signup is not connected yet.
        </Text>
      ) : null}
    </div>
  );
}
