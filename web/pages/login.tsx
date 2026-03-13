import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { TravelExplore as OSINTIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import api from '../lib/api';
import { useAuth } from '../context/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirect = (router.query.redirect as string) || '/';

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirect);
    }
  }, [isAuthenticated, redirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      const res = await api.post<{ access_token: string }>('/auth/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      login(res.data.access_token);
      router.replace(redirect);
    } catch (e: unknown) {
      const status = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { status?: number } }).response?.status
        : null;
      setError(status === 401 ? 'Невірний логін або пароль' : 'Помилка входу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0a0e17',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        p: 2,
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 1, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <OSINTIcon sx={{ color: '#0a0e17', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
              MINIMAX <span style={{ color: '#00d4aa' }}>OSINT</span>
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Увійдіть для доступу</Typography>
          </Box>
        </Box>

        <TextField
          fullWidth
          label="Логін"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          sx={{
            mb: 2,
            '& .MuiInputBase-root': { color: '#fff' },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
            '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '& .MuiOutlinedInput-root:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
          }}
        />
        <TextField
          fullWidth
          type="password"
          label="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          sx={{
            mb: 2,
            '& .MuiInputBase-root': { color: '#fff' },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
            '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '& .MuiOutlinedInput-root:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
          }}
        />
        {error && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(239,68,68,0.1)' }}>
            {error}
          </Alert>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ py: 1.5, fontWeight: 700 }}
        >
          {loading ? 'Вхід...' : 'Увійти'}
        </Button>
        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          Немає облікового запису? Реєстрація через API /auth/register
        </Typography>
      </Paper>
    </Box>
  );
}
