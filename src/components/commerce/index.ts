/**
 * Commerce components.
 *
 * These know about products, carts and wishlists; the design-system primitives
 * they are built from do not. Nothing here embeds product data -- every
 * component takes typed props or reads a store.
 */

export { ProductCard, productHref, type ProductCardProps } from "./ProductCard";
export { ProductImage, type ProductImageProps } from "./ProductImage";
export { ProductGrid, type ProductGridProps } from "./ProductGrid";
export { ProductGallery, type ProductGalleryProps } from "./ProductGallery";
export { WishlistButton, type WishlistButtonProps } from "./WishlistButton";
export { AddToBagButton, type AddToBagButtonProps } from "./AddToBagButton";
export { QuickView, type QuickViewProps } from "./QuickView";
export { StockBadge, type StockBadgeProps } from "./StockBadge";
export { VariantPicker, type VariantPickerProps } from "./VariantPicker";

export {
  FilterSidebar,
  type FilterSidebarProps,
  type FilterSelection,
} from "./FilterSidebar";
export { FilterSheet, type FilterSheetProps } from "./FilterSheet";
export {
  SortSelect,
  SORT_OPTIONS,
  sortToQuery,
  type SortSelectProps,
  type SortValue,
} from "./SortSelect";
export {
  CategoryChips,
  type CategoryChipsProps,
  type ChipOption,
} from "./CategoryChips";

export { CartDrawer } from "./CartDrawer";
export { CartLineItem, type CartLineItemProps } from "./CartLineItem";
export { CartSummary, type CartSummaryProps } from "./CartSummary";

export {
  ShopControls,
  ShopSort,
  selectionFromParams,
  sortFromParams,
  type ShopControlsProps,
} from "./ShopControls";

export { SearchOverlay } from "./SearchOverlay";
export {
  SearchSuggestions,
  type SearchSuggestionsProps,
} from "./SearchSuggestions";
