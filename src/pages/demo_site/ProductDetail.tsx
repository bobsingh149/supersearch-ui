import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  Rating,
  Divider,
  Card,
  CardMedia,
  Chip,
  IconButton,
  alpha,
  CircularProgress,
  Paper,
  Tooltip,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Stack,
  Fab,
  ClickAwayListener,
  Zoom,
  Alert,
  Snackbar,
  Badge
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from '../../theme/theme';
import { useProductById, MovieProduct } from '../../hooks/useProduct';
import { useReviews } from '../../hooks/useReviews';
import { useReviewSummary } from '../../hooks/useReviewSummary';
import { useProductQuestions } from '../../hooks/useProductQuestions';
import { useSimilarProducts, SimilarProduct } from '../../hooks/useSimilarProducts';
import { useOrders, OrderRequest } from '../../hooks/useOrders';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AISearchBar, { AISearchBarRef } from '../Products/ai_shopping/AISearchBar';
import ContactUsModal from './components/ContactUsModal';

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { loading: apiLoading, getProductById } = useProductById();
  const { reviews, loading: reviewsLoading, error: reviewsError, fetchReviews } = useReviews();
  const { summary: reviewSummary, loading: summaryLoading, error: summaryError, fetchReviewSummary } = useReviewSummary();
  const { similarProducts, loading: similarProductsLoading, error: similarProductsError, fetchSimilarProducts } = useSimilarProducts();
  const { questions, loading: questionsLoading, error: questionsError, fetchProductQuestions } = useProductQuestions();
  const { loading: orderLoading, error: orderError, orderSuccess, createOrder, reset: resetOrder } = useOrders();
  const [product, setProduct] = useState<MovieProduct | null>(null);
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isFavorite, setIsFavorite] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const questionsButtonRef = useRef<HTMLButtonElement>(null);
  const [_selectedQuestion, setSelectedQuestion] = useState<string>('');
  
  // Open questions modal when questions finish loading
  useEffect(() => {
    if (!questionsLoading && questions.length > 0 && product) {
      setQuestionsOpen(true);
    }
  }, [questionsLoading, questions, product]);
  
  // Updated refs with proper typing
  const desktopSearchRef = useRef<AISearchBarRef>(null);
  const mobileSearchRef = useRef<AISearchBarRef>(null);

  // Contact modal states
  const [contactModalOpen, setContactModalOpen] = useState(false);
  
  // Use the theme from theme.ts
  const theme = getTheme(mode);

  // Handle Buy Now
  const handleBuyNow = async () => {
    if (!product || !productId) return;
    
    // Get price with fallback to default
    const price = product.price || 9.99;
    
    // Create dummy order data
    const orderData: OrderRequest = {
      status: "pending",
      total_amount: price,
      items: [
        {
          product_id: productId,
          quantity: 1,
          price: price,
          title: product.title || "Movie Title",
          custom_data: {
            // Include all product fields as custom data
            ...product
          }
        }
      ],
      shipping_address: {
        full_name: "John Doe",
        address_line1: "123 Main Street",
        address_line2: "Apt 4B",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "USA",
        phone: "+1-555-123-4567"
      },
      billing_address: {
        full_name: "John Doe",
        address_line1: "123 Main Street",
        address_line2: "Apt 4B",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "USA",
        phone: "+1-555-123-4567"
      },
      payment_info: {
        payment_method: "credit_card",
        transaction_id: `txn_${Date.now()}`,
        payment_status: "completed",
        amount_paid: price,
        currency: "USD"
      },
      notes: "This is a demo purchase."
    };
    
    try {
      await createOrder(orderData);
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  // Function to handle regular search by redirecting to DemoEcommerce page
  const handleSearch = () => {
    // Get the search query from the AISearchBar
    const searchQuery = desktopSearchRef.current?.getSearchQuery() || 
                        mobileSearchRef.current?.getSearchQuery() || '';
                        
    // Redirect to DemoEcommerce with the search query as a URL parameter
    navigate(`/demo_site?q=${encodeURIComponent(searchQuery)}`);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (productId) {
          // Fetch product by ID using the hook
          const response = await getProductById(productId);
          setProduct(response as MovieProduct);
          
          // Execute all other API calls in parallel
          await Promise.all([
            fetchReviews(productId),
            fetchReviewSummary(productId),
            fetchProductQuestions(productId),
            fetchSimilarProducts(productId)
          ]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };

    fetchProduct();
  }, [productId]);

  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleContactModalOpen = () => {
    setContactModalOpen(true);
  };

  const handleContactModalClose = () => {
    setContactModalOpen(false);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const toggleQuestionsModal = () => {
    // Only allow opening the modal if questions are loaded
    if (questionsLoading) {
      return;
    }
    setQuestionsOpen(!questionsOpen);
  };

  const handleQuestionClick = (question: string) => {
    // Store the selected question
    setSelectedQuestion(question);
    
    // Close the questions modal
    setQuestionsOpen(false);
    
    // Get a reference to the AI search bar (desktop or mobile)
    const aiSearchBar = desktopSearchRef.current || mobileSearchRef.current;
    
    // If we have access to the AI search bar, send the question directly with the current product ID
    if (aiSearchBar && productId) {
      // Call the openAiChatWithMessage method that directly sends the message with product context
      aiSearchBar.openAiChatWithMessage(question, [productId]);
    }
  };

  // Questions modal component
  const QuestionsModal = () => {
    if (!questionsOpen) return null;
    
    return (
      <ClickAwayListener onClickAway={() => setQuestionsOpen(false)}>
        <Zoom 
          in={questionsOpen} 
          timeout={{
            enter: 500, // slightly faster entry for better UX
            exit: 400
          }}
          style={{
            transitionDelay: questionsOpen ? '100ms' : '0ms'
          }}
        >
          <Paper
            elevation={4}
            sx={{
              position: 'fixed',
              right: { xs: 16, sm: 32, md: 100 },
              left: { xs: 16, sm: 'auto' },
              top: { xs: '12%', sm: '20%', md: questionsButtonRef.current?.getBoundingClientRect().top || 250 },
              transform: { xs: 'none', md: 'translateY(-50%)' },
              zIndex: 1300,
              width: { xs: 'calc(100% - 32px)', sm: 400 },
              height: { xs: '400px', sm: 'auto' },
              maxHeight: { xs: '400px', sm: '450px' },
              overflowY: 'auto',
              borderRadius: { xs: 3, sm: 2 },
              p: { xs: 2, sm: 3 },
              boxShadow: theme => `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
              animation: 'fadeIn 0.3s ease-out',
              '@keyframes fadeIn': {
                '0%': { 
                  opacity: 0, 
                  transform: { 
                    xs: 'translateY(-10px)', 
                    md: 'translateY(-45%)' 
                  } 
                },
                '100%': { 
                  opacity: 1, 
                  transform: { 
                    xs: 'none', 
                    md: 'translateY(-50%)' 
                  } 
                }
              },
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                <QuestionAnswerIcon color="primary" fontSize="small" />
                Frequently Asked Questions
                {questionsLoading && (
                  <CircularProgress size={16} sx={{ ml: 1 }} />
                )}
              </Typography>
              <IconButton size="small" onClick={toggleQuestionsModal}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {questionsLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Loading questions...
                </Typography>
              </Box>
            ) : questionsError ? (
              <Box sx={{ p: 1 }}>
                <Box 
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    p: 2,
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ 
                    position: 'absolute', 
                    top: -15, 
                    right: -15, 
                    opacity: 0.07,
                    transform: 'rotate(10deg)'
                  }}>
                    <AutoAwesomeIcon sx={{ fontSize: 100, color: theme.palette.primary.main }} />
                  </Box>
                  
                  <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="subtitle1" color="primary.main" gutterBottom fontWeight={700}>
                      Integrate CogniShop AI
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Unlock full access to CogniShop AI features and transform your customer experience.
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      fullWidth
                      sx={{ 
                        mt: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 1.5,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      }}
                      onClick={() => {
                        handleContactModalOpen();
                        setQuestionsOpen(false);
                      }}
                    >
                      Contact Us
                    </Button>
                  </Stack>
                </Box>
              </Box>
            ) : questions.length === 0 ? (
              <Typography color="text.secondary">No questions available for this product.</Typography>
            ) : (
              <List sx={{ px: 0 }}>
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
                      },
                      animation: `fadeInUp 0.5s ease forwards`,
                      animationDelay: `${200 + index * 100}ms`,
                      opacity: 0,
                      transform: 'translateY(10px)',
                      '@keyframes fadeInUp': {
                        '0%': {
                          opacity: 0,
                          transform: 'translateY(10px)'
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'translateY(0)'
                        }
                      }
                    }}
                    onClick={() => handleQuestionClick(question)}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <HelpIcon fontSize="small" sx={{ color: 'primary.main', mr: 1, mt: 0.3 }} />
                          <Box>
                            <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{question}</Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                mt: 0.5,
                                gap: 0.5 
                              }}
                            >
                              <AutoAwesomeIcon fontSize="inherit" />
                              Ask AI
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {/* Ask AI Button */}
                <ListItem 
                  sx={{ 
                    py: 1.5, 
                    px: 2,
                    borderRadius: 1,
                    mt: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      cursor: 'pointer'
                    },
                    opacity: 1,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => {
                    const aiSearchBar = desktopSearchRef.current || mobileSearchRef.current;
                    if (aiSearchBar && productId) {
                      aiSearchBar.openAiChat([productId]);
                      setQuestionsOpen(false);
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoAwesomeIcon sx={{ color: 'inherit' }} fontSize="small" />
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'inherit' }}>
                          Ask AI Shopping Assistant
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            )}
          </Paper>
        </Zoom>
      </ClickAwayListener>
    );
  };

  // Similar product card component
  const SimilarProductCard = ({ product }: { product: SimilarProduct }) => {
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
        onClick={() => navigate(`/demo_site/${product.id}`)}
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
        <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography 
            variant="subtitle1" 
            component="h3" 
            sx={{ 
              fontWeight: 600,
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.2,
              height: '2.4em'
            }}
          >
            {product.title}
          </Typography>
          
          {product.custom_data?.genres && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {parseArrayField(product.custom_data.genres).slice(0, 2).map((genre, idx) => (
                <Chip
                  key={idx}
                  label={genre}
                  size="small"
                  sx={{
                    fontSize: '0.7rem',
                    height: 20,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main'
                  }}
                />
              ))}
            </Box>
          )}
          
          {product.custom_data?.vote_average && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
              <Rating
                value={parseFloat(product.custom_data.vote_average) / 2}
                precision={0.5}
                readOnly
                size="small"
              />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {(parseFloat(product.custom_data.vote_average) / 2).toFixed(1)}
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
    );
  };

  // Function to handle API errors
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
          {/* Decorative elements */}
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
                Our AI-powered search can transform your site's user experience, increasing conversions and customer satisfaction. Connect with our team to implement this technology on your own platform.
              </Typography>
              
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                onClick={() => {
                  navigate('/demo_site?contactUs=true');
                }}
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

  if (apiLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            minHeight: '100vh',
            bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f5f5f7',
            width: '100%'
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (!product) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            flexDirection: 'column',
            bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f5f5f7',
            width: '100%'
          }}
        >
          <Paper 
            sx={{ 
              p: { xs: 3, sm: 5 }, 
              textAlign: 'center',
              borderRadius: 4,
              maxWidth: 600,
              width: '90%',
              backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.15)} 100%)`,
              boxShadow: theme.shadows[10],
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.2),
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.08, transform: 'rotate(20deg)' }}>
              <AutoAwesomeIcon sx={{ fontSize: 180, color: theme.palette.primary.main }} />
            </Box>
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                Upgrade Your Experience
              </Typography>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500, color: 'text.secondary' }}>
                You've reached the free usage limit
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 4, maxWidth: '80%', mx: 'auto' }}>
                Thank you for exploring CogniShop AI. To continue enjoying our premium AI-powered search features, 
                connect with our team to implement this technology on your own site.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => {
                  navigate('/demo_site?contactUs=true');
                }}
                sx={{
                  borderRadius: 2.5,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  boxShadow: theme.shadows[4],
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    boxShadow: theme.shadows[6],
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Contact Us to Integrate CogniShop
              </Button>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleGoBack}
                sx={{ 
                  mt: 3, 
                  color: 'text.secondary', 
                  '&:hover': { 
                    backgroundColor: 'transparent', 
                    color: 'primary.main' 
                  }
                }}
              >
                Return to Homepage
              </Button>
            </Box>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  // Extract product data - prioritize the movie-specific fields
  const title = product.title || 'Product Title';
  const imageUrl = product.poster_path || '';
  
  // Helper function to parse different formats of stringified arrays
  const parseArrayField = (field?: string): string[] => {
    if (!field) return [];
    
    try {
      // Try standard JSON parse first
      return JSON.parse(field);
    } catch (e) {
      try {
        // Handle single quotes format by replacing with double quotes
        const normalizedField = field.replace(/'/g, '"');
        return JSON.parse(normalizedField);
      } catch (e2) {
        try {
          // Handle mixed quotes format (escaped double quotes inside single quotes)
          const fixedField = field
            .replace(/\\\"/g, '"') // Replace escaped double quotes
            .replace(/'/g, '"');   // Replace single quotes with double quotes
          return JSON.parse(fixedField);
        } catch (e3) {
          console.error("Failed to parse array field:", field, e3);
          return [];
        }
      }
    }
  };
  
  // Parse stringified arrays
  const genres = parseArrayField(product.genres);
  const actors = parseArrayField(product.actors);
  const directors = parseArrayField(product.director);
  
  // Review component
  const ReviewCard = ({ review }: { review: any }) => {
    const [expanded, setExpanded] = useState(false);
    const maxPreviewLength = 150;
    const shouldShowExpand = review.content.length > maxPreviewLength;
    const previewText = shouldShowExpand ? review.content.slice(0, maxPreviewLength) + '...' : review.content;

    // Generate color based on first letter
    const getAvatarColor = (name: string) => {
      const colors = [
        '#f44336', // red
        '#e91e63', // pink
        '#9c27b0', // purple
        '#673ab7', // deep purple
        '#3f51b5', // indigo
        '#2196f3', // blue
        '#03a9f4', // light blue
        '#00bcd4', // cyan
        '#009688', // teal
        '#4caf50', // green
        '#8bc34a', // light green
        '#cddc39', // lime
        '#ffc107', // amber
        '#ff9800', // orange
        '#ff5722', // deep orange
        '#795548', // brown
        '#607d8b', // blue grey
      ];
      const charCode = name.charCodeAt(0);
      return colors[charCode % colors.length];
    };

    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 2, 
          borderRadius: 2,
          bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
          border: '1px solid',
          borderColor: theme => alpha(theme.palette.divider, 0.1),
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: theme => theme.shadows[2],
            borderColor: theme => alpha(theme.palette.divider, 0.2),
          }
        }}
      >
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: getAvatarColor(review.author),
                width: 40,
                height: 40,
                fontSize: '1rem',
                fontWeight: 600,
                color: 'white'
              }}
            >
              {review.author.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                @{review.author}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">
                  {new Date(review.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Typography
            variant="body1"
            color="text.primary"
            sx={{ 
              whiteSpace: 'pre-line',
              lineHeight: 1.6
            }}
          >
            {expanded ? review.content : previewText}
          </Typography>

          {shouldShowExpand && (
            <Button
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ 
                alignSelf: 'flex-start',
                textTransform: 'none',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'transparent',
                  color: 'primary.main'
                }
              }}
            >
              {expanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </Stack>
      </Paper>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f5f5f7',
        width: '100vw',
        maxWidth: '100vw',
        overflowX: 'hidden',
        margin: 0,
        padding: 0,
        position: 'relative'
      }}>
        {/* Header */}
        <AppBar 
          position="fixed"
          color="default" 
          elevation={0}
          sx={{ 
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            zIndex: theme.zIndex.drawer + 1,
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
              <Tooltip title="View Orders">
                <IconButton 
                  size="small" 
                  color="inherit"
                  onClick={() => navigate('/demo_site/orders')}
                >
                  <Badge color="primary">
                    <ShoppingCartIcon fontSize="small" />
                  </Badge>
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

        {/* Success/Error Snackbar - For order status only now */}
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
        
        {/* Main Content */}
        <Container maxWidth="lg" sx={{ pt: { xs: 20, md: 10 }, pb: 8 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleGoBack}
            sx={{ mb: 2, mt: 0 }}
          >
            Back
          </Button>

          <Grid container spacing={4}>
            {/* Product Image */}
            <Grid item xs={12} md={5}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  background: 'transparent',
                  position: 'relative'
                }}
              >
                {imageUrl ? (
                  <Box sx={{ 
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <CardMedia
                      component="img"
                      image={imageUrl}
                      alt={title}
                      sx={{ 
                        width: '100%',
                        maxWidth: { xs: '100%', sm: '80%', md: '100%' },
                        aspectRatio: '2/3',
                        objectFit: 'contain',
                        borderRadius: 2,
                        boxShadow: theme.shadows[4]
                      }}
                    />
                  </Box>
                ) : (
                  <CardMedia
                    component="img"
                    image={`https://picsum.photos/500/750?random=${productId}`}
                    alt={title}
                    sx={{ 
                      width: '100%',
                      maxWidth: { xs: '100%', sm: '80%', md: '100%' },
                      aspectRatio: '2/3',
                      objectFit: 'contain',
                      borderRadius: 2,
                      boxShadow: theme.shadows[4]
                    }}
                  />
                )}
                
                {/* Action buttons overlayed on image */}
                <Box sx={{ 
                  position: 'absolute',
                  top: 10,
                  right: { xs: '5%', sm: '12%', md: 10 },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  zIndex: 2
                }}>
                  <IconButton 
                    size="small"
                    onClick={handleToggleFavorite}
                    sx={{ 
                      bgcolor: 'background.paper',
                      boxShadow: theme.shadows[2],
                      '&:hover': {
                        bgcolor: 'background.paper',
                      }
                    }}
                  >
                    <FavoriteIcon fontSize="small" sx={{ color: isFavorite ? 'error.main' : 'inherit' }} />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    sx={{ 
                      bgcolor: 'background.paper',
                      boxShadow: theme.shadows[2],
                      '&:hover': {
                        bgcolor: 'background.paper',
                      }
                    }}
                  >
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
            
            {/* Product Details */}
            <Grid item xs={12} md={7}>
              <Box>
                {/* Title and Genre/Category */}
                {genres.length > 0 && (
                  <Chip 
                    label={genres[0]} 
                    size="small" 
                    sx={{ 
                      mb: 2,
                      fontWeight: 500,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main'
                    }} 
                  />
                )}
                
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                  {title}
                </Typography>
                
                {/* Rating */}
                {product.vote_average && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating 
                      value={parseFloat(product.vote_average) / 2} 
                      precision={0.5} 
                      readOnly 
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {(parseFloat(product.vote_average) / 2).toFixed(1)} ({product.vote_count} reviews)
                    </Typography>
                  </Box>
                )}
                
                {/* Release Date */}
                {product.release_date && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Released:</strong> {new Date(product.release_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                )}
                
                {/* Language */}
                {product.original_language && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Language:</strong> {product.original_language.toUpperCase()}
                  </Typography>
                )}
                
                {/* Director */}
                {directors.length > 0 && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Director:</strong> {directors.join(', ')}
                  </Typography>
                )}
                
                {/* Actors */}
                {actors.length > 0 && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Starring:</strong> {actors.join(', ')}
                  </Typography>
                )}
                
                <Divider sx={{ my: 3 }} />
                
                {/* Description/Overview */}
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {product.overview || "No description available for this product."}
                </Typography>
                
                {/* Price */}
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                    ${product.price ? product.price.toFixed(2) : '9.99'}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                {/* Add to Cart Button (replaced with Buy Now) */}
                <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<ShoppingBagIcon />}
                    onClick={handleBuyNow}
                    disabled={orderLoading}
                    sx={{ 
                      borderRadius: 1.5,
                      py: 1.5,
                      textTransform: 'none',
                      flex: 1
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
                </Box>
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
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
                  borderRadius: 2
                }}
              >
                <Typography color="text.secondary">No similar items found.</Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {similarProducts.map((product) => (
                  <Grid item key={product.id} xs={6} sm={4} md={2}>
                    <SimilarProductCard product={product} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {/* Review Summary Section */}
          <Box sx={{ mt: 8 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AutoAwesomeIcon color="primary" />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                AI Review Summary
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {summaryLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : summaryError ? (
              handleApiError(summaryError)
            ) : reviewSummary ? (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  borderRadius: 2,
                  bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
                  border: '1px solid',
                  borderColor: theme => alpha(theme.palette.divider, 0.1),
                }}
              >
                {/* Summary Text */}
                <Typography variant="body1" paragraph sx={{ fontStyle: 'italic', mb: 3 }}>
                  {reviewSummary.summary}
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Pros */}
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3, 
                        height: '100%',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.success.main, 0.1),
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
                              primaryTypographyProps={{
                                variant: 'body2'
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                  
                  {/* Cons */}
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3, 
                        height: '100%',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.error.main, 0.05),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.error.main, 0.1),
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
                              primaryTypographyProps={{
                                variant: 'body2'
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            ) : (
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
                  borderRadius: 2
                }}
              >
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
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
                  borderRadius: 2
                }}
              >
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
        </Container>
        
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

export default ProductDetail; 