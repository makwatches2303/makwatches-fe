"use client";

import { useEffect } from "react";
import type { Product } from "@/lib/api/types";
import { trackViewItemList } from "@/lib/analytics";

export function ItemListTracker({
  products,
  listName = "Product Grid",
}: {
  products: Product[];
  listName?: string;
}) {
  useEffect(() => {
    if (products && products.length > 0) {
      trackViewItemList(listName, products.slice(0, 24));
    }
  }, [products, listName]);

  return null;
}
