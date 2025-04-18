import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import config from '../config';

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

// Helper function to extract column definitions from products
export const getColumnDefinitions = (products: Product[]): Array<{ field: string; headerName: string; type: string }> => {
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
};

// Helper function to format cell values based on their type
export const formatCellValue = (value: any): string => {
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
};

// Hook for getting products with pagination
export const useProducts = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get products with pagination
  const getProducts = async (page: number = 1, size: number = 10): Promise<ProductsResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get authentication token
      const token = await getToken();
      
      const response = await fetch(`${config.apiBaseUrl}/products?page=${page}&size=${size}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Failed to fetch products. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    getProducts
  };
};

// Hook for getting a single product by ID
export const useProductById = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get a single product by ID
  const getProductById = async (productId: string): Promise<Product> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get authentication token
      const token = await getToken();
      
      const response = await fetch(`${config.apiBaseUrl}/products/${productId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching product with ID ${productId}:`, error);
      setError(error.message || `Failed to fetch product with ID ${productId}. Please try again.`);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    getProductById
  };
};

// Legacy hook to maintain backward compatibility
export const useProduct = () => {
  const productsHook = useProducts();
  const productByIdHook = useProductById();
  
  return {
    loading: productsHook.loading || productByIdHook.loading,
    error: productsHook.error || productByIdHook.error,
    getProducts: productsHook.getProducts,
    getProductById: productByIdHook.getProductById,
    getColumnDefinitions,
    formatCellValue
  };
}; 