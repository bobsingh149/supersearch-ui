import * as React from 'react';
import { useState, useCallback, useEffect} from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Chip,
  Divider,
  CardActions,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  Link,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import { 
  DataGrid, 
  GridColDef, 
  GridToolbar,
  GridPaginationModel,
} from '@mui/x-data-grid';
import {
  Upload as UploadIcon,
  Storage as StorageIcon,
  Api as ApiIcon,
  Dataset as DatabaseIcon,
  ShoppingBag as ShoppingBagIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Link as LinkIcon,
  Language as LanguageIcon,
  Add as AddIcon,
  Sync as SyncIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import {
  useProduct, 
  Product
} from '../../hooks/useProduct';
import {
  useSyncProduct,
  SyncSource,
  SyncStatus,
  SyncInterval,
  DatabaseType,
  AuthType,
  SyncProduct,
  ProductSyncInput,
  SourceConfigType,
  ManualFileUploadConfig,
  CrawlerConfig,
  SupersearchApiConfig,
  HostedFileConfig,
  SqlDatabaseConfig
} from '../../hooks/useSyncProduct';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

interface Connector {
  id: string;
  title: string;
  icon: React.ComponentType<{ sx?: any }>;
  description: string;
  tag?: string;
}

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  preview: string;
}


interface SyncHistory {
  id: string;
  source: string;
  status: SyncStatus;
  startTime: string;
  endTime: string | null;
  recordsProcessed: number | null;
  nextRun: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PreviewData {
  headers: string[];
  rows: any[];
}


const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <Box 
    role="tabpanel" 
    hidden={value !== index} 
    sx={{ 
      mt: 4,
      width: '100%',
      minHeight: '60vh', // Ensures minimum height consistency
    }}
  >
    {value === index && (
      <Box sx={{ 
        width: '100%',
        maxWidth: index === 2 || index === 3 
          ? { xs: '100%', sm: '100%', md: '1400px', lg: '1800px' } 
          : { xs: '100%', sm: '100%', md: '800px', lg: '900px' },
        mx: 'auto',
        pl: index === 2 || index === 3 ? { xs: 1, sm: 2 } : 0,
        pr: index === 2 || index === 3 ? { xs: 0.5, sm: 1 } : 0
      }}>
        {children}
      </Box>
    )}
  </Box>
);

const nativeConnectors: Connector[] = [
  {
    id: 'file-upload',
    title: 'Manual File Upload',
    icon: UploadIcon,
    description: 'Upload CSV or JSON files manually',
  },
  {
    id: 'hosted-file',
    title: 'Hosted File',
    icon: StorageIcon,
    description: 'Connect to hosted CSV/JSON files',
    tag: 'Auto Sync',
  },
  {
    id: 'supersearch-api',
    title: 'SuperSearch API',
    icon: ApiIcon,
    description: 'Connect using our API endpoints',
  },
  {
    id: 'sql-database',
    title: 'SQL Database',
    icon: DatabaseIcon,
    description: 'Connect to your SQL database',
    tag: 'Auto Sync',
  },
];

const externalConnectors: Connector[] = [
  {
    id: 'shopify',
    title: 'Shopify',
    icon: ShoppingBagIcon,
    description: 'Connect your Shopify store',
  },
  {
    id: 'woocommerce',
    title: 'WooCommerce',
    icon: ShoppingBagIcon,
    description: 'Connect your WooCommerce store',
  },
];


// Reusable button styles for consistent hover effects
const buttonStyles = {
  outlinedButton: {
    '&:hover': { 
      borderColor: 'primary.main',
      bgcolor: 'primary.lighter',
    }
  },
  containedButton: {
    '&:hover': { 
      bgcolor: 'primary.dark',
    }
  },
  errorButton: {
    '&:hover': { 
      borderColor: 'error.main',
      bgcolor: 'error.lighter',
    }
  }
};

