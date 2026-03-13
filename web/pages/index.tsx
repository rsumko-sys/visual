import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();
  return (
    <Container maxWidth="lg" sx={{ py: 8, px: { xs: 2, sm: 3 }, width: '100%', position: 'relative', zIndex: 2, pointerEvents: 'auto' }}>
      <Box sx={{ mb: 6, maxWidth: 720, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 900, mb: 2, color: 'text.primary', wordBreak: 'break-word' }}>
          OSINT Command Center
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3, wordBreak: 'break-word' }}>
          Набір інструментів розвідки — 150+ OSINT-інструментів
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, wordBreak: 'break-word', maxWidth: '65ch', mx: 'auto' }}>
          Додавайте інструменти, налаштовуйте API-ключі, запускайте розслідування. Все в одному інтерфейсі.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            type="button"
            variant="contained" 
            color="primary" 
            size="large" 
            sx={{ px: 4, py: 1.5, fontWeight: 700, minHeight: 48 }}
            onClick={() => router.push('/tools')}
          >
            Каталог інструментів
          </Button>
          <Button 
            type="button"
            variant="outlined" 
            sx={{ px: 4, py: 1.5, minHeight: 48, borderColor: 'rgba(255,255,255,0.4)', color: 'text.primary' }}
            onClick={() => router.push('/investigation')}
          >
            Почати дослідження
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
