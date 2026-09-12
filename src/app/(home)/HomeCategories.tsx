import { Container, Section, SectionHeader } from "@/design-system";
import { CategoryTiles, type CategoryTile } from "@/components/marketing";
import { toMediaRef } from "@/lib/media";
import type { Category } from "@/lib/api/types";
import type { CategoryTilesContent } from "@/lib/api/storefront";
import { resolveCategoryTiles } from "@/lib/category-tiles";

/**
 * "Shop by category".
 *
 * Which tiles appear, in what order, with what label and image, is
 * admin-configured — see the storefront document's categoryTiles. The default
 * derives one tile per subcategory from the live tree, so a fresh install shows
 * the whole catalogue without curation.
 *
 * A tile stores a reference into the category tree, never a copy and never a
 * product id. A reference that no longer resolves is omitted rather than
 * rendered broken or silently swapped for a different category.
 *
 * A server component.
 */

export interface HomeCategoriesProps {
  content: CategoryTilesContent;
  /** The live category tree, which references resolve against. */
  categories: Category[];
  /** Product totals keyed by top-level category name. */
  counts?: Record<string, number>;
  /** Stand-in images for subcategories the admin has not given one, keyed by
   * categoryImageKey. */
  fallbackImages?: Record<string, string>;
}

export function HomeCategories({
  content,
  categories,
  counts = {},
  fallbackImages = {},
}: HomeCategoriesProps) {
  const { tiles: resolved, warnings } = resolveCategoryTiles(
    content,
    categories,
    fallbackImages
  );

  // Broken references are a merchandising problem, not a rendering one: the
  // tile is already omitted, and this makes it findable in the server log
  // rather than only in the admin's warnings list.
  if (warnings.length > 0) {
    console.warn(
      `[storefront] ${warnings.length} category tile(s) could not be resolved: ` +
        warnings.map((w) => `${w.tileId} (${w.message})`).join(", ")
    );
  }

  if (!content.enabled || resolved.length === 0) return null;

  const tiles: CategoryTile[] = resolved.map((tile) => ({
    label: tile.label,
    href: tile.href,
    image: toMediaRef(tile.image, tile.label),
  }));

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <Section id="categories" spacing="default">
      <Container>
        <SectionHeader
          eyebrow={content.eyebrow}
          title={content.title}
          aside={
            total > 0
              ? `${total.toLocaleString("en-IN")} pieces across ${categories.length} houses`
              : undefined
          }
          className="mb-9"
        />
        <CategoryTiles tiles={tiles} />
      </Container>
    </Section>
  );
}
