import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';
import type { LoadingButtonProps } from '@mui/lab';
import type { CSSObject } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Extend the Theme type to include custom properties
declare module '@mui/material/styles' {
  interface Palette {
    accent: {
      green: string;
      pink: string;
      violet: string;
      navy: string;
    };
  }
  interface PaletteOptions {
    accent?: {
      green: string;
      pink: string;
      violet: string;
      navy: string;
    };
  }
  interface TypeBackground {
    sidebar: string;
  }
  interface Components {
    MuiLoadingButton: {
      defaultProps?: Partial<LoadingButtonProps>;
      styleOverrides?: {
        root?: CSSObject;
        contained?: CSSObject;
      };
    };
  }
}

const getThemeOptions = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: '#0891b2',  // Muted cyan-blue (Elegant and modern)
      light: '#0ea5e9', // Soft, refined cyan (for hover states)
      dark: '#0369a1',  // Deep cyan-blue (for active states)
      contrastText: '#FAF7F5',
    },    
    secondary: {
      main: '#ec4899',  // Base pink color
      light: '#f472b6', // Lighter pink (for hover states)
      dark: '#be185d', // Darker pink (for active states)
      contrastText: '#FAF7F5',
    },
    accent: {
      green: '#22C55E', // Neon Green
      pink: '#ec4899', // Electric Pink
      violet: '#8b5cf6', // Soft violet - will complement cyan and pink
      navy: '#0f3460', // Navy Blue - professional color for external connectors
    },
    background: mode === 'dark' ? {
      default: '#121212',
      paper: '#1E1E1E',
      sidebar: '#161616',
    } : {
      default: '#F8FAFC',
      paper: '#FFFFFF',
      sidebar: '#F1F5F9',
    },
    text: mode === 'dark' ? {
      primary: '#FAF7F5',
      secondary: '#D6D3D1',
    } : {
      primary: '#121212',
      secondary: '#4B5563',
    },
    error: {
      main: '#DC2626', // Scarlet Red
    },
    warning: {
      main: '#EAB308', // Amber Gold
    },
    success: {
      main: '#16A34A', // Bright Green
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
        contained: {
          backgroundColor: 'primary.dark',
          '&:hover': {
            backgroundColor: 'primary.main',
          },
        },
      },
      defaultProps: {
        disableElevation: true, // Removes default shadow for a more modern look
      },
    },
    MuiLoadingButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
        contained: {
          backgroundColor: 'primary.dark',
          '&:hover': {
            backgroundColor: 'primary.main',
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#0891b2', // primary.main
            },
          },
          '& .MuiInputLabel-root': {
            '&.Mui-focused': {
              color: 'inherit', // This prevents label color change on focus
            },
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&:focus': {
            outline: 'none',
          },
          '&.Mui-focusVisible': {
            outline: 'none',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:focus': {
            outline: 'none',
            backgroundColor: 'transparent',
          },
          '&.Mui-focusVisible': {
            outline: 'none',
            backgroundColor: 'transparent',
          },
        },
      },
    },
  },
});

export const getTheme = (mode: 'light' | 'dark'): Theme => createTheme(getThemeOptions(mode)); 