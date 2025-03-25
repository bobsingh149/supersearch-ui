import React from 'react';
import { Box, Typography } from '@mui/material';

const AnalyticsTab: React.FC = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          AI Shopping Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          View analytics and insights from AI-assisted shopping interactions.
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
          Analytics content will be implemented soon.
        </Typography>
      </Box>
    </Box>
  );
};

export default AnalyticsTab; 