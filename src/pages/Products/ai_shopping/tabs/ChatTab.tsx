import React, { useState } from 'react';
import { 
  Box, 
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  useTheme
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AISearchBar from '../AISearchBar';
import { SearchResultItem } from '../../../../hooks/useSearch';

const ChatTab: React.FC = () => {
  const theme = useTheme();
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);

  return (
    <Box sx={{ width: '100%' }}>
      <AISearchBar setData={setSearchResults} />

      {/* Display search results */}
      {searchResults.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Search Results
          </Typography>
          <Grid container spacing={3}>
            {searchResults.map((result) => (
              <Grid item xs={12} sm={6} md={4} key={result.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[4]
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom noWrap>
                      {result.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {result.searchable_content}
                    </Typography>
                    {result.search_type && (
                      <Chip 
                        label={result.search_type} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    )}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Score: {result.score.toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Show popular searches section only when no results */}
      {searchResults.length === 0 && (
        <Box sx={{ mt: 6, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="subtitle1" sx={{ width: '100%', mb: 1 }}>
            Popular Searches
          </Typography>
          {["Find me a summer dress under $50", "What are the best running shoes for beginners?", "I need gift ideas for my mom's birthday"].map((prompt, index) => (
            <Box 
              key={index}
              onClick={() => {
                // This will trigger the AI chat in the AISearchBar component
                const aiSearchBarElement = document.querySelector('input[placeholder*="Search for products"]') as HTMLInputElement;
                if (aiSearchBarElement) {
                  aiSearchBarElement.value = prompt;
                  aiSearchBarElement.dispatchEvent(new Event('input', { bubbles: true }));
                  
                  // Find and click the AI button
                  const aiButton = document.querySelector('button[aria-label*="AI Shopping Assistant"]') as HTMLButtonElement;
                  if (aiButton) {
                    aiButton.click();
                  }
                }
              }}
              sx={{
                py: 1.5,
                px: 2.5,
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
                }
              }}
            >
              <TrendingUpIcon 
                fontSize="small" 
                sx={{ 
                  mr: 1, 
                  color: theme.palette.secondary.main,
                  opacity: 0.8
                }} 
              />
              <Typography variant="body2">{prompt}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ChatTab; 