import { useState } from 'react';
import { 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
} from '@mui/material';

// Import components
import TabPanel from './ai_shopping/components/TabPanel';
import ChatTab from './ai_shopping/tabs/ChatTab';
import ConfigureTab from './ai_shopping/tabs/ConfigureTab';
import DemoTab from './ai_shopping/tabs/DemoTab';
import HistoryTab from './ai_shopping/tabs/HistoryTab';
import AnalyticsTab from './ai_shopping/tabs/AnalyticsTab';

export default function AiShopping() {
  const [activeTab, setActiveTab] = useState(0);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      p: { xs: 2, sm: 3 },
    }}>
      <Box sx={{
        maxWidth: {
          xs: '100%',
          sm: '100%',
          md: '1200px',
          lg: '1400px',
        },
        mx: 'auto',
      }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          AI Shopping
        </Typography>
        
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          width: '100%',
          mb: 4,
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                minWidth: 120,
                mx: 1,
                position: 'relative',
              }
            }}
          >
            <Tab 
              label="Chat" 
              id="ai-shopping-tab-0" 
              aria-controls="ai-shopping-tabpanel-0"
            />
            <Tab 
              label="Configure" 
              id="ai-shopping-tab-1" 
              aria-controls="ai-shopping-tabpanel-1"
            />
            <Tab 
              label="Demo" 
              id="ai-shopping-tab-2" 
              aria-controls="ai-shopping-tabpanel-2"
            />
            <Tab 
              label="History" 
              id="ai-shopping-tab-3" 
              aria-controls="ai-shopping-tabpanel-3"
            />
            <Tab 
              label="Analytics" 
              id="ai-shopping-tab-4" 
              aria-controls="ai-shopping-tabpanel-4"
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <ChatTab />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <ConfigureTab />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <DemoTab />
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <HistoryTab />
        </TabPanel>
        
        <TabPanel value={activeTab} index={4}>
          <AnalyticsTab />
        </TabPanel>
      </Box>
    </Box>
  );
} 