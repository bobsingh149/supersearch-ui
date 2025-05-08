import React, { useEffect, useState, useRef, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Tooltip,
  Stack,
  alpha,
  Button,
  IconButton,
  CircularProgress,
  Divider,
  useTheme,
  Collapse,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  Container,
  CssBaseline
} from '@mui/material';
import { 
  DataGrid, 
  GridColDef,
  GridToolbar,
  GridPaginationModel,
  GridRenderCellParams
} from '@mui/x-data-grid';
import { 
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon,
  ArrowBack as ArrowBackIcon,
  Inventory as InventoryIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowForward as ArrowForwardIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ShoppingBag as ShoppingBagIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useOrdersList, Order } from '../../hooks/useOrdersList';
import { useNavigate } from 'react-router-dom';
import AISearchBar, { AISearchBarRef } from '../Products/ai_shopping/AISearchBar';
import ContactUsModal from './components/ContactUsModal';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../../theme/theme';
import { ThemeContext } from '../../App';

const DemoOrders: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { 
    orders, 
    loading, 
    error, 
    page, 
    pageSize, 
    totalCount,
    fetchOrders,
  } = useOrdersList();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Use the global theme context instead of local state
  const { mode, toggleTheme } = useContext(ThemeContext);
  
  const [contactModalOpen, setContactModalOpen] = useState(false);
  
  // Updated refs with proper typing
  const desktopSearchRef = useRef<AISearchBarRef>(null);
  const mobileSearchRef = useRef<AISearchBarRef>(null);
  
  // Use the theme from theme.ts
  const currentTheme = getTheme(mode);

  useEffect(() => {
    fetchOrders(1, 10);
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'success';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    const newPage = model.page + 1; // DataGrid uses 0-based indexing
    const newPageSize = model.pageSize;

    if (newPage !== page || newPageSize !== pageSize) {
      fetchOrders(newPage, newPageSize);
    }
  };

  const handleGoBack = () => {
    navigate('/demo_site');
  };

  const handleExpandOrder = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Contact modal handlers
  const handleContactModalOpen = () => {
    setContactModalOpen(true);
  };

  const handleContactModalClose = () => {
    setContactModalOpen(false);
  };

  // Function to handle search
  const handleSearch = () => {
    // Get the search query from the AISearchBar
    const searchQuery = desktopSearchRef.current?.getSearchQuery() || 
                        mobileSearchRef.current?.getSearchQuery() || '';
                        
    // Redirect to DemoEcommerce with the search query as a URL parameter
    navigate(`/demo_site?q=${encodeURIComponent(searchQuery)}`);
  };

  const renderOrderSummary = (order: Order) => {
    const items = order.items || [];
    const itemCount = items.length;
    
    return (
      <Collapse in={expandedOrderId === order.id} timeout="auto" unmountOnExit>
        <Box sx={{ p: { xs: 1, sm: 2 }, pt: 0, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Divider sx={{ my: 1.5 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                    <InventoryIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                    Order Items ({itemCount})
                  </Typography>
                  <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
                    {items.map((item, index) => (
                      <Box key={index} sx={{ 
                        mb: 1.5, 
                        p: 1.5, 
                        borderRadius: 1,
                        bgcolor: 'background.default'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <Box 
                            sx={{ 
                              width: 50, 
                              height: 50, 
                              borderRadius: 1, 
                              bgcolor: 'primary.main', 
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 2,
                              flexShrink: 0
                            }}
                          >
                            {item.custom_data?.poster_path ? (
                              <Box 
                                component="img" 
                                src={item.custom_data.poster_path}
                                alt={item.title}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1 }}
                              />
                            ) : (
                              <InventoryIcon />
                            )}
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2">{item.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Qty: {item.quantity} • ${item.price.toFixed(2)}
                            </Typography>
                            {item.custom_data?.genres && (
                              <Chip 
                                size="small" 
                                label={item.custom_data.genres.replace(/[\[\]']/g, '').split(',')[0]} 
                                sx={{ mt: 1, height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                    <ShippingIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                    Shipping Information
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {order.shipping_address.full_name}
                    </Typography>
                    <Typography variant="body2">
                      {order.shipping_address.address_line1}
                    </Typography>
                    {order.shipping_address.address_line2 && (
                      <Typography variant="body2">
                        {order.shipping_address.address_line2}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                    </Typography>
                    <Typography variant="body2">
                      {order.shipping_address.country}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Phone: {order.shipping_address.phone}
                    </Typography>
                  </Box>
                  {order.tracking_number && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="body2" color="text.secondary">
                        Tracking Number: 
                        <Typography component="span" sx={{ fontWeight: 'bold', ml: 1 }}>
                          {order.tracking_number}
                        </Typography>
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                    <PaymentIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                    Payment Details
                  </Typography>
                  <Box>
                    <Typography variant="body2">
                      Method: <Typography component="span" sx={{ fontWeight: 'medium' }}>
                        {order.payment_info.payment_method.replace('_', ' ')}
                      </Typography>
                    </Typography>
                    <Typography variant="body2">
                      Status: <Chip 
                        size="small" 
                        label={order.payment_info.payment_status}
                        color={order.payment_info.payment_status === 'completed' ? 'success' : 'default'}
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    </Typography>
                    <Typography variant="body2">
                      Amount: {order.payment_info.currency} {order.payment_info.amount_paid.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
                      Transaction ID: {order.payment_info.transaction_id}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'order_number',
      headerName: 'Order #',
      width: 180,
      renderCell: (params: GridRenderCellParams<Order>) => {
        const id = params.row.id.slice(0, 8).toUpperCase();
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ReceiptIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {id}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params: GridRenderCellParams<Order>) => {
        const status = params.row.status;
        return (
          <Chip 
            label={status.charAt(0).toUpperCase() + status.slice(1)} 
            color={getStatusColor(status)}
            size="small"
            sx={{ 
              minWidth: 90,
              fontWeight: 'medium'
            }}
          />
        );
      }
    },
    {
      field: 'items',
      headerName: 'Items',
      width: 120,
      align: 'center',
      renderCell: (params: GridRenderCellParams<Order>) => {
        const itemCount = params.row.items.length;
        return (
          <Tooltip title={`${itemCount} item(s) in this order`}>
            <Chip 
              label={itemCount} 
              size="small"
              variant="outlined"
              sx={{ 
                minWidth: 40,
                fontWeight: 'medium'
              }}
            />
          </Tooltip>
        );
      }
    },
    {
      field: 'first_item_title',
      headerName: 'Title',
      width: 220,
      renderCell: (params: GridRenderCellParams<Order>) => {
        const firstItem = params.row.items && params.row.items.length > 0 ? params.row.items[0] : null;
        if (!firstItem) {
          return (
            <Typography variant="body2" color="text.secondary">
              No items
            </Typography>
          );
        }
        
        const hasMoreItems = params.row.items.length > 1;
        
        return (
          <Tooltip title={hasMoreItems ? `${params.row.items.length - 1} more item(s) in this order` : ""}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              {firstItem.custom_data?.poster_path && (
                <Box 
                  component="img" 
                  src={firstItem.custom_data.poster_path}
                  alt={firstItem.title}
                  sx={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: 0.5, 
                    objectFit: 'cover',
                    mr: 1
                  }}
                />
              )}
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'medium',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {firstItem.title}
                {hasMoreItems && (
                  <Typography 
                    component="span" 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ ml: 0.5 }}
                  >
                    +{params.row.items.length - 1}
                  </Typography>
                )}
              </Typography>
            </Box>
          </Tooltip>
        );
      }
    },
    {
      field: 'total_amount',
      headerName: 'Total',
      width: 120,
      align: 'right',
      renderCell: (params: GridRenderCellParams<Order>) => {
        return (
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            ${params.row.total_amount.toFixed(2)}
          </Typography>
        );
      }
    },
    {
      field: 'customer',
      headerName: 'Customer',
      width: 200,
      renderCell: (params: GridRenderCellParams<Order>) => {
        return (
          <Typography variant="body2">
            {params.row.shipping_address.full_name}
          </Typography>
        );
      }
    },
    {
      field: 'created_at',
      headerName: 'Order Date',
      width: 180,
      renderCell: (params: GridRenderCellParams<Order>) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ScheduleIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
            <Typography variant="body2">
              {formatDate(params.row.created_at)}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'expected_shipping_date',
      headerName: 'Expected Shipping',
      width: 180,
      renderCell: (params: GridRenderCellParams<Order>) => {
        return params.row.expected_shipping_date ? (
          <Typography variant="body2">
            {formatDate(params.row.expected_shipping_date)}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            N/A
          </Typography>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 120,
      renderCell: (params: GridRenderCellParams<Order>) => {
        const isExpanded = expandedOrderId === params.row.id;
        
        return (
          <Box>
            <IconButton 
              size="small" 
              onClick={() => handleExpandOrder(params.row.id)}
              sx={{ 
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                color: isExpanded ? 'primary.main' : 'text.secondary'
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
            <Tooltip title="View order details">
              <IconButton 
                size="small"
                onClick={() => null} // Future implementation: navigate to a detailed order page
                sx={{ ml: 1 }}
              >
                <ArrowForwardIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      }
    }
  ];

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: currentTheme.palette.mode === 'dark' ? 'background.default' : '#f5f5f7',
        width: '100vw',
        maxWidth: '100vw',
        overflowX: 'hidden',
        margin: 0,
        padding: 0,
        position: 'relative'
      }}>
        {/* Header AppBar */}
        <AppBar 
          position="fixed"
          color="default" 
          elevation={0}
          sx={{ 
            bgcolor: alpha(currentTheme.palette.background.paper, 0.8),
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            zIndex: currentTheme.zIndex.drawer + 1,
            width: '100vw',
            left: 0,
            right: 0,
            margin: 0,
            height: { xs: 'auto', md: '64px' }
          }}
        >
          <Toolbar sx={{ 
            py: 1, 
            px: { xs: 2, md: 3 },
            minHeight: '56px',
            height: 'auto'
          }}>
            {/* Logo */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mr: { md: 4 }
            }}>
              <Box 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  color: 'white',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/demo_site')}
              >
                <ShoppingBagIcon fontSize="small" />
              </Box>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 700,
                  color: 'primary.main',
                  fontSize: { xs: '0.9rem', sm: '1.1rem' },
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/demo_site')}
              >
                CogniDemo
              </Typography>
            </Box>
            
            {/* Search Bar - Desktop */}
            <Box sx={{ 
              flexGrow: 1, 
              mx: 2, 
              display: { xs: 'none', md: 'block' } 
            }}>
              <AISearchBar 
                onSearch={handleSearch}
                ref={desktopSearchRef}
              />
            </Box>
            
            {/* Action Icons */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', gap: 2 }}>
              <Tooltip title="Visit CogniShop Website">
                <IconButton
                  size="small"
                  color="inherit"
                  component="a"
                  href="https://www.cognishop.co/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LanguageIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
                <IconButton size="small" onClick={toggleTheme} color="inherit">
                  {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                color="primary"
                onClick={handleContactModalOpen}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: { xs: 2, sm: 4 },
                  py: { xs: 0.75, sm: 1 },
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  minWidth: { xs: 'auto', sm: '140px' }
                }}
              >
                Contact Us
              </Button>
            </Box>
          </Toolbar>
          
          {/* Search Bar - Mobile */}
          <Box sx={{ 
            px: { xs: 2, md: 3 }, 
            pb: 1, 
            display: { xs: 'block', md: 'none' } 
          }}>
            <AISearchBar 
              onSearch={handleSearch}
              ref={mobileSearchRef}
            />
          </Box>
        </AppBar>

        {/* Contact Form Modal */}
        <ContactUsModal
          open={contactModalOpen}
          onClose={handleContactModalClose}
        />

        {/* Main Content */}
        <Container 
          maxWidth={false} 
          disableGutters 
          sx={{ 
            pt: { xs: 20, md: 10 },
            pb: 4, 
            px: { xs: 1, sm: 2, md: 3 },
            maxWidth: '1600px', 
            mx: 'auto' 
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pl: 1 }}>
            <IconButton onClick={handleGoBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              Orders
            </Typography>
          </Box>

          <Paper sx={{ 
            width: '100%', 
            overflow: 'hidden',
            boxShadow: theme => theme.shadows[1],
            borderRadius: 1,
            mx: 'auto'
          }}>
            {error && (
              <Box sx={{ p: 2, mb: 2 }}>
                <Typography color="error">{error}</Typography>
              </Box>
            )}
            
            <DataGrid
              rows={orders}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize,
                    page: page - 1, // DataGrid uses 0-based indexing
                  },
                },
              }}
              pageSizeOptions={[5, 10, 25, 50]}
              autoHeight
              loading={loading}
              slots={{
                toolbar: GridToolbar,
                noRowsOverlay: () => (
                  <Stack height="100%" alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                    {loading ? (
                      <CircularProgress size={36} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No orders found
                      </Typography>
                    )}
                  </Stack>
                )
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                },
              }}
              paginationMode="server"
              rowCount={totalCount}
              paginationModel={{
                page: page - 1, // DataGrid uses 0-based indexing
                pageSize,
              }}
              onPaginationModelChange={handlePaginationModelChange}
              getDetailPanelContent={(params) => renderOrderSummary(params.row as Order)}
              sx={{
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-row': {
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  },
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-cell': {
                  display: 'flex',
                  alignItems: 'center',
                  p: '8px 10px',
                  pl: 1,
                },
                '& .MuiDataGrid-columnHeaders': {
                  pl: 0,
                  pr: 0,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                },
                '& .MuiDataGrid-columnHeader': {
                  pl: 1,
                  pr: 0,
                },
                '& .MuiDataGrid-toolbarContainer': {
                  pl: 1,
                  pr: 1,
                  pt: 1,
                  pb: 0,
                },
                '& .MuiTablePagination-root': {
                  mr: 1
                },
                borderRadius: 1,
                border: 'none',
                p: 0
              }}
            />
          </Paper>
        </Container>
        
        {/* Footer */}
        <Box 
          component="footer" 
          sx={{ 
            py: 4, 
            textAlign: 'center',
            borderTop: '1px solid',
            borderColor: 'divider',
            mt: 6,
            width: '100%'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} SuperShop Demo. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
            This is a demo site. No real purchases can be made.
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default DemoOrders; 