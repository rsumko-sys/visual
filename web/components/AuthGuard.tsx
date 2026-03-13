import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/auth';
import { Box, CircularProgress, Typography } from '@mui/material';

const PROTECTED_ROUTES = ['/investigation', '/history'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, isReady } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isReady || router.route === '/login') return;
    const isProtected = PROTECTED_ROUTES.some((r) => router.pathname.startsWith(r));
    if (isProtected && !token) {
      setRedirecting(true);
      const dest = encodeURIComponent(router.asPath);
      router.replace(`/login?redirect=${dest}`);
    }
  }, [isReady, token, router.pathname, router.asPath, router.route]);

  if (redirecting) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, bgcolor: '#0a0e17' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Перенаправлення на логін...</Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
