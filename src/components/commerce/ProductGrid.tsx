import { cn } from "@/lib/utils";
import { EmptyState, ProductCardSkeleton, RuleGrid, type RuleGridProps } from "@/design-system";
import type { Product } from "@/lib/api/types";

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
  className?: string;
}

export function ProductGrid({
  products,
  cols = { base: 2, sm: 2, md: 3, lg: 3, xl: 4 },
  loading = false,
  skeletonCount = 8,
  emptyTitle = "Nothing matches yet.",
  emptyDescription,
  emptyAction,
  priorityCount = 0,
  showActions = true,
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

  return (
    <RuleGrid cols={cols} className={cn(className)}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < priorityCount}
          showActions={showActions}
        />
      ))}
    </RuleGrid>
  );
}
