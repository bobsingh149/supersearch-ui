import React, { useState, useEffect } from 'react';
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
  Toolbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from '../../theme/theme';
import { useProduct, MovieProduct } from '../../hooks/useProduct';

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { loading: apiLoading, getProductById } = useProduct();
  const [product, setProduct] = useState<MovieProduct | null>(null);
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Use the theme from theme.ts
  const theme = getTheme(mode);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (productId) {
          // Fetch product by ID using the hook
          const response = await getProductById(productId);
          setProduct(response as MovieProduct);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };

    fetchProduct();
  }, [productId, getProductById]);

  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleGoBack = () => {
    navigate(-1);
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
            minHeight: '100vh',
            bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f5f5f7'
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
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            flexDirection: 'column',
            bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f5f5f7'
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
  const title = product.Title || 'Product Title';
  const imageUrl = product.Poster_Url || '';
  
  // Check if product is a movie
  const isMovie = !!product.Genre;

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
            
            <Box sx={{ flexGrow: 1 }} />
            
            {/* Action Icons */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Favorites">
                <IconButton size="small" color="inherit" sx={{ ml: { xs: 0, md: 1 } }}>
                  <FavoriteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cart">
                <IconButton size="small" color="inherit" sx={{ ml: { xs: 0, md: 1 } }}>
                  <ShoppingCartIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
                <IconButton size="small" onClick={toggleTheme} color="inherit" sx={{ ml: { xs: 0, md: 1 } }}>
                  {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
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
            {isMovie && (
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
                    sx={{ 
                      bgcolor: 'background.paper',
                      boxShadow: theme.shadows[2],
                      '&:hover': {
                        bgcolor: 'background.paper',
                      }
                    }}
                  >
                    <FavoriteIcon fontSize="small" />
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
                {isMovie && product.Genre && (
                  <Chip 
                    label={product.Genre.split(',')[0]} 
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
                {isMovie && product.Vote_Average && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating 
                      value={parseFloat(product.Vote_Average) / 2} 
                      precision={0.5} 
                      readOnly 
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {(parseFloat(product.Vote_Average) / 2).toFixed(1)} ({product.Vote_Count} reviews)
                    </Typography>
                  </Box>
                )}
                
                {/* Release Date */}
                {isMovie && product.Release_Date && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Released:</strong> {new Date(product.Release_Date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                )}
                
                {/* Language */}
                {isMovie && product.Original_Language && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Language:</strong> {product.Original_Language.toUpperCase()}
                  </Typography>
                )}
                
                <Divider sx={{ my: 3 }} />
                
                {/* Description/Overview */}
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {isMovie && product.Overview 
                    ? product.Overview 
                    : "No description available for this product."}
                </Typography>
                
                {/* Popularity for Movies */}
                {isMovie && product.Popularity && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      Popularity Score
                    </Typography>
                    <Typography variant="body2">
                      {parseFloat(product.Popularity).toFixed(1)}
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
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<FavoriteIcon />}
                    sx={{ 
                      borderRadius: 1.5,
                      py: 1.5,
                      textTransform: 'none'
                    }}
                  >
                    Favorite
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
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

export default ProductDetail; 