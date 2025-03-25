import React from 'react';
import { Box, Typography } from '@mui/material';

const HistoryTab: React.FC = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          AI Shopping History
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          View your past AI shopping interactions and search history.
        </Typography>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '300px',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1
      }}>
        <Typography variant="body1" color="text.secondary">
          History content will be implemented soon.
        </Typography>
      </Box>
    </Box>
  );
};

export default HistoryTab; 