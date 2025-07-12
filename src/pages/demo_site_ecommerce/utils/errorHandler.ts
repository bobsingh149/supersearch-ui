/**
 * Utility function to handle API errors, specifically 429 rate limit errors
 */

export const handleApiError = (error: any, navigate: (path: string) => void) => {
  // Check if error is a fetch response or has status property
  if (error?.status === 429 || error?.response?.status === 429) {
    // Redirect to rate limit error page
    navigate('/demo_ecommerce/rate-limit');
    return true; // Indicates error was handled
  }
  
  // Check if error message contains rate limit indicators
  if (error?.message?.includes('429') || 
      error?.message?.toLowerCase().includes('rate limit') ||
      error?.message?.toLowerCase().includes('too many requests')) {
    navigate('/demo_ecommerce/rate-limit');
    return true; // Indicates error was handled
  }
  
  return false; // Error was not handled, let component handle it normally
};

/**
 * Wrapper function for fetch requests that automatically handles 429 errors
 */
export const fetchWithErrorHandling = async (
  url: string, 
  options: RequestInit = {},
  navigate: (path: string) => void
) => {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      navigate('/demo_ecommerce/rate-limit');
      throw new Error('Rate limit exceeded');
    }
    
    return response;
  } catch (error) {
    // Handle network errors or other fetch errors
    if (handleApiError(error, navigate)) {
      throw error; // Re-throw after handling
    }
    throw error; // Re-throw unhandled errors
  }
};

/**
 * Check if an error is a 429 rate limit error
 */
export const isRateLimitError = (error: any): boolean => {
  return error?.status === 429 || 
         error?.response?.status === 429 ||
         error?.message?.includes('429') ||
         error?.message?.toLowerCase().includes('rate limit') ||
         error?.message?.toLowerCase().includes('too many requests');
}; 