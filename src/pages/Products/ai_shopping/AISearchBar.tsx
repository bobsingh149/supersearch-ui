import React, { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  IconButton, 
  Typography, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  List, 
  ListItemButton, 
  InputAdornment,
  Tooltip,
  Zoom,
  useTheme,
  CircularProgress,
  Paper,
  alpha,
  Rating,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Button,
  Chip,
  Divider,
  ClickAwayListener,
  Avatar,
  useMediaQuery
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import AddCommentIcon from '@mui/icons-material/AddComment';
import { keyframes } from '@mui/material/styles';
import { useSearch, SearchResultItem } from '../../../hooks/useSearch';
import ReactMarkdown from 'react-markdown';
import config from '../../../config';



// Animation for gradient border
const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Types for streaming responses
// type StreamingResponseType = 'products' | 'content' | 'questions';

interface ProductSearchResult {
  id: string;
  title?: string;
  custom_data?: Record<string, any>;
  searchable_content?: string;
  score?: number;
  search_type?: string;
  image_url?: string;
}

// New interface for selected products with additional UI data
interface SelectedProduct {
  id: string;
  title?: string;
  image_url?: string;
  custom_data?: Record<string, any>;
}

// interface StreamingResponse {
//   type: StreamingResponseType;
//   conversation_id: string;
//   content: string | ProductSearchResult[] | string[];
// }

// Message interface for chat
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  suggestedProducts?: ProductSearchResult[];
  suggestedQuestions?: string[];
  includedProducts?: SelectedProduct[];
}

// Types for autocomplete
interface AutocompleteResult {
  data: {
    id: string;
    title: string;
    poster_path?: string;
    release_date?: string;
    vote_average?: string;
    genres?: string;
    [key: string]: any;
  };
  score: number;
}

interface AutocompleteResponse {
  results: AutocompleteResult[];
}

// API endpoint
const API_ENDPOINT = `${config.apiBaseUrl}/shopping-assistant/chat`;

// Generate new conversation ID
const generateConversationId = () => `c${Date.now()}`;

// Define the ref interface that will be exposed
export interface AISearchBarRef {
  openAiChat: (productIds?: string[]) => void;
  setCurrentMessage: (message: string) => void;
  sendMessage: (productIds?: string[]) => void;
  openAiChatWithMessage: (message: string, productIds?: string[]) => void;
  getSearchQuery: () => string;
  closeAutocomplete: () => void;
}

interface AISearchBarProps {
  setData?: (data: SearchResultItem[]) => void;
  onSearch?: () => void;
  initialQuery?: string;
}