export default function DataSources() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [configuredSource, setConfiguredSource] = useState<Connector | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [syncHistoryLoading, setSyncHistoryLoading] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [syncHistoryPage, setSyncHistoryPage] = useState(1);
  const [syncHistoryPageSize, setSyncHistoryPageSize] = useState(10);
  const [syncHistoryTotalCount, setSyncHistoryTotalCount] = useState(0);
  
  // Product catalog states
  const [products, setProducts] = useState<Product[]>([]);
  const [productColumns, setProductColumns] = useState<GridColDef<Product>[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(10);
  const [productTotalCount, setProductTotalCount] = useState(0);
  const [productError, setProductError] = useState<string | null>(null);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  
  // Source configuration states
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState<SyncInterval | ''>('');
  
  // Crawler specific states
  const [crawlerUrls, setCrawlerUrls] = useState('');
  
  const [maxDepth, setMaxDepth] = useState(1);
  
  // Hosted file specific states
  const [fileUrl, setFileUrl] = useState('');
  const [hostedFileFormat, setHostedFileFormat] = useState<'csv' | 'json'>('csv');
  const [hostedFileAuthType, setHostedFileAuthType] = useState<AuthType>(AuthType.PUBLIC);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // SQL Database specific states
  const [databaseType, setDatabaseType] = useState<DatabaseType>(DatabaseType.POSTGRESQL);
  const [host, setHost] = useState('');
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState('');
  const [dbUsername, setDbUsername] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [tableName, setTableName] = useState('');
  
  // Add this near other state declarations
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  const { 
    error: productApiError, 
    getProducts, 
    getColumnDefinitions 
  } = useProduct();

  const {
    error: syncApiError,
    syncProducts: syncProductsApi,
    getSyncHistory
  } = useSyncProduct();

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 2) { // Products tab
      setProductsLoading(true);
      // Fetch products from API
      fetchProducts(productPage, productPageSize);
    } else if (activeTab === 3) { // Sync History tab
      // Reset pagination to first page when tab is selected
      setSyncHistoryPage(1);
      // Fetch sync history from API
      fetchSyncHistory(1, syncHistoryPageSize);
    }
  }, [activeTab]);

  // Fetch products from API
  const fetchProducts = async (page: number = productPage, pageSize: number = productPageSize) => {
    try {
      setProductsLoading(true);
      setProductError(null);
      
      console.log('Fetching products:', { page, pageSize });
      
      const response = await getProducts(page, pageSize);
      
      console.log('API Response:', response);
      
      // Set products
      setProducts(response.products);
      setProductPage(response.page);
      setProductPageSize(response.size);
      
      // Calculate total count - if we have less items than the page size and no more pages,
      // then the total count is the current offset + number of items
      const currentOffset = (response.page - 1) * response.size;
      const totalCount = response.has_more 
        ? currentOffset + response.products.length + response.size // Estimate if there are more pages
        : currentOffset + response.products.length; // Exact count if this is the last page
      
      setProductTotalCount(totalCount);
      
      // Extract column definitions from the products
      setProductColumns(getColumnDefinitions(response.products) as unknown as GridColDef<Product>[]);
      
      console.log('Products loaded:', {
        products: response.products,
        page: response.page,
        size: response.size,
        hasMore: response.has_more,
        columns: productColumns
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductError(productApiError || 'Failed to load products. Please try again later.');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch sync history from API
  const fetchSyncHistory = async (page: number = syncHistoryPage, pageSize: number = syncHistoryPageSize) => {
    try {
      setSyncHistoryLoading(true);
      const response = await getSyncHistory(page, pageSize);
      
      console.log('API Response:', response); // Log the API response for debugging
      
      // Map the API response to our internal format
      const formattedHistory: SyncHistory[] = response.items.map(item => ({
        id: item.id || '',
        source: item.source || '',
        status: item.status || SyncStatus.PROCESSING,
        startTime: item.start_time || '', // Map snake_case to camelCase
        endTime: item.end_time, // Map snake_case to camelCase
        recordsProcessed: item.records_processed,
        nextRun: item.next_run,
        createdAt: item.created_at || '',
        updatedAt: item.updated_at || ''
      }));
      
      console.log('Formatted History:', formattedHistory); // Log the formatted history for debugging
      
      setSyncHistory(formattedHistory);
      setSyncHistoryPage(response.page || 1);
      setSyncHistoryPageSize(response.size || 10);
      
      // Calculate total count - if we have less items than the page size and no more pages,
      // then the total count is the current offset + number of items
      const currentOffset = (response.page - 1) * response.size;
      const totalCount = response.has_more 
        ? currentOffset + response.items.length + response.size // Estimate if there are more pages
        : currentOffset + response.items.length; // Exact count if this is the last page
      
      setSyncHistoryTotalCount(totalCount);
      
      console.log('Sync history loaded:', {
        items: formattedHistory,
        page: response.page,
        size: response.size,
        hasMore: response.has_more,
        totalCount
      });
    } catch (error) {
      console.error('Error fetching sync history:', error);
      // Set empty data on error
      setSyncHistory([]);
    } finally {
      setSyncHistoryLoading(false);
    }
  };

  // Sync products with the API
  const handleSyncProducts = async () => {
    try {
      setIsSyncing(true);
      setSyncError(null);
      setSyncSuccess(false);

      // For file upload, parse the file first and wait for it to complete
      let products: SyncProduct[] = [];
      
      if (selectedConnector?.id === 'file-upload' || configuredSource?.id === 'file-upload') {
        if (!uploadedFile) {
          setSyncError('Please upload a file first');
          setIsSyncing(false);
          return;
        }
        
        // Parse the file and get products directly instead of using state
        products = await new Promise<SyncProduct[]>((resolve: (value: SyncProduct[]) => void, reject) => {
          fetch(uploadedFile.preview)
            .then(r => r.blob())
            .then(blob => {
              const reader = new FileReader();
              
              reader.onload = (e) => {
                const text = e.target?.result as string;
                const fileType = detectFileType(text, uploadedFile.name);
                
                if (fileType === 'json') {
                  try {
                    const jsonData = JSON.parse(text);
                    const parsedProducts = Array.isArray(jsonData) ? jsonData : [jsonData];
                    setParsedProducts(parsedProducts); // Update state for future use
                    resolve(parsedProducts);
                  } catch (error) {
                    console.error('Error parsing JSON:', error);
                    setSyncError('Error parsing JSON file');
                    reject(new Error('Error parsing JSON file'));
                  }
                } else {
                  // Handle delimited files (CSV, TSV, etc.)
                  const delimiter = fileType === 'tsv' ? '\t' : ','; // Default to comma for CSV
                  
                  Papa.parse(text, {
                    header: true,
                    delimiter: delimiter,
                    complete: (results) => {
                      // Map the parsed data to ensure it matches SyncProduct structure
                      const typedData = (results.data as any[]).map(item => {
                        return {
                          product_id: item.product_id || item.id || '',
                          product_name: item.product_name || item.title || '',
                          description: item.description || '',
                          price: Number(item.price) || 0,
                          category: item.category || '',
                          tags: item.tags || '',
                          in_stock: Boolean(item.in_stock),
                          image_url: item.image_url || ''
                        } as SyncProduct;
                      });
                      setParsedProducts(typedData);
                      resolve(typedData);
                    },
                    error: (error: Error) => {
                      console.error('Error parsing delimited file:', error);
                      setSyncError('Error parsing file');
                      reject(new Error('Error parsing file'));
                    }
                  });
                }
              };
              
              reader.onerror = () => {
                setSyncError('Error reading file');
                reject(new Error('Error reading file'));
              };
              
              reader.readAsText(blob);
            })
            .catch(error => {
              setSyncError('Error loading file');
              reject(error);
            });
        }).catch(() => {
          setIsSyncing(false);
          return [];
        });
        
        // Check if we have products after parsing
        if (products.length === 0) {
          setSyncError('No products found in the uploaded file');
          setIsSyncing(false);
          return;
        }
      } else {
        // For non-file upload sources, use the existing parsedProducts state
        products = parsedProducts;
      }

      const config = createSourceConfig();
      if (!config) {
        setSyncError('Invalid source configuration');
        return;
      }

      const input: ProductSyncInput = {
        source_config: config
      };

      // Add products for manual file upload and API sources
      if (
        config.source === SyncSource.MANUAL_FILE_UPLOAD || 
        config.source === SyncSource.SUPERSEARCH_API
      ) {
        // Use the products we parsed directly
        input.products = products;
      }

      const response = await syncProductsApi(input);
      setSyncSuccess(true);
      setSyncMessage(`Products synced successfully! Sync ID: ${response.sync_id}`);
      
      // Remove automatic tab switch
      // setActiveTab(3);
    } catch (error: any) {
      console.error('Error syncing products:', error);
      setSyncError(syncApiError || error.message || 'Failed to sync products. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Detect file type based on content and file extension
  const detectFileType = (content: string, fileName: string): 'json' | 'csv' | 'tsv' => {
    // Check file extension first
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (extension === 'json') {
      return 'json';
    } else if (extension === 'tsv') {
      return 'tsv';
    } else if (extension === 'csv') {
      return 'csv';
    }
    
    // If extension doesn't clearly indicate type, try to detect from content
    try {
      // Check if content is valid JSON
      JSON.parse(content);
      return 'json';
    } catch (e) {
      // Not valid JSON, check for tab or comma delimiters
      const firstLine = content.split('\n')[0];
      
      if (firstLine.includes('\t')) {
        return 'tsv';
      } else {
        // Default to CSV for any other delimiter
        return 'csv';
      }
    }
  };

  // Create source configuration based on selected connector
  const createSourceConfig = (): SourceConfigType | null => {
    if (!selectedConnector && !configuredSource) return null;
    
    const connector = selectedConnector || configuredSource;
    if (!connector) return null;

    switch (connector.id) {
      case 'file-upload':
        // For file upload, detect file type from the uploaded file
        if (!uploadedFile) {
          setSyncError('Please upload a file first');
          return null;
        }
        
        // Get file extension to determine format
        const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();
        const fileFormat = fileExtension === 'json' ? 'json' : 'csv';
        
        return {
          source: SyncSource.MANUAL_FILE_UPLOAD,
          auto_sync: autoSync,
          sync_interval: autoSync && syncInterval ? syncInterval : undefined,
          file_format: fileFormat
        } as ManualFileUploadConfig;
      
      case 'crawler':
        return {
          source: SyncSource.CRAWLER,
          auto_sync: autoSync,
          sync_interval: autoSync && syncInterval ? syncInterval : undefined,
          urls: crawlerUrls.split('\n').map(url => url.trim()).filter(url => url),
          max_depth: maxDepth
        } as CrawlerConfig;
      
      case 'api':
        return {
          source: SyncSource.SUPERSEARCH_API,
          auto_sync: autoSync,
          sync_interval: autoSync && syncInterval ? syncInterval : undefined
        } as SupersearchApiConfig;
      
      case 'hosted-file':
        return {
          source: SyncSource.HOSTED_FILE,
          auto_sync: autoSync,
          sync_interval: autoSync && syncInterval ? syncInterval : undefined,
          file_url: fileUrl,
          file_format: hostedFileFormat,
          auth_type: hostedFileAuthType,
          username: hostedFileAuthType === AuthType.BASIC_AUTH ? username : undefined,
          password: hostedFileAuthType === AuthType.BASIC_AUTH ? password : undefined
        } as HostedFileConfig;
      
      case 'database':
        return {
          source: SyncSource.SQL_DATABASE,
          auto_sync: autoSync,
          sync_interval: autoSync && syncInterval ? syncInterval : undefined,
          database_type: databaseType,
          host,
          port,
          database,
          username: dbUsername,
          password: dbPassword,
          table_name: tableName
        } as SqlDatabaseConfig;
      
      default:
        return null;
    }
  };

  // Helper function to format source enum values
  const formatSourceName = (source: string): string => {
    switch (source) {
      case SyncSource.MANUAL_FILE_UPLOAD:
        return 'Manual File Upload';
      case SyncSource.CRAWLER:
        return 'Web Crawler';
      case SyncSource.SUPERSEARCH_API:
        return 'SuperSearch API';
      case SyncSource.HOSTED_FILE:
        return 'Hosted File';
      case SyncSource.SQL_DATABASE:
        return 'SQL Database';
      default:
        return source;
    }
  };

  // Define columns for sync history DataGrid
  const syncHistoryColumns: GridColDef<SyncHistory>[] = [
    { 
      field: 'source', 
      headerName: 'Source', 
      flex: 1,
      minWidth: 180,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const source = params.row.source;
        let icon;
        let tooltipText = '';
        
        switch (source) {
          case SyncSource.MANUAL_FILE_UPLOAD:
            icon = <CloudUploadIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />;
            tooltipText = 'Data uploaded manually via file upload';
            break;
          case SyncSource.CRAWLER:
            icon = <LanguageIcon fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />;
            tooltipText = 'Data collected via web crawler';
            break;
          case SyncSource.SUPERSEARCH_API:
            icon = <ApiIcon fontSize="small" sx={{ mr: 1, color: theme.palette.secondary.main }} />;
            tooltipText = 'Data synced via SuperSearch API';
            break;
          case SyncSource.HOSTED_FILE:
            icon = <LinkIcon fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />;
            tooltipText = 'Data imported from hosted file URL';
            break;
          case SyncSource.SQL_DATABASE:
            icon = <DatabaseIcon fontSize="small" sx={{ mr: 1, color: theme.palette.warning.main }} />;
            tooltipText = 'Data imported from SQL database';
            break;
          default:
            icon = null;
            tooltipText = source;
        }
        
        return (
          <Tooltip title={tooltipText} arrow>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%',
              py: 1
            }}>
              {icon}
              <Typography variant="body2">{formatSourceName(source)}</Typography>
            </Box>
          </Tooltip>
        );
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const status = params.row.status;
        let color, icon, label, tooltipText;
        
        switch (status) {
          case SyncStatus.SUCCESS:
            color = 'success';
            icon = <CheckIcon fontSize="small" />;
            label = 'Success';
            tooltipText = 'Sync completed successfully';
            break;
          case SyncStatus.PROCESSING:
            color = 'warning';
            icon = <SyncIcon fontSize="small" />;
            label = 'Processing';
            tooltipText = 'Sync is currently in progress';
            break;
          case SyncStatus.FAILED:
            color = 'error';
            icon = <ErrorIcon fontSize="small" />;
            label = 'Failed';
            tooltipText = 'Sync failed to complete';
            break;
          default:
            color = 'default';
            icon = <InfoIcon fontSize="small" />;
            label = status;
            tooltipText = status;
        }
        
        return (
          <Tooltip title={tooltipText} arrow>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              width: '100%',
              py: 1
            }}>
          <Chip
            size="small"
                label={label}
                color={color as any}
                icon={icon}
            variant="outlined"
                sx={{ 
                  '& .MuiChip-icon': { 
                    ml: 0.5,
                    mr: -0.5
                  },
                  fontWeight: 500,
                  borderRadius: '6px',
                  px: 0.5
                }}
              />
            </Box>
          </Tooltip>
        );
      }
    },
    { 
      field: 'startTime', 
      headerName: 'Start Time', 
      width: 220,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params: { value: string | null | undefined }) => {
        if (!params || params.value === null || params.value === undefined) return '-';
        try {
          const date = new Date(params.value);
          return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).format(date);
        } catch (error) {
          console.error('Error formatting start time:', error, params.value);
          return params.value || '-';
        }
      },
      renderCell: (params) => {
        if (!params.value) return <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>-</Box>;
        
        try {
          const date = new Date(params.value as string);
          const formattedDate = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).format(date);
          
          return (
            <Tooltip title={`Sync started at ${formattedDate}`} arrow>
              <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>
                <Typography variant="body2">{formattedDate}</Typography>
              </Box>
            </Tooltip>
          );
        } catch (error) {
          console.error('Error rendering start time:', error, params.value);
          return <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>{params.value as string || '-'}</Box>;
        }
      }
    },
    { 
      field: 'endTime', 
      headerName: 'End Time', 
      width: 220,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params: { value: string | null | undefined }) => {
        if (!params || params.value === null || params.value === undefined) return '-';
        try {
          const date = new Date(params.value);
          return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).format(date);
        } catch (error) {
          console.error('Error formatting end time:', error, params.value);
          return params.value || '-';
        }
      },
      renderCell: (params) => {
        if (!params.value) return <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>-</Box>;
        
        try {
          const date = new Date(params.value as string);
          const formattedDate = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).format(date);
          
          return (
            <Tooltip title={`Sync completed at ${formattedDate}`} arrow>
              <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>
                <Typography variant="body2">{formattedDate}</Typography>
              </Box>
            </Tooltip>
          );
        } catch (error) {
          console.error('Error rendering end time:', error, params.value);
          return <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>{params.value as string || '-'}</Box>;
        }
      }
    },
    { 
      field: 'recordsProcessed', 
      headerName: 'Records Processed', 
      type: 'number',
      width: 180,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        if (!params || !params.row || params.row.recordsProcessed === null || params.row.recordsProcessed === undefined) {
          return <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>-</Box>;
        }
        return (
          <Tooltip 
            title={`${params.row.recordsProcessed.toLocaleString()} records processed during this sync operation`}
            arrow
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%',
              py: 1
            }}>
              <Typography variant="body2">{params.row.recordsProcessed.toLocaleString()}</Typography>
            </Box>
          </Tooltip>
        );
      }
    },
    { 
      field: 'nextRun', 
      headerName: 'Next Run', 
      width: 220,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params: { value: string | null | undefined }) => {
        if (!params || params.value === null || params.value === undefined) return 'N/A';
        try {
          const date = new Date(params.value);
          return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).format(date);
        } catch (error) {
          console.error('Error formatting next run:', error, params.value);
          return params.value || 'N/A';
        }
      },
      renderCell: (params) => {
        if (!params.value) return <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>N/A</Box>;
        
        try {
          const date = new Date(params.value as string);
          const formattedDate = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).format(date);
          
          return (
            <Tooltip title={`Next scheduled run at ${formattedDate}`} arrow>
              <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>
                <Typography variant="body2">{formattedDate}</Typography>
              </Box>
            </Tooltip>
          );
        } catch (error) {
          console.error('Error rendering next run:', error, params.value);
          return <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>{params.value as string || 'N/A'}</Box>;
        }
      }
    }
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        preview: URL.createObjectURL(file)
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/tab-separated-values': ['.tsv'],
      'text/plain': ['.txt'],
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  const handleConnectorSelect = useCallback((connector: Connector) => {
    setSelectedConnector(connector);
    setActiveTab(1); // Switch to Configure Source tab
    // Reset upload state when selecting a new connector
    setUploadedFile(null);
  }, []);


  const handlePreviewFile = useCallback(async () => {
    if (!uploadedFile) return;

    const file = await fetch(uploadedFile.preview).then(r => r.blob());
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      let data: PreviewData = { headers: [], rows: [] };
      
      // Auto-detect file type
      const fileType = detectFileType(text, uploadedFile.name);

      if (fileType === 'json') {
        try {
          const jsonData = JSON.parse(text);
          const sampleData = Array.isArray(jsonData) ? jsonData.slice(0, 10) : [jsonData];
          const headers = [...new Set(sampleData.flatMap(obj => Object.keys(obj)))];
          data = {
            headers,
            rows: sampleData
          };
          setPreviewData(data);
          setPreviewOpen(true);
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      } else {
        // Handle delimited files
        const delimiter = fileType === 'tsv' ? '\t' : ','; // Default to comma for CSV
        
        Papa.parse(text, {
          header: true,
          delimiter: delimiter,
          complete: (results) => {
            data = {
              headers: results.meta.fields || [],
              rows: results.data.slice(0, 10)
            };
            setPreviewData(data);
            setPreviewOpen(true);
          }
        });
      }
    };

    reader.readAsText(file);
  }, [uploadedFile]);

  const renderConfigurationScreen = () => {
    if (!selectedConnector && !configuredSource) {
      return (
        <Box sx={{ 
          minHeight: '60vh',
        }}>
          <Typography variant="h6" color="text.primary" sx={{ mb: 3 }}>
            Please select a data source to configure
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setActiveTab(0)}
            startIcon={<ArrowBackIcon />}
            sx={buttonStyles.outlinedButton}
          >
            Browse Data Sources
          </Button>
        </Box>
      );
    }

    const connector = selectedConnector || configuredSource;
    if (!connector) return null;

    const renderConfigContent = () => {
      switch (connector.id) {
        case 'file-upload':
          return (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Upload Product Data File
                </Typography>
                <Paper
                  {...getRootProps()}
                  sx={{
                    p: 3,
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <input {...getInputProps()} />
                  <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                  {uploadedFile ? (
                    <>
                      <Typography variant="body1" gutterBottom>
                        {uploadedFile.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        File type: {uploadedFile.name.split('.').pop()?.toUpperCase() || 'Unknown'} 
                        <Chip 
                          size="small" 
                          label="Auto-detected" 
                          color="primary" 
                          variant="outlined" 
                          sx={{ ml: 1, height: 20, '& .MuiChip-label': { px: 1, py: 0 } }} 
                        />
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body1" gutterBottom>
                        {isDragActive ? 'Drop the file here' : 'Drag and drop a file here, or click to select'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Supported formats: CSV, JSON, TSV, TXT
                      </Typography>
                    </>
                  )}
                </Paper>
              </Grid>
              
              {uploadedFile && (
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button 
                    variant="outlined" 
                    onClick={handlePreviewFile}
                    startIcon={<VisibilityIcon />}
                    sx={buttonStyles.outlinedButton}
                  >
                    Preview Data
                  </Button>
                  <Button 
                    color="error" 
                    onClick={() => setUploadedFile(null)}
                    startIcon={<DeleteIcon />}
                    variant="outlined"
                    sx={buttonStyles.errorButton}
                  >
                    Remove File
                  </Button>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Sync Settings
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <Typography variant="body2" gutterBottom>
                    Enable Auto Sync
                  </Typography>
                  <Chip
                    label={autoSync ? "Enabled" : "Disabled"}
                    color={autoSync ? "success" : "default"}
                    onClick={() => setAutoSync(!autoSync)}
                    variant={autoSync ? "filled" : "outlined"}
                    sx={{ mr: 1 }}
                  />
                </FormControl>
              </Grid>
              
              {autoSync && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="sync-interval-label">Sync Interval</InputLabel>
                    <Select
                      labelId="sync-interval-label"
                      value={syncInterval}
                      label="Sync Interval"
                      onChange={(e) => setSyncInterval(e.target.value as SyncInterval)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value={SyncInterval.DAILY}>Daily</MenuItem>
                      <MenuItem value={SyncInterval.WEEKLY}>Weekly</MenuItem>
                      <MenuItem value={SyncInterval.MONTHLY}>Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          );
          
        case 'crawler':
          return (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Web Crawler Configuration
                </Typography>
                <TextField
                  fullWidth
                  label="URLs to Crawl"
                  multiline
                  rows={4}
                  placeholder="Enter one URL per line"
                  value={crawlerUrls}
                  onChange={(e) => setCrawlerUrls(e.target.value)}
                  variant="outlined"
                  helperText="Enter one URL per line. The crawler will start from these URLs."
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Crawl Depth"
                  type="number"
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                  variant="outlined"
                  helperText="How many links deep the crawler should go (1-10)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Sync Settings
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <Typography variant="body2" gutterBottom>
                    Enable Auto Sync
                  </Typography>
                  <Chip
                    label={autoSync ? "Enabled" : "Disabled"}
                    color={autoSync ? "success" : "default"}
                    onClick={() => setAutoSync(!autoSync)}
                    variant={autoSync ? "filled" : "outlined"}
                    sx={{ mr: 1 }}
                  />
                </FormControl>
              </Grid>
              
              {autoSync && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="sync-interval-label">Sync Interval</InputLabel>
                    <Select
                      labelId="sync-interval-label"
                      value={syncInterval}
                      label="Sync Interval"
                      onChange={(e) => setSyncInterval(e.target.value as SyncInterval)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value={SyncInterval.DAILY}>Daily</MenuItem>
                      <MenuItem value={SyncInterval.WEEKLY}>Weekly</MenuItem>
                      <MenuItem value={SyncInterval.MONTHLY}>Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          );
          
        case 'api':
          return (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Supersearch API Configuration
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  This connector uses the Supersearch API to sync product data. No additional configuration is needed.
                </Alert>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Sync Settings
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <Typography variant="body2" gutterBottom>
                    Enable Auto Sync
                  </Typography>
                  <Chip
                    label={autoSync ? "Enabled" : "Disabled"}
                    color={autoSync ? "success" : "default"}
                    onClick={() => setAutoSync(!autoSync)}
                    variant={autoSync ? "filled" : "outlined"}
                    sx={{ mr: 1 }}
                  />
                </FormControl>
              </Grid>
              
              {autoSync && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="sync-interval-label">Sync Interval</InputLabel>
                    <Select
                      labelId="sync-interval-label"
                      value={syncInterval}
                      label="Sync Interval"
                      onChange={(e) => setSyncInterval(e.target.value as SyncInterval)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value={SyncInterval.DAILY}>Daily</MenuItem>
                      <MenuItem value={SyncInterval.WEEKLY}>Weekly</MenuItem>
                      <MenuItem value={SyncInterval.MONTHLY}>Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          );
          
        case 'hosted-file':
          return (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Hosted File Configuration
                </Typography>
                <TextField
                  fullWidth
                  label="File URL"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  variant="outlined"
                  placeholder="https://example.com/products.csv"
                  helperText="Enter the URL of the hosted file"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="file-format-label">File Format</InputLabel>
                  <Select
                    labelId="file-format-label"
                    value={hostedFileFormat}
                    label="File Format"
                    onChange={(e) => setHostedFileFormat(e.target.value as 'csv' | 'json')}
                  >
                    <MenuItem value="csv">CSV</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="auth-type-label">Authentication</InputLabel>
                  <Select
                    labelId="auth-type-label"
                    value={hostedFileAuthType}
                    label="Authentication"
                    onChange={(e) => setHostedFileAuthType(e.target.value as AuthType)}
                  >
                    <MenuItem value={AuthType.PUBLIC}>Public (No Auth)</MenuItem>
                    <MenuItem value={AuthType.BASIC_AUTH}>Basic Auth</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {hostedFileAuthType === AuthType.BASIC_AUTH && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                </>
              )}
              
                <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Sync Settings
                </Typography>
                </Grid>

              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <Typography variant="body2" gutterBottom>
                    Enable Auto Sync
                  </Typography>
                  <Chip
                    label={autoSync ? "Enabled" : "Disabled"}
                    color={autoSync ? "success" : "default"}
                    onClick={() => setAutoSync(!autoSync)}
                    variant={autoSync ? "filled" : "outlined"}
                    sx={{ mr: 1 }}
                  />
                </FormControl>
              </Grid>
              
              {autoSync && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="sync-interval-label">Sync Interval</InputLabel>
                    <Select
                      labelId="sync-interval-label"
                      value={syncInterval}
                      label="Sync Interval"
                      onChange={(e) => setSyncInterval(e.target.value as SyncInterval)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                      <MenuItem value={SyncInterval.DAILY}>Daily</MenuItem>
                      <MenuItem value={SyncInterval.WEEKLY}>Weekly</MenuItem>
                      <MenuItem value={SyncInterval.MONTHLY}>Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          );

        case 'database':
          return (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Database Configuration
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="db-type-label">Database Type</InputLabel>
                  <Select
                    labelId="db-type-label"
                    value={databaseType}
                  label="Database Type"
                    onChange={(e) => setDatabaseType(e.target.value as DatabaseType)}
                  >
                    <MenuItem value={DatabaseType.POSTGRESQL}>PostgreSQL</MenuItem>
                    <MenuItem value={DatabaseType.MYSQL}>MySQL</MenuItem>
                    <MenuItem value={DatabaseType.SQLITE}>SQLite</MenuItem>
                    <MenuItem value={DatabaseType.MSSQL}>Microsoft SQL Server</MenuItem>
                    <MenuItem value={DatabaseType.ORACLE}>Oracle</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Host"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  variant="outlined"
                  placeholder="localhost or IP address"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Port"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value))}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Database Name"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={dbUsername}
                  onChange={(e) => setDbUsername(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={dbPassword}
                  onChange={(e) => setDbPassword(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Table Name"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  variant="outlined"
                  helperText="Name of the table containing product data"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Sync Settings
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <Typography variant="body2" gutterBottom>
                    Enable Auto Sync
                  </Typography>
                  <Chip
                    label={autoSync ? "Enabled" : "Disabled"}
                    color={autoSync ? "success" : "default"}
                    onClick={() => setAutoSync(!autoSync)}
                    variant={autoSync ? "filled" : "outlined"}
                    sx={{ mr: 1 }}
                  />
                </FormControl>
              </Grid>
              
              {autoSync && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="sync-interval-label">Sync Interval</InputLabel>
                    <Select
                      labelId="sync-interval-label"
                      value={syncInterval}
                      label="Sync Interval"
                      onChange={(e) => setSyncInterval(e.target.value as SyncInterval)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value={SyncInterval.DAILY}>Daily</MenuItem>
                      <MenuItem value={SyncInterval.WEEKLY}>Weekly</MenuItem>
                      <MenuItem value={SyncInterval.MONTHLY}>Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          );

        default:
          return (
            <Typography variant="body1">
              Configuration options for {connector.title} will be available soon.
            </Typography>
          );
      }
    };

    return (
      <Box sx={{ minHeight: '60vh' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            onClick={() => {
              setSelectedConnector(null);
              setConfiguredSource(null);
            }}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" color="text.primary">
            Configure {connector.title}
          </Typography>
        </Box>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          {renderConfigContent()}
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSyncProducts}
            disabled={isSyncing}
            startIcon={isSyncing ? <CircularProgress size={20} color="inherit" /> : null}
            sx={buttonStyles.containedButton}
          >
            {isSyncing ? 'Syncing...' : 'Sync Products'}
          </Button>
        </Box>

        {/* Success Snackbar */}
        <Snackbar
          open={syncSuccess}
          autoHideDuration={5000}
          onClose={() => setSyncSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSyncSuccess(false)} 
            severity="success" 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {syncMessage || 'Products synced successfully!'}{' '}
            <Link 
              component="button"
              onClick={() => setActiveTab(3)}
              sx={{ 
                color: 'inherit',
                textDecoration: 'underline', 
                cursor: 'pointer',
                fontWeight: 'medium'
              }}
            >
              See sync history
            </Link>
          </Alert>
        </Snackbar>

        {/* Error Snackbar */}
        <Snackbar
          open={syncError !== null}
          autoHideDuration={5000}
          onClose={() => setSyncError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSyncError(null)} 
            severity="error" 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {syncError}
          </Alert>
        </Snackbar>
      </Box>
    );
  };

  const PreviewDialog = () => (
    <Dialog
      open={previewOpen}
      onClose={() => setPreviewOpen(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        Data Preview
        <Typography variant="caption" display="block" color="text.secondary">
          Showing first 10 rows
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ overflowX: 'auto' }}>
        {previewData && (
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ 
                backgroundColor: 'primary.main', 
                '& th': { 
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap'
                } 
              }}>
                {previewData.headers.map((header) => (
                  <TableCell key={header}>{header}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.rows.map((row, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:nth-of-type(odd)': { 
                      backgroundColor: 'action.hover' 
                    }
                  }}
                >
                  {previewData.headers.map((header) => (
                    <TableCell key={`${index}-${header}`}>
                      {row[header]?.toString().trim() || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setPreviewOpen(false)}
          variant="outlined"
          sx={buttonStyles.outlinedButton}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Handle pagination change for sync history
  const handleSyncHistoryPaginationChange = (model: GridPaginationModel) => {
    const newPage = model.page + 1; // Convert from 0-indexed to 1-indexed
    const newPageSize = model.pageSize;
    
    if (newPage !== syncHistoryPage || newPageSize !== syncHistoryPageSize) {
      setSyncHistoryPage(newPage);
      setSyncHistoryPageSize(newPageSize);
      fetchSyncHistory(newPage, newPageSize);
    }
  };
  
  // Handle pagination change for products
  const handleProductPaginationChange = (model: GridPaginationModel) => {
    const newPage = model.page + 1; // Convert from 0-indexed to 1-indexed
    const newPageSize = model.pageSize;
    
    if (newPage !== productPage || newPageSize !== productPageSize) {
      setProductPage(newPage);
      setProductPageSize(newPageSize);
      fetchProducts(newPage, newPageSize);
    }
  };

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      p: { xs: 2, sm: 3 },
    }}>
      <Box sx={{
        maxWidth: {
          xs: '100%',
          sm: '100%',
          md: '800px',
          lg: '900px',
        },
        mx: 'auto',
      }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Data Sources
        </Typography>
        
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          width: '100%',
          mb: 6,
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                minWidth: 120,
                mx: 1,
                position: 'relative',
                '&:hover': {
                  '&::after': {
                    width: '100%',
                  },
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '0%',
                  height: '3px',
                  backgroundColor: 'primary.main',
                  transition: 'width 0.3s ease',
                },
                '&:focus': {
                  outline: 'none',
                },
                '&.Mui-focusVisible': {
                  outline: 'none',
                },
                '&.Mui-selected': {
                  color: 'text.primary',
                  fontWeight: 600,
                  '&::after': {
                    width: '100%',
                  }
                }
              },
              '& .MuiTabs-indicator': {
                height: 0 // Hide the default indicator since we're using our custom underline
              }
            }}
          >
            <Tab label="Sources" />
            <Tab label="Configure Source" />
            <Tab label="Product Catalog" />
            <Tab label="Sync History" />
          </Tabs>
        </Box>

        <Box sx={{ 
          width: '100%',
        }}>
          <TabPanel value={activeTab} index={0}>
            <Box 
              sx={{ 
                width: '100%',
                maxWidth: {
                  xs: '100%',
                  sm: '500px',
                  md: '600px',
                  lg: '700px',
                },
                mx: 'auto',
              }}
            >
              {/* Header section with introduction */}
              <Box 
                sx={{ 
                  mb: 6, 
                  p: 4, 
                  borderRadius: 3,
                  background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)}, ${alpha(theme.palette.primary.main, 0.03)})`,
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: {xs: 'column', sm: 'row'},
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Box 
                  sx={{
                    width: {xs: '60px', sm: '60px'},
                    height: {xs: '60px', sm: '60px'},
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    color: 'white',
                    flexShrink: 0,
                    boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`
                  }}
                >
                  <StorageIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.75, letterSpacing: '-0.02em' }}>
                    Data Sources
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '650px', lineHeight: 1.5 }}>
                    Connect to various data sources to import your product catalog. Your data will be automatically synced and made searchable.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 6 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 4, 
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    position: 'relative',
                    pl: 2,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 4,
                      height: '60%',
                      bgcolor: 'primary.main',
                      borderRadius: 8,
                    }
                  }}
                >
                  Native Connectors
                </Typography>
                <Grid container spacing={4}>
                  {nativeConnectors.map((connector) => (
                    <Grid item xs={12} sm={6} key={connector.id}>
                      <Card
                        sx={{
                          height: '100%',
                          minHeight: '240px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderRadius: 4,
                          border: '1px solid',
                          borderColor: (theme) => theme.palette.mode === 'dark' ? 'divider' : alpha(theme.palette.grey[400], 0.5),
                          bgcolor: 'background.paper',
                          overflow: 'hidden',
                          position: 'relative',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: (theme) => `0 20px 40px ${alpha(theme.palette.primary.main, 0.12)}`,
                            borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                            '& .connector-icon-container': {
                              transform: 'scale(1.05)',
                              boxShadow: (theme) => `0 10px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                            },
                            '& .connector-button': {
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                            borderColor: 'primary.main',
                              boxShadow: (theme) => `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
                            }
                          },
                        }}
                        onClick={() => handleConnectorSelect(connector)}
                      >
                        <CardContent sx={{ p: 3, flex: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box 
                              className="connector-icon-container"
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.primary.light, 0.08)})`,
                                color: 'primary.main',
                                mb: 2.5,
                                transition: 'all 0.3s ease',
                              }}
                            >
                              <connector.icon sx={{ fontSize: 28 }} />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <Typography variant="h6" sx={{ 
                                fontSize: '1.25rem',
                                  fontWeight: 600,
                                letterSpacing: '-0.01em',
                                }}>
                                  {connector.title}
                                </Typography>
                                {connector.tag && (
                                  <Chip
                                    label={connector.tag}
                                    size="small"
                                  color="primary"
                                    sx={{ 
                                    height: 22,
                                      '& .MuiChip-label': {
                                      px: 1,
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                        lineHeight: 1,
                                      },
                                    }}
                                  />
                                )}
                            </Box>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                lineHeight: 1.7,
                                mb: 2
                              }}
                            >
                              {connector.description}
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions sx={{ 
                          px: 3,
                          pb: 3,
                          pt: 0,
                          mt: 'auto'
                        }}>
                          <Button 
                            className="connector-button"
                            variant="contained" 
                            color="primary" 
                            fullWidth
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                              py: 1,
                              textTransform: 'none',
                              fontWeight: 500,
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                            }}
                          >
                            Connect
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider sx={{ my: 6, borderColor: (theme) => alpha(theme.palette.divider, 0.5) }} />

              <Box sx={{ mb: 6 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 4, 
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    position: 'relative',
                    pl: 2,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 4,
                      height: '60%',
                      bgcolor: theme => theme.palette.accent.navy,
                      borderRadius: 8,
                    }
                  }}
                >
                  External Connectors
                </Typography>
                <Grid container spacing={4}>
                  {externalConnectors.map((connector) => (
                    <Grid item xs={12} sm={6} key={connector.id}>
                      <Card
                        sx={{
                          height: '100%',
                          minHeight: '240px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderRadius: 4,
                          border: '1px solid',
                          borderColor: (theme) => theme.palette.mode === 'dark' ? 'divider' : alpha(theme.palette.grey[400], 0.5),
                          bgcolor: 'background.paper',
                          overflow: 'hidden',
                          position: 'relative',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: (theme) => `0 20px 40px ${alpha(theme.palette.accent.navy, 0.12)}`,
                            borderColor: (theme) => alpha(theme.palette.accent.navy, 0.3),
                            '& .connector-icon-container': {
                              transform: 'scale(1.05)',
                              boxShadow: (theme) => `0 10px 20px ${alpha(theme.palette.accent.navy, 0.2)}`,
                            },
                            '& .connector-button': {
                              bgcolor: theme => alpha(theme.palette.accent.navy, 0.9),
                              boxShadow: (theme) => `0 8px 16px ${alpha(theme.palette.accent.navy, 0.25)}`,
                            }
                          },
                        }}
                        onClick={() => handleConnectorSelect(connector)}
                      >
                        <CardContent sx={{ p: 3, flex: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box 
                              className="connector-icon-container"
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.accent.navy, 0.12)}, ${alpha(theme.palette.accent.navy, 0.08)})`,
                                color: theme => theme.palette.accent.navy,
                                mb: 2.5,
                                transition: 'all 0.3s ease',
                              }}
                            >
                              <connector.icon sx={{ fontSize: 28 }} />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <Typography variant="h6" sx={{ 
                                fontSize: '1.25rem',
                                  fontWeight: 600,
                                letterSpacing: '-0.01em',
                                }}>
                                  {connector.title}
                                </Typography>
                                {connector.tag && (
                                  <Chip
                                    label={connector.tag}
                                    size="small"
                                  color="secondary"
                                    sx={{ 
                                    height: 22,
                                      '& .MuiChip-label': {
                                      px: 1,
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                        lineHeight: 1,
                                      },
                                    }}
                                  />
                                )}
                            </Box>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                lineHeight: 1.7,
                                mb: 2
                              }}
                            >
                              {connector.description}
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions sx={{ 
                          px: 3,
                          pb: 3,
                          pt: 0,
                          mt: 'auto'
                        }}>
                          <Button 
                            className="connector-button"
                            variant="contained" 
                            sx={{
                              py: 1,
                              textTransform: 'none',
                              fontWeight: 500,
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              bgcolor: theme => theme.palette.accent.navy,
                              color: '#FAF7F5',
                              '&:hover': {
                                bgcolor: theme => alpha(theme.palette.accent.navy, 0.9),
                              }
                            }}
                            fullWidth
                            endIcon={<ArrowForwardIcon />}
                          >
                            Learn More
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Request Connector Section */}
              <Box sx={{ mt: 6, mb: 4 }}>
                <Card 
                  sx={{ 
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: (theme) => theme.palette.mode === 'dark' ? 'divider' : alpha(theme.palette.grey[400], 0.5),
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.8)}, ${alpha(theme.palette.background.paper, 0.9)})`,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                      <Box 
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)}, ${alpha(theme.palette.primary.main, 0.1)})`,
                          color: 'primary.main',
                          flexShrink: 0
                        }}
                      >
                        <AddIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, letterSpacing: '-0.01em' }}>
                          Need a different connector?
                    </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: '600px', lineHeight: 1.6 }}>
                          Don't see the connector you need? Let us know what data source you'd like to connect to.
                    </Typography>
                        
                    <TextField
                      fullWidth
                      variant="outlined"
                          placeholder="Describe the connector you need..."
                          multiline
                          rows={2}
                      sx={{
                            mb: 2,
                        '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: 'background.paper',
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                              '&.Mui-focused fieldset': {
                                borderColor: 'primary.main',
                              },
                            }
                          }}
                        />
                        
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{
                            py: 1,
                            px: 3,
                            textTransform: 'none',
                            fontWeight: 500,
                            borderRadius: 2,
                            color: 'primary.contrastText',
                          }}
                        >
                          Submit Request
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {renderConfigurationScreen()}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>Product Catalog</Typography>
              
              {productError && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 4, 
                    borderRadius: 2,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`
                  }}
                >
                  {productError}
                </Alert>
              )}
              
              <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <DataGrid
                  rows={products}
                  columns={productColumns}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize: productPageSize,
                        page: productPage - 1,
                      },
                    },
                  }}
                  pageSizeOptions={[5, 10, 25]}
                  checkboxSelection
                  disableRowSelectionOnClick
                  autoHeight
                  loading={productsLoading}
                  slots={{ 
                    toolbar: GridToolbar,
                    noRowsOverlay: () => (
                      <Stack height="100%" alignItems="center" justifyContent="center">
                        <Typography variant="body2" color="text.secondary">
                          {productsLoading ? 'Loading...' : 'No products found'}
                        </Typography>
                      </Stack>
                    )
                  }}
                  slotProps={{
                    toolbar: {
                      showQuickFilter: true,
                    },
                  }}
                  paginationMode="server"
                  rowCount={productTotalCount}
                  paginationModel={{
                    page: productPage - 1,
                    pageSize: productPageSize,
                  }}
                  onPaginationModelChange={handleProductPaginationChange}
                  sx={{ 
                    minHeight: 400,
                    '& .MuiDataGrid-cell': {
                      display: 'flex',
                      alignItems: 'center',
                    }
                  }}
                  getRowId={(row) => row.product_id || row.id || Math.random().toString()}
                />
              </Paper>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>Sync History</Typography>
              <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <DataGrid
                  rows={syncHistory}
                  columns={syncHistoryColumns}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize: syncHistoryPageSize,
                        page: syncHistoryPage - 1,
                      },
                    },
                  }}
                  pageSizeOptions={[5, 10, 25]}
                  checkboxSelection
                  disableRowSelectionOnClick
                  autoHeight
                  loading={syncHistoryLoading}
                  slots={{ 
                    toolbar: GridToolbar,
                    noRowsOverlay: () => (
                      <Stack height="100%" alignItems="center" justifyContent="center">
                        <Typography variant="body2" color="text.secondary">
                          {syncHistoryLoading ? 'Loading...' : 'No sync history found'}
                        </Typography>
                      </Stack>
                    )
                  }}
                  slotProps={{
                    toolbar: {
                      showQuickFilter: true,
                    },
                  }}
                  paginationMode="server"
                  rowCount={syncHistoryTotalCount}
                  paginationModel={{
                    page: syncHistoryPage - 1,
                    pageSize: syncHistoryPageSize,
                  }}
                  onPaginationModelChange={handleSyncHistoryPaginationChange}
                  sx={{ 
                    minHeight: 400,
                    '& .MuiDataGrid-cell': {
                      display: 'flex',
                      alignItems: 'center',
                    }
                  }}
                />
              </Paper>
            </Box>
          </TabPanel>
        </Box>
      </Box>
      <PreviewDialog />
    </Box>
  );
} 