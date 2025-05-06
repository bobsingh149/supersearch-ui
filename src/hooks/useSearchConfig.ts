import { useState } from 'react';
import config from '../config';

// Interface for search configuration
export interface SearchConfig {
  id_field: string;
  title_field: string;
  image_url_field: string;
  searchable_attribute_fields: string[];
  filter_fields?: string[];
  sortable_fields?: string[];
  removeStopWords?: boolean;
  optionalWords?: string[];
}

// Interface for settings response
export interface SettingsResponse {
  key: string;
  title: string;
  description: string;
  value: any;
  created_at: string;
  updated_at: string;
}

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
      
      // Get authentication token
      const token = 'dummy-auth-token';
      
      // Get configuration from the settings API
      const response = await fetch(`${config.apiBaseUrl}${config.apiEndpoints.settings}/SEARCH_CONFIG`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        // If status is 404, it means the record doesn't exist yet
        if (response.status === 404) {
          throw new Error('not_found');
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const settingsResponse = await response.json() as SettingsResponse;
      
      // Check if the response has the expected structure
      if (settingsResponse.value) {
        const config = settingsResponse.value as SearchConfig;
        return config;
      } else {
        throw new Error('Invalid response format');
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
          searchable_attribute_fields: [],
          filter_fields: [],
          sortable_fields: []
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
      
      // Get authentication token
      const token = 'dummy-auth-token';
      
      // Save configuration using the search config API
      const response = await fetch(`${config.apiBaseUrl}${config.apiEndpoints.searchConfig}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(searchConfig),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      await response.json();
      
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