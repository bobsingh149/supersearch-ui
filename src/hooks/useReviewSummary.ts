import { useState } from 'react';
import config from '../config';
import { getTenantHeadersFromPath } from '../utils/tenantHeaders';

interface ReviewSummary {
  summary: string;
  pros: string[];
  cons: string[];
}

export const useReviewSummary = () => {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviewSummary = async (productId: string) => {
    setLoading(true);
    setSummary(null);
    setError(null);

    try {
      // Get tenant headers based on current path
      const headers = getTenantHeadersFromPath(window.location.pathname);
      
      const response = await fetch(`${config.apiBaseUrl}${config.apiEndpoints.reviews}/${productId}/summary`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch review summary: ${response.status}`);
      }

      const data = await response.json();
      setSummary(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching review summary:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    summary,
    loading,
    error,
    fetchReviewSummary
  };
}; 