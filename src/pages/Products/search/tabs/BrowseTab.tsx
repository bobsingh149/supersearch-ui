import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  Grid,
  Paper,
  IconButton,
  alpha,
  useTheme,
  Select,
  MenuItem,
  CircularProgress,
  Collapse,
  Divider,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useSearch, SearchResultItem } from '../../../../hooks/useSearch';

export const BrowseTab = () => {
  const theme = useTheme();
  const { loading: apiLoading, error: apiError, searchProducts } = useSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Get border color based on theme mode
  const getBorderColor = () => {
    return theme.palette.mode === 'dark' 
      ? alpha(theme.palette.grey[700], 0.6)
      : alpha(theme.palette.grey[400], 0.5);
  };

  // Toggle expanded state for a product
  const toggleExpand = (productId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Fetch search results
  const fetchSearchResults = async (queryOverride?: string) => {
    const queryToUse = queryOverride !== undefined ? queryOverride : searchQuery;
    
    setError(null);
    
    try {
      const response = await searchProducts({
        query: queryToUse,
        page,
        size: pageSize,
      });
      
      setSearchResults(response.results);
      setHasMore(response.has_more || false);
      setTotalResults(response.total || response.results.length);
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError(apiError || 'Failed to fetch search results. Please try again.');
      setSearchResults([]);
    } finally {
      setInitialLoad(false);
    }
  };

  // Load initial results on component mount
  useEffect(() => {
    fetchSearchResults('');
  }, []);

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    // Reset to first page when search changes
    setPage(1);
  };
  
  // Handle search submission
  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchSearchResults();
  };
  
  // Handle next page
  const handleNextPage = () => {
    if (hasMore) {
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
  
  // Handle page size change
  const handlePageSizeChange = (event: any) => {
    setPageSize(event.target.value as number);
    setPage(1); // Reset to first page when changing page size
  };

  // Fetch results when page or pageSize changes (but not on initial load)
  useEffect(() => {
    if (!initialLoad) {
      fetchSearchResults();
    }
  }, [page, pageSize]);

  // Render custom data as key-value pairs
  const renderCustomData = (customData: Record<string, any>) => {
    return Object.entries(customData).map(([key, value]) => (
      <Box key={key} sx={{ display: 'flex', mb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ width: 120, flexShrink: 0 }}>
          {key}:
        </Typography>
        <Typography variant="body2" color="text.primary" sx={{ wordBreak: 'break-word' }}>
          {typeof value === 'object' 
            ? JSON.stringify(value) 
            : typeof value === 'boolean'
              ? value.toString()
              : value}
        </Typography>
      </Box>
    ));
  };

  return (
    <Box sx={{ 
      height: '100%',
      overflowY: 'auto',
    }}>
      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <form onSubmit={handleSearchSubmit}>
          <TextField
            fullWidth
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: apiLoading && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 1,
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </form>
      </Box>

      {/* Search Stats */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton size="small" sx={{ border: `1px solid ${getBorderColor()}`, borderRadius: 1 }}>
            <Box component="span" sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box component="span" sx={{ width: 16, height: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box component="span" sx={{ width: '100%', height: 2, bgcolor: theme.palette.text.secondary }}></Box>
                <Box component="span" sx={{ width: '100%', height: 2, bgcolor: theme.palette.text.secondary }}></Box>
                <Box component="span" sx={{ width: '100%', height: 2, bgcolor: theme.palette.text.secondary }}></Box>
              </Box>
            </Box>
          </IconButton>
          
          {searchResults.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Found: <Typography component="span" fontWeight="medium" color="text.primary">{totalResults} results</Typography>
            </Typography>
          )}
        </Box>
        
        {/* Page Size Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Show:
          </Typography>
          <Select
            value={pageSize}
            onChange={handlePageSizeChange}
            size="small"
            sx={{ minWidth: 80 }}
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </Box>
      </Box>

      {/* Error Message */}
      {error && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 2, 
            bgcolor: alpha(theme.palette.error.main, 0.1),
            color: theme.palette.error.main,
            border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
          }}
        >
          <Typography>{error}</Typography>
        </Paper>
      )}

      {/* Loading Indicator */}
      {apiLoading && searchResults.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <Grid container spacing={3}>
          {searchResults.map((product, index) => (
            <Grid item xs={12} key={product.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px solid ${getBorderColor()}`,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: `0 4px 20px ${alpha(theme.palette.text.primary, 0.1)}`,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                  {/* Product Number */}
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    bgcolor: alpha(theme.palette.primary.light, 0.1),
                    color: theme.palette.text.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'medium',
                    fontSize: '1rem'
                  }}>
                    {(page - 1) * pageSize + index + 1}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    {/* Product ID */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 100 }}>
                        objectID
                      </Typography>
                      <Typography variant="body2" color="text.primary" fontFamily="monospace">
                        "{product.id}"
                      </Typography>
                    </Box>
                    
                    {/* Product Title */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 100, display: 'flex', alignItems: 'center' }}>
                        <SearchIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} /> title
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        "{product.title}"
                      </Typography>
                    </Box>
                    
                    {/* Searchable Content */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 100, display: 'flex', alignItems: 'center' }}>
                        <SearchIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} /> overview
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                        "{product.searchable_content}"
                      </Typography>
                    </Box>
                    
                    {/* Show More Button */}
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 12.5 }}>
                      <Typography 
                        variant="body2" 
                        color="primary" 
                        sx={{ 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={() => toggleExpand(product.id)}
                      >
                        {expandedItems[product.id] 
                          ? 'Hide attributes' 
                          : `Show more attributes (${Object.keys(product.custom_data).length})`}
                        {expandedItems[product.id] 
                          ? <ExpandLessIcon fontSize="small" sx={{ ml: 0.5 }} />
                          : <ExpandMoreIcon fontSize="small" sx={{ ml: 0.5 }} />
                        }
                      </Typography>
                    </Box>
                    
                    {/* Expanded Custom Data */}
                    <Collapse in={expandedItems[product.id]} timeout="auto" unmountOnExit>
                      <Box sx={{ 
                        mt: 2, 
                        ml: 12.5,
                        maxHeight: '300px',
                        overflowY: 'auto',
                      }}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Custom Data</Typography>
                        {renderCustomData(product.custom_data)}
                      </Box>
                    </Collapse>
                  </Box>
                  
                  {/* Product Image (if available) */}
                  {(product.image_url || product.custom_data?.image_url) && (
                    <Box 
                      sx={{ 
                        width: 140, 
                        height: 140, 
                        borderRadius: 2, 
                        overflow: 'hidden', 
                        flexShrink: 0,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                        position: 'relative',
                        '&:hover': {
                          '& .zoom-overlay': {
                            opacity: 1
                          }
                        }
                      }}
                    >
                      <img 
                        src={product.image_url || product.custom_data?.image_url} 
                        alt={product.title}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                      <Box 
                        className="zoom-overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: alpha(theme.palette.common.black, 0.5),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(product.image_url || product.custom_data?.image_url, '_blank')}
                      >
                        <VisibilityIcon sx={{ color: 'white' }} />
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : searchQuery && !apiLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary">No results found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search query or filters
          </Typography>
        </Box>
      ) : null}
      
      {/* Pagination */}
      {searchResults.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mt: 4,
          mb: 2
        }}>
          {/* Page information */}
          <Typography variant="body2" color="text.secondary">
            Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalResults || searchResults.length)} of {totalResults || 'many'} results
          </Typography>

          {/* Pagination controls with Next/Previous instead of fixed pages */}
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
        </Box>
      )}
    </Box>
  );
};

export default BrowseTab; 