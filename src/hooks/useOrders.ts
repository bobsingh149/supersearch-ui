import { useState } from 'react';
import axios from 'axios';
import config from '../config';
import { getTenantHeadersFromPath } from '../utils/tenantHeaders';

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  title: string;
  custom_data?: Record<string, any>;
}

export interface Address {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}

export interface PaymentInfo {
  payment_method: string;
  transaction_id: string;
  payment_status: string;
  amount_paid: number;
  currency: string;
}

export interface OrderRequest {
  status: string;
  total_amount: number;
  items: OrderItem[];
  shipping_address: Address;
  billing_address: Address;
  payment_info: PaymentInfo;
  notes?: string;
}

export const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Reset the states
  const reset = () => {
    setError(null);
    setOrderSuccess(false);
    setOrderId(null);
  };

  // Create a new order
  const createOrder = async (orderData: OrderRequest) => {
    setLoading(true);
    setError(null);
    setOrderSuccess(false);
    
    try {
      // Get tenant headers based on current path
      const headers = getTenantHeadersFromPath(window.location.pathname);
      
      const response = await axios.post(
        `${config.apiBaseUrl}${config.apiEndpoints.orders}`,
        orderData,
        { headers }
      );
      
      setOrderSuccess(true);
      setOrderId(response.data.id || response.data.order_id || null);
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to create order');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    orderSuccess,
    orderId,
    createOrder,
    reset
  };
}; 