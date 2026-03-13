import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, Paper, Button } from '@mui/material';
import { History as HistoryIcon, Search as SearchIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function HistoryPage() {
  const router = useRouter();
  const [investigations] = useState<Array<{ id: string; query: string; date: string; tools: number }>>([]);

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
          Історія розслідувань
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Перегляд попередніх досліджень та результатів
        </Typography>
      </Box>

      {investigations.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <HistoryIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}>
            Історія порожня
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', mb: 3, display: 'block' }}>
            Запустіть розслідування в Investigation Hub, щоб зберегти історію
          </Typography>
          <Button variant="contained" color="primary" startIcon={<SearchIcon />} onClick={() => router.push('/investigation')}>
            Почати дослідження
          </Button>
        </Paper>
      ) : (
        <List>
          {investigations.map((inv) => (
            <ListItem key={inv.id} component={Paper} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
              <ListItemText
                primary={inv.query}
                secondary={`${inv.tools} інструментів • ${inv.date}`}
                primaryTypographyProps={{ color: '#fff' }}
                secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)' }}
              />
              <Chip label={inv.id.slice(0, 8)} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            </ListItem>
          ))}
        </List>
      )}
    </Layout>
  );
}
