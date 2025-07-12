import { useState, useCallback } from 'react';
import axios from 'axios';
import config from '../config';
import { getTenantHeadersFromPath } from '../utils/tenantHeaders';

export interface ProductQuestionsResponse {
  questions: string[];
}

export const useProductQuestions = () => {
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductQuestions = useCallback(async (productId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get tenant headers based on current path
      const headers = getTenantHeadersFromPath(window.location.pathname);
      
      const endpoint = config.apiEndpoints.productQuestions.replace('{product_id}', productId);
      const response = await axios.get<ProductQuestionsResponse>(
        `${config.apiBaseUrl}${endpoint}`,
        { headers }
      );
      
      setQuestions(response.data.questions);
      return response.data.questions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product questions';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    questions,
    loading,
    error,
    fetchProductQuestions
  };
}; 