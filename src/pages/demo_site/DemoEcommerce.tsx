import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Typography,  
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  AppBar, 
  Toolbar, 
  alpha,
  IconButton,
  Tooltip,
  Drawer,
  Divider,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Paper,
  SelectChangeEvent,
  Link,
  Stack,  
  ClickAwayListener,
  Zoom,
  List,
  ListItem,
  ListItemText,
  Fab,
  Rating,
  Badge,
  Chip
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FilterListIcon from '@mui/icons-material/FilterList';
import AISearchBar, { AISearchBarRef } from '../Products/ai_shopping/AISearchBar';
import { useSearch, SearchResultItem} from '../../hooks/useSearch';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from '../../theme/theme';
import { useNavigate, useLocation } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContactUsModal from './components/ContactUsModal';

// Drawer width
const DRAWER_WIDTH = 280;

// Define filter and sort interfaces
interface FilterCondition {
  field: string;
  value: any;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
}

interface FilterOptions {
  conditions: FilterCondition[];
  filter_type: 'AND' | 'OR';
}

interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

interface SearchFilters {
  filters?: FilterOptions;
  sort?: SortOptions;
}

const DemoEcommerce: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [page, setPage] = useState(1);
  const { loading: apiLoading, searchProducts, error: apiError} = useSearch();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    // Get initial theme based on system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialRender = useRef(true);
  const previousPage = useRef(page);
  const previousItemsPerPage = useRef(itemsPerPage);
  const questionsButtonRef = useRef<HTMLButtonElement>(null);

  // Extract search query from URL if present
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';
  // Add state to track the current search query
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>(searchQuery);
  const shouldOpenContactModal = queryParams.get('contactUs') === 'true';

  // Filter states
  const [priceRange, _setPriceRange] = useState<number[]>([0, 10]);
  const [sortBy, setSortBy] = useState('popularity');
  const [genre, setGenre] = useState('all');
  const [_searchFilters, setSearchFilters] = useState<SearchFilters>({});
  // Add state for expanded genres
  const [showAllGenres, setShowAllGenres] = useState(false);

  // Define popular genres for initial display
  const popularGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller'];
  const allGenres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror',
    'Mystery', 'Romance', 'Science Fiction', 'Thriller'
  ];
  
  // Get genres to display based on showAllGenres state
  const displayedGenres = showAllGenres ? allGenres : popularGenres;

  // Use the theme from theme.ts
  const theme = getTheme(mode);

  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Add state to track favorited products
  const [favoriteProducts, setFavoriteProducts] = useState<Record<string, boolean>>({});
  
  // FAQ modal state
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  
  // Sample frequently asked questions about movies
  const faqs = [
    "Summarize The Dark Knight's reviews",
    "What are the highest rated action movies?",
    "What's the update on my latest order?",
    "Can you recommend movies similar to Inception?",
    "What are some must-watch sci-fi movies?",
    "Can you suggest movies with great plot twists?"
  ];

  // Add ref for AISearchBar
  const aiSearchBarRef = useRef<AISearchBarRef | null>(null);

  aiSearchBarRef.current?.closeAutocomplete()
  
  // Add ref for mobile AISearchBar
  const mobileSearchRef = useRef<AISearchBarRef | null>(null);

  mobileSearchRef.current?.closeAutocomplete()

  // Add state for selected question
  const [_selectedQuestion, setSelectedQuestion] = useState('');

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setMode(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Set the current search query when URL param changes
    if (searchQuery) {
      setCurrentSearchQuery(searchQuery);
    }
  }, [searchQuery]);

  // Memoized fetch function to prevent recreation on each render
  const fetchProducts = useCallback(async (currentPage: number, pageSize: number, query: string = currentSearchQuery) => {
    try {
      // Use current filter and sort selections
      const filterConditions: FilterCondition[] = [];
      
      // Add vote_average (rating) filter
      if (priceRange[0] > 0 || priceRange[1] < 10) {
        filterConditions.push({
          field: 'vote_average',
          value: priceRange[0],
          operator: 'gte'
        });
        filterConditions.push({
          field: 'vote_average',
          value: priceRange[1],
          operator: 'lte'
        });
      }
      
      // Add genre filter - using 'in' operator to check if the genre exists in the array
      if (genre !== 'all') {
        filterConditions.push({
          field: 'genres',
          // Using a partial string match approach
          value: genre,
          operator: 'in'
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
          sort = { field: 'vote_count', direction: 'desc' };
          break;
        case 'rating':
          sort = { field: 'vote_average', direction: 'desc' };
          break;
        default:
          // Default to popularity
          sort = { field: 'vote_count', direction: 'desc' };
      }
      
      // Set the filters to state for debugging/transparency
      const filtersPayload = { filters, sort };
      setSearchFilters(filtersPayload);
      
      // Fetch products with current page
      searchProducts({
        query: query,
        page: currentPage,
        size: pageSize,
        filters: filtersPayload
      }).then(response => {
        setSearchResults(response.results);
        setTotalResults(response.total || response.results.length);
        setHasMore(response.has_more || false);
      }).catch(error => {
        console.error('Error fetching products:', error);
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      // Error is handled via the apiError state from useSearch
    }
  }, [searchProducts, priceRange, genre, sortBy, currentSearchQuery]);

  // Combined useEffect for initial load and page/pageSize changes
  useEffect(() => {
    // When this is the initial render
    if (isInitialRender.current) {
      console.log('Initial render');
      isInitialRender.current = false;
      fetchProducts(page, itemsPerPage, searchQuery);
      
      // If there was a query parameter, let's update the URL to remove it 
      // after the initial search to keep it clean for subsequent navigation
      if (searchQuery) {
        window.history.replaceState(null, '', '/demo_site');
      }
    } 
    // When page or itemsPerPage changes (not on initial render)
    else if (page !== previousPage.current || itemsPerPage !== previousItemsPerPage.current) {
      console.log('Page or itemsPerPage changed');
      fetchProducts(page, itemsPerPage, currentSearchQuery);
      previousPage.current = page;
      previousItemsPerPage.current = itemsPerPage;
    }
  }, [page, itemsPerPage, fetchProducts, searchQuery, currentSearchQuery]);

  // Check for contactUs query parameter and open modal if needed
  useEffect(() => {
    if (shouldOpenContactModal) {
      setContactModalOpen(true);
      // Update URL to remove the parameter after opening to prevent reopening on refresh
      navigate('/demo_site', { replace: true });
    }
  }, [shouldOpenContactModal, navigate]);

  // Auto open FAQ modal after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setFaqModalOpen(true);
    }, 3000); // 3 seconds delay
    
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const newPageSize = Number(event.target.value);
    // When changing page size, adjust the current page to maintain the start position
    const currentStartIndex = (page - 1) * itemsPerPage; 
    const newPage = Math.floor(currentStartIndex / newPageSize) + 1;
    
    setItemsPerPage(newPageSize);
    setPage(newPage);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    const newSortBy = event.target.value;
    setSortBy(newSortBy);
    // Using the new value directly to ensure latest data
    applyFilters(priceRange, genre, newSortBy);
  };

  const handleGenreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newGenre = event.target.value;
    setGenre(newGenre);
    // Using the new value directly to ensure latest data
    applyFilters(priceRange, newGenre, sortBy);
  };

  const toggleMobileFilter = () => {
    setMobileFilterOpen(!mobileFilterOpen);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/demo_site/${productId}`);
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
    if (hasMore || page * itemsPerPage < totalResults) {
      setPage(page + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle previous page
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Unified function to apply filters with current values
  const applyFilters = (currentPriceRange: number[], currentGenre: string, currentSortBy: string) => {
    // Build filter conditions based on current filter state
    const filterConditions: FilterCondition[] = [];
    
    // Add vote_average (rating) filter
    if (currentPriceRange[0] > 0 || currentPriceRange[1] < 10) {
      filterConditions.push({
        field: 'vote_average',
        value: currentPriceRange[0],
        operator: 'gte'
      });
      filterConditions.push({
        field: 'vote_average',
        value: currentPriceRange[1],
        operator: 'lte'
      });
    }
    
    // Add genre filter - using 'in' operator to check if the genre exists in the array
    if (currentGenre !== 'all') {
      filterConditions.push({
        field: 'genres',
        // Using a partial string match approach
        value: currentGenre,
        operator: 'in'
      });
    }
    
    // Create the filters object
    const filters: FilterOptions | undefined = filterConditions.length > 0 
      ? { conditions: filterConditions, filter_type: 'AND' } 
      : undefined;
    
    // Create the sort object
    let sort: SortOptions | undefined;
    
    switch (currentSortBy) {
      case 'popularity':
        sort = { field: 'vote_count', direction: 'desc' };
        break;
      case 'rating':
        sort = { field: 'vote_average', direction: 'desc' };
        break;
      default:
        // Default to popularity
        sort = { field: 'vote_count', direction: 'desc' };
    }
    
    // Set the filters to state for debugging/transparency
    const filtersPayload = { filters, sort };
    setSearchFilters(filtersPayload);
    
    // Log the filter payload for debugging
    console.log('Applying filters:', filtersPayload);
    
    // Fetch products with new filters
    searchProducts({
      query: currentSearchQuery, // Use the current search query
      page: 1, // Reset to page 1 when changing filters
      size: itemsPerPage,
      filters: filtersPayload
    }).then(response => {
      setSearchResults(response.results);
      setTotalResults(response.total || response.results.length);
      setHasMore(response.has_more || false);
      setPage(1); // Reset page to 1
    }).catch(error => {
      console.error('Error fetching products:', error);
    });
  };

  // Genre Filter section
  const genreFilterSection = (
    <Box sx={{ mt: 1.5 }}>
      <FormControl component="fieldset" sx={{ width: '100%' }}>
        <RadioGroup value={genre} onChange={handleGenreChange}>
          <Box sx={{ display: 'grid', gap: 1 }}>
            <FormControlLabel 
              value="all" 
              control={
                <Radio 
                  size="small" 
                  sx={{ 
                    '&.Mui-checked': {
                      color: 'primary.main'
                    }
                  }}
                />
              } 
              label={
                <Typography variant="body2" sx={{ fontWeight: genre === 'all' ? 600 : 400 }}>
                  All Genres
                </Typography>
              }
              sx={{ mr: 0 }}
            />
            {displayedGenres.map(genreOption => (
              <FormControlLabel 
                key={genreOption}
                value={genreOption} 
                control={
                  <Radio 
                    size="small" 
                    sx={{ 
                      '&.Mui-checked': {
                        color: 'primary.main'
                      }
                    }}
                  />
                } 
                label={
                  <Typography variant="body2" sx={{ fontWeight: genre === genreOption ? 600 : 400 }}>
                    {genreOption}
                  </Typography>
                }
                sx={{ mr: 0 }}
              />
            ))}
          </Box>
        </RadioGroup>
      </FormControl>
      
      {!showAllGenres && allGenres.length > popularGenres.length && (
        <Button 
          onClick={() => setShowAllGenres(true)}
          sx={{ 
            mt: 1,
            fontSize: '0.75rem',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline'
            },
            pl: 0.5,
            minWidth: 'auto',
            textTransform: 'none'
          }}
        >
          + Show more genres
        </Button>
      )}
      
      {showAllGenres && (
        <Button 
          onClick={() => setShowAllGenres(false)}
          sx={{ 
            mt: 1,
            fontSize: '0.75rem',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline'
            },
            pl: 0.5,
            minWidth: 'auto',
            textTransform: 'none'
          }}
        >
          - Show less
        </Button>
      )}
    </Box>
  );

  // Filter content component
  const filterContent = (
    <Box sx={{ 
      p: 3, 
      width: '100%',
      overflowY: 'auto',
      '&::-webkit-scrollbar': {
        width: '6px',
        display: 'block',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
        borderRadius: '3px',
        border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
      },
    }}>
      <Typography variant="h6" gutterBottom sx={{ 
        fontWeight: 700, 
        mb: 3, 
        borderBottom: '2px solid', 
        borderColor: 'primary.main', 
        pb: 1,
        display: 'inline-block'
      }}>
        Filters
      </Typography>
      
      {/* Genre Filter */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ 
          fontWeight: 600, 
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          '&:before': {
            content: '""',
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            mr: 1,
            opacity: 0.7
          }
        }}>
          Genre
        </Typography>
        {genreFilterSection}
      </Box>
      
      {/* Sort By */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ 
          fontWeight: 600, 
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          '&:before': {
            content: '""',
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            mr: 1,
            opacity: 0.7
          }
        }}>
          Sort By
        </Typography>
        <FormControl fullWidth size="small" sx={{ mt: 2 }}>
          <Select
            value={sortBy}
            onChange={handleSortChange}
            displayEmpty
            sx={{ 
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(theme.palette.divider, 0.8)
              }
            }}
          >
            <MenuItem value="popularity" sx={{ fontWeight: 'medium' }}>Popularity</MenuItem>
            <MenuItem value="rating" sx={{ fontWeight: 'medium' }}>Rating</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );

  // Render error message based on status code
  const renderErrorMessage = () => {
    if (!apiError) return null;
    
    return (
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={3}
          sx={{
            p: 0,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: theme.shadows[3],
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.2)
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
                
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ mt: 3 }}
                  justifyContent={{ xs: 'center', sm: 'flex-start' }}
                >
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
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Box>
    );
  };

  // Handle question click to send to chatbot
  const handleQuestionClick = (question: string) => {
    // Store the selected question
    setSelectedQuestion(question);
    
    // Close the questions modal
    setFaqModalOpen(false);
    
    // Get a reference to the AI search bar
    if (aiSearchBarRef.current) {
      // Call the openAiChatWithMessage method that directly sends the message
      aiSearchBarRef.current.openAiChatWithMessage(question);
    } else {
      console.error("AI Search Bar reference not available");
    }
  };

  // FAQ modal component
  const FaqModal = () => {
    if (!faqModalOpen) return null;
    
    return (
      <ClickAwayListener onClickAway={() => setFaqModalOpen(false)}>
        <Zoom 
          in={faqModalOpen} 
          timeout={{
            enter: 500,
            exit: 400
          }}
          style={{
            transitionDelay: faqModalOpen ? '100ms' : '0ms'
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
              maxHeight: { xs: '400px', sm: '400px' },
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
              </Typography>
              <IconButton size="small" onClick={() => setFaqModalOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ px: 0 }}>
              {faqs.map((question, index) => (
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
                  setFaqModalOpen(false);
                  if (aiSearchBarRef.current) {
                    aiSearchBarRef.current.openAiChat();
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
          </Paper>
        </Zoom>
      </ClickAwayListener>
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
        padding: 0
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
            height: { xs: 'auto', md: '64px' } // Set auto height for mobile to adapt to search bar
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
                  fontSize: { xs: '0.9rem', sm: '1.1rem' }
                }}
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
                setData={setSearchResults}
                initialQuery={searchQuery}
                ref={aiSearchBarRef}
                onSearch={() => {
                  // Get search query directly from the AISearchBar
                  const newQuery = aiSearchBarRef.current?.getSearchQuery() || '';
                  if (newQuery) {
                    setCurrentSearchQuery(newQuery);
                    // Reset to page 1 when performing a new search
                    setPage(1);
                    // Fetch products with the new query
                    fetchProducts(1, itemsPerPage, newQuery);
                    // Update URL to reflect the search
                    // navigate(`/demo_site?q=${encodeURIComponent(newQuery)}`, { replace: true });
                  }
                }}
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
                onClick={() => setContactModalOpen(true)}
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
              setData={setSearchResults}
              initialQuery={searchQuery}
              ref={mobileSearchRef}
              onSearch={() => {
                // Get search query directly from the AISearchBar
                const newQuery = mobileSearchRef.current?.getSearchQuery() || '';
                if (newQuery) {
                  setCurrentSearchQuery(newQuery);
                  // Reset to page 1 when performing a new search
                  setPage(1);
                  // Fetch products with the new query
                  fetchProducts(1, itemsPerPage, newQuery);
                  // Update URL to reflect the search
                  // navigate(`/demo_site?q=${encodeURIComponent(newQuery)}`, { replace: true });
                }
              }}
            />
          </Box>
        </AppBar>

        {/* Contact Form Modal */}
        <ContactUsModal
          open={contactModalOpen}
          onClose={() => {
            setContactModalOpen(false);
          }}
        />

        {/* Main Content */}
        <Box sx={{ 
          display: 'flex', 
          width: '100%',
          mt: { xs: '120px', md: '64px' } // Further increased top margin for mobile to prevent content cropping
        }}>
          {/* Sidebar - Desktop */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: DRAWER_WIDTH,
                borderRight: '1px solid',
                borderColor: 'divider',
                pt: 2,
                mt: '64px', // Match the AppBar height
                '&::-webkit-scrollbar': {
                  width: '6px',
                  display: 'block', // Force display
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                  borderRadius: '3px',
                  border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                },
              },
            }}
            open
          >
            {filterContent}
          </Drawer>
          
          {/* Sidebar - Mobile */}
          <Drawer
            variant="temporary"
            open={mobileFilterOpen}
            onClose={toggleMobileFilter}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: DRAWER_WIDTH,
                borderRight: '1px solid',
                borderColor: 'divider',
                '&::-webkit-scrollbar': {
                  width: '6px',
                  display: 'block', // Force display
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                  borderRadius: '3px',
                  border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                },
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
              <Typography variant="h6">Filters</Typography>
              <IconButton onClick={toggleMobileFilter}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />
            {filterContent}
          </Drawer>

          {/* Main Content Area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, md: 3 },
              width: { xs: '100%', sm: `calc(100% - ${DRAWER_WIDTH}px)` },
              ml: { sm: `${DRAWER_WIDTH}px` },
              overflowY: 'auto',
              height: 'calc(100vh - 64px)',
              '&::-webkit-scrollbar': {
                width: '6px',
                display: 'block',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                borderRadius: '3px',
                border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              },
            }}
          >
            {/* Page Title with Warning */}
            <Box sx={{ mb: 4 }}>
              {/* Warning Box */}
              <Box sx={{ 
                display: { xs: 'none', sm: 'block' },
                bgcolor: alpha('#FFF8E6', theme.palette.mode === 'dark' ? 0.1 : 1),
                border: '1px solid',
                borderColor: alpha('#F0B849', 0.5),
                borderRadius: 1,
                p: 2,
                mb: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box component="span" sx={{ 
                    color: '#F0B849', 
                    mr: 1.5,
                    fontSize: '1rem'
                  }}>
                    ⚠️
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.mode === 'dark' ? 'text.primary' : 'text.secondary' }}>
                    This demo uses the 
                    <Link 
                      href="https://www.kaggle.com/datasets/disham993/9000-movies-dataset" 
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        ml: 0.5, 
                        mr: 0.5,
                        color: theme.palette.primary.main,
                        textDecoration: 'none',
                        fontWeight: 'medium',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      Kaggle Movies Dataset
                    </Link>
                    but our AI-powered search works brilliantly with e-commerce products, blog content, knowledge bases, and more! Transform your customer experience today.
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
              }}>
                <Box>
                  {/* Show search query message when there's a query */}
                  {currentSearchQuery && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        Results for:
                      </Typography>
                      <Chip 
                        label={currentSearchQuery}
                        size="small"
                        color="primary"
                        sx={{ 
                          fontWeight: 500,
                          height: 24,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                
                {/* Sort By - Mobile & Tablet */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Show:
                    </Typography>
                    <Select
                      value={itemsPerPage}
                      onChange={handlePageSizeChange}
                      size="small"
                      sx={{ minWidth: 80, height: 32 }}
                    >
                      <MenuItem value={6}>6</MenuItem>
                      <MenuItem value={12}>12</MenuItem>
                      <MenuItem value={24}>24</MenuItem>
                      <MenuItem value={48}>48</MenuItem>
                    </Select>
                  </Box>
                
                  <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <Select
                        value={sortBy}
                        onChange={handleSortChange}
                        displayEmpty
                        sx={{ borderRadius: 1 }}
                      >
                        <MenuItem value="popularity">Sort: Popularity</MenuItem>
                        <MenuItem value="rating">Sort: Rating</MenuItem>
                      </Select>
                    </FormControl>
                    <Tooltip title="Filters">
                      <IconButton 
                        onClick={toggleMobileFilter} 
                        size="small"
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1
                        }}
                      >
                        <FilterListIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Loading Indicator */}
            {apiLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Error Message */}
            {!apiLoading && apiError && renderErrorMessage()}

            {/* Product Grid */}
            {!apiLoading && !apiError && (
              <>
                {searchResults.length > 0 ? (
                  <Grid container spacing={3}>
                    {searchResults.map((product) => (
                      <Grid item xs={12} sm={6} md={4} key={product.id}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.2s',
                            borderRadius: 2,
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: theme.shadows[4]
                            }
                          }}
                          onClick={() => handleProductClick(product.id)}
                        >
                          {/* Favorite Button */}
                          <IconButton 
                            size="small" 
                            sx={{ 
                              position: 'absolute', 
                              top: 8, 
                              right: 8, 
                              bgcolor: 'background.paper',
                              boxShadow: theme.shadows[2],
                              '&:hover': {
                                bgcolor: 'background.paper',
                              },
                              zIndex: 1
                            }}
                            onClick={(e) => handleToggleFavorite(e, product.id)}
                          >
                            <FavoriteIcon 
                              fontSize="small" 
                              sx={{ color: favoriteProducts[product.id] ? 'error.main' : 'action' }} 
                            />
                          </IconButton>
                          
                          {/* Product Image */}
                          {(product.image_url) ? (
                            <CardMedia
                              component="img"
                              height="260"
                              image={product.image_url}
                              alt={product.title}
                              sx={{ 
                                objectFit: 'cover',
                                height: { xs: '240px', sm: '260px', md: '280px' }
                              }}
                            />
                          ) : (
                            <CardMedia
                              component="img"
                              height="260"
                              image={`https://picsum.photos/400/300?random=${product.id}`}
                              alt={product.title}
                              sx={{ 
                                objectFit: 'cover',
                                height: { xs: '240px', sm: '260px', md: '280px' }
                              }}
                            />
                          )}
                          
                          <CardContent sx={{ flexGrow: 1, p: 3 }}>
                            {/* Genre for movies */}
                            {product.custom_data?.genres && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                sx={{ 
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                  fontWeight: 500,
                                  display: 'block',
                                  mb: 1
                                }}
                              >
                                {JSON.parse(product.custom_data.genres.replace(/'/g, '"'))[0]}
                              </Typography>
                            )}
                            
                            {/* Product Title */}
                            <Typography 
                              variant="h6" 
                              gutterBottom 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '1rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                height: '3rem'
                              }}
                            >
                              {product.title}
                            </Typography>
                            
                            {/* Rating */}
                            {product.custom_data?.vote_average && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <Rating 
                                  value={parseFloat(product.custom_data.vote_average) / 2} 
                                  precision={0.5} 
                                  readOnly 
                                  size="small"
                                />
                                <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                                  {(parseFloat(product.custom_data.vote_average) / 2).toFixed(1)}
                                  {product.custom_data?.vote_count && (
                                    <span> ({parseInt(product.custom_data.vote_count).toLocaleString()})</span>
                                  )}
                                </Typography>
                              </Box>
                            )}
                            
                            {/* Price */}
                            <Typography 
                              variant="h6" 
                              color="primary.main" 
                              sx={{ 
                                mb: 1.5, 
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center' 
                              }}
                            >
                              ${product.custom_data?.price ? product.custom_data.price.toFixed(2) : '9.99'}
                            </Typography>
                            
                            {/* Release Date for movies */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              {product.custom_data?.release_date && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                >
                                  Released: {new Date(product.custom_data.release_date).getFullYear()}
                                </Typography>
                              )}
                            </Box>
                            
                            {/* View Details Button */}
                            <Button 
                              variant="contained" 
                              fullWidth
                              sx={{ 
                                mt: 'auto',
                                textTransform: 'none',
                                borderRadius: 1.5,
                                py: 1
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/demo_site/${product.id}`);
                              }}
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Paper 
                    sx={{ 
                      p: 4, 
                      textAlign: 'center',
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.background.paper, 0.6)
                    }}
                  >
                    <ShoppingBagIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6">No products found</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Try adjusting your search or filter criteria
                    </Typography>
                  </Paper>
                )}
              </>
            )}
            
            {/* Pagination */}
            {totalResults > 0 && (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'flex-end',
                mt: 6,
                gap: 2
              }}>
                {/* Pagination controls */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: theme.palette.background.paper,
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
                      color: theme.palette.text.primary,
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
                    color: theme.palette.primary.main,
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
                    disabled={!hasMore && page * itemsPerPage >= totalResults}
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
                      color: theme.palette.text.primary,
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
                
                <Typography variant="body2" color="text.secondary">
                  Showing {((page - 1) * itemsPerPage) + 1}-{Math.min(page * itemsPerPage, totalResults)} of {totalResults} results
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* FAQ floating button */}
      <Fab
        color="primary"
        aria-label="questions"
        ref={questionsButtonRef}
        onClick={() => setFaqModalOpen(!faqModalOpen)}
        sx={{
          position: 'fixed',
          right: { xs: 16, sm: 30 },
          top: { xs: '35%', sm: '30%' },
          transform: { xs: 'translateY(0)', sm: 'translateY(-50%)' },
          zIndex: 1200,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          animation: faqModalOpen ? 'none' : 'bounce 1s ease infinite',
          animationDelay: '3s',
          boxShadow: theme => faqModalOpen 
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
        {faqModalOpen ? <CloseIcon /> : <QuestionAnswerIcon />}
      </Fab>
      
      {/* FAQ Modal */}
      <FaqModal />
    </ThemeProvider>
  );
};

export default DemoEcommerce; 