import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  Breadcrumbs,
  Link,
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
  Collapse,
  Stack,
  Fab,
  Modal,
  ClickAwayListener,
  Zoom
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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import random_name from 'node-random-name';
import AISearchBar, { AISearchBarRef } from '../Products/ai_shopping/AISearchBar';
import { useSearch } from '../../hooks/useSearch';

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { loading: apiLoading, getProductById } = useProductById();
  const { reviews, loading: reviewsLoading, error: reviewsError, fetchReviews } = useReviews();
  const { summary: reviewSummary, loading: summaryLoading, error: summaryError, fetchReviewSummary } = useReviewSummary();
  const { questions, loading: questionsLoading, error: questionsError, fetchProductQuestions } = useProductQuestions();
  const { similarProducts, loading: similarProductsLoading, error: similarProductsError, fetchSimilarProducts } = useSimilarProducts();
  const [product, setProduct] = useState<MovieProduct | null>(null);
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const { searchProducts } = useSearch();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(true);
  const questionsButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  
  // Updated refs with proper typing
  const desktopSearchRef = useRef<AISearchBarRef>(null);
  const mobileSearchRef = useRef<AISearchBarRef>(null);

  // Use the theme from theme.ts
  const theme = getTheme(mode);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (productId) {
          // Fetch product by ID using the hook
          const response = await getProductById(productId);
          setProduct(response as MovieProduct);
          // Fetch reviews when product is loaded
          await fetchReviews(productId);
          // Fetch review summary
          await fetchReviewSummary(productId);
          // Fetch product questions
          await fetchProductQuestions(productId);
          // Fetch similar products
          await fetchSimilarProducts(productId);
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
    // Will be implemented if needed
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
    
    // If we have access to the AI search bar, send the question directly
    if (aiSearchBar) {
      // This will: 
      // 1. Open the AI chat
      // 2. Set the question in the input field
      // 3. Send the message immediately
      // 4. Process the response
      aiSearchBar.openAiChatWithMessage(question);
    }
  };

  // Questions modal component
  const QuestionsModal = () => {
    if (!questionsOpen) return null;
    
    return (
      <ClickAwayListener onClickAway={() => setQuestionsOpen(false)}>
        <Zoom in={questionsOpen}>
          <Paper
            elevation={4}
            sx={{
              position: 'fixed',
              right: { xs: '50%', md: 100 },
              top: { xs: '50%', md: questionsButtonRef.current?.getBoundingClientRect().top || 250 },
              transform: { xs: 'translate(50%, -50%)', md: 'translateY(-50%)' },
              zIndex: 1300,
              width: { xs: '90%', sm: 400 },
              height: { xs: 'auto', sm: 450 },
              maxHeight: '80vh',
              overflowY: 'auto',
              borderRadius: 2,
              p: 3
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
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : questionsError ? (
              <Typography color="error">{questionsError}</Typography>
            ) : questions.length === 0 ? (
              <Typography color="text.secondary">No questions available for this product.</Typography>
            ) : (
              <List>
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
                          <Typography variant="body1">{question}</Typography>
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
        onClick={() => navigate(`/demo_site/product/${product.id}`)}
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
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              maxWidth: 500,
              width: '90%'
            }}
          >
            <Typography variant="h5" gutterBottom>Product Not Found</Typography>
            <Typography variant="body1" paragraph>
              We couldn't find the product you're looking for.
            </Typography>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
            >
              Go Back
            </Button>
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
    // Use useMemo to create a stable random name that won't change on re-renders
    const reviewAuthor = useMemo(() => random_name(), []);
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
                bgcolor: getAvatarColor(reviewAuthor),
                width: 40,
                height: 40,
                fontSize: '1rem',
                fontWeight: 600,
                color: 'white'
              }}
            >
              {reviewAuthor.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {reviewAuthor}
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
            margin: 0
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
                  color: 'white'
                }}
              >
                <ShoppingBagIcon fontSize="small" />
              </Box>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 700,
                  color: 'primary.main',
                  display: { xs: 'none', sm: 'block' },
                  fontSize: '1.1rem'
                }}
              >
                SuperShop
              </Typography>
            </Box>
            
            {/* Search Bar - Desktop */}
            <Box sx={{ 
              flexGrow: 1, 
              mx: 2, 
              display: { xs: 'none', md: 'block' } 
            }}>
              <AISearchBar 
                setData={setSearchResults} 
                ref={desktopSearchRef}
              />
            </Box>
            
            {/* Action Icons */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', gap: 2 }}>
              <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
                <IconButton size="small" onClick={toggleTheme} color="inherit">
                  {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                color="primary"
                size="medium"
                onClick={handleContactModalOpen}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1,
                  fontSize: '0.95rem',
                  minWidth: '140px',
                  display: { xs: 'none', sm: 'block' }
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
              setData={setSearchResults} 
              ref={mobileSearchRef}
            />
          </Box>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ pt: 10, pb: 8 }}>
          {/* Breadcrumbs */}
          <Breadcrumbs sx={{ mb: 3, mt: 2 }}>
            <Link 
              color="inherit" 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                navigate('/demo_site');
              }}
              sx={{ 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Home
            </Link>
            {genres.length > 0 && (
              <Link 
                color="inherit" 
                href="#" 
                onClick={(e) => e.preventDefault()}
                sx={{ 
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Movies
              </Link>
            )}
            <Typography color="text.primary">{title}</Typography>
          </Breadcrumbs>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleGoBack}
            sx={{ mb: 4 }}
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
                        maxWidth: { xs: '70%', sm: '60%', md: '100%' },
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
                      maxWidth: { xs: '70%', sm: '60%', md: '100%' },
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
                  right: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
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
                
                {/* Popularity for Movies */}
                {product.popularity && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      Popularity Score
                    </Typography>
                    <Typography variant="body2">
                      {parseFloat(product.popularity).toFixed(1)}
                    </Typography>
                  </Box>
                )}
                
                <Divider sx={{ my: 3 }} />
                
                {/* Add to Cart */}
                <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<ShoppingCartIcon />}
                    sx={{ 
                      borderRadius: 1.5,
                      py: 1.5,
                      textTransform: 'none',
                      flex: 1
                    }}
                  >
                    Add to Cart
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
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light' }}>
                <Typography color="error">{similarProductsError}</Typography>
              </Paper>
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
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light' }}>
                <Typography color="error">{summaryError}</Typography>
              </Paper>
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
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light' }}>
                <Typography color="error">{reviewsError}</Typography>
              </Paper>
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
            right: 30,
            top: '30%',
            transform: 'translateY(-50%)',
            zIndex: 1200
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