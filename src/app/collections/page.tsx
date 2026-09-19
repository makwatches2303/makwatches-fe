import type { Metadata } from "next";

import {
  Container,
  EmptyState,
  Eyebrow,
  Heading,
  Section,
  Text,
} from "@/design-system";
import { CategoryShowcase } from "@/components/marketing";
import { fetchCategories, fetchStorefront, isApiConfigured } from "@/lib/api/server";
import { resolveCategoryFrontDoors } from "@/lib/category-front-doors";

/**
 * Shop by Category.
 *
 * What this replaced: a flat list of text rows, one per subcategory, derived by
 * falling back from an editorial "collections" grouping no product carries. It
 * read as a sitemap -- eleven equally-weighted links named after strap
 * materials ("Metal Watch", "Leather Watch", "Silver Watch"). A shopper
 * arriving at a watch retailer wants a handful of real front doors, each with a
 * photograph behind it.
 *
 * ## Nothing here is invented
 *
 * The five front doors come from @/lib/category-front-doors, shared with the
 * homepage band so the two cannot drift. They are a *display order*, not a
 * content system: each names a category and is resolved against the live tree
 * from GET /categories at render time:
 *
 *   - a name that resolves gets its real route, its real product count, and a
 *     real photograph (the admin's own subcategory image where one is set,
 *     otherwise borrowed from the newest in-stock product in that scope);
 *   - a name that does not resolve renders as an inert "coming soon" panel with
 *     no href at all -- never a link to a page that would 404, and never one
 *     quietly pointed somewhere unrelated.
 *
 * No product ids, no invented slugs, no second category store. Rename a
 * category in the admin and the card follows it; create the missing one and its
 * card becomes a link with no code change.
 *
 * ## What the catalogue actually has today
 *
 * Men and Women are top-level categories. "Wall Clock" and "Smart Watch" are
 * subcategories existing under *both* parents, so they route to the unscoped
 * /category/<slug>, which spans both -- the parent-scoped form would hide half
 * the stock. There is no Kids category at any level, which is why that card
 * renders inert rather than linked.
 *
 * A server component.
 */

export const metadata: Metadata = {
  title: "Shop by Category",
  description:
    "Browse MAK Watches by category - watches for men and women, smart watches and wall clocks, with the full catalogue behind every card.",
  alternates: { canonical: "/collections" },
};

export const revalidate = 0;

export default async function CollectionsPage() {
  if (!isApiConfigured()) {
    return (
      <div className="mak bg-mak-bg">
        <Section spacing="loose">
          <Container>
            <EmptyState
              title="The storefront is not configured."
              description="NEXT_PUBLIC_API_BASE_URL is not set, so categories cannot be reached."
            />
          </Container>
        </Section>
      </div>
    );
  }

  // Admin-managed header (Storefront -> Page headings), falling back to the
  // shipped copy per field so this page is never headless.
  const { listings } = await fetchStorefront();
  const header = listings.categories;

  const categories = await fetchCategories();
  // The same five front doors the homepage band shows, resolved the same way.
  // See @/lib/category-front-doors -- defined once so the two cannot drift.
  const showcase = await resolveCategoryFrontDoors(categories);

  return (
    <div className="mak bg-mak-bg">
      {/* Introduction */}
      <Section tone="ink" spacing="default" className="border-b-2 border-mak-line">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow withRule tone="accent" className="mb-5">
              {header.eyebrow}
            </Eyebrow>
            <Heading level="display" as="h1" tone="inverse">
              {header.title}
            </Heading>
            {header.description ? (
              <Text size="lead" tone="inverse" className="mt-5 max-w-xl opacity-80">
                {header.description}
              </Text>
            ) : null}
          </div>
        </Container>
      </Section>

      {/* The shelf */}
      <Section spacing="default">
        <Container>
          <CategoryShowcase categories={showcase} />
        </Container>
      </Section>
    </div>
  );
}
