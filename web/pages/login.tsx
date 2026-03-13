import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert, Tabs, Tab, Collapse } from '@mui/material';
import { TravelExplore as OSINTIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import api, { getApiBaseUrl } from '../lib/api';
import { useAuth } from '../context/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [showApiUrl, setShowApiUrl] = useState(false);

  const redirect = (router.query.redirect as string) || '/';

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirect);
    }
    setApiUrl(getApiBaseUrl());
  }, [isAuthenticated, redirect, router]);

  const handleLogin = async (e: React.FormEvent) => {
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
      setError(status === 401 ? 'Невірний логін або пароль' : status === 404 ? 'API недоступний (404). Перевірте URL в Налаштуваннях.' : 'Помилка входу');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await api.post('/auth/register', { username, email, password });
      setSuccess('Обліковий запис створено. Увійдіть.');
      setMode('login');
    } catch (e: unknown) {
      const res = e && typeof e === 'object' && 'response' in e ? (e as { response?: { status?: number; data?: { detail?: string } } }).response : null;
      const status = res?.status;
      const detail = res?.data?.detail;
      const msg = status === 404
        ? 'API недоступний (404). Перевірте URL API в Налаштуваннях.'
        : typeof detail === 'string' ? detail : detail || 'Помилка реєстрації';
      setError(msg);
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
        onSubmit={mode === 'login' ? handleLogin : handleRegister}
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
              {mode === 'login' ? 'Увійдіть для доступу' : 'Створіть обліковий запис'}
            </Typography>
          </Box>
        </Box>

        <Tabs value={mode} onChange={(_, v) => { setMode(v); setError(null); setSuccess(null); }} sx={{ mb: 2, '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)' }, '& .Mui-selected': { color: '#00d4aa' } }}>
          <Tab label="Вхід" value="login" />
          <Tab label="Реєстрація" value="register" />
        </Tabs>

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
        {mode === 'register' && (
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            sx={{
              mb: 2,
              '& .MuiInputBase-root': { color: '#fff' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
              '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
              '& .MuiOutlinedInput-root:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
            }}
          />
        )}
        <TextField
          fullWidth
          type="password"
          label="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
        <Box sx={{ mb: 2 }}>
          <Button size="small" startIcon={<SettingsIcon />} onClick={() => setShowApiUrl(!showApiUrl)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            API URL
          </Button>
          <Collapse in={showApiUrl}>
            <TextField
              fullWidth
              size="small"
              label="URL API"
              value={apiUrl}
              onChange={(e) => {
                setApiUrl(e.target.value);
                if (typeof window !== 'undefined') localStorage.setItem('NEXT_PUBLIC_API_URL', e.target.value.replace(/\/$/, ''));
              }}
              placeholder="https://robust-kindness-production.up.railway.app"
              sx={{ mt: 1, '& .MuiInputBase-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' } }}
            />
          </Collapse>
        </Box>
        {success && (
          <Alert severity="success" sx={{ mb: 2, bgcolor: 'rgba(34,197,94,0.1)' }}>
            {success}
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
          {loading ? (mode === 'login' ? 'Вхід...' : 'Реєстрація...') : (mode === 'login' ? 'Увійти' : 'Зареєструватися')}
        </Button>
      </Paper>
    </Box>
  );
}
