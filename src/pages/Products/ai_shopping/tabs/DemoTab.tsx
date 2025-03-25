import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
  Rating,
  Skeleton,
  Alert,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Sample product data
const SAMPLE_PRODUCTS = [
  {
    id: 1,
    name: 'Premium Wireless Headphones',
    description: 'Noise-cancelling wireless headphones with premium sound quality',
    price: 199.99,
    rating: 4.7,
    image: 'https://source.unsplash.com/random/300x200/?headphones',
    category: 'Electronics',
    brand: 'SoundMaster'
  },
  {
    id: 2,
    name: 'Smart Fitness Watch',
    description: 'Track your fitness goals with this advanced smart watch',
    price: 149.99,
    rating: 4.5,
    image: 'https://source.unsplash.com/random/300x200/?smartwatch',
    category: 'Electronics',
    brand: 'FitTech'
  },
  {
    id: 3,
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable organic cotton t-shirt',
    price: 29.99,
    rating: 4.2,
    image: 'https://source.unsplash.com/random/300x200/?tshirt',
    category: 'Clothing',
    brand: 'EcoWear'
  },
  {
    id: 4,
    name: 'Professional Chef Knife',
    description: 'High-quality stainless steel chef knife for professional cooking',
    price: 89.99,
    rating: 4.8,
    image: 'https://source.unsplash.com/random/300x200/?knife',
    category: 'Kitchen',
    brand: 'ChefPro'
  }
];

const DemoTab: React.FC = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  
  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLoading(true);
      setAiRecommendation(null);
      
      // Simulate search delay
      setTimeout(() => {
        // Filter products based on search query
        const filtered = SAMPLE_PRODUCTS.filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setProducts(filtered);
        setLoading(false);
        
        // Show AI recommendation if search has results
        if (filtered.length > 0) {
          setAiRecommendation(
            `Based on your search for "${searchQuery}", I recommend the ${filtered[0].name} because it has excellent reviews and matches your criteria.`
          );
        }
      }, 1500);
    }
  };
  
  // Toggle favorite status
  const toggleFavorite = (productId: number) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };
  
  // Handle key press in search input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Reset search
  const resetSearch = () => {
    setSearchQuery('');
    setProducts(SAMPLE_PRODUCTS);
    setAiRecommendation(null);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          AI Shopping Demo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This demo showcases how AI can enhance the shopping experience. Try searching for products to see AI-powered recommendations.
        </Typography>
        
        <TextField
          fullWidth
          placeholder="Search for products (e.g., headphones, t-shirt, kitchen)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
              },
              '&.Mui-focused': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  onClick={handleSearch}
                  color="primary"
                  disabled={!searchQuery.trim() || loading}
                >
                  <AutoAwesomeIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          disabled={loading}
        />
        
        {searchQuery && (
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="small" onClick={resetSearch}>
              Reset
            </Button>
          </Box>
        )}
      </Box>
      
      {/* AI Recommendation */}
      {aiRecommendation && (
        <Alert 
          icon={<AutoAwesomeIcon />} 
          severity="info" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: 'secondary.main'
            }
          }}
        >
          <Typography variant="body2">
            <strong>AI Recommendation:</strong> {aiRecommendation}
          </Typography>
        </Alert>
      )}
      
      {/* Product Grid */}
      <Box sx={{ mt: 2 }}>
        {loading ? (
          // Loading skeletons
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item}>
                <Card sx={{ 
                  height: '100%', 
                  borderRadius: 2,
                  boxShadow: theme.shadows[1]
                }}>
                  <Skeleton variant="rectangular" height={200} />
                  <CardContent>
                    <Skeleton variant="text" height={30} />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                  </CardContent>
                  <CardActions>
                    <Skeleton variant="rectangular" width={120} height={36} />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          products.length > 0 ? (
            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={3} key={product.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: theme.shadows[1],
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4]
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={product.image}
                      alt={product.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {product.name}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => toggleFavorite(product.id)}
                          color="error"
                        >
                          {favorites.includes(product.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        </IconButton>
                      </Box>
                      
                      <Chip 
                        label={product.category} 
                        size="small" 
                        sx={{ mb: 1 }} 
                        color="primary" 
                        variant="outlined" 
                      />
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {product.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={product.rating} precision={0.1} size="small" readOnly />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {product.rating}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        Brand: {product.brand}
                      </Typography>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                      <Typography variant="h6" color="primary.main">
                        ${product.price.toFixed(2)}
                      </Typography>
                      <Button 
                        variant="contained" 
                        size="small" 
                        startIcon={<ShoppingCartIcon />}
                        sx={{ borderRadius: 1.5 }}
                      >
                        Add to Cart
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4, 
              bgcolor: 'background.paper', 
              borderRadius: 2,
              boxShadow: theme.shadows[1]
            }}>
              <Typography variant="h6" color="text.secondary">
                No products found for "{searchQuery}"
              </Typography>
              <Button 
                variant="outlined" 
                sx={{ mt: 2, borderRadius: 2 }}
                onClick={resetSearch}
              >
                View All Products
              </Button>
            </Box>
          )
        )}
      </Box>
    </Box>
  );
};

export default DemoTab; 