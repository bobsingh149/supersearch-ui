import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

/**
 * Hook that provides an authenticated fetch function
 * Can be used directly in components that need to make authenticated API calls
 */
export default function useAuthFetch() {
  const { getToken } = useAuth();

  /**
   * Performs an authenticated fetch request with the current bearer token
   *
   * @param url - The URL to fetch
   * @param options - Optional fetch request options
   * @returns A promise that resolves to the parsed JSON response
   */
  const authFetch = useCallback(
    async <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
      // Get the current authentication token
      const token = await getToken();

      // Create headers with authorization
      const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': options.headers?.['Content-Type'] || 'application/json',
      };

      // Make the authenticated request
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle non-successful responses
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      // Parse and return the JSON response
      return await response.json();
    },
    [getToken]
  );

  return authFetch;
} 