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
  useMediaQuery,
  Menu,
  MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import AddCommentIcon from '@mui/icons-material/AddComment';
import StreamIcon from '@mui/icons-material/Stream';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { keyframes } from '@mui/material/styles';
import { useSearch } from '../../../hooks/useSearch';
import { EcommerceSearchResultItem } from '../types/ecommerce';
import ReactMarkdown from 'react-markdown';
import config from '../../../config';
import { getTenantHeadersFromPath } from '../../../utils/tenantHeaders';

// Replace with Switch import
import Switch from '@mui/material/Switch';

// Add FormControlLabel back for switch label
import FormControlLabel from '@mui/material/FormControlLabel';

// Simple keyframes for basic animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
  setSearchQuery: (query: string) => void;
  closeAutocomplete: () => void;
}

interface AISearchBarProps {
  setData?: (data: EcommerceSearchResultItem[]) => void;
  onSearch?: () => void;
  initialQuery?: string;
  autoFocus?: boolean;
}

const AISearchBar = forwardRef<AISearchBarRef, AISearchBarProps>(({ setData, onSearch, initialQuery = '', autoFocus = true }, ref) => {
  const theme = useTheme();
  const {searchProducts} = useSearch();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState(generateConversationId());
  
  // Add stream mode state
  const [isStreamMode, setIsStreamMode] = useState(true); // Default to non-streaming mode
  
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

  // Add state for mobile menu
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const isMobileMenuOpen = Boolean(mobileMenuAnchor);

  // Add state to track scroll behavior
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add state for expanded messages
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  
  // Character limit for user messages
  const USER_MESSAGE_CHAR_LIMIT = 150;

  // Add refs and state for dynamic height calculation
  const dialogTitleRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLDivElement>(null);
  const productContextRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  const [dynamicHeights, setDynamicHeights] = useState({
    dialogTitle: 64, // Default fallback values
    chatInput: 80,
    productContext: 0,
    lastUserMessage: 60
  });

  const navigate = useNavigate();

  // Predefined FAQs to show when starting a new chat
  const faqs = [
    "What are the most comfortable running shoes for beginners?",
    "Can you recommend premium fashion brands?",
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
          // Transform the response to match ecommerce interface
          const ecommerceResults: EcommerceSearchResultItem[] = response.results.map(item => ({
            id: item.id,
            title: item.title,
            image_url: item.image_url,
            custom_data: item.custom_data as unknown as EcommerceSearchResultItem['custom_data'],
            searchable_content: item.searchable_content,
            score: item.score,
            search_type: item.search_type
          }));
          setData(ecommerceResults);
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
      
      // Get tenant headers based on current path
      const headers = getTenantHeadersFromPath(window.location.pathname);

      const response = await fetch(
        `${config.apiBaseUrl}${config.apiEndpoints.autocomplete}?query=${encodeURIComponent(query)}`,
        { headers }
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

  // Note: Automatic search is handled by the parent component (EcommerceHome.tsx)
  // to prevent cycling issues with URL management

  // Handle selecting an autocomplete suggestion
  const handleAutocompleteSelect = (result: AutocompleteResult) => {
    // Navigate to ecommerce product detail page instead of demo_site
    navigate(`/demo_ecommerce/${result.data.id}`);
    setShowAutocomplete(false);
  };

  // Close autocomplete dropdown when clicking away
  const handleClickAway = () => {
    setShowAutocomplete(false);
  };

  // Handle mobile menu
  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  // Handle key press in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
      setShowAutocomplete(false);
    }
  };

  // Check if user is near bottom of chat
  const isNearBottom = () => {
    if (!chatContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle scroll events to detect if user scrolled up
  const handleScroll = () => {
    setShouldAutoScroll(isNearBottom());
  };

  // Smart scroll logic - only scroll when appropriate
  useEffect(() => {
    const messageCountChanged = messages.length !== lastMessageCount;
    
    if (messageCountChanged) {
      // New message added - always scroll if we should auto-scroll
      if (shouldAutoScroll) {
        scrollToBottom();
      }
      setLastMessageCount(messages.length);
    } else if (shouldAutoScroll && isStreamMode) {
      // During streaming, only scroll if user is very close to bottom and message is complete
      // Check if the last message is no longer typing (streaming complete)
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && !lastMessage.isTyping && isNearBottom()) {
        // Use gentle auto scroll for completed streaming messages
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }
    }
  }, [messages, shouldAutoScroll, lastMessageCount, isStreamMode]);

  // Function to fetch product details by ID
  const fetchProductDetails = async (productId: string): Promise<SelectedProduct | null> => {
    try {
      setIsLoadingProducts(true);
      
      // Get tenant headers based on current path
      const headers = getTenantHeadersFromPath(window.location.pathname);
      
      const response = await fetch(
        `${config.apiBaseUrl}/products/${productId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        title: data.product_name || data.title || 'Unknown Product',
        image_url: data.image_url || `https://picsum.photos/300/400?random=${data.id}`,
        custom_data: data
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
    setShouldAutoScroll(true);
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
    setShouldAutoScroll(true);
    setLastMessageCount(0);
    setExpandedMessages(new Set()); // Reset expanded messages
  };

  // Helper function to toggle message expansion
  const toggleMessageExpansion = (messageId: number) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Helper function to check if message should be truncated
  const shouldTruncateMessage = (text: string) => {
    return text.length > USER_MESSAGE_CHAR_LIMIT;
  };

  // Helper function to get truncated text
  const getTruncatedText = (text: string) => {
    return text.substring(0, USER_MESSAGE_CHAR_LIMIT) + '...';
  };

  // Streaming response handler
  const handleStreamingResponse = async (response: Response, messageId: number) => {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body reader available');
    
    const decoder = new TextDecoder();
    let mainContent = '';
    let questions: string[] = [];
    let products: ProductSearchResult[] = [];
    let isComplete = false;
    
    try {
      while (!isComplete) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            switch (data.type) {
              case 'content':
                mainContent += data.content;
                // Update the AI message with new content progressively
                setMessages(prev => {
                  const updatedMessages = [...prev];
                  const aiMessageIndex = updatedMessages.findIndex(msg => msg.id === messageId);
                  
                  if (aiMessageIndex !== -1) {
                    updatedMessages[aiMessageIndex] = {
                      ...updatedMessages[aiMessageIndex],
                      text: mainContent,
                      isTyping: true // Keep typing indicator while streaming
                    };
                  }
                  
                  return updatedMessages;
                });
                break;
                
              case 'questions':
                questions = data.content || [];
                break;
                
              case 'products':
                products = data.content || [];
                break;
                
              case 'complete':
                isComplete = true;
                // Update the final AI message with all data and remove typing indicator
                setMessages(prev => {
                  const updatedMessages = [...prev];
                  const aiMessageIndex = updatedMessages.findIndex(msg => msg.id === messageId);
                  
                  if (aiMessageIndex !== -1) {
                    updatedMessages[aiMessageIndex] = {
                      ...updatedMessages[aiMessageIndex],
                      text: mainContent,
                      isTyping: false,
                      suggestedProducts: products,
                      suggestedQuestions: questions,
                      includedProducts: products
                    };
                  }
                  
                  return updatedMessages;
                });
                break;
            }
          } catch (parseError) {
            console.error('Error parsing JSON chunk:', parseError);
            // Continue processing other chunks
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      // Update with error message
      setMessages(prev => {
        const updatedMessages = [...prev];
        const aiMessageIndex = updatedMessages.findIndex(msg => msg.id === messageId);
        
        if (aiMessageIndex !== -1) {
          updatedMessages[aiMessageIndex] = {
            id: messageId,
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
    }
  };

  // Send message to shopping assistant API
  const sendMessage = async (productIds: string[] = []) => {
    if (currentMessage.trim()) {
      const messageText = currentMessage.trim();
      const userMessageId = Date.now();
      const aiMessageId = userMessageId + 1;
      
      const newUserMessage: Message = {
        id: userMessageId,
        text: messageText,
        sender: 'user',
        timestamp: new Date(),
        includedProducts: [...selectedProducts]
      };
      
      // Add a loading message with empty products array
      const loadingMessage: Message = {
        id: aiMessageId,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        isTyping: true,
        suggestedProducts: [],
        suggestedQuestions: []
      };
      
      setMessages(prev => [...prev, newUserMessage, loadingMessage]);
      setCurrentMessage('');
      setIsChatLoading(true);
      
      try {
        // Combine passed productIds with any already in the selectedProducts state
        // Ensure all product IDs are strings
        const allProductIds = [...new Set([
          ...productIds.map(id => String(id)),
          ...selectedProducts.map(p => String(p.id))
        ])];
        
        // Create the request payload
        const payload = {
          query: messageText,
          conversation_id: conversationId,
          product_ids: allProductIds,
          stream: isStreamMode // Use stream mode setting
        };
        
        // Get tenant headers based on current path
        const headers = getTenantHeadersFromPath(window.location.pathname);
        // Override Accept header for streaming mode
        const finalHeaders = {
          ...headers,
          'Accept': isStreamMode ? 'text/plain' : 'application/json'
        };
        
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: finalHeaders,
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (isStreamMode) {
          // Handle streaming response
          await handleStreamingResponse(response, aiMessageId);
        } else {
          // Handle non-streaming response (original logic)
          const data = await response.json();
          
          setMessages(prev => {
            const updatedMessages = [...prev];
            const aiMessageIndex = updatedMessages.findIndex(msg => msg.id === aiMessageId);
            
            if (aiMessageIndex !== -1) {
              updatedMessages[aiMessageIndex] = {
                id: aiMessageId,
                text: data.response || '',
                sender: 'ai',
                timestamp: new Date(),
                isTyping: false,
                suggestedProducts: data.products || [],
                suggestedQuestions: data.suggested_user_queries || [],
                includedProducts: data.products || []
              };
            }
            
            return updatedMessages;
          });
        }
        
      } catch (error) {
        console.error('Fetch error:', error);
        
        // Update with error message
        setMessages(prev => {
          const updatedMessages = [...prev];
          const aiMessageIndex = updatedMessages.findIndex(msg => msg.id === aiMessageId);
          
          if (aiMessageIndex !== -1) {
            updatedMessages[aiMessageIndex] = {
              id: aiMessageId,
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
    const userMessageId = Date.now();
    const aiMessageId = userMessageId + 1;

    // Set the input field initially (for visual feedback)
    setCurrentMessage(messageToSend);
    
    // Create and add the user message directly
    const newUserMessage: Message = {
      id: userMessageId,
      text: messageToSend,
      sender: 'user',
      timestamp: new Date(),
      includedProducts: [...selectedProducts]
    };
    
    // Add a loading message
    const loadingMessage: Message = {
      id: aiMessageId,
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
        // Combine passed productIds with any already in the selectedProducts state
        // Ensure all product IDs are strings
        const allProductIds = [...new Set([
          ...productIds.map(id => String(id)),
          ...selectedProducts.map(p => String(p.id))
        ])];
        
        // Create the request payload
        const payload = {
          query: messageToSend,
          conversation_id: conversationId,
          product_ids: allProductIds,
          stream: isStreamMode // Use stream mode setting
        };
        
        // Get tenant headers based on current path
        const headers = getTenantHeadersFromPath(window.location.pathname);
        // Override Accept header for streaming mode
        const finalHeaders = {
          ...headers,
          'Accept': isStreamMode ? 'text/plain' : 'application/json'
        };
        
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: finalHeaders,
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (isStreamMode) {
          // Handle streaming response
          await handleStreamingResponse(response, aiMessageId);
        } else {
          // Handle non-streaming response (original logic)
          const data = await response.json();
          
          setMessages(prev => {
            const updatedMessages = [...prev];
            const aiMessageIndex = updatedMessages.findIndex(msg => msg.id === aiMessageId);
            
            if (aiMessageIndex !== -1) {
              updatedMessages[aiMessageIndex] = {
                id: aiMessageId,
                text: data.response || '',
                sender: 'ai',
                timestamp: new Date(),
                isTyping: false,
                suggestedProducts: data.products || [],
                suggestedQuestions: data.suggested_user_queries || [],
                includedProducts: data.products || []
              };
            }
            
            return updatedMessages;
          });
        }
        
      } catch (error) {
        console.error('Fetch error:', error);
        
        // Update with error message
        setMessages(prev => {
          const updatedMessages = [...prev];
          const aiMessageIndex = updatedMessages.findIndex(msg => msg.id === aiMessageId);
          
          if (aiMessageIndex !== -1) {
            updatedMessages[aiMessageIndex] = {
              id: aiMessageId,
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
  const TypingIndicator = () => {
    // Calculate total height to subtract based on actual component heights
    const MINIMUM_TOP_SPACING = 90; // Constant spacing to always maintain from top (48px = 6 * 8px spacing units)
    const DIALOG_MARGIN = 32; // Desktop margin (16px top + 16px bottom)
    const totalHeightToSubtract = dynamicHeights.dialogTitle + 
                                  dynamicHeights.chatInput + 
                                  dynamicHeights.productContext + 
                                  dynamicHeights.lastUserMessage + 
                                  32 + // Chat area padding (16px top + 16px bottom)
                                  MINIMUM_TOP_SPACING; // Always maintain this minimum spacing from top
    
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        pb: { 
          xs: `calc(100vh - ${totalHeightToSubtract + 21}px)`, // Mobile: full height minus all measured components
          md: `calc(100vh - ${totalHeightToSubtract + DIALOG_MARGIN}px)`   // Desktop: 100vh minus all measured components and dialog margin
        }
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
  };

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
      const userMessageId = Date.now();
      const aiMessageId = userMessageId + 1;
      
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
            id: userMessageId,
            text: messageToSend,
            sender: 'user',
            timestamp: new Date(),
            includedProducts: productDetails
          };
          
          // Add a loading message right away
          const loadingMessage: Message = {
            id: aiMessageId,
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
          
          // Create the request payload with all product IDs
          // Ensure product IDs are strings
          const payload = {
            query: messageToSend,
            conversation_id: conversationId,
            product_ids: productIds.map(id => String(id)),
            stream: isStreamMode // Use stream mode setting
          };
          
          // Get tenant headers based on current path
          const headers = getTenantHeadersFromPath(window.location.pathname);
          // Override Accept header for streaming mode
          const finalHeaders = {
            ...headers,
            'Accept': isStreamMode ? 'text/plain' : 'application/json'
          };
          
          const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: finalHeaders,
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          if (isStreamMode) {
            // Handle streaming response
            await handleStreamingResponse(response, aiMessageId);
          } else {
            // Handle non-streaming response (original logic)
            const data = await response.json();
            
            setMessages(prev => {
              const updatedMessages = [...prev];
              const aiMessageIndex = updatedMessages.findIndex(msg => msg.id === aiMessageId);
              
              if (aiMessageIndex !== -1) {
                updatedMessages[aiMessageIndex] = {
                  id: aiMessageId,
                  text: data.response || '',
                  sender: 'ai',
                  timestamp: new Date(),
                  isTyping: false,
                  suggestedProducts: data.products || [],
                  suggestedQuestions: data.suggested_user_queries || [],
                  includedProducts: data.products || []
                };
              }
              
              return updatedMessages;
            });
          }
          
        } catch (error) {
          console.error('Fetch error:', error);
          
          // Update with error message
          setMessages(prev => {
            const updatedMessages = [...prev];
            const aiMessageIndex = updatedMessages.findIndex(msg => msg.id === aiMessageId);
            
            if (aiMessageIndex !== -1) {
              updatedMessages[aiMessageIndex] = {
                id: aiMessageId,
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
    setSearchQuery: (query: string) => setSearchQuery(query),
    closeAutocomplete: () => setShowAutocomplete(false)
  }));

  // Reset state when query changes (from URL parameters when navigating)
  useEffect(() => {
    if (initialQuery !== searchQuery && initialQuery !== '') {
      setSearchQuery(initialQuery);
      setShowAutocomplete(false); // Close autocomplete when query changes due to navigation
    }
  }, [initialQuery]);

  // Function to calculate dynamic heights
  const calculateDynamicHeights = useCallback(() => {
    const dialogTitleHeight = dialogTitleRef.current?.offsetHeight || 64;
    const chatInputHeight = chatInputRef.current?.offsetHeight || 80;
    const productContextHeight = productContextRef.current?.offsetHeight || 0;
    const lastUserMessageHeight = lastUserMessageRef.current?.offsetHeight || 60;

    setDynamicHeights({
      dialogTitle: dialogTitleHeight,
      chatInput: chatInputHeight,
      productContext: productContextHeight,
      lastUserMessage: lastUserMessageHeight
    });
  }, []);

  // Update heights when relevant elements change
  useEffect(() => {
    calculateDynamicHeights();
    
    // Add resize observer to recalculate on window resize
    const resizeObserver = new ResizeObserver(() => {
      calculateDynamicHeights();
    });

    if (dialogTitleRef.current) resizeObserver.observe(dialogTitleRef.current);
    if (chatInputRef.current) resizeObserver.observe(chatInputRef.current);
    if (productContextRef.current) resizeObserver.observe(productContextRef.current);
    if (lastUserMessageRef.current) resizeObserver.observe(lastUserMessageRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateDynamicHeights, selectedProducts.length, messages.length]);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{
        position: 'relative',
        width: '100%',
        my: { xs: 2, sm: 2 },
        zIndex: 10,
        maxWidth: { xs: '100%', sm: '1000px', md: '1200px' },
        mx: 'auto',
      }}>
        <Box ref={searchInputRef}>
          <TextField
            fullWidth
            placeholder="Try AI Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            onFocus={() => {
              if (autocompleteResults.length > 0) {
                setShowAutocomplete(true);
              }
            }}
            autoFocus={autoFocus}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                height: { xs: 48, sm: 52 },
                backgroundColor: 'background.paper',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  animation: 'shimmer 3s infinite',
                  zIndex: 1,
                  pointerEvents: 'none',
                },
                '& fieldset': {
                  borderWidth: 2,
                  borderColor: alpha(theme.palette.divider, 0.7),
                  transition: 'all 0.3s ease',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                  boxShadow: `0 0 0 1px rgba(25, 118, 210, 0.2)`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2.5,
                  boxShadow: `0 0 0 2px rgba(25, 118, 210, 0.1)`,
                },
                '& .MuiInputBase-input': {
                  position: 'relative',
                  zIndex: 2,
                  '&::placeholder': {
                    background: 'linear-gradient(45deg, #4f46e5, #7c3aed, #4f46e5)',
                    backgroundSize: '200% 200%',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    animation: 'gradientShift 3s ease-in-out infinite',
                    fontWeight: 600,
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    opacity: 0.5,
                  }
                },
                '@keyframes shimmer': {
                  '0%': { left: '-100%' },
                  '100%': { left: '100%' }
                },
                '@keyframes gradientShift': {
                  '0%, 100%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' }
                }
              },
              '& .MuiInputBase-input': {
                padding: { xs: '12px 16px', sm: '14px 16px' },
                fontSize: '1rem',
                '&::placeholder': {
                  color: 'text.primary',
                  opacity: 0.5,
                }
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ 
                  height: '100%', 
                  alignItems: 'center',
                  gap: 0.5,
                  mr: 0.5
                }}>
                  <Tooltip title="Search" arrow>
                    <IconButton 
                      onClick={handleSearch} 
                      edge="end"
                      disabled={isSearching}
                      aria-label="Search products"
                      size="medium"
                      sx={{ 
                        mx: 0.5,
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                        }
                      }}
                    >
                      {isSearching ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <SearchIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  
                  <Divider 
                    orientation="vertical" 
                    flexItem 
                    sx={{ 
                      mx: 0.5,
                      my: 1,
                      borderColor: alpha(theme.palette.divider, 0.5),
                      borderWidth: 1
                    }} 
                  />
                  
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
                        mr: isMobile ? 0.5 : 1,
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
                          mr: isMobile ? 0 : 0.5
                        }
                      }}
                    >
                      {!isMobile && "Assistant"}
                    </Button>
                  </Tooltip>
                  
                  {!isMobile && (
                    <Chip 
                      label="⌘ K"
                      size="small"
                      variant="outlined"
                      sx={{ 
                        height: 24,
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        borderColor: 'divider',
                        ml: 0.5,
                        mr: 0.5,
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
              zIndex: 15,
              width: '100%',
              mt: 1,
              borderRadius: 2,
              maxHeight: { xs: '350px', sm: '450px' },
              overflow: 'hidden',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              animation: `${fadeIn} 0.2s ease-out`,
            }}
          >
            {isLoadingAutocomplete ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                p: 4,
                minHeight: 120
              }}>
                <CircularProgress size={24} />
              </Box>
            ) : autocompleteResults.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                p: 4,
                minHeight: 120
              }}>
                <Typography variant="body2" color="text.secondary">
                  No products found
                </Typography>
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
                    {autocompleteResults.map((result, index) => (
                      <ListItemButton
                        key={result.data.id}
                        onClick={() => handleAutocompleteSelect(result)}
                        sx={{
                          display: 'flex',
                          py: 2,
                          px: 2,
                          borderBottom: index < autocompleteResults.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                          {/* Product image */}
                          <Box sx={{ 
                            flexShrink: 0, 
                            width: { xs: 60, sm: 64 }, 
                            height: { xs: 80, sm: 85 }, 
                            mr: 2,
                            overflow: 'hidden',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}>
                            <img
                              src={result.data.image_url || result.data.poster_path || `https://picsum.photos/70/95?random=${result.data.id}`}
                              alt={result.data.title || result.data.product_name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              loading="lazy"
                            />
                          </Box>

                          {/* Product details */}
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography 
                              variant="subtitle1" 
                              fontWeight="500" 
                              sx={{ 
                                fontSize: '0.95rem',
                                lineHeight: 1.3,
                                mb: 0.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {result.data.title || result.data.product_name}
                            </Typography>

                            {/* Brand and Rating Row */}
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              mb: 0.75,
                              gap: 1
                            }}>
                              {result.data.brand && (
                                <Chip
                                  label={result.data.brand}
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    height: 20,
                                    fontSize: '0.7rem',
                                  }}
                                />
                              )}
                              
                              {result.data.average_rating && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                }}>
                                  <Rating
                                    value={parseFloat(result.data.average_rating)}
                                    readOnly
                                    size="small"
                                    precision={0.1}
                                    sx={{ 
                                      fontSize: '0.9rem',
                                      mr: 0.5
                                    }}
                                  />
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {result.data.average_rating}
                                  </Typography>
                                </Box>
                              )}
                            </Box>

                            {/* Price Row */}
                            {(result.data.price || result.data.discounted_price) && (
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1.5,
                                mb: 0.5
                              }}>
                                <Typography 
                                  variant="body2" 
                                  fontWeight="700" 
                                  sx={{ 
                                    color: 'secondary.main',
                                    fontSize: { xs: '0.9rem', sm: '1rem' }
                                  }}
                                >
                                  ₹{result.data.discounted_price || result.data.price}
                                </Typography>
                                {result.data.discounted_price && result.data.price && parseFloat(result.data.price) > parseFloat(result.data.discounted_price) && (
                                  <>
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        textDecoration: 'line-through', 
                                        color: 'text.disabled',
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      ₹{result.data.price}
                                    </Typography>
                                    <Chip
                                      label={`${Math.round(((parseFloat(result.data.price) - parseFloat(result.data.discounted_price)) / parseFloat(result.data.price)) * 100)}% OFF`}
                                      size="small"
                                      color="error"
                                      sx={{ 
                                        height: 18,
                                        fontSize: '0.65rem',
                                      }}
                                    />
                                  </>
                                )}
                              </Box>
                            )}

                            {/* Category */}
                            {result.data.master_category && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {result.data.master_category}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </ListItemButton>
                    ))}
                  </List>
                </Box>

                {/* Ask AI button */}
                {searchQuery.trim() && (
                  <Box sx={{ 
                    p: 2, 
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                  }}>
                    <Button
                      variant="contained"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={openAiChatWithQuery}
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        borderRadius: 1,
                        px: 2,
                        py: 1,
                        fontSize: '0.875rem',
                        maxWidth: '300px',
                      }}
                    >
                      Ask AI about "{searchQuery.length > 20 ? searchQuery.slice(0, 20) + '...' : searchQuery}"
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
          sx={{
            '& .MuiDialog-container': {
              alignItems: { xs: 'center', md: 'flex-start' }, // Align to top on desktop
            },
            '& .MuiDialog-paper': {
              m: { xs: 0, md: 2 }, // Add margin back on desktop (16px)
              maxHeight: { xs: '100%', md: 'calc(100vh - 32px)' }, // Subtract margin from height (2 * 16px = 32px)
            }
          }}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, md: 2 },
              height: { xs: '100%', md: 'calc(100vh - 32px)' },
              width: { xs: '100%', md: '95%' },
              maxWidth: '900px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle 
            ref={dialogTitleRef}
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              p: { xs: 1.5, sm: 2 },
              bgcolor: 'background.paper'
            }}>
            {/* Left side - New Chat Button */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="New conversation" placement="bottom">
                <Button
                  variant="text"
                  size="small"
                  onClick={startNewChat}
                  startIcon={<AddCommentIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 2,
                    py: 0.75,
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: alpha(theme.palette.primary.main, 0.04)
                    }
                  }}
                >
                  {!isMobile && 'New'}
                </Button>
              </Tooltip>
            </Box>

            {/* Center - Title */}
            <Box sx={{ 
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex', 
              alignItems: 'center', 
              gap: 1 
            }}>
              <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  fontWeight: 600,
                  color: 'text.primary'
                }}
              >
                CogniShop
              </Typography>
            </Box>

            {/* Right side - Stream Toggle and Close Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Desktop: Show stream toggle directly */}
              {!isMobile && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={isStreamMode}
                      onChange={(e) => setIsStreamMode(e.target.checked)}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: 'primary.main',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'primary.main',
                        }
                      }}
                    />
                  }
                  label={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: 'text.secondary',
                        fontSize: '0.875rem'
                      }}
                    >
                      Stream Mode
                    </Typography>
                  }
                  labelPlacement="start"
                  sx={{ 
                    m: 0,
                    gap: 1,
                    display: 'flex',
                    alignItems: 'center',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center'
                    }
                  }}
                />
              )}

              {/* Mobile: Show more options menu */}
              {isMobile && (
                <>
                  <IconButton 
                    onClick={handleMobileMenuOpen}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: 'primary.main'
                      }
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                  
                  <Menu
                    anchorEl={mobileMenuAnchor}
                    open={isMobileMenuOpen}
                    onClose={handleMobileMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    PaperProps={{
                      sx: {
                        borderRadius: 2,
                        minWidth: 200,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <MenuItem sx={{ py: 1.5, px: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isStreamMode}
                            onChange={(e) => setIsStreamMode(e.target.checked)}
                            size="small"
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: 'primary.main',
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: 'primary.main',
                              }
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StreamIcon 
                              sx={{ 
                                fontSize: '1.1rem',
                                color: 'text.secondary'
                              }} 
                            />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 500,
                                color: 'text.secondary',
                                fontSize: '0.875rem'
                              }}
                            >
                              Stream Mode
                            </Typography>
                          </Box>
                        }
                        labelPlacement="start"
                        sx={{ 
                          m: 0,
                          gap: 1,
                          width: '100%',
                          justifyContent: 'space-between'
                        }}
                      />
                    </MenuItem>
                  </Menu>
                </>
              )}
              
              <IconButton 
                onClick={closeAiChat} 
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
              <Box 
                ref={chatContainerRef}
                onScroll={handleScroll}
                sx={{ 
                  flexGrow: 1, 
                  p: { xs: 1.5, sm: 2 }, 
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  position: 'relative',
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
                      CogniShop Shopping Assistant!
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, mb: 3 }}>
                      Your AI-powered shopping companion. Ask me anything about products, orders, or get personalized recommendations.
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
                  messages.map((message, index) => {
                    // Check if this is the last user message
                    // Find the last index of a user message manually (since findLastIndex may not be available)
                    let lastUserMessageIndex = -1;
                    for (let i = messages.length - 1; i >= 0; i--) {
                      if (messages[i].sender === 'user') {
                        lastUserMessageIndex = i;
                        break;
                      }
                    }
                    const isLastUserMessage = message.sender === 'user' && index === lastUserMessageIndex;
                    
                    return (
                      <Box key={message.id}>
                        {/* User messages */}
                        {message.sender === 'user' && (
                          <Box
                            ref={isLastUserMessage ? lastUserMessageRef : undefined}
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
                                position: 'relative',
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
                              {/* Message text with truncation logic */}
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    flexGrow: 1,
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap'
                                  }}
                                >
                                  {shouldTruncateMessage(message.text) && !expandedMessages.has(message.id)
                                    ? getTruncatedText(message.text)
                                    : message.text
                                  }
                                </Typography>
                                
                                {/* Expand/Collapse button */}
                                {shouldTruncateMessage(message.text) && (
                                  <IconButton
                                    size="small"
                                    onClick={() => toggleMessageExpansion(message.id)}
                                    sx={{
                                      color: 'rgba(255,255,255,0.8)',
                                      p: 0.25,
                                      ml: 0.5,
                                      mt: -0.25,
                                      '&:hover': {
                                        color: '#fff',
                                        bgcolor: 'rgba(255,255,255,0.1)'
                                      }
                                    }}
                                  >
                                    {expandedMessages.has(message.id) ? (
                                      <ExpandLessIcon fontSize="small" />
                                    ) : (
                                      <ExpandMoreIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                )}
                              </Box>
                              
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
                                pl: { xs: 0, sm: 2 },
                                mb: 3
                              }}
                            >
                              <Box
                                sx={{
                                  maxWidth: { xs: '90%', sm: '80%' },
                                  color: 'text.primary',
                                  '& a': {
                                    color: theme.palette.secondary.main,
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
                                  },
                                  '& p': {
                                    margin: 0,
                                    marginBottom: 1
                                  },
                                  '& p:last-child': {
                                    marginBottom: 0
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
                              </Box>
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
                                          image={(product as any).image_url || product.custom_data?.image_url || `https://picsum.photos/400/300?random=${product.id}`}
                                          alt={product.title || product.custom_data?.product_name || 'Product image'}
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
                                            {product.title || product.custom_data?.product_name}
                                          </Typography>
                                          
                                          {/* Brand */}
                                          {product.custom_data?.brand && (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                              {product.custom_data.brand}
                                            </Typography>
                                          )}
                                          
                                          {/* Price & Rating */}
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                            {(product.custom_data?.discounted_price || product.custom_data?.price) && (
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" fontWeight="medium" color="secondary.main">
                                                  ₹{product.custom_data?.discounted_price || product.custom_data?.price}
                                                </Typography>
                                                {product.custom_data?.discounted_price && product.custom_data?.price && 
                                                 parseFloat(product.custom_data.price) > parseFloat(product.custom_data.discounted_price) && (
                                                  <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                      textDecoration: 'line-through',
                                                      color: 'text.disabled',
                                                      fontSize: '0.75rem'
                                                    }}
                                                  >
                                                    ₹{product.custom_data.price}
                                                  </Typography>
                                                )}
                                              </Box>
                                            )}
                                            
                                            {product.custom_data?.average_rating && (
                                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Rating 
                                                  value={parseFloat(product.custom_data.average_rating)} 
                                                  readOnly 
                                                  size="small" 
                                                  precision={0.1}
                                                />
                                                <Typography variant="caption" fontWeight="medium" sx={{ ml: 0.5 }}>
                                                  {product.custom_data.average_rating}
                                                </Typography>
                                              </Box>
                                            )}
                                          </Box>
                                          
                                          {/* Category */}
                                          {product.custom_data?.master_category && (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                              {product.custom_data.master_category}
                                            </Typography>
                                          )}
                                          
                                          <Button 
                                            variant="contained"
                                            size="small"
                                            fullWidth
                                            sx={{ mt: 1, textTransform: 'none' }}
                                            onClick={() => {
                                              // Open product details in a new tab
                                              window.open(`/demo_ecommerce/${product.id}`, '_blank');
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
                                                      color: 'secondary.main',
                                                      textDecoration: 'none',
                                                      display: 'inline',
                                                      fontWeight: 'bold',
                                                      '&:hover': {
                                                        textDecoration: 'underline',
                                                        color: 'secondary.main'
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
                    );
                  })
                )}
                
                {/* Floating scroll to bottom button */}
                {!shouldAutoScroll && messages.length > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      zIndex: 10
                    }}
                  >
                    <IconButton
                      onClick={() => {
                        setShouldAutoScroll(true);
                        scrollToBottom();
                      }}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        boxShadow: 2,
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          boxShadow: 4
                        },
                        animation: 'fadeIn 0.3s ease-in-out',
                        '@keyframes fadeIn': {
                          from: { opacity: 0, transform: 'scale(0.8)' },
                          to: { opacity: 1, transform: 'scale(1)' }
                        }
                      }}
                    >
                      <KeyboardArrowDownIcon />
                    </IconButton>
                  </Box>
                )}
                
                <div ref={messagesEndRef} />
              </Box>
              
              {/* Chat input area with Selected Products Display moved ABOVE it */}
              <Box 
                ref={chatInputRef}
                sx={{ 
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}>
                {/* Selected Products Display - Now at the top */}
                {selectedProducts.length > 0 && (
                  <Box 
                    ref={productContextRef}
                    sx={{ 
                      px: { xs: 1.5, sm: 2 }, // Only horizontal padding, same as input
                      py: 0, // Remove all vertical padding
                      bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 0.5, // Reduced gap between chips
                      alignItems: 'center',
                      py: 0.5 // Move padding to inner box for tighter control
                    }}>
                      {isLoadingProducts ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CircularProgress size={16} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Loading...
                          </Typography>
                        </Box>
                      ) : (
                        selectedProducts.map(product => (
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
                            onDelete={() => removeProduct(product.id)}
                            deleteIcon={<CloseIcon sx={{ fontSize: '0.875rem' }} />}
                            variant="outlined"
                            sx={{ 
                              borderRadius: 1,
                              height: 24, // Much smaller height
                              fontSize: '0.7rem',
                              '& .MuiChip-avatar': {
                                width: 20,
                                height: 20,
                                ml: 0.25
                              },
                              '& .MuiChip-label': {
                                px: 0.5,
                                fontSize: '0.7rem'
                              },
                              '& .MuiChip-deleteIcon': {
                                width: 16,
                                height: 16,
                                mr: 0.25
                              }
                            }}
                          />
                        ))
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Text input and send button */}
                <Box sx={{ 
                  px: { xs: 1.5, sm: 2 }, 
                  pt: 0, // Remove top padding completely
                  pb: { xs: 1.5, sm: 2 }, // Keep bottom padding for send button
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <TextField
                    fullWidth
                    placeholder="Ask about products..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    multiline
                    maxRows={4}
                    variant="outlined"
                    sx={{ mr: 1 }}
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