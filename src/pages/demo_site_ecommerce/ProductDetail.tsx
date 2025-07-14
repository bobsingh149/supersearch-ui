import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Rating,
  Chip,
  Paper,
  IconButton,
  Breadcrumbs,
  Link,
  Divider,
  Stack,
  alpha,
  CircularProgress,
  Card,
  CardMedia,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Fab,
  ClickAwayListener,
  Zoom,
  Snackbar,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ShareIcon from '@mui/icons-material/Share';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SecurityIcon from '@mui/icons-material/Security';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useProductById } from '../../hooks/useProduct';
import { useProductQuestions } from '../../hooks/useProductQuestions';
import { useSimilarProducts } from '../../hooks/useSimilarProducts';
import { useOrders, OrderRequest } from '../../hooks/useOrders';
import { EcommerceCustomData } from './types/ecommerce';
import ContactUsModal from './components/ContactUsModal';
import GlobalHeader from './components/GlobalHeader';
import EcommerceAISearchBar, { AISearchBarRef } from './components/EcommerceAISearchBar';
import ecommerceTheme from './theme/ecommerceTheme';
import config from '../../config';
import { getTenantHeadersFromPath } from '../../utils/tenantHeaders';
import { isRateLimitError } from './utils/errorHandler';

// Interfaces for API responses
interface ReviewSummaryOutput {
  summary: string;
  pros: string[];
  cons: string[];
}

interface GeneratedReviewsOutput {
  reviews: Array<{
    id: string;
    author: string;
    content: string;
    created_at: string;
  }>;
  summary: ReviewSummaryOutput;
}

interface EcommerceProduct {
  id: string;
  title: string;
  image_url: string;
  custom_data: EcommerceCustomData;
  searchable_content: string;
}

