import config from '../config';
import { withAuth } from './authUtils';

// Interface for search configuration
export interface SearchConfig {
  id_field: string;
  title_field: string;
  image_url_field: string;
  searchable_attribute_fields: string[];
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

// API service for search-related operations
const searchApi = {
  // Save search configuration
  saveSearchConfig: async (searchConfig: SearchConfig): Promise<any> => {
    try {
      const options = await withAuth({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(searchConfig),
      });
      
      const response = await fetch(`${config.apiBaseUrl}${config.apiEndpoints.searchConfig}`, options);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving search configuration:', error);
      throw error;
    }
  },
  
  // Get search configuration
  getSearchConfig: async (): Promise<SearchConfig> => {
    try {
      const options = await withAuth({
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const response = await fetch(`${config.apiBaseUrl}${config.apiEndpoints.searchConfig}`, options);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting search configuration:', error);
      throw error;
    }
  }
};

// API service for settings-related operations
const settingsApi = {
  // Get search configuration settings
  getSearchConfig: async (): Promise<SettingsResponse> => {
    try {
      const options = await withAuth({
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const response = await fetch(`${config.apiBaseUrl}/api/v1/settings/SEARCH_CONFIG`, options);
      
      if (!response.ok) {
        // If status is 404, it means the record doesn't exist yet
        if (response.status === 404) {
          throw new Error('not_found');
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting search configuration:', error);
      throw error;
    }
  }
};

export default {
  search: searchApi,
  settings: settingsApi,
}; 