import { useState } from 'react';
import config from '../config';
import { getTenantHeadersFromPath } from '../utils/tenantHeaders';

// Enums matching the backend
export enum SyncSource {
  MANUAL_FILE_UPLOAD = "MANUAL_FILE_UPLOAD",
  CRAWLER = "CRAWLER",
  SUPERSEARCH_API = "SUPERSEARCH_API",
  HOSTED_FILE = "HOSTED_FILE",
  SQL_DATABASE = "SQL_DATABASE"
}

export enum SyncStatus {
  SUCCESS = "SUCCESS",
  PROCESSING = "PROCESSING",
  FAILED = "FAILED"
}

export enum SyncInterval {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY"
}

export enum TriggerType {
  IMMEDIATE = "IMMEDIATE",
  SCHEDULED = "SCHEDULED"
}

export enum AuthType {
  PUBLIC = "PUBLIC",
  BASIC_AUTH = "BASIC_AUTH"
}

export enum DatabaseType {
  POSTGRESQL = "POSTGRESQL",
  MYSQL = "MYSQL",
  SQLITE = "SQLITE",
  MSSQL = "MSSQL",
  ORACLE = "ORACLE"
}

// Base interface for all source configurations
export interface BaseSourceConfig {
  source: SyncSource;
  auto_sync: boolean;
  sync_interval?: SyncInterval;
}

// Configuration for manual file upload
export interface ManualFileUploadConfig extends BaseSourceConfig {
  source: SyncSource.MANUAL_FILE_UPLOAD;
  file_format: 'csv' | 'json';
}

// Configuration for web crawler
export interface CrawlerConfig extends BaseSourceConfig {
  source: SyncSource.CRAWLER;
  urls: string[];
  max_depth: number;
}

// Configuration for Supersearch API
export interface SupersearchApiConfig extends BaseSourceConfig {
  source: SyncSource.SUPERSEARCH_API;
}

// Configuration for hosted file
export interface HostedFileConfig extends BaseSourceConfig {
  source: SyncSource.HOSTED_FILE;
  file_url: string;
  file_format: 'csv' | 'json';
  auth_type: AuthType;
  username?: string;
  password?: string;
}

// Configuration for SQL database
export interface SqlDatabaseConfig extends BaseSourceConfig {
  source: SyncSource.SQL_DATABASE;
  database_type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  table_name: string;
}

// Union type for all source configurations
export type SourceConfigType = 
  | ManualFileUploadConfig
  | CrawlerConfig
  | SupersearchApiConfig
  | HostedFileConfig
  | SqlDatabaseConfig;

// Input for syncing products
export interface ProductSyncInput {
  products?: any[];
  source_config: SourceConfigType;
}

// Response from sync operation
export interface SyncResponse {
  sync_id: string;
  status: SyncStatus;
  message: string;
  timestamp: string;
}

// Sync history item
export interface SyncHistoryItem {
  id: string;
  source: string;
  status: SyncStatus;
  start_time: string;
  end_time: string | null;
  records_processed: number | null;
  next_run: string | null;
  created_at: string;
  updated_at: string;
}

// Paginated response for sync history
export interface SyncHistoryResponse {
  items: SyncHistoryItem[];
  page: number;
  size: number;
  has_more: boolean;
}

export const useSyncProduct = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sync products
  const syncProducts = async (input: ProductSyncInput): Promise<SyncResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get tenant headers based on current path
      const headers = getTenantHeadersFromPath(window.location.pathname);
      
      const response = await fetch(`${config.apiBaseUrl}/sync-products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error syncing products:', error);
      setError(error.message || 'Failed to sync products. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Get sync history with pagination
  const getSyncHistory = async (page: number = 1, size: number = 10): Promise<SyncHistoryResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get tenant headers based on current path
      const headers = getTenantHeadersFromPath(window.location.pathname);
      
      const response = await fetch(`${config.apiBaseUrl}/sync-history?page=${page}&size=${size}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error getting sync history:', error);
      setError(error.message || 'Failed to get sync history. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    syncProducts,
    getSyncHistory
  };
}; 