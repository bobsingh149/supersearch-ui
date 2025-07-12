import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Grid,
  Paper,
  alpha,
  useTheme,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import { useLeads } from '../../../hooks/useLeads';

interface ContactUsModalProps {
  open: boolean;
  onClose: () => void;
}

const ContactUsModal: React.FC<ContactUsModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    business_email: '',
    company_name: ''
  });

  const { submitLead, loading, error, success, reset } = useLeads();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (success) {
      handleClose();
      setShowSuccessMessage(true);
    } else if (error) {
      if (error.includes('already exists')) {
        setErrorMessage('Lead with this email already exists');
      } else {
        setErrorMessage(error);
      }
    }
  }, [success, error]);

  const handleClose = () => {
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
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitLead(formData);
    } catch (err: any) {
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
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          py: 2
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Contact CogniShop
          </Typography>
          <IconButton 
            onClick={handleClose}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Grid container>
            {/* Contact Information */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  p: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 0
                }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Get in Touch
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      team@cognishop.co
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  We're here to help you with any questions about CogniShop's AI-powered ecommerce solutions.
                </Typography>
              </Paper>
            </Grid>

            {/* Contact Form */}
            <Grid item xs={12} md={8}>
              <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Send us a Message
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Your Name"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Business Email"
                      name="business_email"
                      type="email"
                      value={formData.business_email}
                      onChange={handleFormChange}
                      required
                      variant="outlined"
                      error={!!errorMessage && errorMessage.toLowerCase().includes('email')}
                      helperText={errorMessage && errorMessage.toLowerCase().includes('email') ? errorMessage : ''}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Company Name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleFormChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
                {errorMessage && !errorMessage.toLowerCase().includes('email') && (
                  <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                    {errorMessage}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleClose}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1
            }}
          >
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>
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