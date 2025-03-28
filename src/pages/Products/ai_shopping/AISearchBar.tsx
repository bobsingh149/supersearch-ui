import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Typography, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  List, 
  ListItem, 
  ListItemText, 
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
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import AddCommentIcon from '@mui/icons-material/AddComment';
import { keyframes } from '@mui/material/styles';
import { useSearch, SearchResultItem } from '../../../hooks/useSearch';
import { useAuth } from '@clerk/clerk-react';
import ReactMarkdown from 'react-markdown';

// Animation for the magic wand icon
const sparkle = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

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

// Predefined shopping-related chat prompts
const PREDEFINED_PROMPTS = [
  "Find me sci-fi movies with high ratings",
  "What are the best action movies from the 90s?",
  "Show me movies directed by Christopher Nolan",
  "Recommend family-friendly animated movies",
  "What's that movie where a guy catches the robber who steals paintings?"
];

// Types for streaming responses
type StreamingResponseType = 'products' | 'content';

interface ProductSearchResult {
  id: string;
  title?: string;
  custom_data?: Record<string, any>;
  searchable_content?: string;
  score?: number;
  search_type?: string;
  image_url?: string;
}

interface StreamingResponse {
  type: StreamingResponseType;
  conversation_id: string;
  content: string | ProductSearchResult[];
}

// Message interface for chat
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  suggestedProducts?: ProductSearchResult[];
}

// API endpoint
const API_ENDPOINT = 'http://localhost:9000/api/v1/shopping-assistant/chat';

// Generate new conversation ID
const generateConversationId = () => `c${Date.now()}`;

interface AISearchBarProps {
  setData: (data: SearchResultItem[]) => void;
}

