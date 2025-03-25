import React, { useState, useEffect } from 'react';
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
  Slider,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  Badge,
  Button,
  CircularProgress,
  Paper,
  Rating,
  SelectChangeEvent,
  Link
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import AISearchBar from '../Products/ai_shopping/AISearchBar';
import { SearchResultItem } from '../../services/searchApi';
import searchApi from '../../services/searchApi';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from '../../theme/theme';
import { useNavigate } from 'react-router-dom';

// Drawer width
const DRAWER_WIDTH = 280;

const DemoEcommerce: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    // Get initial theme based on system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const navigate = useNavigate();

  // Filter states
  const [priceRange, setPriceRange] = useState<number[]>([0, 10]);
  const [sortBy, setSortBy] = useState('relevance');
  const [genre, setGenre] = useState('all');
  const [releaseYear, setReleaseYear] = useState<number[]>([1970, 2023]);

  // Use the theme from theme.ts
  const theme = getTheme(mode);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setMode(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Initial search on page load
  useEffect(() => {
    const fetchInitialProducts = async () => {
      setLoading(true);
      try {
        const response = await searchApi.searchProducts({
          query: '',
          page: page,
          size: itemsPerPage
        });
        setSearchResults(response.results);
        setTotalResults(response.total || response.results.length);
        setHasMore(response.has_more || false);
      } catch (error) {
        console.error('Error fetching initial products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialProducts();
  }, [page, itemsPerPage]);

  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  
  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    setItemsPerPage(Number(event.target.value));
    setPage(1); // Reset to first page when changing items per page
  };

  const handlePriceChange = (_event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as number[]);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };

  const handleGenreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGenre(event.target.value);
  };

  const handleReleaseYearChange = (_event: Event, newValue: number | number[]) => {
    setReleaseYear(newValue as number[]);
  };

  const toggleMobileFilter = () => {
    setMobileFilterOpen(!mobileFilterOpen);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/demo_site/${productId}`);
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
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Filters
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {/* Rating Filter */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Rating Range
        </Typography>
        <Box sx={{ px: 1 }}>
          <Slider
            value={priceRange}
            onChange={handlePriceChange}
            valueLabelDisplay="auto"
            min={0}
            max={10}
            step={0.5}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {priceRange[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {priceRange[1]}
          </Typography>
        </Box>
      </Box>
      
      {/* Release Year Filter */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Release Year
        </Typography>
        <Box sx={{ px: 1 }}>
          <Slider
            value={releaseYear}
            onChange={handleReleaseYearChange}
            valueLabelDisplay="auto"
            min={1970}
            max={2023}
            step={1}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {releaseYear[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {releaseYear[1]}
          </Typography>
        </Box>
      </Box>
      
      {/* Genre Filter */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Genre
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup value={genre} onChange={handleGenreChange}>
            <FormControlLabel value="all" control={<Radio size="small" />} label="All Genres" />
            <FormControlLabel value="action" control={<Radio size="small" />} label="Action" />
            <FormControlLabel value="comedy" control={<Radio size="small" />} label="Comedy" />
            <FormControlLabel value="drama" control={<Radio size="small" />} label="Drama" />
            <FormControlLabel value="sci-fi" control={<Radio size="small" />} label="Sci-Fi" />
            <FormControlLabel value="horror" control={<Radio size="small" />} label="Horror" />
          </RadioGroup>
        </FormControl>
      </Box>
      
      {/* Sort By */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Sort By
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={sortBy}
            onChange={handleSortChange}
            displayEmpty
            sx={{ borderRadius: 1 }}
          >
            <MenuItem value="relevance">Relevance</MenuItem>
            <MenuItem value="rating_high">Rating: High to Low</MenuItem>
            <MenuItem value="rating_low">Rating: Low to High</MenuItem>
            <MenuItem value="year_new">Newest First</MenuItem>
            <MenuItem value="year_old">Oldest First</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Apply Filters Button (Mobile Only) */}
      <Box sx={{ display: { sm: 'none' } }}>
        <Button 
          variant="contained" 
          fullWidth 
          onClick={toggleMobileFilter}
          sx={{ mt: 2 }}
        >
          Apply Filters
        </Button>
      </Box>
    </Box>
  );

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
              <AISearchBar setData={setSearchResults} />
            </Box>
            
            {/* Action Icons */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
              <Tooltip title="Favorites">
                <IconButton size="small" color="inherit" sx={{ ml: { xs: 0, md: 1 } }}>
                  <FavoriteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cart">
                <IconButton size="small" color="inherit" sx={{ ml: { xs: 0, md: 1 } }}>
                  <Badge badgeContent={3} color="primary">
                    <ShoppingCartIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Tooltip title="Account">
                <IconButton size="small" color="inherit" sx={{ ml: { xs: 0, md: 1 } }}>
                  <PersonIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
                <IconButton size="small" onClick={toggleTheme} color="inherit" sx={{ ml: { xs: 0, md: 1 } }}>
                  {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Filters" sx={{ display: { sm: 'none' } }}>
                <IconButton size="small" color="inherit" onClick={toggleMobileFilter} sx={{ ml: { xs: 0, md: 1 } }}>
                  <FilterListIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
          
          {/* Search Bar - Mobile */}
          <Box sx={{ 
            px: { xs: 2, md: 3 }, 
            pb: 1, 
            display: { xs: 'block', md: 'none' } 
          }}>
            <AISearchBar setData={setSearchResults} />
          </Box>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ 
          display: 'flex', 
          width: '100%',
          mt: '64px' // Add margin to account for fixed AppBar
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
                mt: '48px', // Match the AppBar height
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
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0 }}>
                All Products
              </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {totalResults} products found
                </Typography>
                
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
                
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={sortBy}
                      onChange={handleSortChange}
                      displayEmpty
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value="relevance">Sort: Relevance</MenuItem>
                        <MenuItem value="rating_low">Sort: Rating Low-High</MenuItem>
                        <MenuItem value="rating_high">Sort: Rating High-Low</MenuItem>
                        <MenuItem value="year_new">Sort: Newest</MenuItem>
                    </Select>
                  </FormControl>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Loading Indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Product Grid */}
            {!loading && (
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
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle favorite click
                            }}
                          >
                            <FavoriteIcon fontSize="small" color="action" />
                          </IconButton>
                          
                          {/* Product Image */}
                          {(product.image_url || product.custom_data?.image_url || product.custom_data?.Poster_Url) ? (
                            <CardMedia
                              component="img"
                              height="200"
                              image={product.image_url || product.custom_data?.image_url || product.custom_data?.Poster_Url}
                              alt={product.title}
                              sx={{ 
                                objectFit: 'cover',
                                height: '200px'
                              }}
                            />
                          ) : (
                            <CardMedia
                              component="img"
                              height="200"
                              image={`https://picsum.photos/400/300?random=${product.id}`}
                              alt={product.title}
                              sx={{ 
                                objectFit: 'cover',
                                height: '200px'
                              }}
                            />
                          )}
                          
                          <CardContent sx={{ flexGrow: 1, p: 3 }}>
                            {/* Category */}
                            {product.custom_data?.category && (
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
                                {product.custom_data.category}
                              </Typography>
                            )}
                            
                            {/* Genre for movies */}
                            {product.custom_data?.Genre && (
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
                                {product.custom_data.Genre.split(',')[0]}
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
                              {product.title || product.custom_data?.Title}
                            </Typography>
                            
                            {/* Rating */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Rating 
                                value={product.custom_data?.rating ? parseFloat(product.custom_data.rating) : 
                                       product.custom_data?.Vote_Average ? parseFloat(product.custom_data.Vote_Average) / 2 : 4.5} 
                                precision={0.5} 
                                size="small" 
                                readOnly 
                              />
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                ({product.custom_data?.reviews || product.custom_data?.Vote_Count || '42'})
                              </Typography>
                            </Box>
                            
                            {/* Price or Release Date for movies */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              {product.custom_data?.price && (
                                <Typography 
                                  variant="h6" 
                                  color="primary" 
                                  sx={{ 
                                    fontWeight: 700
                                  }}
                                >
                                  ${parseFloat(product.custom_data.price).toFixed(2)}
                                </Typography>
                              )}
                              
                              {product.custom_data?.original_price && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    ml: 1,
                                    textDecoration: 'line-through'
                                  }}
                                >
                                  ${parseFloat(product.custom_data.original_price).toFixed(2)}
                                </Typography>
                              )}
                              
                              {product.custom_data?.Release_Date && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                >
                                  Released: {new Date(product.custom_data.Release_Date).getFullYear()}
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
    </ThemeProvider>
  );
};

export default DemoEcommerce; 