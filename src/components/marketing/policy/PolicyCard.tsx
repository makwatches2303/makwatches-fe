import { Heading, Text } from "@/design-system";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** A plain bordered box for one point within a section -- the default unit. */
export function PolicyCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-2 border-mak-line p-5", className)}>
      {title ? (
        <Heading level="subheading" as="h3" className="mb-1.5">
          {title}
        </Heading>
      ) : null}
      <Text size="small" tone="muted">
        {children}
      </Text>
    </div>
  );
}
