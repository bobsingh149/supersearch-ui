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

      // Handle headers correctly with type safety
      const currentHeaders = options.headers || {};
      let contentType = 'application/json';
      
      // Determine content type from existing headers
      if (currentHeaders instanceof Headers) {
        contentType = currentHeaders.get('Content-Type') || contentType;
      } else if (typeof currentHeaders === 'object') {
        const headerRecord = currentHeaders as Record<string, string>;
        contentType = headerRecord['Content-Type'] || contentType;
      }

      // Create headers with authorization
      const headers = {
        ...currentHeaders,
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
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