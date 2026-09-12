import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Heading, Text } from "./typography";

/**
 * Loading, empty and error states.
 *
 * Every data-backed surface in the system is expected to use these rather than
 * inventing its own. A blank screen is not an empty state, and a spinner with
 * no context is not a loading state.
 */

// ── Skeleton ────────────────────────────────────────────────────────────────

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Preset shapes matching the components they stand in for. */
  variant?: "block" | "text" | "title" | "image";
}

/**
 * A content placeholder sized like the thing it replaces, so nothing shifts
 * when real content arrives.
 *
 * `aria-hidden` because a skeleton conveys nothing to a screen reader -- the
 * surrounding region should carry `aria-busy` instead.
 */
export function Skeleton({
  variant = "block",
  className,
  ...rest
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-mak-surface",
        variant === "text" && "h-4 w-full",
        variant === "title" && "h-7 w-2/3",
        variant === "image" && "aspect-square w-full",
        variant === "block" && "h-24 w-full",
        className
      )}
      {...rest}
    />
  );
}

/** A product card skeleton, matching ProductCard's geometry exactly. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-white">
      <Skeleton variant="image" />
      <div className="flex flex-col gap-2 p-3 sm:p-4 pb-3.5 sm:pb-5">
        <Skeleton variant="text" className="h-4 sm:h-4.5 w-3/4" />
        <Skeleton variant="text" className="h-3 w-1/3" />
        <Skeleton variant="text" className="mt-2 sm:mt-3 h-5 sm:h-6 w-2/5" />
      </div>
    </div>
  );
}

// ── LoadingState ────────────────────────────────────────────────────────────

export interface LoadingStateProps {
  /** Announced to assistive technology while the region is busy. */
  label?: string;
  className?: string;
}

/** A centred, labelled loading indicator for a whole region. */
export function LoadingState({
  label = "Loading",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-20 text-center",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-8 border-2 border-mak-divider border-t-mak-accent",
          // The spin is decorative; reduced-motion users get a static ring.
          "motion-safe:animate-spin"
        )}
      />
      <Text size="label" tone="muted">
        {label}
      </Text>
    </div>
  );
}

// ── EmptyState ──────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** The single action that resolves the emptiness. */
  action?: { label: string; onClick: () => void } | ReactNode;
  /** Wrap in the system's 2px rule. */
  bordered?: boolean;
  className?: string;
}

function renderAction(action: EmptyStateProps["action"]) {
  if (!action) return null;
  if (typeof action === "object" && action !== null && "label" in action) {
    const typed = action as { label: string; onClick: () => void };
    return (
      <Button onClick={typed.onClick} variant="primary" size="md">
        {typed.label}
      </Button>
    );
  }
  return action as ReactNode;
}

/** Nothing here yet, and what to do about it. */
export function EmptyState({
  title,
  description,
  action,
  bordered = true,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        bordered && "border-2 border-mak-line",
        className
      )}
    >
      <Heading level="heading" as="p">
        {title}
      </Heading>
      {description ? (
        <Text size="small" tone="muted" className="max-w-sm">
          {description}
        </Text>
      ) : null}
      {action ? <div className="mt-3">{renderAction(action)}</div> : null}
    </div>
  );
}

// ── ErrorState ──────────────────────────────────────────────────────────────

export interface ErrorStateProps {
  title?: string;
  /**
   * What went wrong, in plain language. Pass the server's message where it is
   * useful to a shopper; keep stack traces out of the UI.
   */
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  bordered?: boolean;
  className?: string;
}

/** Something failed, and how to try again. */
export function ErrorState({
  title = "Something went wrong.",
  description,
  onRetry,
  retryLabel = "Try again",
  bordered = true,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        bordered && "border-2 border-mak-error",
        className
      )}
    >
      <Heading level="heading" as="p" tone="ink">
        {title}
      </Heading>
      {description ? (
        <Text size="small" tone="muted" className="max-w-md">
          {description}
        </Text>
      ) : null}
      {onRetry ? (
        <Button onClick={onRetry} variant="secondary" size="md" className="mt-3">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
