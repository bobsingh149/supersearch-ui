import React from 'react';
import { Box } from '@mui/material';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`search-tabpanel-${index}`}
    aria-labelledby={`search-tab-${index}`}
  >
    {value === index && (
      <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto' }}>
        {children}
      </Box>
    )}
  </div>
);

export default TabPanel; 