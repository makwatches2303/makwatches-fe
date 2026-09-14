import { Container, Section, SectionHeader } from "@/design-system";
import { CategoryShowcase } from "@/components/marketing";
import { resolveCategoryFrontDoors } from "@/lib/category-front-doors";
import type { Category } from "@/lib/api/types";

/**
 * "Shop by category" on the homepage.
 *
 * ## What changed, and why the copy is no longer admin-managed
 *
 * This band used to derive one tile per *subcategory* from the live tree, so
 * the homepage opened on "Metal watch / Leather watch / Silver watch" — a
 * shopper's first decision framed as a choice of strap material. It now shows
 * the same five front doors as /collections (Men, Women, Kids, Wall Clocks,
 * Smart Watches), resolved the same way, from the same module. Sharing that
 * definition is the point: the two surfaces cannot drift apart.
 *
 * With the tile *selection* no longer coming from `storefront.categoryTiles`,
 * its `title`, `eyebrow` and `autoFromCategories` fields no longer describe
 * what renders here, so the heading is set in code rather than read from a
 * field that now means something else. `enabled` is still honoured — turning
 * the section off from the admin still works, which is the part of that config
 * that still applies.
 *
 * A server component, and an async one: it resolves the five doors against the
 * live tree itself rather than making the page assemble them.
 */

export interface HomeCategoriesProps {
  /** The live category tree the front doors resolve against. */
  categories: Category[];
  /** Product totals keyed by top-level category name, for the aside. */
  counts?: Record<string, number>;
  /** The admin's section toggle, from storefront.categoryTiles.enabled. */
  enabled?: boolean;
}

export async function HomeCategories({
  categories,
  counts = {},
  enabled = true,
}: HomeCategoriesProps) {
  if (!enabled) return null;

  const showcase = await resolveCategoryFrontDoors(categories);
  if (showcase.length === 0) return null;

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <Section id="categories" spacing="default">
      <Container>
        <SectionHeader
          eyebrow="Shop by category"
          title="Category"
          aside={
            total > 0
              ? `${total.toLocaleString("en-IN")} pieces across ${categories.length} houses`
              : undefined
          }
          className="mb-9"
        />
        <CategoryShowcase categories={showcase} />
      </Container>
    </Section>
  );
}
