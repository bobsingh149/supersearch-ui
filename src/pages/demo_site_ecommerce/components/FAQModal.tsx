import React from 'react';
import {
  Popover,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Box,
  alpha,
  useTheme,
  Divider,
  Paper,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SecurityIcon from '@mui/icons-material/Security';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';

interface FAQModalProps {
  open: boolean;
  onClose: () => void;
  onQuestionClick: (question: string) => void;
  anchorEl: HTMLElement | null;
}

const FAQModal: React.FC<FAQModalProps> = ({ open, onClose, onQuestionClick, anchorEl }) => {
  const theme = useTheme();

  const faqs = [
    {
      question: "Ask AI - Open Assistant to ask any question",
      icon: <AutoAwesomeIcon />,
      category: "AI Assistant"
    },
    {
      question: "What are the most comfortable running shoes for beginners?",
      icon: <TrendingUpIcon />,
      category: "Popular Products"
    },
    {
      question: "Can you recommend premium fashion brands?",
      icon: <SearchIcon />,
      category: "Recommendations"
    },
    {
      question: "Show me products with free shipping",
      icon: <LocalShippingIcon />,
      category: "Shipping"
    },
    {
      question: "What are the top-rated home appliances?",
      icon: <TrendingUpIcon />,
      category: "Popular Products"
    },
    {
      question: "Can you find eco-friendly products?",
      icon: <SearchIcon />,
      category: "Search"
    },
    {
      question: "What's the status of my recent order?",
      icon: <ShoppingCartIcon />,
      category: "Orders"
    },
    {
      question: "How does your return policy work?",
      icon: <SupportAgentIcon />,
      category: "Support"
    },
    {
      question: "Are my payment details secure?",
      icon: <SecurityIcon />,
      category: "Security"
    }
  ];

  const handleQuestionClick = (question: string) => {
    onQuestionClick(question);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          width: { xs: 'calc(100vw - 32px)', sm: 380 },
          maxHeight: { xs: '50vh', sm: '70vh' },
          borderRadius: 3,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1),
          overflow: 'hidden'
        }
      }}
    >
      <Paper elevation={0} sx={{ width: '100%', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            pb: 2,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.02)
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  color: 'secondary.main'
                }}
              >
                <QuestionAnswerIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.1rem' }}>
                  Quick Questions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Ask our AI assistant
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={onClose} 
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                  color: 'error.main'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* FAQ List */}
        <Box sx={{ maxHeight: { xs: 'calc(50vh - 140px)', sm: 'calc(70vh - 140px)' }, overflow: 'auto' }}>
          <List sx={{ py: 0 }}>
            {faqs.map((faq, index) => (
              <React.Fragment key={index}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleQuestionClick(faq.question)}
                    sx={{
                      py: 1.5,
                      px: 3,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.secondary.main, 0.04)
                      }
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: 'secondary.main'
                      }}
                    >
                      {faq.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            mb: 0.25,
                            color: 'text.primary',
                            fontSize: '0.875rem',
                            lineHeight: 1.4
                          }}
                        >
                          {faq.question}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {faq.category}
                        </Typography>
                      }
                    />
                    <AutoAwesomeIcon
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.9rem',
                        opacity: 0.5
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {index < faqs.length - 1 && (
                  <Divider sx={{ mx: 3, opacity: 0.3 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: alpha(theme.palette.secondary.main, 0.02),
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <AutoAwesomeIcon sx={{ color: 'secondary.main', fontSize: '1rem' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
              Powered by CogniShop AI
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.3 }}>
            Get instant answers about products, orders, and shopping.
          </Typography>
        </Box>
      </Paper>
    </Popover>
  );
};

export default FAQModal;