import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar,
  Box,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Chip,
  Tooltip,
  Dialog,
  DialogContent,
} from '@mui/material';
import { 
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { ChevronDown, Users, MessageSquare, HelpCircle, SunMedium, Moon, UserCog } from 'lucide-react';
import { useState, useEffect } from 'react';
import useOrganizationStore from '../../store/organizationStore';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser, SignOutButton, UserProfile } from '@clerk/clerk-react';

interface NavbarProps {
  isExpanded: boolean;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export default function Navbar({ isExpanded, isDarkMode, onThemeToggle }: NavbarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [orgAnchorEl, setOrgAnchorEl] = useState<null | HTMLElement>(null);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const drawerWidth = 240;
  const { user } = useUser();

  const { 
    organizations, 
    setCurrentOrganization, 
    initializeStore 
  } = useOrganizationStore();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const currentOrg = organizations.find(org => org.current) || organizations[0];

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOrgMenu = (event: React.MouseEvent<HTMLElement>) => {
    setOrgAnchorEl(event.currentTarget);
  };

  const handleOrgClose = (orgId: number | null = null) => {
    if (orgId) {
      setCurrentOrganization(orgId);
    }
    setOrgAnchorEl(null);
  };

  const getOrgInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (seed: string) => {
    const colors = [
      '#FFB5B5', '#FFD1B5', '#FFEAB5', '#B5FFB5', 
      '#B5FFEA', '#B5D1FF', '#EAB5FF', '#FFB5EA'
    ];
    return colors[seed.charCodeAt(0) % colors.length];
  };

  const handleOpenUserProfile = () => {
    setUserProfileOpen(true);
    handleClose();
  };

  const handleCloseUserProfile = () => {
    setUserProfileOpen(false);
  };

  const getUserInitials = () => {
    if (!user) return '';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    } else if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    } else {
      return 'U';
    }
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={1}
      sx={{
        width: `calc(100% - ${isExpanded ? drawerWidth : 65}px)`,
        ml: `${isExpanded ? drawerWidth : 65}px`,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            onClick={handleOrgMenu}
            endIcon={
              <ChevronDown 
                size={18}
                style={{ 
                  strokeWidth: 1.5,
                  color: 'currentColor',
                  opacity: 0.6,
                  transform: orgAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease-in-out',
                }}
              />
            }
            sx={{ 
              color: theme => theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.95)' 
                : 'rgba(0, 0, 0, 0.95)',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem',
              height: 40,
              '&:hover': {
                backgroundColor: theme => theme.palette.mode === 'dark' 
                  ? 'transparent'
                  : 'action.hover',
                '& .MuiButton-endIcon': {
                  opacity: 0.9,
                }
              },
              '&:focus': {
                outline: 'none',
                backgroundColor: 'transparent',
              },
              '&.Mui-focusVisible': {
                outline: 'none',
                backgroundColor: 'transparent',
              },
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              pr: 1,
            }}
          >
            <Avatar
              variant="rounded"
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.875rem',
                fontWeight: 600,
                bgcolor: getRandomColor(currentOrg?.name || ''),
                color: 'black',
              }}
            >
              {getOrgInitials(currentOrg?.name || '')}
            </Avatar>
            {currentOrg?.name}
          </Button>

          <Menu
            anchorEl={orgAnchorEl}
            open={Boolean(orgAnchorEl)}
            onClose={() => handleOrgClose()}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              elevation: 4,
              sx: {
                width: 380,
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                boxShadow: theme => `0 4px 20px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'}`,
                mt: 1,
              }
            }}
          >
            <Box sx={{ p: 2, pb: 1.5 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ 
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  mb: 1
                }}
              >
                Select Organization
              </Typography>
            </Box>
            {organizations.map((org) => (
              <MenuItem 
                key={org.id}
                onClick={() => handleOrgClose(org.id)}
                sx={{ 
                  py: 1.5,
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  bgcolor: org.current ? 'action.selected' : 'transparent',
                  '&:hover': {
                    backgroundColor: org.current 
                      ? 'action.selected'
                      : 'action.hover',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      bgcolor: getRandomColor(org.name),
                      color: 'black',
                    }}
                  >
                    {getOrgInitials(org.name)}
                  </Avatar>
                  <Typography sx={{ fontWeight: 500 }}>{org.name}</Typography>
                </Box>
                {org.current && (
                  <Chip 
                    label="Current"
                    size="small"
                    sx={{ 
                      bgcolor: theme => theme.palette.mode === 'dark' 
                        ? 'grey.800'
                        : 'grey.100',
                      color: theme => theme.palette.mode === 'dark'
                        ? 'grey.400'
                        : 'grey.700',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      height: 24,
                      borderRadius: 1,
                    }}
                  />
                )}
              </MenuItem>
            ))}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ 
              px: 1.5, 
              py: 1.5, 
              display: 'flex', 
              gap: 1,
              justifyContent: 'space-between'
            }}>
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleOrgClose()}
                variant="text"
                sx={{ 
                  color: 'primary.main',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                Create Organization
              </Button>
              <Button
                onClick={() => handleOrgClose()}
                variant="outlined"
                sx={{ 
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    borderColor: 'text.secondary',
                  }
                }}
              >
                See All
              </Button>
            </Box>
          </Menu>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 0.5,
        }}>
          <Tooltip
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
            arrow
          >
            <IconButton
              onClick={onThemeToggle}
              size="large"
              sx={{ 
                color: 'text.primary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              {isDarkMode ? (
                <SunMedium size={22} strokeWidth={1.5} />
              ) : (
                <Moon size={22} strokeWidth={1.5} />
              )}
            </IconButton>
          </Tooltip>
          
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="contained" color="primary">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <IconButton
              size="large"
              onClick={handleMenu}
              sx={{ 
                color: 'text.primary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.main',
                  width: 32,
                  height: 32,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
                src={user?.imageUrl}
              >
                {getUserInitials()}
              </Avatar>
              <ChevronDown 
                size={14}
                style={{ 
                  strokeWidth: 2,
                  color: 'currentColor',
                  opacity: 0.5,
                  transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease-in-out',
                }}
              />
            </IconButton>
          </SignedIn>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            elevation: 4,
            sx: {
              width: 320,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              boxShadow: theme => `0 4px 20px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'}`,
              mt: 1,
              '& .MuiMenuItem-root': {
                py: 1.5,
                px: 2,
              }
            }
          }}
        >
          <Box sx={{ 
            p: 2, 
            pb: 1.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            <Avatar 
              sx={{ 
                width: 56,
                height: 56,
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
                fontWeight: 600,
                mb: 1.5,
              }}
              src={user?.imageUrl}
            >
              {getUserInitials()}
            </Avatar>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: 600,
              mb: 0.5,
            }}>
              {user?.fullName || user?.username || 'User'}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              {user?.primaryEmailAddress?.emailAddress || ''}
            </Typography>
            <Chip
              label={user?.publicMetadata?.role as string || 'User'}
              size="small"
              sx={{ 
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                fontWeight: 500,
                fontSize: '0.75rem',
                height: 20,
              }}
            />
          </Box>
          <Divider />
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <SettingsIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Settings"
              secondary="Account preferences and settings"
              secondaryTypographyProps={{ 
                variant: 'caption',
                sx: { mt: 0.5 }
              }}
            />
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <Users size={20} strokeWidth={1.75} />
            </ListItemIcon>
            <ListItemText 
              primary="Invite Team"
              secondary="Add members to your organization"
              secondaryTypographyProps={{ 
                variant: 'caption',
                sx: { mt: 0.5 }
              }}
            />
          </MenuItem>
          <MenuItem onClick={handleOpenUserProfile}>
            <ListItemIcon>
              <UserCog size={20} strokeWidth={1.75} />
            </ListItemIcon>
            <ListItemText 
              primary="Manage Account"
              secondary="Update your profile and preferences"
              secondaryTypographyProps={{ 
                variant: 'caption',
                sx: { mt: 0.5 }
              }}
            />
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <HelpCircle size={20} strokeWidth={1.75} />
            </ListItemIcon>
            <ListItemText 
              primary="Support"
              secondary="Get help from our support team"
              secondaryTypographyProps={{ 
                variant: 'caption',
                sx: { mt: 0.5 }
              }}
            />
          </MenuItem>
          <Divider />
          <SignOutButton>
            <MenuItem 
              sx={{ 
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.lighter',
                }
              }}
            >
              <ListItemIcon>
                <LogoutIcon sx={{ fontSize: 20, color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </SignOutButton>
        </Menu>

        <Dialog 
          open={userProfileOpen} 
          onClose={handleCloseUserProfile}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              overflow: 'hidden',
              height: '90vh',
              maxHeight: '90vh',
            }
          }}
        >
          <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
            <Box sx={{ 
              height: '100%', 
              width: '100%', 
              display: 'flex',
              '& > *': { 
                width: '100%', 
                height: '100%',
                overflow: 'auto'
              } 
            }}>
              <UserProfile />
            </Box>
          </DialogContent>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
} 