import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, useTheme, CircularProgress } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { usePageTransition } from '../../hooks/usePageTransition';

interface LayoutProps {
  children: ReactNode;
  onThemeToggle: () => void;
}

export default function Layout({ children, onThemeToggle }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const theme = useTheme();
  const isLoading = usePageTransition();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        isExpanded={isSidebarOpen} 
        onExpandedChange={toggleSidebar} 
      />
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        bgcolor: 'background.default',
        position: 'relative',
      }}>
        <Box sx={{ mb: 2 }}>
          <Navbar 
            isExpanded={isSidebarOpen}
            isDarkMode={theme.palette.mode === 'dark'}
            onThemeToggle={onThemeToggle}
          />
        </Box>
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            overflowX: 'hidden', 
            overflowY: 'auto',
            bgcolor: 'background.default',
            pt: theme => {
              const minHeight = theme.mixins.toolbar.minHeight;
              return typeof minHeight === 'string' 
                ? `calc(${minHeight} + 12px)`
                : `${minHeight ?? 64 + 12}px`;
            },
            px: {
              xs: 1,  // 16px on mobile
              sm: 2,  // 24px on tablet
              md: 3   // 32px on desktop
            },
            pb: {
              xs: 2,
              sm: 3,
              md: 4
            }
          }}
        >
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </Box>

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <CircularProgress 
                  size={48}
                  sx={{ 
                    color: 'primary.main',
                    filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))'
                  }} 
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
} 