const AISearchBar: React.FC<AISearchBarProps> = ({ setData }) => {
  const theme = useTheme();
  const { getToken } = useAuth();
  const { loading: apiLoading, error: apiError, searchProducts } = useSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState(generateConversationId());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle normal search
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        setIsSearching(true);
        const response = await searchProducts({
          query: searchQuery,
          page: 1,
          size: 10
        });
        setData(response.results);
      } catch (error) {
        console.error('Error performing search:', error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Handle key press in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Open AI chat modal
  const openAiChat = () => {
    if (searchQuery.trim()) {
      setCurrentMessage(searchQuery);
      setIsChatOpen(true);
    } else {
      setIsChatOpen(true);
    }
  };

  // Close AI chat modal
  const closeAiChat = () => {
    setIsChatOpen(false);
  };

  // Start a new chat session
  const startNewChat = () => {
    setMessages([]);
    setCurrentMessage('');
    setConversationId(generateConversationId());
  };

  // Send message to shopping assistant API
  const sendMessage = async () => {
    if (currentMessage.trim()) {
      const newUserMessage: Message = {
        id: Date.now(),
        text: currentMessage.trim(),
        sender: 'user',
        timestamp: new Date()
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
        suggestedProducts: []
      };
      
      setMessages(prev => [...prev, loadingMessage]);
      
      // Call shopping assistant API
      const fetchWithReader = async () => {
        try {
          // Get the authentication token
          const token = await getToken();
          
          // Construct URL with query parameters
          const url = `${API_ENDPOINT}?query=${encodeURIComponent(messageText)}&conversation_id=${conversationId}&stream=true`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('Response body is not readable');
          }
          
          // Update loading message with actual content
          const aiResponseId = Date.now() + 1;
          let accumulatedTextResponse = '';
          let productsReceived: ProductSearchResult[] = [];
          const decoder = new TextDecoder();
          
          const processStream = async () => {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                break;
              }
              
              const chunk = decoder.decode(value, { stream: true });
              
              // Check if the chunk contains [DONE]
              if (chunk.includes('[DONE]')) {
                break;
              }
              
              try {
                // Try to parse the chunk as JSON
                const jsonLines = chunk
                  .split('\n')
                  .filter(line => line.trim() !== '')
                  .map(line => {
                    try {
                      return JSON.parse(line);
                    } catch (e) {
                      return null;
                    }
                  })
                  .filter(Boolean) as StreamingResponse[];
                
                // Process each JSON response
                jsonLines.forEach(jsonResponse => {
                  if (jsonResponse.type === 'content') {
                    // For text content, append to the accumulated response
                    accumulatedTextResponse += jsonResponse.content as string;
                    
                    // Update the AI response message
                    setMessages(prev => {
                      const updatedMessages = [...prev];
                      const aiMessageIndex = updatedMessages.findIndex(msg => msg.isTyping);
                      
                      if (aiMessageIndex !== -1) {
                        updatedMessages[aiMessageIndex] = {
                          id: aiResponseId,
                          text: accumulatedTextResponse,
                          sender: 'ai',
                          timestamp: new Date(),
                          isTyping: true,
                          suggestedProducts: productsReceived
                        };
                      }
                      
                      return updatedMessages;
                    });
                  } else if (jsonResponse.type === 'products') {
                    // For product results, save them and immediately show them
                    productsReceived = jsonResponse.content as ProductSearchResult[];
                    
                    // Update the AI response message
                    setMessages(prev => {
                      const updatedMessages = [...prev];
                      const aiMessageIndex = updatedMessages.findIndex(msg => msg.isTyping);
                      
                      if (aiMessageIndex !== -1) {
                        updatedMessages[aiMessageIndex] = {
                          id: aiResponseId,
                          text: accumulatedTextResponse,
                          sender: 'ai',
                          timestamp: new Date(),
                          isTyping: true,
                          suggestedProducts: productsReceived
                        };
                      }
                      
                      return updatedMessages;
                    });
                  }
                });
              } catch (error) {
                console.error('Error parsing JSON chunk:', error);
                // If it's not valid JSON, just display the raw content
                accumulatedTextResponse += chunk;
                
                // Update the AI response message
                setMessages(prev => {
                  const updatedMessages = [...prev];
                  const aiMessageIndex = updatedMessages.findIndex(msg => msg.isTyping);
                  
                  if (aiMessageIndex !== -1) {
                    updatedMessages[aiMessageIndex] = {
                      id: aiResponseId,
                      text: accumulatedTextResponse,
                      sender: 'ai',
                      timestamp: new Date(),
                      isTyping: true,
                      suggestedProducts: productsReceived
                    };
                  }
                  
                  return updatedMessages;
                });
              }
            }
            
            // Final update - remove typing indicator
            setMessages(prev => {
              const updatedMessages = [...prev];
              const aiMessageIndex = updatedMessages.findIndex(msg => msg.isTyping);
              
              if (aiMessageIndex !== -1) {
                updatedMessages[aiMessageIndex] = {
                  id: aiResponseId,
                  text: accumulatedTextResponse,
                  sender: 'ai',
                  timestamp: new Date(),
                  isTyping: false,
                  suggestedProducts: productsReceived
                };
              }
              
              return updatedMessages;
            });
          };
          
          await processStream();
          setIsChatLoading(false);
        } catch (error) {
          console.error('Fetch error:', error);
          setIsChatLoading(false);
          
          // Update with error message
          setMessages(prev => {
            const updatedMessages = [...prev];
            const aiMessageIndex = updatedMessages.findIndex(msg => msg.isTyping);
            
            if (aiMessageIndex !== -1) {
              updatedMessages[aiMessageIndex] = {
                id: Date.now(),
                text: '**Error connecting to shopping assistant. Please try again later.**',
                sender: 'ai',
                timestamp: new Date(),
                isTyping: false
              };
            }
            
            return updatedMessages;
          });
        }
      };
      
      fetchWithReader();
    }
  };

  // Use predefined prompt
  const usePrompt = (prompt: string) => {
    setCurrentMessage(prompt);
    // Optional: auto-send the prompt
    // setTimeout(() => sendMessage(), 100);
  };

  // Handle key press in chat input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Add keyboard shortcut (Ctrl+K) to open chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        openAiChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchQuery]); // Include searchQuery as dependency to ensure current value is used

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

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
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
        <TextField
          fullWidth
          placeholder="Search for movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleSearchKeyPress}
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
              <InputAdornment position="end">
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
                <Tooltip 
                  title="MovieFinder Assistant (Ctrl+K)" 
                  arrow
                  TransitionComponent={Zoom}
                >
                  <IconButton 
                    onClick={openAiChat} 
                    edge="end" 
                    color="secondary"
                    size="small"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    aria-label="MovieFinder Assistant"
                    sx={{
                      ml: 0.5,
                      mr: 0.5,
                      '& .MuiSvgIcon-root': {
                        animation: isHovering ? `${sparkle} 1.5s infinite ease-in-out` : 'none',
                        color: isHovering ? 'secondary.main' : 'inherit'
                      }
                    }}
                  >
                    <AutoAwesomeIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            )
          }}
        />

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
        PaperProps={{
          sx: {
            borderRadius: 2,
            height: '95vh',
            width: '95%',
            maxWidth: '1800px',
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
          p: 2
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
            <Typography variant="h6">MovieFinder Assistant</Typography>
            <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
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
            width: '70%', 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%'
          }}>
            {/* Chat messages area */}
            <Box sx={{ 
              flexGrow: 1, 
              p: 2, 
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
                  opacity: 0.7
                }}>
                  <AutoAwesomeIcon sx={{ fontSize: 48, mb: 2, color: 'secondary.main' }} />
                  <Typography variant="h6">
                    Welcome to MovieFinder Assistant!
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    This demo uses the Kaggle Movies Dataset to showcase our powerful AI search capabilities. 
                    Ask about genres, directors, actors, or describe the type of movie you're looking for!
                  </Typography>
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
                            p: 2,
                            maxWidth: '80%',
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
                              p: 2,
                              maxWidth: '80%',
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
                          <Box sx={{ mt: 1, mb: 3, pl: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                              Referenced Products:
                            </Typography>
                            <Grid container spacing={2}>
                              {message.suggestedProducts.map((product) => (
                                <Grid item xs={12} sm={6} key={product.id}>
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
                                      sx={{ objectFit: 'cover' }}
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
                      </>
                    )}
                  </Box>
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>
            
            {/* Chat input area */}
            <Box sx={{ 
              p: 2, 
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center'
            }}>
              <TextField
                fullWidth
                placeholder="Ask about movies, genres, directors..."
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
                onClick={sendMessage}
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
          
          {/* Suggestions sidebar */}
          <Box sx={{ 
            width: '30%', 
            borderLeft: '1px solid',
            borderColor: 'divider',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default'
          }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Try These Movie Queries
            </Typography>
            <List dense disablePadding>
              {PREDEFINED_PROMPTS.map((prompt, index) => (
                <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton 
                    onClick={() => usePrompt(prompt)}
                    sx={{ 
                      borderRadius: 1,
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemText 
                      primary={prompt} 
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        sx: { 
                          whiteSpace: 'normal',
                          wordBreak: 'break-word'
                        }
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            
            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Try asking about specific genres, directors, actors, or describe movie plots you'd enjoy.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AISearchBar; 