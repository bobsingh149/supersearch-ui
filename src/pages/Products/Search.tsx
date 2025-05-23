import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
} from '@mui/material';
import { useSearchConfig, SearchConfig } from '../../hooks/useSearchConfig';

// Import components from search directory
import TabPanel from './search/components/TabPanel';
import BrowseTab from './search/tabs/BrowseTab';
import ConfigureTab from './search/tabs/ConfigureTab';
import RulesTab from './search/tabs/RulesTab';
import ReRankingTab from './search/tabs/ReRankingTab';
import DemoTab from './search/tabs/DemoTab';

export default function Search() {
  const [activeTab, setActiveTab] = useState(0);
  const [isConfigChanged, setIsConfigChanged] = useState(false);
  
  // Use the custom hook for search configuration
  const { 
    loading, 
    saveSuccess, 
    saveError, 
    configError,
    loadSearchConfig,
    saveSearchConfig
  } = useSearchConfig();
  
  // Search configuration state
  const [searchConfig, setSearchConfig] = useState<SearchConfig>({
    id_field: '',
    title_field: '',
    image_url_field: '',
    searchable_attribute_fields: []
  });
  
  // Original configuration to compare against for changes
  const [originalConfig, setOriginalConfig] = useState<SearchConfig>({
    id_field: '',
    title_field: '',
    image_url_field: '',
    searchable_attribute_fields: []
  });
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Load search configuration when Configure tab is selected
  useEffect(() => {
    if (activeTab === 1) { // Configure tab
      fetchSearchConfig();
    }
  }, [activeTab]);
  
  // Fetch search configuration using the custom hook
  const fetchSearchConfig = async () => {
    try {
      const config = await loadSearchConfig();
      setSearchConfig(config);
      setOriginalConfig(config); // Store original config for comparison
    } catch (error) {
      // Error is already handled in the hook
      // Reset original config to empty state if needed
      setOriginalConfig({
        id_field: '',
        title_field: '',
        image_url_field: '',
        searchable_attribute_fields: []
      });
    }
  };
  
  // Check if configuration has changed
  useEffect(() => {
    // Compare current config with original config
    const hasChanged = 
      searchConfig.id_field !== originalConfig.id_field ||
      searchConfig.title_field !== originalConfig.title_field ||
      searchConfig.image_url_field !== originalConfig.image_url_field ||
      JSON.stringify(searchConfig.searchable_attribute_fields) !== 
      JSON.stringify(originalConfig.searchable_attribute_fields) ||
      JSON.stringify(searchConfig.filter_fields) !== 
      JSON.stringify(originalConfig.filter_fields) ||
      JSON.stringify(searchConfig.sortable_fields) !== 
      JSON.stringify(originalConfig.sortable_fields);
    
    setIsConfigChanged(hasChanged);
  }, [searchConfig, originalConfig]);
  
  // Handle ID field change
  const handleIdFieldChange = (value: string | null) => {
    setSearchConfig(prev => ({
      ...prev,
      id_field: value || ''
    }));
  };
  
  // Handle title field change
  const handleTitleFieldChange = (value: string | null) => {
    setSearchConfig(prev => ({
      ...prev,
      title_field: value || ''
    }));
  };
  
  // Handle image URL field change
  const handleImageUrlFieldChange = (value: string | null) => {
    setSearchConfig(prev => ({
      ...prev,
      image_url_field: value || ''
    }));
  };
  
  // Handle searchable attributes change
  const handleSearchableAttributesChange = (value: string[]) => {
    setSearchConfig(prev => ({
      ...prev,
      searchable_attribute_fields: value
    }));
  };
  
  // Handle filter fields change
  const handleFilterFieldsChange = (value: string[]) => {
    setSearchConfig(prev => ({
      ...prev,
      filter_fields: value
    }));
  };
  
  // Handle sortable fields change
  const handleSortableFieldsChange = (value: string[]) => {
    setSearchConfig(prev => ({
      ...prev,
      sortable_fields: value
    }));
  };
  
  // Save search configuration
  const handleSaveConfig = async () => {
    const success = await saveSearchConfig(searchConfig);
    if (success) {
      // Update the original config to match the current config
      setOriginalConfig({...searchConfig});
    }
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Heading */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h4" fontWeight="medium" sx={{ mb: 1 }}>
          Search
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure and manage your search engine settings
        </Typography>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="search tabs"
          sx={{ 
            px: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
              minWidth: 'auto',
              px: 3,
              py: 2,
              mr: 3,
              borderRadius: '4px 4px 0 0',
              position: 'relative',
              '&:hover': {
                '&::after': {
                  width: '100%',
                },
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '0%',
                height: '3px',
                backgroundColor: 'primary.main',
                transition: 'width 0.3s ease',
              },
              '&:focus': {
                outline: 'none',
              },
              '&.Mui-focusVisible': {
                outline: 'none',
              },
              '&.Mui-selected': {
                color: 'text.primary',
                fontWeight: 600,
                '&::after': {
                  width: '100%',
                }
              }
            },
            '& .MuiTabs-indicator': {
              height: 0 // Hide the default indicator since we're using our custom underline
            }
          }}
        >
          <Tab label="Browse" />
          <Tab label="Configure" />
          <Tab label="Rules" />
          <Tab label="Re-Ranking" />
          <Tab label="Demo" />
        </Tabs>
      </Box>
      
      <TabPanel value={activeTab} index={0}>
        <BrowseTab />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <ConfigureTab 
          searchConfig={searchConfig}
          originalConfig={originalConfig}
          loading={loading}
          saveSuccess={saveSuccess}
          saveError={saveError}
          configError={configError}
          isConfigChanged={isConfigChanged}
          handleIdFieldChange={handleIdFieldChange}
          handleTitleFieldChange={handleTitleFieldChange}
          handleImageUrlFieldChange={handleImageUrlFieldChange}
          handleSearchableAttributesChange={handleSearchableAttributesChange}
          handleFilterFieldsChange={handleFilterFieldsChange}
          handleSortableFieldsChange={handleSortableFieldsChange}
          handleSaveConfig={handleSaveConfig}
        />
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        <RulesTab />
      </TabPanel>
      
      <TabPanel value={activeTab} index={3}>
        <ReRankingTab />
      </TabPanel>
      
      <TabPanel value={activeTab} index={4}>
        <DemoTab />
      </TabPanel>
    </Box>
  );
} 