import React from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Chip,
  Alert,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import TitleIcon from '@mui/icons-material/Title';
import ImageIcon from '@mui/icons-material/Image';
import { ConfigureTabProps } from '../components/types';

// Updated available fields based on movie database columns
const availableFields = [
  { id: 'id', label: 'ID' },
  { id: 'Release_Date', label: 'Release Date' },
  { id: 'Title', label: 'Title' },
  { id: 'Overview', label: 'Overview' },
  { id: 'Popularity', label: 'Popularity' },
  { id: 'Vote_Count', label: 'Vote Count' },
  { id: 'Vote_Average', label: 'Vote Average' },
  { id: 'Original_Language', label: 'Original Language' },
  { id: 'Genre', label: 'Genre' },
  { id: 'Poster_Url', label: 'Poster URL' }
];

const ConfigureTab = ({
  searchConfig,
  originalConfig,
  loading,
  saveSuccess,
  saveError,
  configError,
  isConfigChanged,
  handleIdFieldChange,
  handleTitleFieldChange,
  handleImageUrlFieldChange,
  handleSearchableAttributesChange,
  handleSaveConfig
}: ConfigureTabProps) => {
  const theme = useTheme();
  
  return (
    <Box>
      <Box sx={{ 
        mb: 4, 
        p: 3, 
        borderRadius: 2,
        background: `linear-gradient(145deg, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <SettingsIcon color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h6" fontWeight="medium" sx={{ mb: 0.5 }}>
            Configure Search Engine
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define how your search engine indexes and retrieves product data
          </Typography>
        </Box>
      </Box>
      
      {saveSuccess && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`
          }}
        >
          Search configuration saved successfully!
        </Alert>
      )}
      
      {saveError && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`
          }}
        >
          {saveError}
        </Alert>
      )}
      
      {configError && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`
          }}
        >
          {configError}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FingerprintIcon sx={{ color: theme.palette.primary.main, mr: 1.5 }} />
                Identifier Field
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose a unique identifier for your products.
              </Typography>
              
              <Autocomplete
                options={availableFields.map(field => field.id)}
                getOptionLabel={(option) => {
                  const field = availableFields.find(f => f.id === option);
                  return field ? `${field.label}` : option;
                }}
                value={searchConfig.id_field || null}
                onChange={(_, newValue) => handleIdFieldChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Choose a unique identifier"
                    variant="outlined"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const field = availableFields.find(f => f.id === option);
                  return (
                    <li {...props}>
                      <Box sx={{ py: 0.5 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {field?.label}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
              />
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TitleIcon sx={{ color: theme.palette.primary.main, mr: 1.5 }} />
                Title Field
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose a field to use as the display title for search results.
              </Typography>
              
              <Autocomplete
                options={availableFields.map(field => field.id)}
                getOptionLabel={(option) => {
                  const field = availableFields.find(f => f.id === option);
                  return field ? `${field.label}` : option;
                }}
                value={searchConfig.title_field || null}
                onChange={(_, newValue) => handleTitleFieldChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Choose a display title"
                    variant="outlined"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const field = availableFields.find(f => f.id === option);
                  return (
                    <li {...props}>
                      <Box sx={{ py: 0.5 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {field?.label}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
              />
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ImageIcon sx={{ color: theme.palette.primary.main, mr: 1.5 }} />
                Image URL Field
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose a field to use as the image URL for search results.
              </Typography>
              
              <Autocomplete
                options={availableFields.map(field => field.id)}
                getOptionLabel={(option) => {
                  const field = availableFields.find(f => f.id === option);
                  return field ? `${field.label}` : option;
                }}
                value={searchConfig.image_url_field || null}
                onChange={(_, newValue) => handleImageUrlFieldChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Choose an image URL field"
                    variant="outlined"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const field = availableFields.find(f => f.id === option);
                  return (
                    <li {...props}>
                      <Box sx={{ py: 0.5 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {field?.label}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SearchIcon sx={{ color: theme.palette.primary.main, mr: 1.5 }} />
              Searchable Attributes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select fields that will be searched when a query is performed.
            </Typography>
            
            <Autocomplete
              multiple
              options={availableFields.map(field => field.id)}
              getOptionLabel={(option) => {
                const field = availableFields.find(f => f.id === option);
                return field ? `${field.label}` : option;
              }}
              value={searchConfig.searchable_attribute_fields}
              onChange={(_, newValue) => handleSearchableAttributesChange(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Choose fields to search"
                  variant="outlined"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: theme.palette.primary.main,
                    },
                  }}
                />
              )}
              renderOption={(props, option) => {
                const field = availableFields.find(f => f.id === option);
                return (
                  <li {...props}>
                    <Box sx={{ py: 0.5 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {field?.label}
                      </Typography>
                    </Box>
                  </li>
                );
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const field = availableFields.find(f => f.id === option);
                  return (
                    <Chip
                      label={field?.label || option}
                      {...getTagProps({ index })}
                      key={option}
                      sx={{ 
                        borderRadius: '6px',
                        '& .MuiChip-deleteIcon': {
                          color: alpha(theme.palette.text.primary, 0.5),
                          '&:hover': {
                            color: theme.palette.text.primary
                          }
                        }
                      }}
                    />
                  );
                })
              }
            />
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            mt: 2
          }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveConfig}
              disabled={
                loading || 
                !isConfigChanged || 
                !searchConfig.id_field || 
                !searchConfig.title_field || 
                !searchConfig.image_url_field ||
                searchConfig.searchable_attribute_fields.length === 0
              }
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ 
                px: 3,
                py: 1,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                '&:hover': {
                  boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
                }
              }}
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ConfigureTab; 