import { useAuth } from '@clerk/clerk-react';

/**
 * Adds auth headers to an existing request options object
 * @param options - The existing request options
 * @returns Promise that resolves to request options with auth headers
 */
export const withAuth = async (options: RequestInit = {}): Promise<RequestInit> => {
  const { getToken } = useAuth();
  const token = await getToken();
  
  // Handle headers correctly with type safety
  const currentHeaders = options.headers || {};
  let contentType = 'application/json';
  
  // If headers is a Headers object
  if (currentHeaders instanceof Headers) {
    contentType = currentHeaders.get('Content-Type') || contentType;
  } 
  // If headers is a Record
  else if (typeof currentHeaders === 'object') {
    const headerRecord = currentHeaders as Record<string, string>;
    contentType = headerRecord['Content-Type'] || contentType;
  }
  
  return {
    ...options,
    headers: {
      ...currentHeaders,
      'Authorization': `Bearer ${token}`,
      'Content-Type': contentType,
    },
  };
}; 