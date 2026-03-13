import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, CircularProgress, Typography } from '@mui/material';

/** Beta: логін не потрібен — редирект на головну */
export default function LoginPage() {
  const router = useRouter();
  const redirect = (router.query.redirect as string) || '/';

  useEffect(() => {
    router.replace(redirect);
  }, [redirect, router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
        bgcolor: '#0a0e17',
      }}
    >
      <CircularProgress sx={{ color: 'primary.main' }} />
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
        Перенаправлення...
      </Typography>
    </Box>
  );
}
