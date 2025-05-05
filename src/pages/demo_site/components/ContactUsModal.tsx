import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  alpha,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert
} from '@mui/material';
import { useLeads } from '../../../hooks/useLeads';

interface ContactUsModalProps {
  open: boolean;
  onClose: () => void;
}

const ContactUsModal: React.FC<ContactUsModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    name: '',
    business_email: '',
    company_name: ''
  });

  const { submitLead, loading, error, success, reset } = useLeads();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Log when open state changes
  useEffect(() => {
    console.log('ContactUsModal: open state changed to', open);
  }, [open]);

  // Handle success or error from API
  useEffect(() => {
    if (success) {
      // Close modal and show success message
      handleClose();
      setShowSuccessMessage(true);
    } else if (error) {
      // Extract specific error message
      if (error.includes('already exists')) {
        setErrorMessage('Lead with this email already exists');
      } else {
        setErrorMessage(error);
      }
    }
  }, [success, error]);

  const handleClose = () => {
    console.log('ContactUsModal: handleClose called');
    setFormData({
      name: '',
      business_email: '',
      company_name: ''
    });
    setErrorMessage(null);
    reset();
    onClose();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('ContactUsModal: submitting form', formData);
    try {
      await submitLead(formData);
    } catch (err: any) {
      // If there's an error response with a detail field
      if (err?.response?.data?.detail) {
        setErrorMessage(err.response.data.detail);
      }
    }
  };

  const handleCloseSuccessMessage = () => {
    setShowSuccessMessage(false);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="contact-form-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 450 },
          bgcolor: 'background.paper',
          boxShadow: 24,
          borderRadius: 3,
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            bgcolor: 'primary.main', 
            py: 2, 
            px: 3,
            color: 'white',
            background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              Contact Us
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
              Tell us about your needs and we'll get back to you
            </Typography>
          </Box>
          
          <Box sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  required
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  variant="outlined"
                  InputProps={{
                    sx: { borderRadius: 1.5 }
                  }}
                  error={!!errorMessage && errorMessage.toLowerCase().includes('name')}
                />
                <TextField
                  required
                  fullWidth
                  label="Business Email"
                  name="business_email"
                  type="email"
                  value={formData.business_email}
                  onChange={handleFormChange}
                  variant="outlined"
                  InputProps={{
                    sx: { borderRadius: 1.5 }
                  }}
                  error={!!errorMessage && errorMessage.toLowerCase().includes('email')}
                  helperText={errorMessage && errorMessage.toLowerCase().includes('email') ? errorMessage : ''}
                />
                <TextField
                  required
                  fullWidth
                  label="Company Name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleFormChange}
                  variant="outlined"
                  InputProps={{
                    sx: { borderRadius: 1.5 }
                  }}
                  error={!!errorMessage && errorMessage.toLowerCase().includes('company')}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleClose}
                    sx={{ 
                      flex: 1,
                      py: isMobile ? 1 : 1.2,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ 
                      flex: 1,
                      py: isMobile ? 1 : 1.2,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 500,
                      background: `linear-gradient(to right, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.dark, 0.9)})`,
                      boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.25)}`,
                      '&:hover': {
                        boxShadow: `0 6px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                        background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Submit'}
                  </Button>
                </Box>

                {errorMessage && !errorMessage.toLowerCase().includes('email') && (
                  <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                    {errorMessage}
                  </Typography>
                )}
              </Stack>
            </form>
          </Box>
        </Box>
      </Modal>

      {/* Success message snackbar */}
      <Snackbar 
        open={showSuccessMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseSuccessMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccessMessage} severity="success" sx={{ width: '100%' }}>
          Thank you for contacting us! We'll get back to you soon.
        </Alert>
      </Snackbar>
    </>
  );
};

export default ContactUsModal;
