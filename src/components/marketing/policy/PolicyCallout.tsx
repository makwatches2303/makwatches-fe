import { Heading, Text } from "@/design-system";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type PolicyCalloutTone = "note" | "success" | "warning" | "error";

const BORDER: Record<PolicyCalloutTone, string> = {
  note: "border-mak-accent",
  success: "border-mak-success",
  warning: "border-mak-warning",
  error: "border-mak-error",
};

const TITLE_COLOR: Record<PolicyCalloutTone, string> = {
  note: "text-mak-accent",
  success: "text-mak-success",
  warning: "text-mak-warning",
  error: "text-mak-error",
};

/**
 * An emphasized note within a section: a left accent bar, not a filled
 * color block -- the system reserves solid fills for the accent-toned
 * primary action, so a callout distinguishes itself by rule weight instead.
 *
 * `note` is the default "pay attention to this" tone; success/warning/error
 * read as their names suggest and should be used sparingly and honestly (a
 * `warning` callout for something that is, in fact, a hard failure misleads
 * the reader).
 */
export function PolicyCallout({
  tone = "note",
  title,
  children,
}: {
  tone?: PolicyCalloutTone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("border-l-4 bg-mak-surface p-5", BORDER[tone])}>
      {title ? (
        <Heading level="subheading" as="h4" className={cn("mb-1.5", TITLE_COLOR[tone])}>
          {title}
        </Heading>
      ) : null}
      <Text size="small">{children}</Text>
    </div>
  );
}
