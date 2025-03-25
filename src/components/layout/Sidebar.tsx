import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Box,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  LayoutDashboard,
  Search,
  ShoppingBag,
  Brain,
  Database,
  Rocket,
  Settings,
  ChevronLeft,
  ChevronRight,
  LineChart,
  Sparkles,
  Store,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const drawerWidth = 240;

// Menu items configuration
const mainMenuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
];

const productMenuItems = [
  { title: 'Search', icon: Search, path: '/search' },
  { title: 'Autocomplete', icon: Sparkles, path: '/autocomplete' },
  { title: 'Recommend', icon: Brain, path: '/recommend' },
  { title: 'AI Shopping', icon: ShoppingBag, path: '/ai-shopping' },
];

const dataMenuItems = [
  { title: 'Data Sources', icon: Database, path: '/data-sources' },
  { title: 'Analytics', icon: LineChart, path: '/analytics' },
];

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  onClick?: () => void;
  isExternal?: boolean;
}

interface SectionHeaderProps {
  title: string;
  isExpanded: boolean;
}

const SectionHeader = ({ title, isExpanded }: SectionHeaderProps) => (
  isExpanded && (
    <Typography
      variant="caption"
      sx={{
        px: 3,
        pt: 2,
        pb: 1,
        color: 'text.secondary',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontSize: '0.75rem',
        display: 'block',
      }}
    >
      {title}
    </Typography>
  )
);

interface SidebarProps {
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export default function Sidebar({ isExpanded, onExpandedChange }: SidebarProps) {
  const location = useLocation();

  const utilityMenuItems: MenuItem[] = [
    { 
      title: 'Demo Shop', 
      icon: Store, 
      onClick: () => window.open('/demo_site', '_blank', 'noopener,noreferrer'),
      isExternal: true
    },
    { title: 'Get Started', icon: Rocket, path: '/get-started' },
    { title: 'Settings', icon: Settings, path: '/settings' },
  ];

  const renderMenuItems = (items: MenuItem[]) => (
    items.map((item) => {
      const selected = !item.isExternal && location.pathname === item.path;
      
      const listItemButton = (
        <ListItemButton
          key={item.title}
          onClick={item.onClick}
          component={item.path && !item.isExternal ? Link : 'button'}
          to={item.path && !item.isExternal ? item.path : undefined}
          sx={{
            minHeight: 48,
            justifyContent: isExpanded ? 'initial' : 'center',
            px: 2.5,
            position: 'relative',
            bgcolor: selected ? 'background.default' : 'transparent',
            '&:before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              bgcolor: 'primary.main',
              transition: theme => theme.transitions.create(['transform', 'opacity'], {
                duration: theme.transitions.duration.shorter,
              }),
              transform: selected ? 'scaleY(1)' : 'scaleY(0)',
              opacity: selected ? 1 : 0,
            },
            '&:hover': {
              bgcolor: 'background.default',
              '& .sidebar-icon svg': {
                transform: 'translateX(4px)',
              },
            },
          }}
        >
          <ListItemIcon
            className="sidebar-icon"
            sx={{
              minWidth: 0,
              mr: isExpanded ? 3 : 'auto',
              justifyContent: 'center',
              color: selected ? 'primary.main' : 'text.primary',
              '& svg': {
                transition: theme => theme.transitions.create(['transform'], {
                  duration: theme.transitions.duration.shorter,
                }),
              },
            }}
          >
            <item.icon size={20} strokeWidth={1.75} />
          </ListItemIcon>
          {isExpanded && (
            <ListItemText 
              primary={item.title}
              sx={{
                '& .MuiTypography-root': {
                  color: selected ? 'primary.main' : 'text.primary',
                  fontWeight: selected ? 600 : 400,
                },
              }} 
            />
          )}
          {item.isExternal && isExpanded && (
            <Box 
              component="span" 
              sx={{ 
                ml: 1, 
                width: 16, 
                height: 16, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '4px',
                p: 0.25
              }}
            >
              ↗
            </Box>
          )}
        </ListItemButton>
      );

      return !isExpanded ? (
        <Tooltip 
          key={item.title}
          title={item.isExternal ? `${item.title} (opens in new tab)` : item.title} 
          placement="right"
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: 2,
                fontSize: '0.95rem',
                fontWeight: 500,
                padding: '8px 12px',
                borderRadius: 1,
                '& .MuiTooltip-arrow': {
                  color: 'background.paper',
                },
              },
            },
          }}
        >
          {listItemButton}
        </Tooltip>
      ) : (
        listItemButton
      );
    })
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isExpanded ? drawerWidth : 65,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isExpanded ? drawerWidth : 65,
          boxSizing: 'border-box',
          transition: theme => theme.transitions.create(['width', 'background-color'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
          bgcolor: 'background.sidebar',
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center' }}>
        {isExpanded && (
          <Typography
            variant="h6"
            sx={{
              background: theme => `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
            }}
          >
            CogniShop
          </Typography>
        )}
        <IconButton
          onClick={() => onExpandedChange(!isExpanded)}
          sx={{
            '&:focus': {
              outline: 'none',
            },
            '&.Mui-focusVisible': {
              outline: 'none',
            }
          }}
        >
          {isExpanded ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </Box>

      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)',
          borderRadius: '4px',
          border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'}`,
        },
        '&:hover::-webkit-scrollbar-thumb': {
          background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)',
        }
      }}>
        <List>
          {renderMenuItems(mainMenuItems)}
        </List>

        <SectionHeader title="Products" isExpanded={isExpanded} />
        <List>
          {renderMenuItems(productMenuItems)}
        </List>

        <Box sx={{ mt: 2 }}>
          <SectionHeader title="Data" isExpanded={isExpanded} />
          <List>
            {renderMenuItems(dataMenuItems)}
          </List>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ my: 2, mx: 2, borderTop: 1, borderColor: 'divider' }} />

        <List sx={{ pb: 2 }}>
          {renderMenuItems(utilityMenuItems)}
        </List>
      </Box>
    </Drawer>
  );
} 