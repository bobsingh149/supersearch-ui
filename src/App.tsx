import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getTheme } from './theme/theme';


// import { ClerkProvider, SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
// import { dark } from '@clerk/themes';
// import Layout from './components/layout/Layout';

// Import pages
// import Dashboard from './pages/Dashboard/Dashboard';
// import Search from './pages/Products/Search';
// import Recommend from './pages/Products/Recommend';
// import AiShopping from './pages/Products/AiShopping';
// import DataSources from './pages/Data/DataSources';
// import GetStarted from './pages/Utility/GetStarted';
// import Settings from './pages/Utility/Settings';
import DemoSiteIndex from './pages/demo_site';

// Replace with your Clerk publishable key
// const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// // SignIn Page Component
// const SignInPage = () => (
//   <div style={{
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: 'translate(-50%, -50%)'
//   }}>
//     <SignIn />
//   </div>
// );

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    // Get initial theme based on system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const theme = getTheme(mode);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setMode(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // const toggleTheme = () => {
  //   setMode(prev => prev === 'light' ? 'dark' : 'light');
  // };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Demo site route - unprotected and outside of ClerkProvider */}
          <Route path="/demo_site/*" element={<DemoSiteIndex />} />
          
          {/* Temporary route to direct all paths to DemoSiteIndex while protected routes are not ready */}
          <Route path="/*" element={<Navigate to="/demo_site" replace />} />
          
          {/* Protected routes inside ClerkProvider - temporarily disabled 
          <Route
            path="/*"
            element={
              <ClerkProvider 
                publishableKey={clerkPubKey}
                appearance={{
                  baseTheme: mode === 'dark' ? dark : undefined,
                  variables: {
                    colorPrimary: theme.palette.primary.main,
                    colorTextOnPrimaryBackground: theme.palette.primary.contrastText,
                  },
                  elements: {
                    card: {
                      boxShadow: theme.shadows[4],
                      borderRadius: '12px',
                    },
                    formButtonPrimary: {
                      backgroundColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                      borderRadius: '8px',
                    },
                    formFieldInput: {
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <>
                  <SignedIn>
                    <Layout onThemeToggle={toggleTheme}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/recommend" element={<Recommend />} />
                        <Route path="/ai-shopping" element={<AiShopping />} />
                        <Route path="/data-sources" element={<DataSources />} />
                        <Route path="/get-started" element={<GetStarted />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Layout>
                  </SignedIn>
                  <SignedOut>
                    <SignInPage />
                  </SignedOut>
                </>
              </ClerkProvider>
            }
          />
          */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
