import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import config from '../config';

// Type for search result item
export interface SearchResultItem {
  id: string;
  title: string;
  custom_data: Record<string, any>;
  searchable_content: string;
  score: number;
  search_type: string | null;
  image_url?: string;
}

// Response type for search results
export interface SearchResponse {
  results: SearchResultItem[];
  page: number;
  size: number;
  total?: number;
  has_more?: boolean;
}

// Search parameters interface
export interface SearchParams {
  query: string;
  page?: number;
  size?: number;
  filters?: Record<string, any>;
}

export const useSearch = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search products
  const searchProducts = async (params: SearchParams): Promise<SearchResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const { query, page = 1, size = 10, filters = {} } = params;
      
      // Get authentication token
      const token = await getToken();
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      // For empty queries, use a special parameter or just omit it
      if (query.trim()) {
        queryParams.append('query', query);
      } else {
        // Either omit the query parameter for a default search
        // or use a special value that your backend recognizes as "get all"
        queryParams.append('query', '');
      }
      queryParams.append('page', page.toString());
      queryParams.append('size', size.toString());
      
      // Add any filters as query parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await fetch(
        `${config.apiBaseUrl}/search?${queryParams.toString()}`, 
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Search API error: ${response.status} ${response.statusText}`);
      }
      
      // Parse the API response
      const data = await response.json();
      
      // Transform the response to match our interface
      let results: SearchResultItem[] = [];
      let totalCount: number | undefined = undefined;
      let hasMore = false;
      
      if (Array.isArray(data)) {
        // Simple array response
        results = data;
        // Assume there's more if we got exactly the requested size
        hasMore = data.length >= size;
        // We don't know the total in this case
      } else if (typeof data === 'object') {
        // Response might be an object with results and metadata
        if (Array.isArray(data.results)) {
          results = data.results;
        }
        if (typeof data.total === 'number') {
          totalCount = data.total;
        }
        if (typeof data.has_more === 'boolean') {
          hasMore = data.has_more;
        } else {
          // If has_more isn't provided but we have total, calculate it
          hasMore = totalCount ? page * size < totalCount : results.length >= size;
        }
      }
      
      return {
        results,
        page,
        size,
        total: totalCount,
        has_more: hasMore,
      };
    } catch (error: any) {
      console.error('Error searching products:', error);
      setError(error.message || 'Failed to search products. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    searchProducts
  };
}; 