const AISearchBar = forwardRef<AISearchBarRef, AISearchBarProps>(({ setData, onSearch, initialQuery = '' }, ref) => {
  const theme = useTheme();
  const {searchProducts} = useSearch();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState(generateConversationId());
  
  // Use MediaQuery for responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Autocomplete states
  const [autocompleteResults, setAutocompleteResults] = useState<AutocompleteResult[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isLoadingAutocomplete, setIsLoadingAutocomplete] = useState(false);
  const searchInputRef = useRef<HTMLDivElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add state for selected products
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const navigate = useNavigate();

  // Predefined FAQs to show when starting a new chat
  const faqs = [
    "Summarize The Dark Knight's reviews",
    "Can you recommend movies similar to Inception?",
    "What's the update on my latest order?",
  ];

  // Debounce function
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ) => {
    let timeout: ReturnType<typeof setTimeout>;
    
    return function(...args: Parameters<T>) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Handle normal search
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        setIsSearching(true);
        // Close autocomplete dropdown when search is performed
        setShowAutocomplete(false);
        
        // If onSearch callback is provided, use it for redirection
        if (onSearch) {
          onSearch();
          setIsSearching(false);
          return;
        }
        
        // Otherwise do the normal search
        const response = await searchProducts({
          query: searchQuery,
          page: 1,
          size: 10
        });
        
        // Only call setData if it's provided
        if (setData) {
          setData(response.results);
        }
      } catch (error) {
        console.error('Error performing search:', error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Fetch autocomplete results
  const fetchAutocomplete = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    try {
      setIsLoadingAutocomplete(true);
      const token = 'dummy-auth-token';

      const response = await fetch(
        `${config.apiBaseUrl}${config.apiEndpoints.autocomplete}?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AutocompleteResponse = await response.json();
      setAutocompleteResults(data.results);
      setShowAutocomplete(data.results.length > 0);
    } catch (error) {
      console.error('Error fetching autocomplete results:', error);
      setAutocompleteResults([]);
    } finally {
      setIsLoadingAutocomplete(false);
    }
  };

  // Create debounced version of fetchAutocomplete
  const debouncedFetchAutocomplete = useMemo(
    () => debounce(fetchAutocomplete, 300),
    []
  );

  // Update autocomplete results when query changes
  useEffect(() => {
    debouncedFetchAutocomplete(searchQuery);
  }, [searchQuery, debouncedFetchAutocomplete]);

  // Automatically perform search when initialQuery is provided
  useEffect(() => {
    if (initialQuery && initialQuery.trim() !== '') {
      handleSearch();
    }
  }, [initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle selecting an autocomplete suggestion
  const handleAutocompleteSelect = (result: AutocompleteResult) => {
    // Navigate to product detail page instead of performing search
    navigate(`/demo_site/${result.data.id}`);
    setShowAutocomplete(false);
  };

  // Close autocomplete dropdown when clicking away
  const handleClickAway = () => {
    setShowAutocomplete(false);
  };

  // Handle key press in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
      setShowAutocomplete(false);
    }
  };

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to fetch product details by ID
  const fetchProductDetails = async (productId: string): Promise<SelectedProduct | null> => {
    try {
      setIsLoadingProducts(true);
      const token = 'dummy-auth-token';
      
      const response = await fetch(
        `${config.apiBaseUrl}/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        title: data.title || data.custom_data?.Title || 'Unknown Product',
        image_url: data.image_url || data.poster_path || data.custom_data?.Poster_Url || data.custom_data?.image_url,
        custom_data: data.custom_data
      };
    } catch (error) {
      console.error('Error fetching product details:', error);
      return null;
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Load product details when productIds are passed
  const loadSelectedProducts = async (productIds: string[]) => {
    if (!productIds || productIds.length === 0) return;
    
    // Filter out products that are already loaded
    const newProductIds = productIds.filter(id => 
      !selectedProducts.some(product => product.id === id)
    );
    
    if (newProductIds.length === 0) return;
    
    const productPromises = newProductIds.map(id => fetchProductDetails(id));
    const products = await Promise.all(productPromises);
    
    // Filter out null results and add new products
    const validProducts = products.filter(product => product !== null) as SelectedProduct[];
    if (validProducts.length > 0) {
      setSelectedProducts(prev => [...prev, ...validProducts]);
    }
  };

  // Remove a product from the selected products
  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(product => product.id !== productId));
  };

  // Open AI chat modal with product IDs
  const openAiChat = (productIds: string[] = []) => {
    if (searchQuery.trim()) {
      setCurrentMessage(searchQuery);
    }
    // Load the product details when opening chat
    loadSelectedProducts(productIds);
    setIsChatOpen(true);
  };

  // Close AI chat modal
  const closeAiChat = () => {
    setIsChatOpen(false);
  };

  // Start a new chat session
  const startNewChat = () => {
    setMessages([]);
    setCurrentMessage('');
    setSelectedProducts([]);
    setConversationId(generateConversationId());
  };

  // Send message to shopping assistant API
  const sendMessage = async (productIds: string[] = []) => {
    if (currentMessage.trim()) {
      const newUserMessage: Message = {
        id: Date.now(),
        text: currentMessage.trim(),
        sender: 'user',
        timestamp: new Date(),
        includedProducts: [...selectedProducts]
      };
      
      const messageText = currentMessage.trim();
      setMessages([...messages, newUserMessage]);
      setCurrentMessage('');
      setIsChatLoading(true);
      
      // Add a loading message with empty products array
      const loadingMessage: Message = {
        id: Date.now() + 1,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        isTyping: true,
        suggestedProducts: [],
        suggestedQuestions: []
      };
      
      setMessages(prev => [...prev, loadingMessage]);
      
      try {
        // Get the authentication token
        const token = 'dummy-auth-token';
        
        // Combine passed productIds with any already in the selectedProducts state
        const allProductIds = [...new Set([
          ...productIds,
          ...selectedProducts.map(p => p.id)
        ])];
        
        // Create the request payload
        const payload = {
          query: messageText,
          conversation_id: conversationId,
          product_ids: allProductIds,
          stream: false // Set stream to false to get a complete response
        };
        
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse the JSON response
        const data = await response.json();
        
        // Update the AI message with the complete response
        setMessages(prev => {
          const updatedMessages = [...prev];
          const aiMessageIndex = updatedMessages.findIndex(msg => msg.isTyping);
          
          if (aiMessageIndex !== -1) {
            updatedMessages[aiMessageIndex] = {
              id: Date.now() + 1,
              text: data.response || '',
              sender: 'ai',
              timestamp: new Date(),
              isTyping: false,
              suggestedProducts: data.products || [],
              suggestedQuestions: data.follow_up_questions || [],
              includedProducts: data.products || []
            };
          }
          
          return updatedMessages;
        });
        
      } catch (error) {
        console.error('Fetch error:', error);
        
        // Update with error message
        setMessages(prev => {
          const updatedMessages = [...prev];
          const aiMessageIndex = updatedMessages.findIndex(msg => msg.isTyping);
          
          if (aiMessageIndex !== -1) {
            updatedMessages[aiMessageIndex] = {
              id: Date.now(),
              text: "**You've reached your free usage limit.** Contact us to start using CogniShop for your store!",
              sender: 'ai',
              timestamp: new Date(),
              isTyping: false,
              suggestedProducts: [],
              suggestedQuestions: [],
              includedProducts: []
            };
          }
          
          return updatedMessages;
        });
      } finally {
        setIsChatLoading(false);
      }
    }
  };

  // Use predefined prompt
  const usePrompt = (prompt: string, productIds: string[] = []) => {
    // Store the prompt text in a variable
    const messageToSend = prompt.trim();

    // Set the input field initially (for visual feedback)
    setCurrentMessage(messageToSend);
    
    // Create and add the user message directly
    const newUserMessage: Message = {
      id: Date.now(),
      text: messageToSend,
      sender: 'user',
      timestamp: new Date(),
      includedProducts: [...selectedProducts]
    };
    
    // Add a loading message
    const loadingMessage: Message = {
      id: Date.now() + 1,
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      isTyping: true,
      suggestedProducts: [],
      suggestedQuestions: []
    };
    
    // Add both messages to the chat
    setMessages(prev => [...prev, newUserMessage, loadingMessage]);
    
    // Clear the input field
    setCurrentMessage('');
    
    // Set loading state
    setIsChatLoading(true);
    
    // Send the API request
    (async () => {
      try {
        // Get the authentication token
        const token = 'dummy-auth-token';
        
        // Combine passed productIds with any already in the selectedProducts state
        const allProductIds = [...new Set([
          ...productIds,
          ...selectedProducts.map(p => p.id)
        ])];
        
        // Create the request payload
        const payload = {
          query: messageToSend,
          conversation_id: conversationId,
          product_ids: allProductIds,
          stream: false
        };
        
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse the JSON response
        const data = await response.json();
        
        // Update the AI message with the complete response
        setMessages(prev => {
          const updatedMessages = [...prev];
          const aiMessageIndex = updatedMessages.findIndex(msg => msg.isTyping);
          
          if (aiMessageIndex !== -1) {
            updatedMessages[aiMessageIndex] = {
              id: Date.now() + 1,
              text: data.response || '',
              sender: 'ai',
              timestamp: new Date(),
              isTyping: false,
              suggestedProducts: data.products || [],
              suggestedQuestions: data.follow_up_questions || [],
              includedProducts: data.products || []
            };
          }
          
          return updatedMessages;
        });
        
      } catch (error) {
        console.error('Fetch error:', error);
        
        // Update with error message
        setMessages(prev => {
          const updatedMessages = [...prev];
          const aiMessageIndex = updatedMessages.findIndex(msg => msg.isTyping);
          
          if (aiMessageIndex !== -1) {
            updatedMessages[aiMessageIndex] = {
              id: Date.now(),
              text: "**You've reached your free usage limit.** Contact us to start using CogniShop for your store!",
              sender: 'ai',
              timestamp: new Date(),
              isTyping: false,
              suggestedProducts: [],
              suggestedQuestions: [],
              includedProducts: []
            };
          }
          
          return updatedMessages;
        });
      } finally {
        setIsChatLoading(false);
      }
    })();
  };

  // Handle key press in chat input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Add keyboard shortcut (Ctrl+K) to open chat with useCallback
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check for Ctrl+K
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      openAiChat([]);
    }
  }, [searchQuery]); // Include searchQuery as dependency to ensure current value is used

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Typing indicator component
  const TypingIndicator = () => (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 0.5
    }}>
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          animation: 'pulse 1s infinite',
          animationDelay: '0s',
          '@keyframes pulse': {
            '0%': { opacity: 0.4 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.4 },
          },
        }}
      />
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          animation: 'pulse 1s infinite',
          animationDelay: '0.2s',
          '@keyframes pulse': {
            '0%': { opacity: 0.4 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.4 },
          },
        }}
      />
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          animation: 'pulse 1s infinite',
          animationDelay: '0.4s',
          '@keyframes pulse': {
            '0%': { opacity: 0.4 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.4 },
          },
        }}
      />
    </Box>
  );

  // Handle opening AI chat with current query
  const openAiChatWithQuery = () => {
    setCurrentMessage(searchQuery);
    setIsChatOpen(true);
    setShowAutocomplete(false);
  };

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    openAiChat: (productIds: string[] = []) => {
      if (searchQuery.trim()) {
        setCurrentMessage(searchQuery);
      }
      // Load product details if IDs are provided
      loadSelectedProducts(productIds);
      setIsChatOpen(true);
    },
    setCurrentMessage,
    sendMessage,
    openAiChatWithMessage: (message: string, productIds: string[] = []) => {
      // Store the message text in a variable so we can use it after state updates
      const messageToSend = message.trim();
      
      // Open the chat
      setIsChatOpen(true);
      
      // First load product details and immediately execute API call
      (async () => {
        try {
          // Set loading state for products
          setIsLoadingProducts(true);
          
          // Fetch product details if IDs are provided
          let productDetails: SelectedProduct[] = [];
          if (productIds && productIds.length > 0) {
            const productPromises = productIds.map(id => fetchProductDetails(id));
            const products = await Promise.all(productPromises);
            // Filter out null results
            productDetails = products.filter(product => product !== null) as SelectedProduct[];
            
            // Add products to selected state
            setSelectedProducts(prev => {
              const newProducts = productDetails.filter(
                newProduct => !prev.some(p => p.id === newProduct.id)
              );
              return [...prev, ...newProducts];
            });
          }
          
          // Create user message with product context
          const newUserMessage: Message = {
            id: Date.now(),
            text: messageToSend,
            sender: 'user',
            timestamp: new Date(),
            includedProducts: productDetails
          };
          
          // Add a loading message right away
          const loadingMessage: Message = {
            id: Date.now() + 1,
            text: '',
            sender: 'ai',
            timestamp: new Date(),
            isTyping: true,
            suggestedProducts: [],
            suggestedQuestions: []
          };
          
          // Add the user message and AI loading message
          setMessages(prev => [...prev, newUserMessage, loadingMessage]);
          
          // Set loading state
          setIsChatLoading(true);
          
          // Get the authentication token
          const token = 'dummy-auth-token';
          
          // Create the request payload with all product IDs
          const payload = {
            query: messageToSend,
            conversation_id: conversationId,
            product_ids: productIds,
            stream: false
          };
          
          const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // Parse the JSON response
          const data = await response.json();
          
          // Update the AI message with the complete response
          setMessages(prev => {
            const updatedMessages = [...prev];
            const aiMessageIndex = updatedMessages.findIndex(msg => msg.isTyping);
            
            if (aiMessageIndex !== -1) {
              updatedMessages[aiMessageIndex] = {
                id: Date.now() + 1,
                text: data.response || '',
                sender: 'ai',
                timestamp: new Date(),
                isTyping: false,
                suggestedProducts: data.products || [],
                suggestedQuestions: data.follow_up_questions || [],
                includedProducts: data.products || []
              };
            }
            
            return updatedMessages;
          });
          
        } catch (error) {
          console.error('Fetch error:', error);
          
          // Update with error message
          setMessages(prev => {
            const updatedMessages = [...prev];
            const aiMessageIndex = updatedMessages.findIndex(msg => msg.isTyping);
            
            if (aiMessageIndex !== -1) {
              updatedMessages[aiMessageIndex] = {
                id: Date.now(),
                text: "**You've reached your free usage limit.** Contact us to start using CogniShop for your store!",
                sender: 'ai',
                timestamp: new Date(),
                isTyping: false,
                suggestedProducts: [],
                suggestedQuestions: [],
                includedProducts: []
              };
            }
            
            return updatedMessages;
          });
        } finally {
          setIsChatLoading(false);
          setIsLoadingProducts(false);
        }
      })();
    },
    getSearchQuery: () => searchQuery,
    closeAutocomplete: () => setShowAutocomplete(false)
  }));

  // Reset state when query changes (from URL parameters when navigating)
  useEffect(() => {
    if (initialQuery !== searchQuery && initialQuery) {
      setSearchQuery(initialQuery);
      setShowAutocomplete(false); // Close autocomplete when query changes due to navigation
    }
  }, [initialQuery]);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{
        position: 'relative',
        width: '100%',
        my: { xs: 2.5, sm: 2 }, // Increased vertical margin for mobile (from 2 to 2.5)
        zIndex: 10,
      }}>
        {/* Animated gradient border wrapper */}
        <Box 
          sx={{
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: '12px',
            background: theme => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
            backgroundSize: '200% 200%',
            animation: `${gradientAnimation} 3s ease infinite`,
            zIndex: 0,
            opacity: 0.8,
          }}
        />
        <Box ref={searchInputRef}>
          <TextField
            fullWidth
            placeholder="Search for movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            onFocus={() => {
              if (autocompleteResults.length > 0) {
                setShowAutocomplete(true);
              }
            }}
            variant="outlined"
            sx={{
              position: 'relative',
              zIndex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                height: 46,
                transition: 'all 0.3s',
                backgroundColor: theme => theme.palette.background.paper,
                '& fieldset': {
                  border: 'none'
                }
              },
              '& .MuiInputBase-input': {
                padding: '12px 14px'
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ height: '100%', alignItems: 'center' }}>
                  <Tooltip title="Search" arrow>
                    <IconButton 
                      onClick={handleSearch} 
                      edge="end"
                      disabled={isSearching}
                      aria-label="Search products"
                      size="small"
                      sx={{ mx: 0.5 }}
                    >
                      {isSearching ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <SearchIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                  <Tooltip 
                    title="Ask the CogniShop AI Assistant" 
                    arrow
                    TransitionComponent={Zoom}
                  >
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => openAiChat([])}
                      startIcon={<AutoAwesomeIcon sx={{ fontSize: '1.1rem' }} />}
                      sx={{
                        px: isMobile ? 0.75 : 1.5,
                        py: 0.5,
                        ml: 0.5,
                        mr: 0.5,
                        color: 'text.secondary',
                        bgcolor: 'transparent',
                        textTransform: 'none',
                        borderRadius: 1.5,
                        fontWeight: 500,
                        minWidth: isMobile ? 'auto' : undefined,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          color: 'secondary.main'
                        },
                        '& .MuiButton-startIcon': {
                          mr: isMobile ? 0 : 0.5 // No margin on mobile
                        },
                        '& .MuiButton-endIcon': {
                          ml: 0
                        }
                      }}
                    >
                      {!isMobile && "Assistant"}
                    </Button>
                  </Tooltip>
                  {!isMobile && (
                    <Chip 
                      label="Ctrl + K"
                      size="small"
                      variant="outlined"
                      sx={{ 
                        height: 24,
                        fontSize: '0.7rem',
                        letterSpacing: '0.5px',
                        color: 'text.secondary',
                        borderColor: 'divider',
                        mr: 1
                      }}
                    />
                  )}
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Autocomplete dropdown */}
        {showAutocomplete && (
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              zIndex: 10,
              width: '100%',
              mt: 0.5,
              borderRadius: 1,
              maxHeight: '400px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {isLoadingAutocomplete ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                <Box sx={{ 
                  flexGrow: 1,
                  overflow: 'auto',
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
                }}>
                  <List disablePadding>
                    {autocompleteResults.map((result) => (
                      <ListItemButton
                        key={result.data.id}
                        onClick={() => handleAutocompleteSelect(result)}
                        sx={{
                          display: 'flex',
                          py: 1.5,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', width: '100%' }}>
                          {/* Movie poster */}
                          <Box sx={{ flexShrink: 0, width: 60, height: 90, mr: 2 }}>
                            <img
                              src={result.data.poster_path || `https://picsum.photos/60/90?random=${result.data.id}`}
                              alt={result.data.title}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 4,
                              }}
                            />
                          </Box>

                          {/* Movie details */}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium" noWrap>
                              {result.data.title}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              {result.data.release_date && (
                                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                  {new Date(result.data.release_date).getFullYear()}
                                </Typography>
                              )}
                              
                              {result.data.vote_average && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Rating
                                    value={parseFloat(result.data.vote_average) / 2}
                                    readOnly
                                    size="small"
                                    precision={0.5}
                                  />
                                  <Typography variant="caption" fontWeight="medium" sx={{ ml: 0.5 }}>
                                    {result.data.vote_average}
                                  </Typography>
                                </Box>
                              )}
                            </Box>

                            {result.data.genres && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {typeof result.data.genres === 'string' 
                                  ? result.data.genres.replace(/[\[\]']/g, '').split(',')[0]
                                  : result.data.genres[0]}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </ListItemButton>
                    ))}
                  </List>
                </Box>

                {/* Ask AI button - Fixed at bottom */}
                {searchQuery.trim() && (
                  <Box sx={{ 
                    p: 1.5, 
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 1,
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
                  }}>
                    <Button
                      variant="contained"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={openAiChatWithQuery}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        bgcolor: 'secondary.main',
                        '&:hover': {
                          bgcolor: 'secondary.dark',
                        }
                      }}
                    >
                      Ask AI about "{searchQuery}"
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Paper>
        )}

        {/* AI Chat Dialog */}
        <Dialog 
          open={isChatOpen} 
          onClose={(_event, reason) => {
            // Only close if the close button is clicked, not when clicking outside
            if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
              closeAiChat();
            }
          }}
          fullWidth
          maxWidth="xl"
          disableEscapeKeyDown
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, md: 2 },
              height: { xs: '100%', md: '95vh' },
              width: { xs: '100%', md: '95%' },
              maxWidth: '900px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
            p: { xs: 1.5, sm: 2 }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Start a new chat session">
                <IconButton
                  color="secondary"
                  size="small"
                  onClick={startNewChat}
                  sx={{ mr: 1.5 }}
                >
                  <AddCommentIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                CogniShop Assistant
              </Typography>
              <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                Session: {conversationId}
              </Typography>
            </Box>
            <IconButton onClick={closeAiChat} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ 
            p: 0, 
            display: 'flex',
            flexGrow: 1,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              width: '100%', // Full width now that we removed the sidebar
              display: 'flex', 
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* Chat messages area */}
              <Box sx={{ 
                flexGrow: 1, 
                p: { xs: 1.5, sm: 2 }, 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
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
              }}>
                {messages.length === 0 ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center',
                    px: 2
                  }}>
                    <AutoAwesomeIcon sx={{ fontSize: 48, mb: 2, color: 'secondary.main' }} />
                    <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                      Welcome to CogniShop Assistant!
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, mb: 3 }}>
                      This demo uses the Kaggle Movies Dataset to showcase our powerful AI search capabilities. 
                      Ask about genres, directors, actors, or describe the type of movie you're looking for!
                    </Typography>
                    
                    {/* Frequently Asked Questions */}
                    <Box sx={{ width: '100%', maxWidth: 600 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Try asking:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {faqs.map((question, index) => (
                          <Paper
                            key={index}
                            elevation={1}
                            onClick={() => usePrompt(question)}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              cursor: 'pointer',
                              bgcolor: alpha(theme.palette.primary.main, 0.04),
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                transform: 'translateY(-2px)'
                              },
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Box sx={{ mr: 1.5, color: 'primary.main' }}>
                              <AutoAwesomeIcon fontSize="small" />
                            </Box>
                            <Typography 
                              variant="body1" 
                              align="left" 
                              sx={{ fontWeight: 500 }}
                            >
                              {question}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  messages.map((message) => (
                    <Box key={message.id}>
                      {/* User messages */}
                      {message.sender === 'user' && (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            mb: 2
                          }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              p: { xs: 1.5, sm: 2 },
                              maxWidth: { xs: '90%', sm: '80%' },
                              borderRadius: '18px 18px 4px 18px',
                              bgcolor: 'primary.main',
                              color: '#fff',
                              '& a': {
                                color: '#fff',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  textDecoration: 'underline',
                                }
                              },
                              '& code': {
                                fontFamily: 'monospace',
                                bgcolor: 'rgba(255,255,255,0.2)',
                                p: 0.5,
                                borderRadius: 0.5
                              }
                            }}
                          >
                            <Typography variant="body1">{message.text}</Typography>
                            
                            {/* Add product context chips to the message bubble */}
                            {message.includedProducts && message.includedProducts.length > 0 && (
                              <Box sx={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: 0.5, 
                                mt: 1.5,
                                pt: 1.5,
                                borderTop: '1px solid',
                                borderColor: 'rgba(255,255,255,0.2)'
                              }}>
                                {message.includedProducts.map(product => (
                                  <Chip
                                    key={product.id}
                                    size="small"
                                    avatar={
                                      <Avatar 
                                        alt={product.title} 
                                        src={product.image_url || `https://picsum.photos/40/40?random=${product.id}`}
                                      />
                                    }
                                    label={product.title || 'Unknown Product'}
                                    variant="outlined"
                                    sx={{ 
                                      borderRadius: 1.5,
                                      height: 28,
                                      border: '1px solid rgba(255,255,255,0.3)',
                                      color: '#fff',
                                      '& .MuiChip-avatar': {
                                        ml: 0.5
                                      }
                                    }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Paper>
                        </Box>
                      )}

                      {/* AI messages - First text response, then suggested products */}
                      {message.sender === 'ai' && (
                        <>
                          {/* AI Text Response - Render First */}
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'flex-start',
                              mb: 2
                            }}
                          >
                            <Paper
                              elevation={1}
                              sx={{
                                p: { xs: 1.5, sm: 2 },
                                maxWidth: { xs: '90%', sm: '80%' },
                                borderRadius: '18px 18px 18px 4px',
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,255,255,0.08)' 
                                  : 'rgba(0,0,0,0.04)',
                                color: 'text.primary',
                                '& a': {
                                  color: theme.palette.primary.main,
                                  textDecoration: 'none',
                                  fontWeight: 'bold',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    textDecoration: 'underline',
                                  }
                                },
                                '& code': {
                                  fontFamily: 'monospace',
                                  bgcolor: alpha(theme.palette.divider, 0.2),
                                  p: 0.5,
                                  borderRadius: 0.5
                                }
                              }}
                            >
                              <ReactMarkdown
                                components={{
                                  a: ({ node, ...props }) => (
                                    <a target="_blank" rel="noopener noreferrer" {...props} />
                                  )
                                }}
                              >
                                {message.text}
                              </ReactMarkdown>
                              {message.isTyping && <TypingIndicator />}
                            </Paper>
                          </Box>

                          {/* Suggested Products - Render Second */}
                          {message.suggestedProducts && message.suggestedProducts.length > 0 && (
                            <Box sx={{ mt: 1, mb: 3, pl: { xs: 0, sm: 2 } }}>
                              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                Referenced Items:
                              </Typography>
                              <Grid container spacing={2}>
                                {message.suggestedProducts.map((product) => (
                                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                                    <Card sx={{ 
                                      display: 'flex',
                                      flexDirection: 'column',
                                      height: '100%',
                                      borderRadius: 2,
                                      boxShadow: 1,
                                      transition: 'transform 0.2s',
                                      '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 3
                                      }
                                    }}>
                                      <CardMedia
                                        component="img"
                                        height="180"
                                        image={(product as any).image_url || product.custom_data?.Poster_Url || product.custom_data?.image_url || `https://picsum.photos/400/300?random=${product.id}`}
                                        alt={product.title || product.custom_data?.Title || 'Product image'}
                                        sx={{ 
                                          objectFit: 'contain',
                                          bgcolor: theme.palette.mode === 'dark' 
                                            ? 'rgba(255,255,255,0.05)' 
                                            : 'rgba(0,0,0,0.02)',
                                          borderBottom: '1px solid',
                                          borderColor: 'divider'
                                        }}
                                      />
                                      <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                                        <Typography variant="subtitle2" component="div" fontWeight="medium" noWrap>
                                          {product.title || product.custom_data?.Title}
                                        </Typography>
                                        
                                        {/* Release Date & Vote Average */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                          {product.custom_data?.Release_Date && (
                                            <Typography variant="caption" color="text.secondary">
                                              {new Date(product.custom_data.Release_Date).getFullYear()}
                                            </Typography>
                                          )}
                                          
                                          {product.custom_data?.Vote_Average && (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                              <Rating 
                                                value={parseFloat(product.custom_data.Vote_Average) / 2} 
                                                readOnly 
                                                size="small" 
                                                precision={0.5}
                                              />
                                              <Typography variant="caption" fontWeight="medium" sx={{ ml: 0.5 }}>
                                                {product.custom_data.Vote_Average}
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>
                                        
                                        {/* Genre */}
                                        {product.custom_data?.Genre && (
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                            {product.custom_data.Genre.split(',')[0]}
                                            {product.custom_data.Genre.split(',').length > 1 ? '...' : ''}
                                          </Typography>
                                        )}
                                        
                                        <Button 
                                          variant="contained"
                                          size="small"
                                          fullWidth
                                          sx={{ mt: 1, textTransform: 'none' }}
                                          onClick={() => {
                                            // Open product details in a new tab
                                            window.open(`/demo_site/${product.id}`, '_blank');
                                          }}
                                        >
                                          View Details
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          )}

                          {/* Suggested Follow-up Questions */}
                          {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                            <Box sx={{ mt: 1, mb: 3, pl: { xs: 0, sm: 2 } }}>
                              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                Suggested Follow-up:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {message.suggestedQuestions.map((question, index) => {
                                  // Create a temporary div to parse the markdown and extract plain text
                                  const tempDiv = document.createElement('div');
                                  tempDiv.innerHTML = question;
                                  const plainTextQuestion = tempDiv.textContent || tempDiv.innerText || question;
                                  
                                  return (
                                    <Chip
                                      key={index}
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: '300px' }}>
                                          <ReactMarkdown
                                            components={{
                                              p: ({ children }) => <span>{children}</span>,
                                              strong: ({ children }) => (
                                                <Typography
                                                  component="span"
                                                  variant="body2"
                                                  sx={{ fontWeight: 'bold', display: 'inline' }}
                                                >
                                                  {children}
                                                </Typography>
                                              ),
                                              em: ({ children }) => (
                                                <Typography
                                                  component="span"
                                                  variant="body2"
                                                  sx={{ fontStyle: 'italic', display: 'inline' }}
                                                >
                                                  {children}
                                                </Typography>
                                              ),
                                              code: ({ children }) => (
                                                <Typography
                                                  component="span"
                                                  variant="body2"
                                                  sx={{
                                                    fontFamily: 'monospace',
                                                    bgcolor: alpha(theme.palette.divider, 0.2),
                                                    px: 0.5,
                                                    borderRadius: 0.5,
                                                    display: 'inline'
                                                  }}
                                                >
                                                  {children}
                                                </Typography>
                                              ),
                                              a: ({ href, children }) => (
                                                <Typography
                                                  component="a"
                                                  href={href}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  variant="body2"
                                                  sx={{
                                                    color: 'primary.main',
                                                    textDecoration: 'none',
                                                    display: 'inline',
                                                    fontWeight: 'bold',
                                                    '&:hover': {
                                                      textDecoration: 'underline',
                                                      color: 'primary.main'
                                                    }
                                                  }}
                                                >
                                                  {children}
                                                </Typography>
                                              )
                                            }}
                                          >
                                            {question}
                                          </ReactMarkdown>
                                        </Box>
                                      }
                                      clickable
                                      onClick={() => usePrompt(plainTextQuestion, [])}
                                      color="primary"
                                      variant="outlined"
                                      sx={{
                                        borderRadius: '16px',
                                        py: 1,
                                        maxWidth: '100%',
                                        height: 'auto',
                                        '& .MuiChip-label': {
                                          display: 'block',
                                          whiteSpace: 'normal',
                                          textOverflow: 'ellipsis',
                                          overflow: 'hidden',
                                          textAlign: 'left'
                                        },
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        }
                                      }}
                                    />
                                  );
                                })}
                              </Box>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  ))
                )}
                <div ref={messagesEndRef} />
              </Box>
              
              {/* Chat input area with Selected Products Display moved ABOVE it */}
              <Box sx={{ 
                borderTop: '1px solid',
                borderColor: 'divider',
              }}>
                {/* Text input and send button */}
                <Box sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <TextField
                    fullWidth
                    placeholder="Ask about movies..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    multiline
                    maxRows={4}
                    variant="outlined"
                    sx={{ mr: 1 }}
                    InputProps={{
                      startAdornment: selectedProducts.length > 0 && (
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 0.5, 
                          p: 0.5,
                          alignItems: 'center'
                        }}>
                          {isLoadingProducts ? (
                            <CircularProgress size={20} />
                          ) : (
                            selectedProducts.map(product => (
                              <Chip
                                key={product.id}
                                size="small"
                                avatar={
                                  <Avatar 
                                    alt={product.title} 
                                    src={product.image_url || `https://picsum.photos/40/40?random=${product.id}`}
                                    sx={{ width: 28, height: 28 }}
                                  />
                                }
                                label={product.title || 'Unknown Product'}
                                onDelete={() => removeProduct(product.id)}
                                deleteIcon={<CloseIcon fontSize="small" />}
                                variant="outlined"
                                sx={{ 
                                  borderRadius: 1.5,
                                  height: 32,
                                  '& .MuiChip-avatar': {
                                    width: 28,
                                    height: 28,
                                    ml: 0.5
                                  }
                                }}
                              />
                            ))
                          )}
                        </Box>
                      )
                    }}
                  />
                  <IconButton 
                    color="primary" 
                    onClick={() => sendMessage()}
                    disabled={!currentMessage.trim() || isChatLoading}
                    sx={{ 
                      p: 1.5,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'action.disabledBackground',
                        color: 'action.disabled'
                      }
                    }}
                  >
                    {isChatLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </ClickAwayListener>
  );
});

export default AISearchBar; 