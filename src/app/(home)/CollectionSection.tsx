"use client";

import { useMemo, useState } from "react";

import {
  ArrowRightIcon,
  Button,
  ButtonLink,
  Container,
  EmptyState,
  Section,
  SectionHeader,
} from "@/design-system";
import {
  CategoryChips,
  ProductGrid,
  SortSelect,
  type ChipOption,
  type SortValue,
} from "@/components/commerce";
import type { Product } from "@/lib/api/types";

/**
 * The collection band: category chips, a sort control, and the 4-up product
 * grid — the reference's central shopping section.
 *
 * Filtering and sorting run client-side over a fixed set of products handed
 * down by the server. That is deliberate for the homepage: this is a curated
 * preview, not the shop. Refetching on every chip click would trade a snappy
 * interaction for a network round trip, and "view all" leads to /shop where
 * server-side filtering belongs.
 */

export interface CollectionSectionProps {
  eyebrow: string;
  title: string;
  /** The pool this section filters within. */
  products: Product[];
  /** True when the request failed, as distinct from returning nothing. */
  failed?: boolean;
  /** Total in the catalog, shown beside the heading. */
  total?: number;
  viewAll?: { label: string; href: string };
  /** Prioritize images in the first row. */
  priorityCount?: number;
}

/** The chip label a product belongs under. */
function facetOf(product: Product): string {
  return (
    product.collection?.trim() ||
    product.subcategory?.trim() ||
    product.category?.trim() ||
    "Other"
  );
}

export function CollectionSection({
  eyebrow,
  title,
  products,
  failed = false,
  total,
  viewAll,
  priorityCount = 0,
}: CollectionSectionProps) {
  const [facet, setFacet] = useState("all");
  const [sort, setSort] = useState<SortValue>("featured");

  // Chips are derived from the products actually present, so a chip never
  // leads to an empty grid.
  const chips: ChipOption[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const key = facetOf(product);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [
      { value: "all", label: "All", count: products.length },
      ...Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ value: label, label, count })),
    ];
  }, [products]);

  const visible = useMemo(() => {
    const filtered =
      facet === "all" ? products : products.filter((p) => facetOf(p) === facet);

    const sorted = [...filtered];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );
        break;
      case "featured":
      default:
        // Server order is the curated order; leave it alone.
        break;
    }
    return sorted;
  }, [products, facet, sort]);

  if (!failed && products.length === 0) return null;

  return (
    <Section id="collection" spacing="none" className="pb-16 md:pb-24">
      <Container>
        {/* The reference opens this section with a 2px rule above the heading. */}
        <div className="border-t-2 border-mak-line pt-9">
          <SectionHeader
            eyebrow={eyebrow}
            title={title}
            ruled={false}
            aside={
              <div className="flex items-center gap-4">
                {typeof total === "number" && total > 0 ? (
                  <span className="whitespace-nowrap">
                    {total.toLocaleString("en-IN")} pieces
                  </span>
                ) : null}
                <SortSelect value={sort} onChange={setSort} />
              </div>
            }
            className="mb-7"
          />

          {chips.length > 2 ? (
            <CategoryChips
              options={chips}
              value={facet}
              onChange={setFacet}
              label="Filter the collection"
              className="mb-8"
            />
          ) : null}

          {visible.length === 0 ? (
            <EmptyState
              title="Nothing matches yet."
              action={
                <Button variant="primary" onClick={() => setFacet("all")}>
                  Reset filters
                </Button>
              }
            />
          ) : (
            /*
              Two columns on a phone, four from tablet up: the rail carries
              eight pieces, so the band reads as four rows of two or two rows
              of four, and every column count divides eight.

              completeRowsOnly is what keeps that true once the chips filter
              the pool. A facet that matches five pieces would otherwise end
              on a row with a hole in it; instead the odd one out steps aside
              at the widths where it cannot fill a row. This is a curated
              preview with the whole catalogue a button away, so a piece held
              back here is still one click from view.
            */
            <ProductGrid
              products={visible}
              cols={{ base: 2, sm: 2, md: 4, lg: 4, xl: 4 }}
              completeRowsOnly
              priorityCount={priorityCount}
            />
          )}

          {viewAll ? (
            <div className="mt-10 flex justify-center">
              <ButtonLink
                href={viewAll.href}
                variant="secondary"
                size="lg"
                iconRight={<ArrowRightIcon size={16} />}
              >
                {viewAll.label}
              </ButtonLink>
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
