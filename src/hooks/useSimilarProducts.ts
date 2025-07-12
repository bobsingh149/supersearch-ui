import { useState } from 'react';
import axios from 'axios';
import config from '../config';
import { getTenantHeadersFromPath } from '../utils/tenantHeaders';

export interface SimilarProduct {
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
  };
  searchable_content: string;
  score: number;
  search_type: string;
  image_url: string;
}

export const useSimilarProducts = () => {
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSimilarProducts = async (productId: string, matchCount: number = 6) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get tenant headers based on current path
      const headers = getTenantHeadersFromPath(window.location.pathname);
      
      const url = `${config.apiBaseUrl}${config.apiEndpoints.similarProducts.replace('{product_id}', productId)}?match_count=${matchCount}`;
      
      const response = await axios.get<SimilarProduct[]>(url, { headers });
      setSimilarProducts(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching similar products:', err);
      let errorMessage = 'Unknown error occurred';
      
      if (axios.isAxiosError(err) && err.response) {
        // Add status code to error for rate limit handling
        const error = new Error(err.response.data.message || 'Failed to fetch similar products');
        (error as any).status = err.response.status;
        errorMessage = err.response.data.message || 'Failed to fetch similar products';
        setError(errorMessage);
        throw error;
      } else if (err instanceof Error) {
        errorMessage = err.message;
        setError(errorMessage);
        throw err;
      } else {
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    similarProducts,
    loading,
    error,
    fetchSimilarProducts
  };
}; 