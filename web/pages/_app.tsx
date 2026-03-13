import type { AppProps } from 'next/app';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Layout from '../components/Layout';
import ApiErrorHandler from '../components/ApiErrorHandler';
import { AuthProvider } from '../context/auth';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196F3',
    },
    secondary: {
      main: '#FF6B6B',
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <ApiErrorHandler />
      </AuthProvider>
    </ThemeProvider>
  );
}
