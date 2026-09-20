"use client";

import { useEffect, useRef } from "react";

import { Button, ProductCardSkeleton, RuleGrid, Text } from "@/design-system";
import { useInfiniteCatalog } from "@/hooks/useInfiniteCatalog";
import type { CatalogQuery, Product } from "@/lib/api/types";
import type { CatalogRequest } from "@/lib/catalog-feed";

import { ProductGrid } from "./ProductGrid";

/**
 * A catalog listing that keeps loading as the shopper scrolls.
 *
 * One component for every listing that offers progressive loading -- /shop,
 * /men and /women differ only by the query handed in.
 *
 * The first batch arrives already rendered from the server, so this mounts
 * with a full grid and no request. What it adds is a sentinel below the grid:
 * when that comes within a screen of the viewport, the next batch is fetched,
 * so the grid usually grows before the shopper reaches the end of it.
 */

export interface ProductFeedProps {
  /** The server-rendered first batch. */
  initialProducts: Product[];
  /**
   * How to fetch the batch after the server-rendered one, or null when the
   * first response was the whole listing.
   */
  initialNext: CatalogRequest | null;
  /** The query the first batch was fetched with. */
  query: CatalogQuery;
  /** Prioritize images in the first row. */
  priorityCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  listName?: string;
}

/**
 * How far below the viewport the sentinel starts the next batch.
 *
 * Roughly a screen of scrolling at a typical batch height: far enough that the
 * batch is usually there before the shopper arrives, near enough that a
 * shopper who stops scrolling has not pulled down products they will never
 * look at.
 */
const PREFETCH_MARGIN = "800px";

export function ProductFeed({
  initialProducts,
  initialNext,
  query,
  priorityCount = 0,
  emptyTitle,
  emptyDescription,
  listName,
}: ProductFeedProps) {
  const { products, loading, error, hasMore, loadMore, retry } = useInfiniteCatalog({
    initialProducts,
    initialNext,
    query,
  });

  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore) return;

    // IntersectionObserver rather than a scroll handler: the browser reports
    // the crossing itself, off the main thread, instead of this page measuring
    // geometry on every frame of a scroll.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: `0px 0px ${PREFETCH_MARGIN} 0px` }
    );

    observer.observe(node);
    return () => observer.disconnect();
    // Re-observing when `loading` settles is what asks for the batch after
    // this one, in the case where the sentinel never left the viewport.
  }, [hasMore, loading, loadMore]);

  return (
    <>
      <ProductGrid
        products={products}
        priorityCount={priorityCount}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        listName={listName}
      />

      {/*
        The sentinel sits outside the grid so it cannot be mistaken for a cell
        and paint over the grid's own rule.
      */}
      <div ref={sentinel} aria-hidden="true" className="h-px w-full" />

      {/* A screen-reader announcement for a grid that grew without a click. */}
      <Text size="small" tone="muted" className="sr-only" aria-live="polite">
        {loading
          ? "Loading more pieces."
          : `${products.length} ${products.length === 1 ? "piece" : "pieces"} loaded.`}
      </Text>

      {loading ? (
        <RuleGrid
          cols={{ base: 2, sm: 2, md: 3, lg: 3, xl: 4 }}
          aria-hidden="true"
          className="mt-[2px] border-t-0"
        >
          {Array.from({ length: 4 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </RuleGrid>
      ) : null}

      {error ? (
        <div className="mt-10 flex flex-col items-center gap-3 border-2 border-mak-line p-6 text-center">
          {/*
            The grid above is untouched. A batch failing costs the shopper the
            next twenty-four pieces, not the two hundred they have already
            scrolled through.
          */}
          <Text size="small" tone="muted">
            {error}
          </Text>
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : null}

      {!hasMore && !error && products.length > 0 ? (
        <Text size="small" tone="muted" className="mt-10 text-center">
          That is every piece in this selection.
        </Text>
      ) : null}
    </>
  );
}
