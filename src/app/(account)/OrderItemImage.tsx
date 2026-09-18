"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/commerce";
import { getProductById } from "@/lib/api/catalog";
import { resolveProductThumbnail } from "@/lib/media";

/**
 * The product thumbnail on a customer's order line.
 *
 * ## Why this is not just an <img src={line.image}>
 *
 * An order stores a *snapshot* of the image URL taken at checkout. Storage
 * object names are timestamp-prefixed, so re-uploading a product's media mints
 * a new object name and orphans the URL every earlier order is holding. Orders
 * placed before a re-upload therefore point at objects that no longer exist,
 * and older records may carry no image at all.
 *
 * So there are two sources, tried in order:
 *
 *   1. **The snapshot**, resolved through the same media layer the rest of the
 *      storefront uses -- which already normalises legacy shapes (`gs://`,
 *      `/uploads/...`, bare object keys) onto the bucket.
 *   2. **The live product**, looked up by the order line's own `productId`,
 *      but only once the snapshot is known to be missing or broken.
 *
 * The fallback is exact, never approximate: it is keyed on the id the order
 * itself recorded, so a line can only ever show its own product. Nothing is
 * matched by name, and no image is substituted from another product.
 *
 * The lookup is lazy on purpose. Orders whose snapshot still resolves -- which
 * is all of them once media stops being re-uploaded -- cost no extra request.
 */

export interface OrderItemImageProps {
  /** The URL snapshotted onto the order line. May be empty, legacy or dead. */
  image?: string;
  /** The product this line refers to. Used only if the snapshot fails. */
  productId: string;
  /** Product name, for alt text. */
  productName: string;
  className?: string;
  sizes?: string;
}

export function OrderItemImage({
  image,
  productId,
  productName,
  className,
  sizes = "96px",
}: OrderItemImageProps) {
  // The snapshot is the starting point; null means "nothing usable yet".
  const [src, setSrc] = useState<string | null>(image?.trim() || null);
  // True once the live product has been consulted, so a product with no image
  // of its own does not send the same request on every re-render.
  const [resolvedLive, setResolvedLive] = useState(false);

  useEffect(() => {
    if (src || resolvedLive || !productId) return;

    let active = true;
    getProductById(productId)
      .then((product) => {
        if (!active) return;
        setResolvedLive(true);
        // resolveProductImage prefers the structured media array and falls back
        // to the legacy fields, exactly as the catalogue does elsewhere.
        const live = product ? resolveProductThumbnail(product) : null;
        if (live?.url) setSrc(live.url);
      })
      .catch(() => {
        // A failed lookup just means the placeholder stands. An order line must
        // still render its name, price and quantity.
        if (active) setResolvedLive(true);
      });

    return () => {
      active = false;
    };
  }, [src, resolvedLive, productId]);

  return (
    <div className={cn("shrink-0 border-[1.5px] border-mak-divider", className)}>
      <ProductImage
        media={src}
        alt={productName}
        sizes={sizes}
        // Contained: an order record should show the whole watch, not a crop of
        // it, and the frame's white ground matches the product photography.
        fit="contain"
        /*
          A dead snapshot URL surfaces here. ProductImage already swaps in the
          branded placeholder on error; clearing `src` additionally lets the
          effect above try the live product, so an order from before a
          re-upload recovers its real image rather than settling for the
          placeholder.
        */
        onError={() => setSrc(null)}
      />
    </div>
  );
}
