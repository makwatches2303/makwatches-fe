import type { Metadata } from "next";
import Link from "next/link";

import {
  ButtonLink,
  Container,
  EmptyState,
  Eyebrow,
  Heading,
  Section,
  Text,
} from "@/design-system";
import { ProductGrid } from "@/components/commerce";
import { fetchCollections, fetchProducts, isApiConfigured } from "@/lib/api/server";
import { SearchTracker } from "@/components/analytics/SearchTracker";

/**
 * Search results.
 *
 * A real, shareable URL for a query — the header overlay is the fast path, this
 * is where a search actually lands. Rendered on the server so results are in
 * the HTML and the page can be linked to.
 *
 * Not indexed: search-result pages are thin, near-duplicate content and are a
 * classic source of index bloat. Links are still followed so the products
 * themselves get crawled.
 */

export const revalidate = 0;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  return {
    title: query ? `Search: ${query}` : "Search",
    description: query
      ? `MAK Watches pieces matching “${query}”.`
      : "Search the MAK Watches collection.",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  if (!isApiConfigured()) {
    return (
      <div className="mak bg-mak-bg">
        <Section spacing="loose">
          <Container>
            <EmptyState
              title="Search is unavailable."
              description="The storefront is not configured to reach the catalog."
            />
          </Container>
        </Section>
      </div>
    );
  }

  // An empty query does no work: there is nothing to search for, and firing a
  // request would return the whole catalogue under a "results" heading.
  if (!query) {
    return (
      <div className="mak bg-mak-bg">
        <Section spacing="default">
          <Container>
            <Eyebrow withRule className="mb-4">
              Search
            </Eyebrow>
            <Heading level="display" as="h1" className="mb-8">
              What are you looking for?
            </Heading>
            <EmptyState
              title="Start with a name, a brand or a category."
              description="Try “leather”, “Titan”, or “gold”."
              action={
                <ButtonLink href="/shop" variant="primary" size="lg">
                  Browse everything
                </ButtonLink>
              }
            />
          </Container>
        </Section>
      </div>
    );
  }

  const [page, collections] = await Promise.all([
    fetchProducts({ q: query, limit: 24 }, `search(${query})`),
    fetchCollections(),
  ]);

  const total = page.meta?.total ?? page.items.length;
  const matchingCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mak bg-mak-bg">
      <SearchTracker query={query} total={total} />
      <Section spacing="tight" className="border-b-2 border-mak-line">
        <Container>
          <Eyebrow withRule className="mb-4">
            Search
          </Eyebrow>
          <Heading level="display" as="h1" className="break-words">
            &ldquo;{query}&rdquo;
          </Heading>
          <Text size="lead" tone="muted" className="mt-4" aria-live="polite">
            {page.failed
              ? "Results are unavailable right now."
              : `${total.toLocaleString("en-IN")} ${total === 1 ? "match" : "matches"}`}
          </Text>
        </Container>
      </Section>

      <Section spacing="default">
        <Container>
          {matchingCollections.length > 0 ? (
            <div className="mb-10">
              <Text size="label" tone="subtle" className="mb-3">
                Collections
              </Text>
              <ul className="flex flex-wrap gap-2">
                {matchingCollections.map((collection) => (
                  <li key={collection.slug}>
                    <Link
                      href={`/collections/${collection.slug}`}
                      className="inline-flex min-h-11 items-center gap-2 border-2 border-mak-divider px-4 text-mak-small text-mak-ink no-underline transition-colors hover:border-mak-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
                    >
                      {collection.name}
                      <span className="text-mak-micro text-mak-subtle">
                        {collection.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <ProductGrid
            products={page.items}
            priorityCount={4}
            emptyTitle={`No matches for “${query}”.`}
            emptyDescription="Try a shorter term, or browse the full collection."
            emptyAction={
              <ButtonLink href="/shop" variant="primary" size="lg">
                Browse everything
              </ButtonLink>
            }
          />
        </Container>
      </Section>
    </div>
  );
}
