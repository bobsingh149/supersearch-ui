import { useState} from 'react';
import config from '../config';
import { getTenantHeadersFromPath } from '../utils/tenantHeaders';

interface Review {
  id: string;
  product_id: string;
  author: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface UseReviewsResult {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  fetchReviews: (productId: string) => Promise<void>;
}

export const useReviews = (): UseReviewsResult => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Get tenant headers based on current path
      const headers = getTenantHeadersFromPath(window.location.pathname);
      
      const response = await fetch(`${config.apiBaseUrl}/reviews/?product_id=${productId}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  return {
    reviews,
    loading,
    error,
    fetchReviews,
  };
}; 