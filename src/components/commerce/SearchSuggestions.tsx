"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { Price, Text } from "@/design-system";
import type { SearchResult } from "@/lib/api/types";
import { resolveProductImage, IMAGE_SIZES } from "@/lib/media";
import { effectivePrice } from "@/lib/pricing";

import { ProductImage } from "./ProductImage";
import { productHref } from "./ProductCard";

/**
 * Search results, grouped by kind: products, collections, categories.
 *
 * Three states are handled explicitly, because a search panel spends most of
 * its life in one of them: nothing typed yet (recent searches), typed with no
 * matches (a way out, not a dead end), and results.
 */

export interface SearchSuggestionsProps {
  result: SearchResult;
  /** Recent queries, shown before the shopper types anything. */
  recentSearches?: string[];
  onSelectRecent?: (query: string) => void;
  /** Called when a result is followed, so the overlay can close itself. */
  onNavigate?: () => void;
  className?: string;
}

export function SearchSuggestions({
  result,
  recentSearches = [],
  onSelectRecent,
  onNavigate,
  className,
}: SearchSuggestionsProps) {
  const hasQuery = result.query.trim().length > 0;
  const hasResults =
    result.products.length > 0 ||
    result.collections.length > 0 ||
    result.categories.length > 0;

  // Nothing typed yet: offer recent searches rather than an empty panel.
  if (!hasQuery) {
    if (recentSearches.length === 0) return null;

    return (
      <div className={cn("py-6", className)}>
        <Text size="label" tone="subtle" className="mb-3">
          Recent searches
        </Text>
        <ul className="flex flex-wrap gap-2">
          {recentSearches.map((query) => (
            <li key={query}>
              <button
                type="button"
                onClick={() => onSelectRecent?.(query)}
                className="inline-flex min-h-11 items-center border-2 border-mak-divider px-4 text-mak-small text-mak-ink transition-colors hover:border-mak-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
              >
                {query}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className={cn("py-10 text-center", className)} role="status">
        <p className="font-display text-mak-heading font-extrabold text-mak-ink">
          No matches for &ldquo;{result.query}&rdquo;.
        </p>
        <Text size="small" tone="muted" className="mt-2">
          Try a shorter term, or browse the full collection.
        </Text>
        <Link
          href="/shop"
          onClick={onNavigate}
          className="mt-4 inline-block font-display text-mak-small font-extrabold tracking-[0.04em] text-mak-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
        >
          Browse everything
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("py-4", className)}>
      {/* Result count is announced but not shown; the panel itself is visual. */}
      <p className="sr-only" role="status" aria-live="polite">
        {result.total} {result.total === 1 ? "result" : "results"} for {result.query}
      </p>

      {result.products.length > 0 && (
        <section className="mb-6">
          <Text size="label" tone="subtle" className="mb-3">
            Products
          </Text>
          <ul className="flex flex-col">
            {result.products.slice(0, 6).map((product) => (
              <li key={product.id}>
                <Link
                  href={productHref(product)}
                  onClick={onNavigate}
                  className="flex items-center gap-4 border-b-[1.5px] border-mak-divider py-3 transition-colors hover:bg-mak-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mak-accent"
                >
                  <span className="size-14 shrink-0 border-[1.5px] border-mak-divider">
                    <ProductImage
                      media={resolveProductImage(product)}
                      alt=""
                      sizes={IMAGE_SIZES.thumbnail}
                      grayscale={false}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-mak-small font-extrabold text-mak-ink">
                      {product.name}
                    </span>
                    {product.collection || product.category ? (
                      <span className="block truncate text-mak-micro uppercase tracking-[0.12em] text-mak-subtle">
                        {product.collection || product.category}
                      </span>
                    ) : null}
                  </span>
                  <Price value={effectivePrice(product).price} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.collections.length > 0 && (
        <section className="mb-6">
          <Text size="label" tone="subtle" className="mb-3">
            Collections
          </Text>
          <ul className="flex flex-wrap gap-2">
            {result.collections.map((collection) => (
              <li key={collection.slug}>
                <Link
                  href={`/collections/${collection.slug}`}
                  onClick={onNavigate}
                  className="inline-flex min-h-11 items-center gap-2 border-2 border-mak-divider px-4 text-mak-small text-mak-ink transition-colors hover:border-mak-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
                >
                  {collection.name}
                  <span className="text-mak-micro text-mak-subtle">
                    {collection.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.categories.length > 0 && (
        <section>
          <Text size="label" tone="subtle" className="mb-3">
            Categories
          </Text>
          <ul className="flex flex-wrap gap-2">
            {result.categories.map((category) => (
              <li key={category}>
                <Link
                  href={`/shop?category=${encodeURIComponent(category)}`}
                  onClick={onNavigate}
                  className="inline-flex min-h-11 items-center border-2 border-mak-divider px-4 text-mak-small text-mak-ink transition-colors hover:border-mak-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
                >
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
