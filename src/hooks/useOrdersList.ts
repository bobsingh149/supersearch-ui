import { useState } from 'react';
import axios from 'axios';
import config from '../config';
import { OrderItem, Address, PaymentInfo } from './useOrders';
import { getTenantHeadersFromPath } from '../utils/tenantHeaders';

export interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
  shipping_address: Address;
  billing_address: Address;
  payment_info: PaymentInfo;
  tracking_number?: string;
  expected_shipping_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface OrdersResponse {
  orders: Order[];
  page: number;
  size: number;
  has_more: boolean;
  total_count: number;
}

export const useOrdersList = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Fetch orders with pagination
  const fetchOrders = async (currentPage: number = page, currentPageSize: number = pageSize) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get tenant headers based on current path
      const headers = getTenantHeadersFromPath(window.location.pathname);
      
      const response = await axios.get<OrdersResponse>(
        `${config.apiBaseUrl}${config.apiEndpoints.getOrders}`, {
          headers,
          params: {
            page: currentPage,
            size: currentPageSize
          }
        }
      );
      
      setOrders(response.data.orders);
      setPage(response.data.page);
      setPageSize(response.data.size);
      setTotalCount(response.data.total_count);
      setHasMore(response.data.has_more);
      
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to fetch orders');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    hasMore,
    fetchOrders,
    setPage,
    setPageSize
  };
}; 