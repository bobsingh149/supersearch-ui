import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  Grid,
  Card,
  CardContent,
  alpha,
  useMediaQuery
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Support as SupportIcon,
  ArrowBack as ArrowBackIcon,
  ContactMail as ContactMailIcon
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useNavigate } from 'react-router-dom';
import ecommerceTheme from './theme/ecommerceTheme';
import ContactUsModal from './components/ContactUsModal';

const RateLimitError: React.FC = () => {
  const theme = ecommerceTheme;
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [contactModalOpen, setContactModalOpen] = React.useState(false);

  const advantages = [
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'AI-Powered Search',
      description: 'Transform your product search with intelligent recommendations and natural language understanding.'
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      title: 'Increase Conversions',
      description: 'Boost sales by 30-50% with personalized product recommendations and improved search relevance.'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      title: 'Lightning Fast',
      description: 'Sub-second search results with advanced caching and optimized algorithms for better user experience.'
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      title: 'Advanced Analytics',
      description: 'Get deep insights into customer behavior, search patterns, and product performance.'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      title: 'Enterprise Security',
      description: 'Bank-grade security with SOC 2 compliance, data encryption, and privacy protection.'
    },
    {
      icon: <SupportIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: '24/7 Support',
      description: 'Dedicated support team with implementation assistance and ongoing optimization.'
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          backgroundImage: `radial-gradient(circle at 25% 25%, ${theme.palette.primary.main} 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, ${theme.palette.secondary.main} 0%, transparent 50%)`,
          zIndex: 0
        }} />
        
        {/* Back Button */}
        <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 2 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              py: 1,
              borderRadius: 2,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main'
              }
            }}
          >
            Back
          </Button>
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 8, pt: 4 }}>
            <Box sx={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 120,
              height: 120,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              mb: 4,
              position: 'relative'
            }}>
              <AutoAwesomeIcon sx={{ 
                fontSize: 60, 
                color: 'primary.main',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'
              }} />
              <Box sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                animation: 'pulse 2s infinite'
              }} />
            </Box>
            
            <Typography 
              variant={isMobile ? "h3" : "h2"} 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 800,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              You've Reached Your Free Limit
            </Typography>
            
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ 
                mb: 4,
                maxWidth: 600,
                mx: 'auto',
                lineHeight: 1.4,
                fontWeight: 400
              }}
            >
              Experience the full power of CogniShop AI for your ecommerce store
            </Typography>

            <Paper 
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                maxWidth: 800,
                mx: 'auto',
                mb: 6
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                Ready to Transform Your Store?
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Join thousands of merchants who've increased their sales by 30-50% with CogniShop's AI-powered search and recommendations.
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ContactMailIcon />}
                  onClick={() => setContactModalOpen(true)}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Get CogniShop for Your Store
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/demo_ecommerce')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      borderColor: 'primary.dark'
                    }
                  }}
                >
                  Continue Demo
                </Button>
              </Stack>
            </Paper>
          </Box>

          {/* Features Grid */}
          <Box sx={{ mb: 8 }}>
            <Typography 
              variant="h4" 
              component="h2" 
              textAlign="center" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                mb: 6,
                color: 'text.primary'
              }}
            >
              Why Choose CogniShop?
            </Typography>
            
            <Grid container spacing={4}>
              {advantages.map((advantage, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      p: 3,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.background.paper, 0.7),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.1)}`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    }}
                  >
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ mb: 2 }}>
                        {advantage.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {advantage.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {advantage.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Stats Section */}
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 3,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              mb: 8
            }}
          >
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
              Trusted by Leading Brands
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} sm={4}>
                <Typography variant="h2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
                  50%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Average Sales Increase
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="h2" sx={{ fontWeight: 800, color: 'success.main', mb: 1 }}>
                  2x
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Faster Search Results
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="h2" sx={{ fontWeight: 800, color: 'secondary.main', mb: 1 }}>
                  99.9%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Uptime Guarantee
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Final CTA */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Ready to Get Started?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              Join the AI revolution in ecommerce. Get personalized onboarding, custom integration, and dedicated support.
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<ContactMailIcon />}
              onClick={() => setContactModalOpen(true)}
              sx={{
                px: 6,
                py: 2,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1.2rem',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Contact Us Today
            </Button>
          </Box>
        </Container>

        {/* Contact Modal */}
        <ContactUsModal 
          open={contactModalOpen} 
          onClose={() => setContactModalOpen(false)} 
        />

        {/* CSS Animations */}
        <style>
          {`
            @keyframes pulse {
              0% {
                transform: scale(1);
                opacity: 1;
              }
              50% {
                transform: scale(1.1);
                opacity: 0.7;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}
        </style>
      </Box>
    </ThemeProvider>
  );
};

export default RateLimitError; 