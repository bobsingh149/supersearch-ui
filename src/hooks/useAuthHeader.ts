import { useAuth } from '@clerk/clerk-react';

// Custom hook to get the authentication header for API requests
const useAuthHeader = async () => {
  const { getToken } = useAuth();
  
  // Get the current session token
  const token = await getToken();
  
  // Return the header object with the token
  return {
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export default useAuthHeader; 