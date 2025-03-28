// Environment configuration
const ENV = import.meta.env.VITE_ENV || 'local';

// API base URL configuration based on environment
const API_BASE_URLS = {
  local: 'http://localhost:9000',
  development: 'https://api.cognishop.co',
  production: 'https://api.cognishop.co',
};

// Configuration object
const config = {
  env: ENV,
  apiBaseUrl: API_BASE_URLS[ENV as keyof typeof API_BASE_URLS] || API_BASE_URLS.local,
  apiEndpoints: {
    searchConfig: '/api/v1/settings/search-config',
    syncProducts: '/api/v1/sync-products',
    syncHistory: '/api/v1/sync-history',
    settings: '/api/v1/settings'
  }
};

export default config; 