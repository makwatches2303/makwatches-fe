import Link from "next/link";

import { cn } from "@/lib/utils";
import { Container, InstagramIcon, Text } from "@/design-system";

import type { FooterColumn, SocialLink } from "@/lib/api/storefront";

/**
 * The site footer.
 *
 * Wordmark and a short positioning line on the left, then Social, then the
 * admin's link columns, with the 2px rule separating the legal strip beneath.
 *
 * Every string here is a prop with no default. Tagline, social links and the
 * link columns are all admin-managed: anything describing the house is a brand
 * claim and must come from real MAK copy, not a component fallback.
 *
 * A server component: nothing here is interactive.
 */

export interface FooterProps {
  /** One-line positioning statement, shown under the wordmark. */
  tagline?: string;
  /** Social destinations. Omitted entirely when not supplied. */
  social?: SocialLink[];
  /** Admin-configured link columns, already filtered and ordered. */
  columns?: FooterColumn[];
  className?: string;
}

/*
 * The lg grid template, by how many link columns sit beside the wordmark.
 * Written out because Tailwind scans source text statically, so an
 * interpolated repeat() count would never be emitted.
 */
const COLUMN_TEMPLATES: Record<number, string> = {
  1: "lg:grid-cols-[1.4fr_repeat(1,1fr)]",
  2: "lg:grid-cols-[1.4fr_repeat(2,1fr)]",
  3: "lg:grid-cols-[1.4fr_repeat(3,1fr)]",
  4: "lg:grid-cols-[1.4fr_repeat(4,1fr)]",
  5: "lg:grid-cols-[1.4fr_repeat(5,1fr)]",
  6: "lg:grid-cols-[1.4fr_repeat(6,1fr)]",
};

/**
 * The icon for a social destination, matched on the link's host rather than on
 * its label: an admin may title the link "Follow us" or "@makwatches.in", but
 * the host is the one part that actually identifies the platform. A destination
 * the icon set does not cover renders as its label alone rather than as a
 * stand-in glyph.
 */
function socialIconFor(href: string) {
  let host: string;
  try {
    host = new URL(href).hostname.toLowerCase();
  } catch {
    return null;
  }

  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    return InstagramIcon;
  }
  return null;
}

export function Footer({
  tagline,
  social = [],
  columns = [],
  className,
}: FooterProps) {
  const year = new Date().getFullYear();

  // Social is a column of its own, first of the link columns, so the template
  // has to count it.
  const linkColumns = columns.filter((column) => column.items.length > 0);
  const columnCount = linkColumns.length + (social.length > 0 ? 1 : 0);

  return (
    <footer className={cn("border-t-2 border-mak-line bg-mak-bg", className)}>
      <Container>
        <div
          className={cn(
            "grid gap-10 py-14 md:grid-cols-2 lg:gap-8",
            COLUMN_TEMPLATES[columnCount] ?? COLUMN_TEMPLATES[4]
          )}
        >
          <div>
            <Link
              href="/"
              className="inline-flex items-baseline gap-2 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
            >
              <span className="font-display text-2xl font-extrabold tracking-[-0.02em] text-mak-ink">
                MAK
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.42em] text-mak-accent">
                Watches
              </span>
            </Link>

            {tagline ? (
              <Text size="small" tone="muted" className="mt-4 max-w-[280px]">
                {tagline}
              </Text>
            ) : null}
          </div>

          {social.length > 0 ? (
            <nav aria-labelledby="footer-social">
              <h2
                id="footer-social"
                className="mb-4 font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-ink"
              >
                Social
              </h2>
              <ul className="flex flex-col gap-1">
                {social.map((item) => {
                  const Icon = socialIconFor(item.href);

                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-9 items-center gap-2 text-mak-small text-mak-muted no-underline transition-colors duration-200 ease-mak hover:text-mak-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
                      >
                        {/* Decorative: the label beside it is the accessible name. */}
                        {Icon ? <Icon size={16} /> : null}
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}

          {linkColumns.map((column) => {
            const items = column.items;

            return (
              <nav key={column.id} aria-labelledby={`footer-${column.id}`}>
                <h2
                  id={`footer-${column.id}`}
                  className="mb-4 font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-mak-ink"
                >
                  {column.heading}
                </h2>
                <ul className="flex flex-col gap-1">
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="flex min-h-9 items-center text-mak-small text-mak-muted no-underline transition-colors duration-200 ease-mak hover:text-mak-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>
      </Container>

      <div className="border-t-2 border-mak-line">
        <Container>
          {/* The legal strip carries the notice only; social lives in its
              own column above. */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-5 text-mak-label font-normal normal-case tracking-[0.04em] text-mak-muted">
            <span>© {year} MAK Watches. All rights reserved.</span>
          </div>
        </Container>
      </div>
    </footer>
  );
}
