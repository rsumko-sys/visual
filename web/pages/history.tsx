import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, Paper, Button, CircularProgress } from '@mui/material';
import { History as HistoryIcon, Search as SearchIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/auth';
import api from '../lib/api';

interface InvItem {
  id: string;
  title: string;
  target_identifier: string;
  status: string;
  created_at: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [investigations, setInvestigations] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setInvestigations([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.get<InvItem[]>('/investigations/')
      .then((res) => { if (!cancelled) setInvestigations(res.data || []); })
      .catch(() => { if (!cancelled) setError('Не вдалося завантажити історію'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

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

      {loading ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <CircularProgress sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Завантаження історії…</Typography>
        </Paper>
      ) : !token ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <HistoryIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}>
            Увійдіть для перегляду історії
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', mb: 3, display: 'block' }}>
            Історія розслідувань зберігається для авторизованих користувачів
          </Typography>
          <Button variant="contained" color="primary" startIcon={<SearchIcon />} onClick={() => router.push('/settings')}>
            Увійти в налаштуваннях
          </Button>
        </Paper>
      ) : error ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Typography variant="body1" sx={{ color: 'error.main', mb: 2 }}>{error}</Typography>
          <Button variant="outlined" color="primary" onClick={() => router.push('/investigation')}>Почати дослідження</Button>
        </Paper>
      ) : investigations.length === 0 ? (
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
                primary={inv.title || inv.target_identifier || inv.id}
                secondary={`${inv.status} • ${inv.created_at ? new Date(inv.created_at).toLocaleDateString('uk-UA') : ''}`}
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
