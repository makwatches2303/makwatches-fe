import type { Product } from "@/lib/api/types";

/**
 * A product's canonical URL.
 *
 * Prefers the slug route, which only exists for records that have been
 * through the additive slug backfill. Records without one keep resolving by
 * id, so an unmigrated catalog still links correctly.
 *
 * Deliberately its own plain module, not exported from a "use client"
 * component file: React Server Components can import and call a function
 * from a client-boundary file, but a client-boundary export is a component
 * reference, not a callable value, from the server's side -- calling it as
 * a plain function there throws. This lives outside any "use client" file
 * so both server and client code can call it directly.
 */
export function productHref(product: Pick<Product, "id" | "slug">): string {
  return product.slug ? `/product/${product.slug}` : `/product/id/${product.id}`;
}
