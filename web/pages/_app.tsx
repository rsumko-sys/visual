import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/print.css';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Layout from '../components/Layout';
import ApiErrorHandler from '../components/ApiErrorHandler';
import AuthGuard from '../components/AuthGuard';
import { AuthProvider } from '../context/auth';
import { GraphEvidenceProvider } from '../context/graphEvidence';

// Design system: 60-30-10, WCAG contrast, 8px baseline
const theme = createTheme({
  palette: {
    primary: {
      main: '#00d4aa',      // Accent 10% — CTA, links
    },
    secondary: {
      main: '#6366f1',      // Secondary accent
    },
    background: {
      default: '#0a0e17',   // 60% — main
      paper: '#111827',      // 30% — surfaces
    },
    text: {
      primary: '#f9fafb',   // Avoid pure white; softer for eyes
      secondary: '#9ca3af',
      disabled: '#6b7280',
    },
    success: { main: '#10b981' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    h1: { fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, lineHeight: 1.25 },
    h3: { fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, lineHeight: 1.3 },
    h4: { fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, lineHeight: 1.35 },
    h5: { fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, lineHeight: 1.4 },
    h6: { fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, lineHeight: 1.45 },
    body1: { lineHeight: 1.5 },
    body2: { lineHeight: 1.5 },
  },
  spacing: 8, // 8px baseline grid
  shape: { borderRadius: 8 },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          minWidth: 44,
          '&.Mui-disabled': { opacity: 1 },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
        },
      },
    },
  },
});

export default function App({ Component, pageProps, router }: AppProps) {
  const isLoginPage = router.route === '/login';
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <GraphEvidenceProvider>
        <AuthGuard>
          {isLoginPage ? <Component {...pageProps} /> : (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          )}
        </AuthGuard>
        </GraphEvidenceProvider>
        <ApiErrorHandler />
      </AuthProvider>
    </ThemeProvider>
    </>
  );
}
