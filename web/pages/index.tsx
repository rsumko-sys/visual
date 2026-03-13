import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();
  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: '#fff' }}>
          OSINT Command Center
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
          Набір інструментів розвідки — 150+ OSINT-інструментів
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)', mb: 4 }}>
          Додавайте інструменти, налаштовуйте API-ключі, запускайте розслідування. Все в одному інтерфейсі.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            sx={{ px: 4, py: 1.5, fontWeight: 700 }}
            onClick={() => router.push('/tools')}
          >
            Каталог інструментів
          </Button>
          <Button 
            variant="outlined" 
            sx={{ px: 4, py: 1.5, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
            onClick={() => router.push('/investigation')}
          >
            Почати дослідження
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
