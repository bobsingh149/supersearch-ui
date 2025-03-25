import React from 'react';
import { Box } from '@mui/material';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <Box 
    role="tabpanel" 
    hidden={value !== index} 
    id={`ai-shopping-tabpanel-${index}`}
    aria-labelledby={`ai-shopping-tab-${index}`}
    sx={{ 
      mt: 2,
      width: '100%',
      minHeight: '60vh', // Ensures minimum height consistency
    }}
  >
    {value === index && children}
  </Box>
);

export default TabPanel; 