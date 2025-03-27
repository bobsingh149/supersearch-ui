import config from '../config';
import { withAuth } from './authUtils';

// API endpoints
const API_ENDPOINTS = {
  products: '/api/v1/products'
};

// Movie product interface
export interface MovieProduct {
  id: string;
  Genre?: string;
  Title?: string;
  Overview?: string;
  Popularity?: string;
  Poster_Url?: string;
  Vote_Count?: string;
  Release_Date?: string;
  Vote_Average?: string;
  Original_Language?: string;
  [key: string]: any;
}

// Generic product type that can handle any fields
export type Product = MovieProduct | Record<string, any>;

// Response type for paginated products
export interface ProductsResponse {
  products: Product[];
  page: number;
  size: number;
  has_more: boolean;
}

// API service for product-related operations
const productApi = {
  // Get products with pagination
  getProducts: async (page: number = 1, size: number = 10): Promise<ProductsResponse> => {
    try {
      const options = await withAuth({
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const response = await fetch(`${config.apiBaseUrl}${API_ENDPOINTS.products}?page=${page}&size=${size}`, options);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
  
  // Get a single product by ID
  getProductById: async (productId: string): Promise<Product> => {
    try {
      const options = await withAuth({
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const response = await fetch(`${config.apiBaseUrl}${API_ENDPOINTS.products}/${productId}`, options);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching product with ID ${productId}:`, error);
      throw error;
    }
  },
  
  // Helper function to extract column definitions from products
  getColumnDefinitions: (products: Product[]): Array<{ field: string; headerName: string; type: string }> => {
    if (!products || products.length === 0) {
      return [];
    }
    
    // Use the first product to determine columns
    const firstProduct = products[0];
    
    return Object.keys(firstProduct).map(key => {
      // Determine the type of the field
      let type = 'string';
      const value = firstProduct[key];
      
      if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (value instanceof Date) {
        type = 'date';
      }
      
      // Format the header name (convert snake_case or camelCase to Title Case)
      const headerName = key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      
      return {
        field: key,
        headerName,
        type
      };
    });
  },
  
  // Helper function to format cell values based on their type
  formatCellValue: (value: any): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'number') {
      // Format as currency if it looks like a price
      if (String(value).includes('.') && value > 0 && value < 10000) {
        return `$${value.toFixed(2)}`;
      }
      return value.toString();
    }
    
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }
};

export default productApi; 