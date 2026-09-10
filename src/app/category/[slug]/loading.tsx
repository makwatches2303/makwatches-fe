import { ProductGrid } from "@/components/commerce";

export default function Loading() {
  return <ProductGrid products={[]} loading skeletonCount={12} />;
}
