import api from '@/lib/api';
import { type HomeContentResponse } from '@/types/home-content';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface Category {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  mainCategory?: 'Men' | 'Women';
  subcategory?: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  images: string[];
  imageUrl?: string;
  // Discount fields (optional)
  discountPercentage?: number | null;
  discountAmount?: number | null;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
  // Filterable attributes (optional)
  gender?: string | null;
  dialColor?: string | null;
  dialShape?: string | null;
  dialType?: string | null;
  strapColor?: string | null;
  strapMaterial?: string | null;
  style?: string | null;
  dialThickness?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Public (unauthenticated) category endpoints
export const fetchPublicCategories = (name?: string) =>
  api.get<ApiResponse<Category[]>>('/categories', { params: name ? { name } : undefined });
export const fetchPublicSubcategories = (name: string, strict?: boolean) =>
  api.get<ApiResponse<{ id: string; name: string }[]>>(`/categories/${encodeURIComponent(name)}/subcategories`, { params: strict ? { strict: 1 } : undefined });
// Public lightweight product listing (catalog)
export interface ProductQueryParams {
  category?: string;
  mainCategory?: string;
  subcategory?: string;
  brand?: string | string[]; // supports comma-separated or array
  gender?: string;
  dialColor?: string;
  dialShape?: string;
  dialType?: string;
  strapColor?: string;
  strapMaterial?: string;
  style?: string;
  dialThickness?: string;
  inStock?: boolean | 0 | 1 | string;
  minPrice?: number | string;
  maxPrice?: number | string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number | string;
  limit?: number | string;
}
export const fetchPublicProducts = (params?: ProductQueryParams) => {
  const q = { ...(params || {}) } as Record<string, unknown>;
  // Normalize brand array to comma-separated string for backend support
  if (Array.isArray(q.brand)) {
    q.brand = (q.brand as string[]).join(',');
  }
  return api.get<ApiResponse<Partial<Product>[]>>('/catalog/products', { params: q });
};
export const fetchPublicProductById = (id: string) =>
  api.get<ApiResponse<Partial<Product>>>(`/catalog/products/${id}`);
// Dynamic filters endpoint
export const fetchCatalogFilters = (params?: { mainCategory?: string; category?: string; subcategory?: string }) =>
  api.get<ApiResponse<{
    brands: string[];
    genders: string[];
    dialColors: string[];
    dialShapes: string[];
    dialTypes: string[];
    strapColors: string[];
    strapMaterials: string[];
    styles: string[];
    dialThicknesses: string[];
    minPrice: number;
    maxPrice: number;
    hasStock: boolean;
  }>>('/catalog/filters', { params });

// Home content endpoint (public read; writes live in the separate admin app)
export const fetchHomeContent = () =>
  api.get<ApiResponse<HomeContentResponse>>('/home-content');
