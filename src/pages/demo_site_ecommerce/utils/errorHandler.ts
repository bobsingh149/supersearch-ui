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

/**
 * Leads API handler - collects only required information for leads API
 * Does not handle rate limit errors for leads API
 */
export interface LeadsData {
  name: string;
  business_email: string;
  company_name: string;
}

export const COGNISHOP_CONTACT_EMAIL = 'team@cognishop.co';

/**
 * Handle leads API submission
 */
export const handleLeadsSubmission = async (
  data: LeadsData,
  submitFunction: (data: LeadsData) => Promise<void>
) => {
  try {
    // Validate required fields
    if (!data.name || !data.business_email || !data.company_name) {
      throw new Error('All fields are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.business_email)) {
      throw new Error('Please enter a valid email address');
    }

    // Submit the lead data
    await submitFunction(data);
  } catch (error) {
    // Re-throw the error to be handled by the calling component
    // Note: We don't handle rate limit errors for leads API as requested
    throw error;
  }
}; 