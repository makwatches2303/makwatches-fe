import { Heading, Reveal } from "@/design-system";
import type { ReactNode } from "react";

/**
 * One numbered clause of a policy document -- Section 1, Section 2, etc.
 *
 * The numbering is real here, not decoration: this is a legal document with
 * actual clause numbers a reader or support agent might reference ("see
 * section 4"), unlike a marketing page's invented 01/02/03 steps.
 */
export function PolicySection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <Reveal as="section" className="mb-14 md:mb-18">
      <div className="mb-6 flex items-baseline gap-4 border-b-2 border-mak-line pb-4">
        <span className="font-display text-mak-title font-extrabold leading-none text-mak-accent">
          {String(number).padStart(2, "0")}
        </span>
        <Heading level="heading" as="h2">
          {title}
        </Heading>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </Reveal>
  );
}
