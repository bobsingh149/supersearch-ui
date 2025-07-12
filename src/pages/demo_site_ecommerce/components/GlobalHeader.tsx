import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Badge,
  alpha,
  useTheme
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LanguageIcon from '@mui/icons-material/Language';
import EcommerceAISearchBar, { AISearchBarRef } from './EcommerceAISearchBar';

interface GlobalHeaderProps {
  onContactUs: () => void;
  onSearch?: () => void;
  searchRef?: React.RefObject<AISearchBarRef | null>;
  initialQuery?: string;
  autoFocus?: boolean;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ onContactUs, onSearch, searchRef, initialQuery, autoFocus = true }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSearch = () => {
    if (onSearch) {
      onSearch();
    }
  };

  return (
    <AppBar 
      position="fixed"
      elevation={0}
      sx={{ 
        bgcolor: alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary',
        zIndex: theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ 
        py: 1, 
        px: { xs: 2, md: 3 },
        minHeight: '64px'
      }}>
        {/* Logo */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mr: { md: 4 },
          cursor: 'pointer'
        }}
        onClick={() => navigate('/demo_ecommerce')}
        >
          <Box 
            sx={{ 
              width: 36, 
              height: 36, 
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
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            CogniShop
          </Typography>
        </Box>
        
        {/* Search Bar - Desktop */}
        <Box sx={{ 
          flexGrow: 1, 
          mx: 3, 
          display: { xs: 'none', md: 'block' },
          maxWidth: '800px'
        }}>
          <EcommerceAISearchBar 
            onSearch={handleSearch}
            ref={searchRef}
            initialQuery={initialQuery}
            autoFocus={autoFocus}
          />
        </Box>
        
        {/* Action Icons */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          ml: 'auto'
        }}>
          <Tooltip title="View Orders">
            <IconButton 
              size="small" 
              color="inherit"
              onClick={() => navigate('/demo_ecommerce/orders')}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.08)
                }
              }}
            >
              <Badge color="primary">
                <ShoppingCartIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Visit CogniShop Website">
            <IconButton
              size="small"
              color="inherit"
              component="a"
              href="https://www.cognishop.co/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.08)
                }
              }}
            >
              <LanguageIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            color="primary"
            onClick={onContactUs}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: { xs: 2, sm: 3 },
              py: 1,
              fontSize: '0.875rem',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: theme.shadows[2]
              }
            }}
          >
            Contact Us
          </Button>
        </Box>
      </Toolbar>
      
      {/* Search Bar - Mobile */}
      <Box sx={{ 
        px: 2, 
        pb: 1, 
        display: { xs: 'block', md: 'none' } 
      }}>
        <EcommerceAISearchBar 
          onSearch={handleSearch}
          ref={searchRef}
          initialQuery={initialQuery}
          autoFocus={autoFocus}
        />
      </Box>
    </AppBar>
  );
};

export default GlobalHeader; 