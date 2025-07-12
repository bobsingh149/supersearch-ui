import { useState } from 'react';
import config from '../config';
import { getTenantHeadersFromPath } from '../utils/tenantHeaders';

// Type for search result item
export interface SearchResultItem {
  id: string;
  title: string;
  custom_data: {
    id: string;
    adult: string;
    title: string;
    actors: string;
    genres: string;
    imdb_id: string;
    runtime: string;
    tagline: string;
    director: string;
    keywords: string;
    overview: string;
    popularity: string;
    vote_count: string;
    poster_path: string;
    release_date: string;
    vote_average: string;
    backdrop_path: string;
    original_language: string;
    price: number;
  };
  searchable_content: string;
  score: number;
  search_type: string | null;
  image_url: string;
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

// Custom error type with status code
export interface SearchError extends Error {
  statusCode?: number;
}

export const useSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SearchError | null>(null);
  const [errorStatusCode, setErrorStatusCode] = useState<number | null>(null);
  
  // Search products
  const searchProducts = async (params: SearchParams): Promise<SearchResponse> => {
    try {
      setLoading(true);
      setError(null);
      setErrorStatusCode(null);
      
      const { query, page = 1, size = 10, filters = {} } = params;
      
      // Get tenant headers based on current path
      const headers = getTenantHeadersFromPath(window.location.pathname);
      
      // Build query parameters for pagination
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('size', size.toString());
      if (query.trim()) {
        queryParams.append('query', query);
      }
      
      // Create request body with filters and sort
      const requestBody: Record<string, any> = {};
      
      // If we have a query, include it in the request body as well
      if (query.trim()) {
        requestBody.query = query;
      }
      
      // Add filters and sort to request body if provided
      if (filters.filters) {
        requestBody.filters = filters.filters;
      }
      
      if (filters.sort) {
        requestBody.sort = filters.sort;
      }
      
      const response = await fetch(
        `${config.apiBaseUrl}/search?${queryParams.toString()}`, 
        {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        }
      );
      
      if (!response.ok) {
        const statusCode = response.status;
        setErrorStatusCode(statusCode);
        
        const customError = new Error(`Search API error: ${statusCode} ${response.statusText}`) as SearchError;
        customError.statusCode = statusCode;
        throw customError;
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
      
      // Create a custom error object
      const customError = new Error(error.message || 'Search failed') as SearchError;
      
      // Set status code if not already set
      if (!errorStatusCode) {
        const statusCode = error.statusCode || error.status || 500;
        setErrorStatusCode(statusCode);
        customError.statusCode = statusCode;
      } else {
        customError.statusCode = errorStatusCode;
      }
      
      setError(customError);
      throw customError;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    errorStatusCode,
    searchProducts
  };
}; 