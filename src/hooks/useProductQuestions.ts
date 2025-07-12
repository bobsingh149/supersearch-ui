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
      let errorMessage = 'Failed to fetch product questions';
      
      if (axios.isAxiosError(err) && err.response) {
        // Add status code to error for rate limit handling
        const error = new Error(err.response.data.message || errorMessage);
        (error as any).status = err.response.status;
        errorMessage = err.response.data.message || errorMessage;
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
  }, []);

  return {
    questions,
    loading,
    error,
    fetchProductQuestions
  };
}; 