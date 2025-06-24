import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Typography,  
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  alpha,
  IconButton,
  Tooltip,
  Drawer,
  FormControl,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Paper,
  Fab,
  Rating,
  Chip,
  Container,
  Slider,
  CardActions,
  useMediaQuery
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useSearch } from '../../hooks/useSearch';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ecommerceTheme from './theme/ecommerceTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import ContactUsModal from './components/ContactUsModal';
import FAQModal from './components/FAQModal';
import GlobalHeader from './components/GlobalHeader';
import { AISearchBarRef } from './components/EcommerceAISearchBar';
import { 
  EcommerceCustomData, 
  EcommerceSearchResultItem, 
  FilterCondition,
  FilterOptions,
  SortOptions
} from './types/ecommerce';

const EcommerceHome: React.FC = () => {
  const [searchResults, setSearchResults] = useState<EcommerceSearchResultItem[]>([]);
  const [page, setPage] = useState(1);
  const { loading: apiLoading, searchProducts } = useSearch();
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isInitialRender = useRef(true);
  const previousPage = useRef(page);
  const previousItemsPerPage = useRef(itemsPerPage);
  const questionsButtonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useMediaQuery('(max-width:768px)');
  const isSearchTriggeredByUser = useRef(false);

  // Add ref for EcommerceAISearchBar
  const aiSearchBarRef = useRef<AISearchBarRef>(null);

  // Extract search query from URL if present
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>(searchQuery);
  const shouldOpenContactModal = queryParams.get('contactUs') === 'true';

  // Filter states - adapted for ecommerce
  const [priceRange, setPriceRange] = useState<number[]>([0, 5000]);
  const [sortBy, setSortBy] = useState('popularity');
  const [category, setCategory] = useState('all');
  const [rating, setRating] = useState(0);
  
  // Track initial filter values to prevent unnecessary API calls
  const initialFilters = useRef({
    priceRange: [0, 5000],
    sortBy: 'popularity',
    category: 'all',
    rating: 0
  });

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Ecommerce categories - updated for fashion/apparel
  const allCategories = [
    'Apparel', 'Footwear', 'Accessories', 'Personal Care', 'Home & Living', 'Sports',
    'Bags', 'Watches', 'Eyewear', 'Fragrance', 'Innerwear', 'Jewellery'
  ];

  // Use the ecommerce theme
  const theme = ecommerceTheme;

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState<Record<string, boolean>>({});
  const [faqModalOpen, setFaqModalOpen] = useState(false);

  // Handle FAQ question click
  const handleFAQQuestionClick = (question: string) => {
    // Open AI assistant with the selected question
    if (aiSearchBarRef.current) {
      aiSearchBarRef.current.openAiChatWithMessage(question, []);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setCategory('all');
    setPriceRange([0, 5000]);
    setRating(0);
    setSortBy('popularity');
  };

  // Update URL with search query
  const updateURLWithQuery = useCallback((query: string) => {
    const newUrl = new URL(window.location.href);
    if (query.trim()) {
      newUrl.searchParams.set('q', query.trim());
    } else {
      newUrl.searchParams.delete('q');
    }
    window.history.pushState({}, '', newUrl.toString());
  }, []);

  // Fetch products function
  const fetchProductsInternal = async (currentPage: number, pageSize: number, query: string = '') => {
    try {
      const filterConditions: FilterCondition[] = [];
      
      // Add price filter (using discounted_price field)
      if (priceRange[0] > 0 || priceRange[1] < 5000) {
        filterConditions.push({
          field: 'discounted_price',
          value: priceRange[0],
          operator: 'gte'
        });
        filterConditions.push({
          field: 'discounted_price',
          value: priceRange[1],
          operator: 'lte'
        });
      }
      
      // Add category filter
      if (category !== 'all') {
        filterConditions.push({
          field: 'master_category',
          value: category,
          operator: 'eq'
        });
      }
      
      // Add rating filter
    if (rating > 0) {
        filterConditions.push({
          field: 'average_rating',
          value: rating,
          operator: 'gte'
        });
      }
      
      // Create the filters object
      const filters: FilterOptions | undefined = filterConditions.length > 0 
        ? { conditions: filterConditions, filter_type: 'AND' } 
        : undefined;
      
      // Create the sort object
      let sort: SortOptions | undefined;
      
      switch (sortBy) {
        case 'popularity':
          sort = { field: 'rating_count', direction: 'desc' };
          break;
        case 'price-low':
          sort = { field: 'discounted_price', direction: 'asc' };
          break;
        case 'price-high':
          sort = { field: 'discounted_price', direction: 'desc' };
          break;
        case 'rating':
          sort = { field: 'average_rating', direction: 'desc' };
          break;
        case 'name':
          sort = { field: 'product_name', direction: 'asc' };
          break;
        default:
          sort = { field: 'rating_count', direction: 'desc' };
      }
      
      // Create the filters payload
      const filtersPayload = { filters, sort };
      
      // Fetch products with current page
      const response = await searchProducts({
        query: query || '',
        page: currentPage,
        size: pageSize,
        filters: filtersPayload
      });

      // Transform the response to match our ecommerce interface
      const ecommerceResults: EcommerceSearchResultItem[] = response.results.map(item => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        custom_data: item.custom_data as unknown as EcommerceCustomData,
        searchable_content: item.searchable_content,
        score: item.score,
        search_type: item.search_type
      }));

      setSearchResults(ecommerceResults);
      setTotalResults(response.total || response.results.length);
      setHasMore(response.has_more || false);

    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Initial load
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      // Set the current search query from URL if it exists
      if (searchQuery) {
        setCurrentSearchQuery(searchQuery);
      }
      fetchProductsInternal(page, itemsPerPage, searchQuery);
      
      // Don't clear the URL query parameter - keep it for proper navigation
    }
  }, []);

  // Page and page size changes
  useEffect(() => {
    if (!isInitialRender.current) {
      if (page !== previousPage.current || itemsPerPage !== previousItemsPerPage.current) {
        // Update URL to maintain current search query
        updateURLWithQuery(currentSearchQuery);
        fetchProductsInternal(page, itemsPerPage, currentSearchQuery);
        previousPage.current = page;
        previousItemsPerPage.current = itemsPerPage;
      }
    }
  }, [page, itemsPerPage]);

  // Apply filters when filter criteria change
  useEffect(() => {
    if (!isInitialRender.current) {
      // Check if any filter has actually changed from initial values
      const hasFilterChanged = 
        category !== initialFilters.current.category ||
        rating !== initialFilters.current.rating ||
        sortBy !== initialFilters.current.sortBy ||
        priceRange[0] !== initialFilters.current.priceRange[0] ||
        priceRange[1] !== initialFilters.current.priceRange[1];
      
      if (hasFilterChanged) {
        // Update URL to maintain current search query
        updateURLWithQuery(currentSearchQuery);
        fetchProductsInternal(1, itemsPerPage, currentSearchQuery);
        setPage(1);
      }
    }
  }, [category, priceRange, rating, sortBy]);



  // Handle contact modal
  useEffect(() => {
    if (shouldOpenContactModal) {
      setContactModalOpen(true);
      // Remove the contactUs parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('contactUs');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [shouldOpenContactModal]);

  // Sync search bar with URL parameters when location changes
  useEffect(() => {
    // Skip during initial render - let the initial load effect handle it
    if (isInitialRender.current) {
      return;
    }
    
    // Skip if this URL change was triggered by user search to avoid loop
    if (isSearchTriggeredByUser.current) {
      isSearchTriggeredByUser.current = false;
      return;
    }
    
    const urlParams = new URLSearchParams(location.search);
    const urlQuery = urlParams.get('q') || '';
    
    // Update search bar if URL query is different from current search query
    if (urlQuery !== currentSearchQuery) {
      setCurrentSearchQuery(urlQuery);
      // Update the search bar's internal state
      if (aiSearchBarRef.current) {
        aiSearchBarRef.current.setSearchQuery(urlQuery);
      }
      
      // If there's a URL query, trigger search
      if (urlQuery.trim()) {
        fetchProductsInternal(1, itemsPerPage, urlQuery);
        setPage(1);
      } else {
        // If no query, fetch all products
        fetchProductsInternal(1, itemsPerPage, '');
        setPage(1);
      }
    }
  }, [location.search, currentSearchQuery, itemsPerPage]);

  const handleProductClick = (productId: string) => {
    navigate(`/demo_ecommerce/${productId}`);
  };

  const handleToggleFavorite = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setFavoriteProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Handle next page
  const handleNextPage = () => {
    setPage(page + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle previous page
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };



  // Get product price
  const getProductPrice = (product: EcommerceSearchResultItem) => {
    return product.custom_data?.discounted_price || product.custom_data?.price || '0';
  };

  // Get product rating
  const getProductRating = (product: EcommerceSearchResultItem) => {
    return parseFloat(product.custom_data?.average_rating || '0');
  };

  // Check if product is on sale
  const isOnSale = (product: EcommerceSearchResultItem) => {
    const price = parseFloat(product.custom_data?.price || '0');
    const discountedPrice = parseFloat(product.custom_data?.discounted_price || '0');
    return price > discountedPrice && discountedPrice > 0;
  };

  // Get discount percentage
  const getDiscountPercentage = (product: EcommerceSearchResultItem) => {
    if (isOnSale(product)) {
      const price = parseFloat(product.custom_data?.price || '0');
      const discountedPrice = parseFloat(product.custom_data?.discounted_price || '0');
      return Math.round(((price - discountedPrice) / price) * 100);
    }
    return 0;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Main Content */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column'
        }}>
          {/* Global Header */}
          <GlobalHeader 
            onContactUs={() => setContactModalOpen(true)}
            searchRef={aiSearchBarRef}
            initialQuery={currentSearchQuery}
            onSearch={() => {
              // Close autocomplete dropdown
              aiSearchBarRef.current?.closeAutocomplete();
              
              // Get search query directly from the AISearchBar
              const newQuery = aiSearchBarRef.current?.getSearchQuery() || '';
              
              // Only proceed if there's a query
              if (newQuery.trim()) {
                // Set flag to indicate this is a user-triggered search
                isSearchTriggeredByUser.current = true;
                
                // Update URL with the new query
                updateURLWithQuery(newQuery);
                
                setCurrentSearchQuery(newQuery);
                // Reset to page 1 when performing a new search
                setPage(1);
                // Fetch products with the new query
                fetchProductsInternal(1, itemsPerPage, newQuery);
              }
            }}
          />

          {/* Products Section */}
          <Container maxWidth="xl" sx={{ flexGrow: 1, pb: 4, pt: { xs: 16, md: 12 } }}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {/* Filter Sidebar - Desktop */}
              {!isMobile && (
                <Paper
                  elevation={0}
                  sx={{
                    width: 280,
                    height: 'fit-content',
                    p: 2.5,
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    borderRadius: 2,
                    position: 'sticky',
                    top: 100
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Filters
                    </Typography>
                    <Button 
                      size="small" 
                      onClick={resetFilters}
                      sx={{ 
                        textTransform: 'none',
                        color: 'primary.main',
                        fontWeight: 500,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.08)
                        }
                      }}
                    >
                      Reset
                    </Button>
                  </Box>

                  {/* Category Filter */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                      Category
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        sx={{ 
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(theme.palette.divider, 0.3)
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          }
                        }}
                      >
                        <MenuItem value="all">All Categories</MenuItem>
                        {allCategories.map((cat) => (
                          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Price Range Filter */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                      Price Range
                    </Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider
                        value={priceRange}
                        onChange={(_, newValue) => setPriceRange(newValue as number[])}
                        valueLabelDisplay="auto"
                        min={0}
                        max={5000}
                        step={50}
                        valueLabelFormat={(value) => `₹${value}`}
                        sx={{ 
                          mb: 2,
                          '& .MuiSlider-thumb': {
                            width: 20,
                            height: 20,
                            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
                          },
                          '& .MuiSlider-track': {
                            height: 4
                          },
                          '& .MuiSlider-rail': {
                            height: 4,
                            bgcolor: alpha(theme.palette.grey[300], 0.5)
                          }
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          ₹{priceRange[0]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          ₹{priceRange[1]}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Rating Filter */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                      Minimum Rating
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {[4, 3, 2, 1, 0].map((stars) => (
                        <Box
                          key={stars}
                          onClick={() => setRating(stars)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1,
                            borderRadius: 1,
                            cursor: 'pointer',
                            bgcolor: rating === stars ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.05)
                            }
                          }}
                        >
                          <Rating value={stars} readOnly size="small" />
                          <Typography variant="body2">
                            {stars === 0 ? 'All' : `${stars}+ stars`}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Sort Options */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                      Sort By
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        sx={{ 
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(theme.palette.divider, 0.3)
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          }
                        }}
                      >
                        <MenuItem value="popularity">Popularity</MenuItem>
                        <MenuItem value="price-low">Price: Low to High</MenuItem>
                        <MenuItem value="price-high">Price: High to Low</MenuItem>
                        <MenuItem value="rating">Highest Rated</MenuItem>
                        <MenuItem value="name">Name A-Z</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Paper>
              )}

              {/* Main Content */}
              <Box sx={{ flexGrow: 1 }}>
                {/* Section Header */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: { xs: 2, md: 3 },
                  flexWrap: 'wrap',
                  gap: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Show per page selector - Desktop */}
                    {!isMobile && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Show:
                        </Typography>
                        <Select
                          value={itemsPerPage}
                          onChange={(e) => setItemsPerPage(Number(e.target.value))}
                          size="small"
                      sx={{ 
                            minWidth: 80, 
                            height: 32,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: alpha(theme.palette.divider, 0.3)
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main'
                            }
                          }}
                        >
                          <MenuItem value={6}>6</MenuItem>
                          <MenuItem value={12}>12</MenuItem>
                          <MenuItem value={24}>24</MenuItem>
                          <MenuItem value={48}>48</MenuItem>
                        </Select>
                      </Box>
                    )}
                  </Box>

                  {/* Mobile Filter Button */}
                  {isMobile && (
                    <Button
                      variant="outlined"
                      startIcon={<FilterListIcon />}
                      onClick={() => setIsFilterDrawerOpen(true)}
                      size="small"
                      sx={{ 
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 500,
                        borderColor: alpha(theme.palette.divider, 0.3),
                        color: 'text.secondary',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: alpha(theme.palette.primary.main, 0.04)
                        }
                      }}
                    >
                      Filters
                    </Button>
                  )}
                </Box>

                {/* Loading State */}
                {apiLoading && (
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
                    zIndex: 1000
                  }}>
                    <CircularProgress size={40} />
                  </Box>
                )}

                {/* Products Grid */}
                  {!apiLoading && searchResults.length > 0 && (
                  <Grid container spacing={3}>
                      {searchResults.map((product) => {
                  const price = getProductPrice(product);
                  const originalPrice = product.custom_data?.price;
                  const rating = getProductRating(product);
                  const onSale = isOnSale(product);
                  const discount = getDiscountPercentage(product);

                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                      <Card
                        onClick={() => handleProductClick(product.id)}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          borderRadius: 2,
                          overflow: 'hidden',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                          bgcolor: alpha(theme.palette.background.paper, 0.7),
                          backdropFilter: 'blur(10px)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.12)}`,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            '& .product-image': {
                              transform: 'scale(1.02)'
                            }
                          }
                        }}
                      >
                        {/* Product Image */}
                        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                          <CardMedia
                            component="img"
                            height="220"
                            image={product.image_url || product.custom_data?.image_url || `https://picsum.photos/400/220?random=${product.id}`}
                            alt={product.title || product.custom_data?.product_name}
                            className="product-image"
                            sx={{
                              objectFit: 'cover',
                              transition: 'transform 0.2s ease',
                              bgcolor: alpha(theme.palette.grey[100], 0.3)
                            }}
                          />
                          
                          {/* Sale Badge */}
                          {onSale && (
                            <Chip
                              label={`${discount}% OFF`}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                bgcolor: 'error.main',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.75rem'
                              }}
                            />
                          )}

                          {/* Favorite Button */}
                          <IconButton
                            onClick={(e) => handleToggleFavorite(e, product.id)}
                            sx={{
                              position: 'absolute',
                              bottom: 12,
                              right: 12,
                              bgcolor: alpha(theme.palette.background.paper, 0.9),
                              backdropFilter: 'blur(8px)',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.background.paper, 1),
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            {favoriteProducts[product.id] ? (
                              <FavoriteIcon sx={{ color: 'error.main' }} />
                            ) : (
                              <FavoriteBorderIcon />
                            )}
                          </IconButton>
                        </Box>

                        {/* Product Info */}
                        <CardContent sx={{ flexGrow: 1, p: 2 }}>
                          {/* Brand */}
                          {product.custom_data?.brand && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'text.secondary',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                mb: 0.5,
                                display: 'block'
                              }}
                            >
                              {product.custom_data.brand}
                            </Typography>
                          )}

                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 500,
                              mb: 1.5,
                              fontSize: '0.95rem',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              color: 'text.primary'
                            }}
                          >
                            {product.title || product.custom_data?.product_name}
                          </Typography>

                          {/* Rating */}
                          {rating > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <Rating 
                              value={rating} 
                              readOnly 
                              size="small" 
                              precision={0.1}
                              sx={{ mr: 0.5 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                ({product.custom_data?.rating_count || 0})
                            </Typography>
                          </Box>
                          )}

                          {/* Price */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600,
                                color: 'text.primary',
                                fontSize: '1.1rem'
                              }}
                            >
                              ₹{price}
                            </Typography>
                            {onSale && originalPrice && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  textDecoration: 'line-through',
                                  color: 'text.secondary',
                                  fontSize: '0.8rem'
                                }}
                              >
                                ₹{originalPrice}
                              </Typography>
                            )}
                          </Box>
                        </CardContent>

                        {/* Action Buttons */}
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            variant="outlined"
                            fullWidth
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add to cart logic
                            }}
                            sx={{
                              py: 0.75,
                              textTransform: 'none',
                              fontWeight: 500,
                              borderRadius: 1.5,
                              borderColor: alpha(theme.palette.divider, 0.3),
                              color: 'text.secondary',
                              fontSize: '0.875rem',
                              '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                                color: 'primary.main'
                              }
                            }}
                          >
                            Add to Cart
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}

                {/* No Results */}
                {!apiLoading && searchResults.length === 0 && (
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh',
                    width: '100%',
                    mt: 4,
                    mb: 4
                  }}>
                  <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 4, sm: 6 },
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        borderRadius: 3,
                        maxWidth: { xs: 320, sm: 400 },
                        width: '100%',
                        mx: 'auto'
                    }}
                  >
                    <ShoppingBagIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      Welcome to CogniShop
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Use the search bar above to discover amazing products with AI-powered recommendations
                    </Typography>
                  </Paper>
                  </Box>
                )}

                {/* Pagination */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  mt: 6,
                  gap: 2
                }}>
                    {/* Pagination controls */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      borderRadius: 2,
                      p: 0.5,
                      boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.08)}`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.7)}`
                    }}>
                      <Button 
                        variant="text" 
                        size="small" 
                        onClick={handlePrevPage}
                        disabled={page === 1}
                        startIcon={<Box component="span" sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 'bold' 
                        }}>‹</Box>}
                        sx={{ 
                          minWidth: 40,
                          borderRadius: 1.5,
                          color: 'text.primary',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                          '&.Mui-disabled': {
                            color: alpha(theme.palette.text.disabled, 0.6)
                          }
                        }}
                      >
                        Prev
                      </Button>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        px: 2,
                        height: 32,
                        minWidth: 48,
                        justifyContent: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        borderRadius: 1.5,
                        fontWeight: 'medium',
                        fontSize: '0.875rem'
                      }}>
                        {page}
                      </Box>
                      <Button 
                        variant="text" 
                        size="small" 
                        onClick={handleNextPage}
                        disabled={!hasMore}
                        endIcon={<Box component="span" sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 'bold' 
                        }}>›</Box>}
                        sx={{ 
                          minWidth: 40,
                          borderRadius: 1.5,
                          color: 'text.primary',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                          '&.Mui-disabled': {
                            color: alpha(theme.palette.text.disabled, 0.6)
                          }
                        }}
                      >
                        Next
                      </Button>
                    </Box>
                  </Box>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Floating Action Button */}
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
          <Tooltip title="Quick Questions" placement="left">
            <Fab
              size="medium"
              onClick={() => setFaqModalOpen(true)}
              ref={questionsButtonRef}
              sx={{
                bgcolor: theme.palette.secondary.main,
                color: 'white',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  bgcolor: theme.palette.secondary.dark,
                  transform: 'scale(1.05)',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <HelpIcon />
            </Fab>
          </Tooltip>
        </Box>

        {/* FAQ Modal */}
        <FAQModal
          open={faqModalOpen}
          onClose={() => setFaqModalOpen(false)}
          onQuestionClick={handleFAQQuestionClick}
          anchorEl={questionsButtonRef.current}
        />

        {/* Mobile Filter Drawer */}
        <Drawer
          anchor="right"
          open={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: 320,
              p: 3
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Filters
            </Typography>
            <Box>
              <Button 
                size="small" 
                onClick={resetFilters}
                sx={{ textTransform: 'none', mr: 1 }}
              >
                Reset
              </Button>
              <IconButton onClick={() => setIsFilterDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Category Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Category
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {allCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Price Range Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Price Range
            </Typography>
            <Box sx={{ px: 1 }}>
              <Slider
                value={priceRange}
                onChange={(_, newValue) => setPriceRange(newValue as number[])}
                valueLabelDisplay="auto"
                min={0}
                max={5000}
                step={50}
                valueLabelFormat={(value) => `₹${value}`}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  ₹{priceRange[0]}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ₹{priceRange[1]}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Rating Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Minimum Rating
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[4, 3, 2, 1, 0].map((stars) => (
                <Box
                  key={stars}
                  onClick={() => setRating(stars)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    cursor: 'pointer',
                    bgcolor: rating === stars ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  <Rating value={stars} readOnly size="small" />
                  <Typography variant="body2">
                    {stars === 0 ? 'All' : `${stars}+ stars`}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Sort Options */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Sort By
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="popularity">Popularity</MenuItem>
                <MenuItem value="price-low">Price: Low to High</MenuItem>
                <MenuItem value="price-high">Price: High to Low</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
                <MenuItem value="name">Name A-Z</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Apply Filters Button */}
          <Button
            variant="contained"
            fullWidth
            onClick={() => setIsFilterDrawerOpen(false)}
            sx={{ mt: 2, borderRadius: 2 }}
          >
            Apply Filters ({totalResults} products)
          </Button>
        </Drawer>

        {/* Contact Modal */}
        <ContactUsModal 
          open={contactModalOpen} 
          onClose={() => setContactModalOpen(false)} 
        />
      </Box>
    </ThemeProvider>
  );
};

export default EcommerceHome; 