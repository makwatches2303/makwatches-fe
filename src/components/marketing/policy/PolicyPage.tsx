import { Container, Section, Divider } from "@/design-system";
import { PolicyHero } from "./PolicyHero";
import type { ReactNode } from "react";

/**
 * The shared shell every policy/info page (privacy, terms, shipping,
 * refund, ...) renders through: dark hero, then a narrow reading column of
 * numbered PolicySections passed in as children.
 *
 * This is the single place that owns the page-level layout, so a change to
 * how these pages open or close (spacing, the closing rule) is one edit, not
 * one edit repeated across every policy page.
 */
export function PolicyPage({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="mak">
      <PolicyHero eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <Section spacing="loose">
        <Container size="narrow">{children}</Container>
      </Section>
      <Divider />
    </div>
  );
}
