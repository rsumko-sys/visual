import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { TravelExplore as OSINTIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import api from '../lib/api';
import { useAuth } from '../context/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirect = (router.query.redirect as string) || '/';

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirect);
    }
  }, [isAuthenticated, redirect, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ access_token: string }>('/auth/pass', { password });
      login(res.data.access_token);
      router.replace(redirect);
    } catch (e: unknown) {
      const status = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { status?: number } }).response?.status
        : null;
      setError(status === 401 ? 'Невірний пароль' : status === 503 ? 'Сервер не налаштований (ALLOWED_PASSWORDS)' : 'Помилка входу');
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
        onSubmit={handleLogin}
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
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Вимагається код доступу
            </Typography>
          </Box>
        </Box>

        <TextField
          fullWidth
          type="password"
          label="Код доступу"
          placeholder="Введіть код..."
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
      </Paper>
    </Box>
  );
}
