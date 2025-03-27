import config from '../config';

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

// Product interface
export interface Product {
  product_id: string;
  product_name: string;
  description: string;
  price: number;
  category: string;
  tags: string;
  in_stock: boolean;
  image_url: string;
}

// Input for syncing products
export interface ProductSyncInput {
  products?: Product[];
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

// Update config to include the sync products endpoint
if (!config.apiEndpoints.syncProducts) {
  config.apiEndpoints = {
    ...config.apiEndpoints,
    syncProducts: '/api/v1/sync-products',
    syncHistory: '/api/v1/sync-history'
  };
}

// API service for product sync operations
const syncProductApi = {
  // Sync products
  syncProducts: async (input: ProductSyncInput): Promise<SyncResponse> => {
    try {
      const response = await fetch(`${config.apiBaseUrl}${config.apiEndpoints.syncProducts}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error syncing products:', error);
      throw error;
    }
  },
  
  // Get sync history with pagination
  getSyncHistory: async (page: number = 1, size: number = 10): Promise<SyncHistoryResponse> => {
    try {
      const response = await fetch(`${config.apiBaseUrl}${config.apiEndpoints.syncHistory}?page=${page}&size=${size}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting sync history:', error);
      throw error;
    }
  }
};

export default syncProductApi; 