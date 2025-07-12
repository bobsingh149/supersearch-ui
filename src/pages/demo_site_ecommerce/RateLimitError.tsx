import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  alpha,
  useMediaQuery
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
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

        <Container maxWidth="sm" sx={{ textAlign: 'center', py: 4 }}>
          {/* Icon */}
          <Box sx={{ 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            mb: 4
          }}>
            <AutoAwesomeIcon sx={{ 
              fontSize: 50, 
              color: 'primary.main'
            }} />
          </Box>
          
          {/* Main Message */}
          <Typography 
            variant={isMobile ? "h4" : "h3"} 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              color: 'text.primary',
              mb: 2
            }}
          >
            Demo Limit Reached
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              mb: 4,
              lineHeight: 1.6
            }}
          >
            You've explored our AI search demo! Ready to unlock the full potential for your store?
          </Typography>

          {/* CTA Section */}
          <Paper 
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              mb: 4
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Get CogniShop for Your Store
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              AI-powered search that increases conversions and improves customer experience.
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
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Contact Us
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

          {/* Simple Stats */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                50%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sales Increase
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                2x
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Faster Search
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                99.9%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Uptime
              </Typography>
            </Box>
          </Box>
        </Container>

        {/* Contact Modal */}
        <ContactUsModal 
          open={contactModalOpen} 
          onClose={() => setContactModalOpen(false)} 
        />
      </Box>
    </ThemeProvider>
  );
};

export default RateLimitError; 