import { useState } from 'react';
import api, { SearchConfig } from '../services/settingsApi';

// Custom hook for managing search configuration
export const useSearchConfig = () => {
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  
  // Load search configuration from API
  const loadSearchConfig = async () => {
    try {
      setLoading(true);
      setConfigError(null);
      
      // Try to get configuration from the search config API
      const response = await api.settings.getSearchConfig();
      
      // Check if the response has the expected structure
      if (response.value) {
        const config = response.value as SearchConfig;
        return config;
      } else {
        // Fallback to the existing getSearchConfig method if needed
        const config = await api.search.getSearchConfig();
        return config;
      }
    } catch (error: any) {
      console.error('Failed to load search configuration', error);
      
      // If error is 'not_found', it means the record doesn't exist yet
      if (error.message === 'not_found') {
        // Just use the default empty state, no need to show an error
        console.log('Search configuration not found, using default empty state');
        
        // Return empty config
        return {
          id_field: '',
          title_field: '',
          image_url_field: '',
          searchable_attribute_fields: []
        };
      } else {
        // Show error message for other errors
        setConfigError('Error loading your configuration. Please try again later.');
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Save search configuration
  const saveSearchConfig = async (searchConfig: SearchConfig) => {
    try {
      setLoading(true);
      setSaveSuccess(false);
      setSaveError(null);
      
      await api.search.saveSearchConfig(searchConfig);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      return true;
    } catch (error) {
      console.error('Failed to save search configuration', error);
      setSaveError('Failed to save configuration. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    saveSuccess,
    saveError,
    configError,
    loadSearchConfig,
    saveSearchConfig
  };
}; 