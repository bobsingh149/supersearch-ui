// Environment configuration
const ENV = import.meta.env.VITE_ENV || 'local';

// API base URL configuration based on environment
const API_BASE_URLS = {
  local: 'http://localhost:9000/v1',
  development: 'https://api.cognishop.co/v1',
  production: 'https://api.cognishop.co/v1',
};

// Configuration object
const config = {
  env: ENV,
  apiBaseUrl: API_BASE_URLS[ENV as keyof typeof API_BASE_URLS] || API_BASE_URLS.local,
  apiEndpoints: {
    searchConfig: '/settings/search-config',
    syncProducts: '/sync-products',
    syncHistory: '/sync-history',
    settings: '/settings',
    leads: '/leads',
    reviews: '/reviews',
    productQuestions: '/products/{product_id}/questions',
    autocomplete: '/search/autocomplete'
  }
};

export default config; 