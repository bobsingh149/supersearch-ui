import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Chip,
  Autocomplete,
  useTheme
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';

// Interface for AI Shopping configuration
interface AiShoppingConfig {
  enabled: boolean;
  model: string;
  temperature: number;
  max_tokens: number;
  product_fields: string[];
  custom_instructions: string;
}

const ConfigureTab: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isConfigChanged, setIsConfigChanged] = useState(false);
  
  // AI Shopping configuration state
  const [config, setConfig] = useState<AiShoppingConfig>({
    enabled: true,
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 1000,
    product_fields: ['name', 'description', 'price', 'category', 'brand'],
    custom_instructions: 'Help users find products that match their needs and preferences.'
  });
  
  // Original configuration to compare against for changes
  const [originalConfig, setOriginalConfig] = useState<AiShoppingConfig>({
    enabled: true,
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 1000,
    product_fields: ['name', 'description', 'price', 'category', 'brand'],
    custom_instructions: 'Help users find products that match their needs and preferences.'
  });

  // Available models
  const availableModels = [
    { label: 'GPT-4', value: 'gpt-4' },
    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
    { label: 'Claude 3 Opus', value: 'claude-3-opus' },
    { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet' }
  ];

  // Available product fields
  const availableProductFields = [
    'name', 'title', 'description', 'price', 'sale_price', 'category', 
    'subcategory', 'brand', 'color', 'size', 'material', 'features', 
    'specifications', 'sku', 'stock', 'rating', 'reviews', 'image_url'
  ];

  // Load configuration
  const loadConfig = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would fetch from an API
      // const response = await api.getAiShoppingConfig();
      // setConfig(response);
      // setOriginalConfig(response);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading AI Shopping configuration:', error);
      setSaveError('Failed to load configuration. Please try again.');
      setLoading(false);
    }
  };

  // Save configuration
  const saveConfig = async () => {
    setLoading(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would save to an API
      // await api.saveAiShoppingConfig(config);
      
      setOriginalConfig({...config});
      setIsConfigChanged(false);
      setSaveSuccess(true);
      setLoading(false);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving AI Shopping configuration:', error);
      setSaveError('Failed to save configuration. Please try again.');
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleChange = (field: keyof AiShoppingConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Load configuration on component mount
  useEffect(() => {
    loadConfig();
  }, []);

  // Check if configuration has changed
  useEffect(() => {
    const hasChanged = 
      config.enabled !== originalConfig.enabled ||
      config.model !== originalConfig.model ||
      config.temperature !== originalConfig.temperature ||
      config.max_tokens !== originalConfig.max_tokens ||
      JSON.stringify(config.product_fields) !== JSON.stringify(originalConfig.product_fields) ||
      config.custom_instructions !== originalConfig.custom_instructions;
    
    setIsConfigChanged(hasChanged);
  }, [config, originalConfig]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Configure AI Shopping Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Customize how the AI shopping assistant works and what product information it can access.
        </Typography>
      </Box>
      
      <Box sx={{ 
        bgcolor: 'background.paper', 
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          alignItems: 'center', 
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            AI Shopping Configuration
          </Typography>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Configuration saved successfully!
            </Alert>
          )}
          
          {saveError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {saveError}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Enable/Disable AI Shopping */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">AI Shopping Status</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enabled}
                        onChange={(e) => handleChange('enabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={config.enabled ? 'Enabled' : 'Disabled'}
                  />
                </FormGroup>
              </FormControl>
            </Grid>
            
            {/* Model Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <FormLabel component="legend" sx={{ mb: 1 }}>AI Model</FormLabel>
                <Autocomplete
                  options={availableModels}
                  getOptionLabel={(option) => option.label}
                  value={availableModels.find(m => m.value === config.model) || null}
                  onChange={(_, newValue) => {
                    handleChange('model', newValue?.value || 'gpt-4');
                  }}
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" placeholder="Select AI model" />
                  )}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            
            {/* Temperature */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <FormLabel component="legend" sx={{ mb: 1 }}>Temperature</FormLabel>
                <TextField
                  type="number"
                  value={config.temperature}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  inputProps={{ min: 0, max: 2, step: 0.1 }}
                  variant="outlined"
                  disabled={loading}
                  helperText="Controls randomness (0-2). Lower values are more deterministic."
                />
              </FormControl>
            </Grid>
            
            {/* Max Tokens */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <FormLabel component="legend" sx={{ mb: 1 }}>Max Tokens</FormLabel>
                <TextField
                  type="number"
                  value={config.max_tokens}
                  onChange={(e) => handleChange('max_tokens', parseInt(e.target.value))}
                  inputProps={{ min: 100, max: 4000, step: 100 }}
                  variant="outlined"
                  disabled={loading}
                  helperText="Maximum length of AI responses"
                />
              </FormControl>
            </Grid>
            
            {/* Product Fields */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <FormLabel component="legend" sx={{ mb: 1 }}>Product Fields to Include</FormLabel>
                <Autocomplete
                  multiple
                  options={availableProductFields}
                  value={config.product_fields}
                  onChange={(_, newValue) => {
                    handleChange('product_fields', newValue);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" placeholder="Select product fields" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ))
                  }
                  disabled={loading}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Select the product fields that should be included in AI responses
                </Typography>
              </FormControl>
            </Grid>
            
            {/* Custom Instructions */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <FormLabel component="legend" sx={{ mb: 1 }}>Custom Instructions</FormLabel>
                <TextField
                  multiline
                  rows={4}
                  value={config.custom_instructions}
                  onChange={(e) => handleChange('custom_instructions', e.target.value)}
                  variant="outlined"
                  disabled={loading}
                  placeholder="Enter custom instructions for the AI shopping assistant"
                  helperText="Instructions to guide the AI's behavior when helping shoppers"
                />
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={saveConfig}
              disabled={loading || !isConfigChanged}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2
              }}
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ConfigureTab; 