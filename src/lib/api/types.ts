/**
 * Wire types for the MAK Watches API.
 *
 * These mirror the Go models in makwatches-be/internal/models. Fields the
 * backend marks `omitempty` are optional here, and stay optional rather than
 * being defaulted: an absent specification means "not recorded", which the UI
 * must render as nothing rather than as a fabricated value.
 */

/** Envelope every API endpoint responds with. */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/** A structured reference to a stored asset. Mirrors models.MediaRef. */
export interface MediaRef {
  url: string;
  /** Storage object name within the bucket, when known. */
  key?: string;
  /** Accessible description. */
  alt?: string;
  /** "image" | "video"; absent means image. */
  kind?: "image" | "video";
  width?: number;
  height?: number;
}

/**
 * Watch specifications. Mirrors models.Specs.
 *
 * Every field is optional by design. Never substitute a placeholder for a
 * missing value -- omit the row instead.
 */
export interface ProductSpecs {
  movement?: string;
  case?: string;
  crystal?: string;
  dial?: string;
  strap?: string;
  waterResistance?: string;
  dimensions?: string;
  warranty?: string;
  boxContents?: string[];
}

export interface ProductSeo {
  title?: string;
  description?: string;
  ogImage?: string;
}

export type ProductStatus = "draft" | "published" | "archived";

/** Mirrors models.Product. */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;

  brand?: string;
  mainCategory?: string;
  subcategory?: string;

  /** Legacy single image. Prefer `media`. */
  imageUrl?: string;
  /** Legacy image list. Prefer `media`. */
  images?: string[];
  /** Structured media. The API backfills this from `images` for old records. */
  media?: MediaRef[];

  stock: number;

  // Filterable attributes
  gender?: string | null;
  dialColor?: string | null;
  dialShape?: string | null;
  dialType?: string | null;
  strapColor?: string | null;
  strapMaterial?: string | null;
  style?: string | null;
  dialThickness?: string | null;

  // Discounts
  discountPercentage?: number | null;
  discountAmount?: number | null;
  discountStartDate?: string | null;
  discountEndDate?: string | null;

  // Reconstruction fields
  slug?: string;
  sku?: string;
  collection?: string;
  /** Links sibling colorways of the same watch. Empty means standalone. */
  variantGroupId?: string;
  /** Shown on the variant picker, e.g. "Elite Black". */
  variantLabel?: string;
  compareAtPrice?: number;
  shortDescription?: string;
  specs?: ProductSpecs;
  status?: ProductStatus;
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
  seo?: ProductSeo;

  createdAt?: string;
  updatedAt?: string;
}

/** An editorial grouping, derived from the products that reference it. */
export interface Collection {
  slug: string;
  name: string;
  count: number;
}

export interface Subcategory {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
  createdAt?: string;
  updatedAt?: string;
}

/** Query accepted by the catalog listing endpoint. */
export interface CatalogQuery {
  category?: string;
  mainCategory?: string;
  subcategory?: string;
  collection?: string;
  gender?: string;
  q?: string;

  /** Multi-select; serialized comma-separated. */
  brand?: string | string[];
  dialColor?: string;
  dialShape?: string;
  dialType?: string;
  strapColor?: string;
  strapMaterial?: string;
  style?: string;
  dialThickness?: string;

  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
  sortBy?: "createdAt" | "price" | "name";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface SearchResult {
  query: string;
  products: Product[];
  collections: Collection[];
  categories: string[];
  total: number;
}

/** A single facet the shop filters can offer. */
export interface FilterOption {
  value: string;
  label?: string;
  count?: number;
}

export interface CatalogFilters {
  brands?: FilterOption[];
  genders?: FilterOption[];
  dialColors?: FilterOption[];
  dialShapes?: FilterOption[];
  dialTypes?: FilterOption[];
  strapColors?: FilterOption[];
  strapMaterials?: FilterOption[];
  styles?: FilterOption[];
  priceRange?: { min: number; max: number };
}

// ── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  product?: Product;
  size?: string;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// ── Wishlist ────────────────────────────────────────────────────────────────

export interface WishlistEntry {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  description?: string;
  inStock: boolean;
  addedAt?: string;
}

// ── Account ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  picture?: string;
  authProvider?: string;
}

export interface OrderSummary {
  id: string;
  orderNumber?: string;
  status: string;
  total: number;
  createdAt: string;
}
