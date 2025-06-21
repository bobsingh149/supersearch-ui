// Ecommerce-specific interfaces
export interface EcommerceCustomData {
  id: string;
  year?: string;
  brand?: string;
  price?: string;
  usage?: string;
  gender?: string;
  season?: string;
  age_group?: string;
  image_url?: string;
  style_note?: string;
  base_colour?: string;
  description?: string;
  article_type?: string;
  product_name?: string;
  rating_count?: string;
  sub_category?: string;
  material_care?: string;
  average_rating?: string;
  available_sizes?: string;
  master_category?: string;
  discounted_price?: string;
  display_categories?: string;
}

export interface EcommerceSearchResultItem {
  id: string;
  title?: string;
  image_url?: string;
  custom_data?: EcommerceCustomData;
  searchable_content?: string;
  score?: number;
  search_type?: string | null;
}

export interface EcommerceSearchResponse {
  results: EcommerceSearchResultItem[];
  total?: number;
  page?: number;
  size?: number;
}

// Filter and sort interfaces
export interface FilterCondition {
  field: string;
  value: any;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
}

export interface FilterOptions {
  conditions: FilterCondition[];
  filter_type: 'AND' | 'OR';
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchFilters {
  filters?: FilterOptions;
  sort?: SortOptions;
} 