interface SimilarEcommerceProduct {
  id: string;
  title: string;
  image_url: string;
  custom_data: EcommerceCustomData;
  score: number;
}

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const theme = ecommerceTheme;
  const { loading: apiLoading, error: productByIdError, getProductById } = useProductById();
  const { questions, loading: questionsLoading, error: questionsError, fetchProductQuestions } = useProductQuestions();
  const { similarProducts, loading: similarProductsLoading, error: similarProductsError, fetchSimilarProducts } = useSimilarProducts();
  const { loading: orderLoading, error: orderError, orderSuccess, createOrder, reset: resetOrder } = useOrders();
  
  const [product, setProduct] = useState<EcommerceProduct | null>(null);
  const [reviews, setReviews] = useState<GeneratedReviewsOutput['reviews']>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryOutput | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [_selectedQuestion, setSelectedQuestion] = useState<string>('');
  
  const questionsButtonRef = useRef<HTMLButtonElement>(null);
  const aiSearchBarRef = useRef<AISearchBarRef>(null);

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

  // Fetch reviews and summary from the AI summary API
  const fetchReviewsAndSummary = useCallback(async (productId: string): Promise<GeneratedReviewsOutput | null> => {
    try {
      // Get tenant headers based on current path
      const headers = getTenantHeadersFromPath(window.location.pathname);
      
      const response = await fetch(
        `${config.apiBaseUrl}${config.apiEndpoints.reviews}/${productId}/summary`,
        { headers }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`);
      }
      
      const data: GeneratedReviewsOutput = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching reviews and summary:', error);
      
      // Check if it's a rate limit error
      if (isRateLimitError(error)) {
        throw error; // Re-throw to be handled by the calling function
      }
      
      throw error;
    }
  }, []);

  // Fetch product and related data
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return;
      
      try {
        // First, fetch the product data
        const productData = await getProductById(productId);
        
        if (productData) {
          const ecommerceProduct: EcommerceProduct = {
            id: productData.id,
            title: productData.title,
            image_url: productData.poster_path || '',
            custom_data: productData as unknown as EcommerceCustomData,
            searchable_content: productData.overview || ''
          };
          setProduct(ecommerceProduct);
          
          // Now fetch the rest of the data in parallel
          setReviewsLoading(true);
          setReviewsError(null);
          
          const results = await Promise.allSettled([
            fetchProductQuestions(productId),
            fetchSimilarProducts(productId),
            fetchReviewsAndSummary(productId)
          ]);
          
          // Handle reviews data (optional)
          if (results[2].status === 'fulfilled' && results[2].value) {
            const reviewsData = results[2].value;
            setReviews(reviewsData.reviews);
            setReviewSummary(reviewsData.summary);
          } else if (results[2].status === 'rejected') {
            console.error('Error fetching reviews:', results[2].reason);
            
            // Check if it's a rate limit error
            if (isRateLimitError(results[2].reason)) {
              navigate('/demo_ecommerce/rate-limit');
              return;
            }
            
            setReviewsError(results[2].reason instanceof Error ? results[2].reason.message : 'Failed to fetch reviews');
          }
          
          setReviewsLoading(false);
        }
        
              } catch (error) {
          console.error('Error fetching product data:', error);
          
          // Check if it's a rate limit error and redirect
          if (isRateLimitError(error)) {
            navigate('/demo_ecommerce/rate-limit');
            return; // Exit early to prevent further processing
          }
          
          setReviewsError(error instanceof Error ? error.message : 'Failed to fetch data');
          setReviewsLoading(false);
        }
    };

    fetchProductData();
  }, [productId, fetchReviewsAndSummary]); // Only include stable dependencies

  // Open questions modal when questions finish loading
  useEffect(() => {
    if (!questionsLoading && questions.length > 0 && product) {
      setQuestionsOpen(true);
    }
  }, [questionsLoading, questions.length, product?.id]); // Use specific values to prevent unnecessary re-renders

  // Helper functions
  const handleApiError = (_error: string) => {
    return (
      <Paper 
        elevation={3}
        sx={{
          p: 0,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: theme.shadows[3],
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.2),
          width: '100%',
          mb: 3
        }}
      >
        <Box 
          sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            p: 3,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            position: 'absolute', 
            top: -20, 
            right: -20, 
            opacity: 0.07
          }}>
            <AutoAwesomeIcon sx={{ fontSize: 160, color: theme.palette.primary.main }} />
          </Box>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'center', sm: 'flex-start' }} sx={{ position: 'relative', zIndex: 1 }}>
            <Box 
              sx={{ 
                width: 60, 
                height: 60, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                flexShrink: 0,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, width: '100%' }}>
              <Typography variant="h5" color="primary.main" gutterBottom fontWeight={700}>
                Integrate CogniShop AI
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: 'text.primary', fontWeight: 500 }}>
                You've reached the free usage limit of CogniShop AI
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Our AI-powered search can transform your site's user experience, increasing conversions and customer satisfaction.
              </Typography>
              
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                onClick={() => setContactModalOpen(true)}
                sx={{ 
                  px: 3,
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: theme.shadows[3],
                  '&:hover': {
                    boxShadow: theme.shadows[5],
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Contact Us to Integrate CogniShop
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
    );
  };

  const toggleQuestionsModal = () => {
    if (questionsLoading) return;
    setQuestionsOpen(!questionsOpen);
  };

  const handleQuestionClick = (question: string) => {
    setSelectedQuestion(question);
    setQuestionsOpen(false);
    
    if (aiSearchBarRef.current && productId) {
      // Check if it's the "Ask AI" option
      if (question === "Ask AI - Open Assistant to ask any question") {
        // Open AI assistant with product context but no pre-filled message
        aiSearchBarRef.current.openAiChat([productId]);
      } else {
        // Open AI assistant with the selected question and product context
      aiSearchBarRef.current.openAiChatWithMessage(question, [productId]);
      }
    }
  };

  // Questions Modal Component
  const QuestionsModal = () => {
    if (!questionsOpen) return null;
    
    return (
      <ClickAwayListener onClickAway={() => setQuestionsOpen(false)}>
        <Zoom in={questionsOpen} timeout={{ enter: 500, exit: 400 }}>
          <Paper
            elevation={4}
            sx={{
              position: 'fixed',
              right: { xs: 16, sm: 32, md: 100 },
              left: { xs: 16, sm: 'auto' },
              top: { xs: '20%', sm: '20%', md: questionsButtonRef.current?.getBoundingClientRect().top || 250 },
              transform: { xs: 'none', md: 'translateY(-50%)' },
              zIndex: 1300,
              width: { xs: 'calc(100% - 32px)', sm: 400 },
              height: { xs: '350px', sm: 'auto' },
              maxHeight: { xs: '350px', sm: '450px' },
              overflowY: 'auto',
              borderRadius: { xs: 3, sm: 2 },
              p: { xs: 2, sm: 3 },
              boxShadow: theme => `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QuestionAnswerIcon color="primary" fontSize="small" />
                Frequently Asked Questions
              </Typography>
              <IconButton size="small" onClick={toggleQuestionsModal}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {questionsLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">Loading questions...</Typography>
              </Box>
            ) : questionsError ? (
              <Box sx={{ p: 1 }}>
                <Box sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  p: 2,
                  borderRadius: 2
                }}>
                  <Typography variant="subtitle1" color="primary.main" gutterBottom fontWeight={700}>
                    Integrate CogniShop AI
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    fullWidth
                    onClick={() => {
                      setContactModalOpen(true);
                      setQuestionsOpen(false);
                    }}
                  >
                    Contact Us
                  </Button>
                </Box>
              </Box>
            ) : (
              <List sx={{ px: 0 }}>
                {/* Add "Ask AI" option as first item */}
                <ListItem 
                  sx={{ 
                    py: 1.5, 
                    px: 2,
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => handleQuestionClick("Ask AI - Open Assistant to ask any question")}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <AutoAwesomeIcon fontSize="small" sx={{ color: 'secondary.main', mr: 1, mt: 0.3 }} />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>Ask AI - Open Assistant to ask any question</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
                            <AutoAwesomeIcon fontSize="inherit" />
                            AI Assistant
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {questions.map((question, index) => (
                  <ListItem 
                    key={index} 
                    sx={{ 
                      py: 1.5, 
                      px: 2,
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => handleQuestionClick(question)}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <HelpIcon fontSize="small" sx={{ color: 'primary.main', mr: 1, mt: 0.3 }} />
                          <Box>
                            <Typography variant="body1">{question}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
                              <AutoAwesomeIcon fontSize="inherit" />
                              Ask AI
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Zoom>
      </ClickAwayListener>
    );
  };

  // Review Card Component
  const ReviewCard = ({ review }: { review: GeneratedReviewsOutput['reviews'][0] }) => {
    const [expanded, setExpanded] = useState(false);
    const maxPreviewLength = 150;
    const shouldShowExpand = review.content.length > maxPreviewLength;
    const previewText = shouldShowExpand ? review.content.slice(0, maxPreviewLength) + '...' : review.content;

    const getAvatarColor = (name: string) => {
      const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50'];
      const charCode = (name || 'Anonymous').charCodeAt(0);
      return colors[charCode % colors.length];
    };

    return (
      <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.6) }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: getAvatarColor(review.author), width: 40, height: 40 }}>
              {(review.author || 'Anonymous').charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>@{review.author || 'Anonymous'}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">{new Date(review.created_at).toLocaleDateString()}</Typography>
              </Box>
            </Box>
          </Box>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
            {expanded ? review.content : previewText}
          </Typography>
          {shouldShowExpand && (
            <Button
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              {expanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </Stack>
      </Paper>
    );
  };

  // Similar Product Card Component
  const SimilarProductCard = ({ product }: { product: SimilarEcommerceProduct }) => {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[4],
            cursor: 'pointer'
          }
        }}
        onClick={() => navigate(`/demo_ecommerce/${product.id}`)}
      >
        <Box sx={{ position: 'relative', paddingTop: '150%' }}>
          <CardMedia
            component="img"
            image={product.image_url || `https://picsum.photos/300/450?random=${product.id}`}
            alt={product.title}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </Box>
        <Box sx={{ p: 2, flexGrow: 1 }}>
          <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
            {product.title}
          </Typography>
          {product.custom_data?.brand && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {product.custom_data.brand}
            </Typography>
          )}
          {product.custom_data?.average_rating && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rating
                value={parseFloat(product.custom_data.average_rating)}
                precision={0.1}
                readOnly
                size="small"
              />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {product.custom_data.average_rating}
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
    );
  };

  if (apiLoading || !product) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}>
          <GlobalHeader 
            onContactUs={() => setContactModalOpen(true)}
          />
          {/* Fixed positioned loading overlay */}
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
                Loading product details...
              </Typography>
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  if (productByIdError) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}>
          <GlobalHeader 
            onContactUs={() => setContactModalOpen(true)}
          />
          <Container maxWidth="lg" sx={{ py: 8, pt: 16, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              Product Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              The product you're looking for doesn't exist or has been removed.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/demo_ecommerce')}
              sx={{ mt: 2 }}
            >
              Back to Shop
            </Button>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  // Get product details
  const price = product.custom_data?.discounted_price || product.custom_data?.price || '0';
  const originalPrice = product.custom_data?.price;
  const rating = parseFloat(product.custom_data?.average_rating || '0');
  const isOnSale = originalPrice && parseFloat(originalPrice) > parseFloat(price);
  const discount = isOnSale ? Math.round(((parseFloat(originalPrice!) - parseFloat(price)) / parseFloat(originalPrice!)) * 100) : 0;

  // Handle Buy Now and Add to Cart
  const handleBuyNow = async () => {
    if (!product || !productId) return;
    
    // Get price with fallback to default
    const productPrice = parseFloat(price) || 599.0;
    
    // Create order data
    const orderData: OrderRequest = {
      status: "pending",
      total_amount: productPrice,
      items: [
        {
          product_id: productId,
          quantity: 1,
          price: productPrice,
          title: product.title || product.custom_data?.product_name || "Product",
          custom_data: {
            // Include all product fields as custom data
            ...product.custom_data
          }
        }
      ],
      shipping_address: {
        full_name: "John Doe",
        address_line1: "123 Main Street",
        address_line2: "Apt 4B",
        city: "Mumbai",
        state: "Maharashtra",
        postal_code: "400001",
        country: "India",
        phone: "+91-9876543210"
      },
      billing_address: {
        full_name: "John Doe",
        address_line1: "123 Main Street",
        address_line2: "Apt 4B",
        city: "Mumbai",
        state: "Maharashtra",
        postal_code: "400001",
        country: "India",
        phone: "+91-9876543210"
      },
      payment_info: {
        payment_method: "credit_card",
        transaction_id: `txn_${Date.now()}`,
        payment_status: "completed",
        amount_paid: productPrice,
        currency: "INR"
      },
      notes: "This is a demo purchase from ecommerce site."
    };
    
    try {
      await createOrder(orderData);
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !productId) return;
    
    // Get price with fallback to default
    const productPrice = parseFloat(price) || 599.0;
    
    // Create order data for cart (same as buy now but with different status)
    const orderData: OrderRequest = {
      status: "pending",
      total_amount: productPrice,
      items: [
        {
          product_id: productId,
          quantity: 1,
          price: productPrice,
          title: product.title || product.custom_data?.product_name || "Product",
          custom_data: {
            // Include all product fields as custom data
            ...product.custom_data
          }
        }
      ],
      shipping_address: {
        full_name: "John Doe",
        address_line1: "123 Main Street",
        address_line2: "Apt 4B",
        city: "Mumbai",
        state: "Maharashtra",
        postal_code: "400001",
        country: "India",
        phone: "+91-9876543210"
      },
      billing_address: {
        full_name: "John Doe",
        address_line1: "123 Main Street",
        address_line2: "Apt 4B",
        city: "Mumbai",
        state: "Maharashtra",
        postal_code: "400001",
        country: "India",
        phone: "+91-9876543210"
      },
      payment_info: {
        payment_method: "credit_card",
        transaction_id: `txn_${Date.now()}`,
        payment_status: "pending",
        amount_paid: productPrice,
        currency: "INR"
      },
      notes: "Added to cart from ecommerce site."
    };
    
    try {
      await createOrder(orderData);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
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
          autoFocus={false}
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
              onClick={() => navigate(-1)}
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
              Back
            </Button>
          </Box>

          {/* Breadcrumbs */}
          <Breadcrumbs 
            aria-label="breadcrumb" 
            sx={{ mb: 3 }}
            separator={<NavigateNextIcon fontSize="small" />}
          >
            <Link 
              color="inherit" 
              href="/demo_site_ecommerce" 
              onClick={(e) => {
                e.preventDefault();
                navigate('/demo_site_ecommerce');
              }}
              sx={{ 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {product.custom_data?.master_category || 'Products'}
            </Link>
            <Typography color="text.primary">{product.title || product.custom_data?.product_name}</Typography>
          </Breadcrumbs>

          <Grid container spacing={6}>
            {/* Product Image */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0}
                sx={{ 
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  position: 'relative'
                }}
              >
                <Box sx={{ 
                  position: 'relative',
                  paddingTop: '100%', // 1:1 aspect ratio
                  overflow: 'hidden'
                }}>
                  <img
                    src={product.image_url || product.custom_data?.image_url || `https://picsum.photos/600/600?random=${productId}`}
                    alt={product.title || product.custom_data?.product_name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  
                  {/* Action buttons overlayed on image */}
                  <Box sx={{ 
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}>
                    <IconButton 
                      size="small"
                      onClick={() => setIsFavorite(!isFavorite)}
                      sx={{ 
                        bgcolor: alpha(theme.palette.background.paper, 0.9),
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.background.paper, 0.95),
                        }
                      }}
                    >
                      {isFavorite ? (
                        <FavoriteIcon fontSize="small" sx={{ color: 'error.main' }} />
                      ) : (
                        <FavoriteBorderIcon fontSize="small" />
                      )}
                    </IconButton>
                    <IconButton 
                      size="small" 
                      sx={{ 
                        bgcolor: alpha(theme.palette.background.paper, 0.9),
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.background.paper, 0.95),
                        }
                      }}
                    >
                      <ShareIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Sale badge */}
                  {isOnSale && (
                    <Chip
                      label={`${discount}% OFF`}
                      color="error"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        fontWeight: 600,
                        bgcolor: 'error.main',
                        color: 'white'
                      }}
                    />
                  )}
                </Box>
              </Paper>
            </Grid>
            
            {/* Product Details */}
            <Grid item xs={12} md={6}>
              <Box>
                {/* Brand */}
                {product.custom_data?.brand && (
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 600,
                      letterSpacing: '1px',
                      mb: 1,
                      display: 'block'
                    }}
                  >
                    {product.custom_data.brand}
                  </Typography>
                )}

                {/* Category */}
                {product.custom_data?.master_category && (
                  <Chip 
                    label={product.custom_data.master_category} 
                    size="small" 
                    sx={{ 
                      mb: 2,
                      fontWeight: 500,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      border: 'none'
                    }} 
                  />
                )}
                
                <Typography variant="h3" component="h1" gutterBottom sx={{ 
                  fontWeight: 700,
                  color: 'text.primary',
                  lineHeight: 1.2
                }}>
                  {product.title || product.custom_data?.product_name}
                </Typography>
                
                {/* Rating */}
                {rating > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Rating 
                    value={rating} 
                      precision={0.1} 
                    readOnly 
                    size="small"
                  />
                  <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                      {rating.toFixed(1)} ({product.custom_data?.rating_count || 0} reviews)
                  </Typography>
                </Box>
                )}
                
                {/* Price */}
                <Box sx={{ mb: 4 }}>
                  <Stack direction="row" alignItems="baseline" spacing={2}>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                      ₹{price}
                    </Typography>
                    {isOnSale && originalPrice && (
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          textDecoration: 'line-through',
                          color: 'text.secondary'
                        }}
                      >
                        ₹{originalPrice}
                      </Typography>
                    )}
                  </Stack>
                </Box>
                
                {/* Description - Render HTML content */}
                <Box sx={{ 
                  color: 'text.secondary',
                  lineHeight: 1.7,
                  mb: 4,
                  '& p': { mb: 2 },
                  '& ul, & ol': { pl: 2, mb: 2 },
                  '& li': { mb: 0.5 },
                  '& strong': { fontWeight: 600 },
                  '& em': { fontStyle: 'italic' }
                }}>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: product.searchable_content || product.custom_data?.description || "Experience premium quality with this carefully crafted product. Designed with attention to detail and built to last." 
                    }} 
                  />
                </Box>

                {/* Product Details */}
                {(product.custom_data?.base_colour || product.custom_data?.available_sizes) && (
                  <Box sx={{ mb: 4 }}>
                    {product.custom_data?.base_colour && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Color: <strong>{product.custom_data.base_colour}</strong>
                </Typography>
                      </Box>
                    )}
                    {product.custom_data?.available_sizes && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Available Sizes:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {(() => {
                            const sizes = product.custom_data.available_sizes;
                            // Handle both string and number types
                            if (typeof sizes === 'string') {
                              return sizes.split(',').map((size: string, index: number) => (
                            <Chip
                              key={index}
                              label={size.trim()}
                              variant="outlined"
                              size="small"
                              sx={{ borderRadius: 1 }}
                            />
                              ));
                            } else if (typeof sizes === 'number') {
                              return (
                                <Chip
                                  label={String(sizes)}
                                  variant="outlined"
                                  size="small"
                                  sx={{ borderRadius: 1 }}
                                />
                              );
                            }
                            return null;
                          })()}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
                
                {/* Trust signals */}
                <Stack direction="row" spacing={3} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShippingIcon fontSize="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Free Shipping
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon fontSize="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Secure Payment
                    </Typography>
                  </Box>
                </Stack>
                
                <Divider sx={{ my: 4 }} />
                
                {/* Add to Cart Button */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<ShoppingBagIcon />}
                    onClick={handleAddToCart}
                    disabled={orderLoading}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      px: 4,
                      textTransform: 'none',
                      fontWeight: 600,
                      flex: 1,
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: theme.shadows[2]
                      }
                    }}
                  >
                    {orderLoading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                        Adding...
                      </>
                    ) : (
                      'Add to Cart'
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<ShoppingCartIcon />}
                    onClick={handleBuyNow}
                    disabled={orderLoading}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      px: 4,
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.04)
                      }
                    }}
                  >
                    {orderLoading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                        Processing...
                      </>
                    ) : (
                      'Buy Now'
                    )}
                  </Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>

          {/* Similar Products Section */}
          <Box sx={{ mt: 8 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Similar Items
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {similarProductsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : similarProductsError ? (
              handleApiError(similarProductsError)
            ) : similarProducts.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.background.paper, 0.6), borderRadius: 2 }}>
                <Typography color="text.secondary">No similar items found.</Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {similarProducts.map((product) => (
                  <Grid item key={product.id} xs={6} sm={4} md={2}>
                    <SimilarProductCard product={product as SimilarEcommerceProduct} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {/* AI Review Summary Section */}
          <Box sx={{ mt: 8 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AutoAwesomeIcon color="primary" />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                AI Review Summary
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {reviewsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : reviewsError ? (
              handleApiError(reviewsError)
            ) : reviewSummary ? (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography variant="body1" paragraph sx={{ fontStyle: 'italic', mb: 3 }}>
                  {reviewSummary.summary}
                </Typography>
                
                <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                        height: '100%',
                    borderRadius: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ThumbUpIcon sx={{ color: 'success.main', mr: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                          Pros
                  </Typography>
                      </Box>
                      <List dense disablePadding>
                        {reviewSummary.pros.map((pro, index) => (
                          <ListItem key={index} disableGutters sx={{ py: 0.5 }}>
                            <ListItemText 
                              primary={pro}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3, 
                        height: '100%',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.error.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ThumbDownIcon sx={{ color: 'error.main', mr: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                          Cons
                    </Typography>
                      </Box>
                      <List dense disablePadding>
                        {reviewSummary.cons.map((con, index) => (
                          <ListItem key={index} disableGutters sx={{ py: 0.5 }}>
                            <ListItemText 
                              primary={con}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                </Paper>
              </Grid>
                </Grid>
              </Paper>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.background.paper, 0.6), borderRadius: 2 }}>
                <Typography color="text.secondary">No review summary available for this product.</Typography>
              </Paper>
            )}
          </Box>

          {/* Reviews Section */}
          <Box sx={{ mt: 8 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Customer Reviews
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {reviewsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : reviewsError ? (
              handleApiError(reviewsError)
            ) : reviews.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.background.paper, 0.6), borderRadius: 2 }}>
                <Typography color="text.secondary">No reviews yet for this product.</Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </Stack>
            )}
          </Box>

          {/* Additional Product Information */}
          <Box sx={{ mt: 8 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Product Details
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Specifications
                  </Typography>
                  <Stack spacing={1}>
                    {product.custom_data?.brand && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Brand:</Typography>
                        <Typography variant="body2">{product.custom_data.brand}</Typography>
                      </Box>
                    )}
                    {product.custom_data?.master_category && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Category:</Typography>
                        <Typography variant="body2">{product.custom_data.master_category}</Typography>
                    </Box>
                    )}
                    {product.custom_data?.article_type && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Type:</Typography>
                        <Typography variant="body2">{product.custom_data.article_type}</Typography>
                      </Box>
                    )}
                    {product.custom_data?.gender && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Gender:</Typography>
                        <Typography variant="body2">{product.custom_data.gender}</Typography>
                      </Box>
                    )}
                    {product.custom_data?.usage && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Usage:</Typography>
                        <Typography variant="body2">{product.custom_data.usage}</Typography>
                      </Box>
                    )}
                    {rating > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Rating:</Typography>
                      <Typography variant="body2">{rating.toFixed(1)}/5</Typography>
                    </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">SKU:</Typography>
                      <Typography variant="body2">CGS-{productId}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Care Instructions
                  </Typography>
                  {product.custom_data?.material_care ? (
                    <Box sx={{ 
                      color: 'text.secondary',
                      lineHeight: 1.6,
                      '& p': { mb: 1 },
                      '& ul, & ol': { pl: 2, mb: 1 },
                      '& li': { mb: 0.5 },
                      '& strong': { fontWeight: 600 },
                      '& em': { fontStyle: 'italic' }
                    }}>
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: product.custom_data.material_care 
                        }} 
                      />
                    </Box>
                  ) : (
                    <Stack spacing={1}>
                      <Typography key="care-1" variant="body2" color="text.secondary">
                        • Follow care label instructions
                      </Typography>
                      <Typography key="care-2" variant="body2" color="text.secondary">
                        • Store in a cool, dry place
                      </Typography>
                      <Typography key="care-3" variant="body2" color="text.secondary">
                        • Handle with care
                      </Typography>
                      <Typography key="care-4" variant="body2" color="text.secondary">
                        • Professional cleaning recommended
                      </Typography>
                    </Stack>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Container>

        {/* Hidden AI Search Bar for questions functionality */}
        <Box sx={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <EcommerceAISearchBar ref={aiSearchBarRef} />
        </Box>
        
        {/* Questions button and modal */}
        <Fab
          color="primary"
          aria-label="questions"
          ref={questionsButtonRef}
          onClick={toggleQuestionsModal}
          sx={{
            position: 'fixed',
            right: { xs: 16, sm: 30 },
            top: { xs: '35%', sm: '30%' },
            transform: { xs: 'translateY(0)', sm: 'translateY(-50%)' },
            zIndex: 1200,
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            animation: questionsOpen ? 'none' : 'bounce 1s ease infinite',
            animationDelay: '3s',
            boxShadow: theme => questionsOpen 
              ? `0 0 0 4px ${alpha(theme.palette.primary.main, 0.2)}` 
              : `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              transform: { xs: 'translateY(0) scale(1.05)', sm: 'translateY(-50%) scale(1.05)' },
              boxShadow: theme => `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`
            },
            '@keyframes bounce': {
              '0%, 20%, 50%, 80%, 100%': {
                transform: { xs: 'translateY(0)', sm: 'translateY(-50%)' }
              },
              '40%': {
                transform: { xs: 'translateY(-10px)', sm: 'translateY(-60%)' }
              },
              '60%': {
                transform: { xs: 'translateY(-5px)', sm: 'translateY(-55%)' }
              }
            }
          }}
        >
          {questionsOpen ? <CloseIcon /> : <QuestionAnswerIcon />}
        </Fab>
        
        <QuestionsModal />

        {/* Success/Error Snackbar */}
        <Snackbar
          open={orderSuccess || !!orderError}
          autoHideDuration={6000}
          onClose={() => {
            if (orderSuccess) {
              resetOrder();
            } else if (orderError) {
              resetOrder();
            }
          }}
        >
          <Alert
            severity={orderSuccess ? "success" : "error"}
            sx={{ width: '100%' }}
          >
            {orderSuccess 
              ? "Order placed successfully! Thank you for your purchase."
              : orderError
            }
          </Alert>
        </Snackbar>
        
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

export default ProductDetail; 