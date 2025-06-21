import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Stack,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  Collapse,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InventoryIcon from '@mui/icons-material/Inventory';
import PaymentIcon from '@mui/icons-material/Payment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ecommerceTheme from './theme/ecommerceTheme';
import GlobalHeader from './components/GlobalHeader';
import ContactUsModal from './components/ContactUsModal';
import EcommerceAISearchBar, { AISearchBarRef } from './components/EcommerceAISearchBar';
import { useOrdersList, Order } from '../../hooks/useOrdersList';
import { useNavigate } from 'react-router-dom';

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'success';
    case 'shipped':
      return 'info';
    case 'pending':
      return 'warning';
    case 'processing':
      return 'info';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return <CheckCircleIcon fontSize="small" />;
    case 'shipped':
      return <LocalShippingIcon fontSize="small" />;
    case 'pending':
      return <ShoppingBagIcon fontSize="small" />;
    case 'processing':
      return <ScheduleIcon fontSize="small" />;
    default:
      return undefined;
  }
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

const EcommerceOrders: React.FC = () => {
  const { 
    orders, 
    loading, 
    error, 
    fetchOrders 
  } = useOrdersList();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const theme = ecommerceTheme;
  const navigate = useNavigate();

  // Add refs for search functionality
  const desktopSearchRef = useRef<AISearchBarRef>(null);
  const mobileSearchRef = useRef<AISearchBarRef>(null);

  // Function to handle search by redirecting to home page with query params
  const handleSearch = () => {
    // Get the search query from the AISearchBar
    const searchQuery = desktopSearchRef.current?.getSearchQuery() || 
                        mobileSearchRef.current?.getSearchQuery() || '';
                        
    // Redirect to EcommerceHome with the search query as a URL parameter
    navigate(`/demo_ecommerce?q=${encodeURIComponent(searchQuery)}`);
  };

  useEffect(() => {
    fetchOrders(1, 10);
  }, []);

  const handleExpandOrder = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}>
        {/* Global Header */}
        <GlobalHeader 
          onContactUs={() => setContactModalOpen(true)}
          searchRef={desktopSearchRef}
          onSearch={handleSearch}
        />

        {/* Contact Form Modal */}
        <ContactUsModal
          open={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
        />

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ pt: 16, pb: 8 }}>
          {/* Back Button */}
          <Box sx={{ mb: 2 }}>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/demo_ecommerce')}
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                fontWeight: 500,
                px: 1,
                py: 0.5,
                borderRadius: 1.5,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main'
                }
              }}
            >
              Back to Shop
            </Button>
          </Box>

          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
            My Orders
          </Typography>

          {loading ? (
            <Box sx={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              bgcolor: alpha(theme.palette.background.default, 0.8),
              backdropFilter: 'blur(4px)',
              zIndex: 1000
            }}>
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                p: 4,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <CircularProgress 
                  size={60} 
                  thickness={4}
                  sx={{ 
                    color: 'primary.main',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'
                  }}
                />
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ 
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                    textAlign: 'center'
                  }}
                >
                  Loading your orders...
                </Typography>
              </Box>
            </Box>
          ) : error ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.error.main, 0.02),
                border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                borderRadius: 3
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'error.main' }}>
                Error Loading Orders
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {error}
              </Typography>
              <Button variant="contained" onClick={() => fetchOrders(1, 10)}>
                Try Again
              </Button>
            </Paper>
          ) : orders.length === 0 ? (
            <Box sx={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              bgcolor: alpha(theme.palette.background.default, 0.8),
              backdropFilter: 'blur(4px)',
              zIndex: 1000
            }}>
              <Paper
                elevation={3}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  bgcolor: alpha(theme.palette.background.paper, 0.95),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 3,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                  maxWidth: 400,
                  mx: 2
                }}
              >
                <ShoppingBagIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  No Orders Yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Start shopping to see your orders here
                </Typography>
                <Button 
                  variant="contained" 
                  href="/demo_ecommerce"
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none'
                  }}
                >
                  Start Shopping
                </Button>
              </Paper>
            </Box>
          ) : (
            <>
              <TableContainer 
                component={Paper} 
                elevation={0}
                sx={{ 
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      '& .MuiTableCell-head': {
                        bgcolor: 'transparent',
                        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }
                    }}>
                      <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Items</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow 
                        key={order.id}
                        sx={{ 
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {order.id.slice(0, 8).toUpperCase()}
                          </Typography>
                          {order.tracking_number && (
                            <Typography variant="caption" color="text.secondary">
                              Tracking: {order.tracking_number}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(order.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            ₹{order.total_amount.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(order.status)}
                            label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            color={getStatusColor(order.status) as any}
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Expand order details">
                            <IconButton 
                              size="small" 
                              onClick={() => handleExpandOrder(order.id)}
                              sx={{ 
                                transform: expandedOrderId === order.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s',
                                color: expandedOrderId === order.id ? 'primary.main' : 'text.secondary'
                              }}
                            >
                              <ExpandMoreIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Expanded Order Details */}
              {orders.map((order) => (
                <Collapse key={`details-${order.id}`} in={expandedOrderId === order.id} timeout="auto" unmountOnExit>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      mt: 2,
                      p: 3,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                      Order Details - {order.id.slice(0, 8).toUpperCase()}
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {/* Order Items */}
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ height: '100%' }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                              <InventoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                              Order Items ({order.items.length})
                            </Typography>
                            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                              {order.items.map((item, index) => (
                                <Box key={index} sx={{ 
                                  mb: 2, 
                                  p: 2, 
                                  borderRadius: 1,
                                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {item.title}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Qty: {item.quantity} • ₹{item.price.toFixed(2)}
                                  </Typography>
                                  {item.custom_data?.brand && (
                                    <Chip 
                                      size="small" 
                                      label={item.custom_data.brand} 
                                      sx={{ mt: 1, height: 20, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Box>
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      {/* Shipping & Payment Info */}
                      <Grid item xs={12} md={6}>
                        <Stack spacing={2}>
                          {/* Shipping Information */}
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <LocalShippingIcon sx={{ mr: 1, color: 'primary.main' }} />
                                Shipping Information
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
                            </CardContent>
                          </Card>
                          
                          {/* Payment Information */}
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <PaymentIcon sx={{ mr: 1, color: 'primary.main' }} />
                                Payment Details
                              </Typography>
                              <Typography variant="body2">
                                Method: {order.payment_info.payment_method.replace('_', ' ')}
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
                            </CardContent>
                          </Card>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                </Collapse>
              ))}
            </>
          )}
        </Container>

        {/* Footer */}
        <Box 
          component="footer" 
          sx={{ 
            py: 4, 
            textAlign: 'center',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            mt: 6,
            bgcolor: alpha(theme.palette.background.paper, 0.6)
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} CogniShop. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
            This is a demo site showcasing AI-powered ecommerce search capabilities.
          </Typography>
        </Box>
    </Box>
    </ThemeProvider>
  );
};

export default EcommerceOrders; 