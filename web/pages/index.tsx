import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();
  return (
    <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, color: 'primary.main' }}>
          OSINT Platform 2026
        </Typography>
        <Typography variant="h5" sx={{ color: 'rgba(0,0,0,0.7)', mb: 3 }}>
          Гібридна платформа для багатовекторного OSINT-аналізу з ланцюжком інструментів
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(0,0,0,0.5)', mb: 4 }}>
          Додавайте інструменти, налаштовуйте API-ключі, запускайте розслідування та експортуйте результати. Все — в одному сучасному інтерфейсі.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          sx={{ px: 6, py: 2, fontWeight: 700, fontSize: 20 }}
          onClick={() => router.push('/investigation')}
        >
          Почати дослідження
        </Button>
      </Box>
    </Container>
  );
}
