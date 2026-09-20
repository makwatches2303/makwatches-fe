import { cn } from "@/lib/utils";
import { EmptyState, ProductCardSkeleton, RuleGrid, type RuleGridProps } from "@/design-system";
import type { Product } from "@/lib/api/types";
import { ItemListTracker } from "@/components/analytics/ItemListTracker";

import { ProductCard } from "./ProductCard";

/**
 * A grid of product tiles on the system's hairline rule.
 *
 * Density follows the approved responsive strategy: 2-up mobile, 3-up tablet,
 * 4-up desktop. The 2px gap between cells is the rule; see RuleGrid.
 *
 * A server component -- ProductCard carries its own client boundary, so a grid
 * of them still renders on the server.
 */

export interface ProductGridProps {
  products: Product[];
  /** Grid column configuration across breakpoints. */
  cols?: RuleGridProps["cols"];
  /**
   * Show only rows that are completely filled with products.
   *
   * A curated band -- the homepage collection, say -- should read as a block,
   * not as a block with a gap bitten out of its corner. With this set, the
   * products that would form a partial last row are hidden at the breakpoints
   * where that row is short, so the grid ends on a full row at every width.
   * `cols` must name at least `base`; see partialRowClasses.
   *
   * Never use it on a listing whose job is to show the whole catalogue: it
   * hides real products from the page.
   */
  completeRowsOnly?: boolean;
  /** Render skeletons instead of products. */
  loading?: boolean;
  /** How many skeletons to show while loading. */
  skeletonCount?: number;
  /** Shown when there are no products and we are not loading. */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  /** Prioritize images in the first row. Use on the first grid of a page only. */
  priorityCount?: number;
  showActions?: boolean;
  listName?: string;
  className?: string;
}

/**
 * Which products sit in a partial last row, and where to hide them.
 *
 * Returns one class per product index. A product in a row that the grid cannot
 * fill is hidden at exactly the breakpoints where that row is short, and shown
 * again at the ones where it is not -- eight products are three full rows at
 * 2-up but only one full row at 4-up, so the last four are hidden from `md`
 * while staying on the page at phone width.
 *
 * `flex` is what restores a card, not `block`: every child here is a
 * ProductCard, whose root is a flex column, so that is the display being
 * turned back on.
 *
 * A last row that is short only because there are fewer products than columns
 * is kept. Hiding it would empty the grid, and one short row is all there is.
 */
function partialRowClasses(
  count: number,
  cols: RuleGridProps["cols"]
): (string | undefined)[] | null {
  // Literal class names: Tailwind scans source text statically.
  type Step = { columns: number | undefined; show: string; hide: string };
  const declared: Step[] = [
    { columns: cols?.base, show: "flex", hide: "hidden" },
    { columns: cols?.sm, show: "sm:flex", hide: "sm:hidden" },
    { columns: cols?.md, show: "md:flex", hide: "md:hidden" },
    { columns: cols?.lg, show: "lg:flex", hide: "lg:hidden" },
    { columns: cols?.xl, show: "xl:flex", hide: "xl:hidden" },
  ];
  const steps = declared.filter(
    (step): step is Step & { columns: number } =>
      typeof step.columns === "number"
  );

  // Without a base column count the grid falls back to RuleGrid's own default,
  // which this function cannot see. Rather than trim against the wrong number,
  // leave the grid to its filler cells.
  if (typeof cols?.base !== "number" || steps.length === 0) return null;

  // Index of the first product to hide, per breakpoint.
  const firstHidden = steps.map(({ columns }) =>
    count < columns ? count : count - (count % columns)
  );

  return Array.from({ length: count }, (_, index) => {
    // One display class per breakpoint at most, emitted only where this
    // product's visibility actually changes.
    const classes: string[] = [];
    let visible: boolean | null = null;

    steps.forEach((step, i) => {
      const shown = index < firstHidden[i];
      // A product visible from the start needs no class: the card is already
      // a flex column.
      if (shown !== visible && !(visible === null && shown)) {
        classes.push(shown ? step.show : step.hide);
      }
      visible = shown;
    });

    return classes.length > 0 ? classes.join(" ") : undefined;
  });
}

export function ProductGrid({
  products,
  cols = { base: 2, sm: 2, md: 3, lg: 3, xl: 4 },
  completeRowsOnly = false,
  loading = false,
  skeletonCount = 8,
  emptyTitle = "Nothing matches yet.",
  emptyDescription,
  emptyAction,
  priorityCount = 0,
  showActions = true,
  listName,
  className,
}: ProductGridProps) {
  if (loading) {
    return (
      <RuleGrid
        cols={cols}
        aria-busy="true"
        aria-label="Loading products"
        className={className}
      >
        {Array.from({ length: skeletonCount }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </RuleGrid>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }

  const trim = completeRowsOnly ? partialRowClasses(products.length, cols) : null;

  return (
    <>
      <ItemListTracker products={products} listName={listName} />
      <RuleGrid cols={cols} fill={trim === null} className={cn(className)}>
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < priorityCount}
            showActions={showActions}
            className={trim?.[index]}
          />
        ))}
      </RuleGrid>
    </>
  );
}
