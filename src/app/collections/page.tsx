import type { Metadata } from "next";
import Link from "next/link";

import {
  Container,
  EmptyState,
  Eyebrow,
  Heading,
  RuleGrid,
  Section,
  Text,
} from "@/design-system";
import { fetchCategories, fetchCollections } from "@/lib/api/server";

/**
 * The collections index.
 *
 * Collections are an editorial grouping the catalog does not yet populate --
 * /api/v1/collections derives them from a `collection` field no product
 * carries. Rather than render an empty page, this falls back to the real
 * category tree, which is the closest true grouping that exists, and says so.
 */

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse MAK Watches by collection.",
  alternates: { canonical: "/collections" },
};

export const revalidate = 300;

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function CollectionsPage() {
  const [collections, categories] = await Promise.all([
    fetchCollections(),
    fetchCategories(),
  ]);

  const hasCollections = collections.length > 0;

  const entries = hasCollections
    ? collections.map((c) => ({
        name: c.name,
        href: `/collections/${c.slug}`,
        count: c.count,
      }))
    : categories.flatMap((category) =>
        (category.subcategories ?? []).map((sub) => ({
          name: titleCase(sub.name),
          href: `/category/${slugify(sub.name)}?mainCategory=${encodeURIComponent(category.name)}`,
          count: undefined as number | undefined,
        }))
      );

  return (
    <div className="mak bg-mak-bg">
      <Section spacing="tight" className="border-b-2 border-mak-line">
        <Container>
          <Eyebrow withRule className="mb-4">
            {hasCollections ? "Collections" : "Browse by category"}
          </Eyebrow>
          <Heading level="display" as="h1">
            {hasCollections ? "The collections." : "Every category."}
          </Heading>
          {!hasCollections ? (
            <Text size="lead" tone="muted" className="mt-4 max-w-2xl">
              Editorial collections are not set up yet, so this lists the
              catalogue&rsquo;s categories instead.
            </Text>
          ) : null}
        </Container>
      </Section>

      <Section spacing="default">
        <Container>
          {entries.length === 0 ? (
            <EmptyState
              title="Nothing to browse yet."
              description="Once products are grouped into collections they will appear here."
            />
          ) : (
            <RuleGrid cols={{ base: 1, md: 2, lg: 3 }}>
              {entries.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="group flex min-h-32 flex-col justify-between p-7 no-underline transition-colors hover:bg-mak-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mak-accent"
                >
                  <span className="font-display text-mak-title font-extrabold tracking-[-0.025em] text-mak-ink group-hover:text-mak-accent">
                    {entry.name}
                  </span>
                  {typeof entry.count === "number" ? (
                    <span className="mt-3 text-mak-label uppercase tracking-[0.14em] text-mak-muted">
                      {entry.count} {entry.count === 1 ? "piece" : "pieces"}
                    </span>
                  ) : null}
                </Link>
              ))}
            </RuleGrid>
          )}
        </Container>
      </Section>
    </div>
  );
}
