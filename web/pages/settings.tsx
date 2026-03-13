import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Switch, FormControlLabel, Snackbar, Alert } from '@mui/material';
import Layout from '../components/Layout';
import { getApiBaseUrl } from '../lib/api';
import api from '../lib/api';
import { useAuth } from '../context/auth';

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [saved, setSaved] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const { token, login, logout } = useAuth();

  useEffect(() => {
    setApiUrl(getApiBaseUrl());
  }, []);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('NEXT_PUBLIC_API_URL', apiUrl.replace(/\/$/, ''));
    }
    setSaved(true);
  };

  const handleLogin = async () => {
    if (!loginUsername || !loginPassword) return;
    setLoginError(null);
    setLoginLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', loginUsername);
      params.append('password', loginPassword);
      const res = await api.post<{ access_token: string }>('/auth/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      login(res.data.access_token);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e && (e as { response?: { status?: number } }).response?.status === 401
        ? 'Невірний логін або пароль'
        : 'Помилка входу';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
          Налаштування
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Конфігурація платформи та API
        </Typography>
      </Box>

      <Paper sx={{ p: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2 }}>API Endpoint</Typography>
        <TextField
          fullWidth
          label="URL API (наприклад: http://localhost:8000)"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          sx={{ 
            mb: 3, 
            '& .MuiInputBase-root': { color: '#fff' },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
            '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '& .MuiOutlinedInput-root:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
          }}
        />
        <FormControlLabel
          control={<Switch defaultChecked color="primary" />}
          label={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Зберігати API-ключі локально</span>}
        />
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" color="primary" onClick={handleSave}>Зберегти</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 4, mt: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2 }}>Авторизація</Typography>
        {token ? (
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>Ви увійшли в систему</Typography>
            <Button variant="outlined" color="secondary" size="small" onClick={logout}>Вийти</Button>
          </Box>
        ) : (
          <Box>
            <TextField
              fullWidth
              label="Логін"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              sx={{ mb: 2, '& .MuiInputBase-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }}
            />
            <TextField
              fullWidth
              type="password"
              label="Пароль"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              sx={{ mb: 2, '& .MuiInputBase-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }}
            />
            {loginError && <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mb: 1 }}>{loginError}</Typography>}
            <Button variant="contained" color="primary" onClick={handleLogin} disabled={loginLoading}>Увійти</Button>
          </Box>
        )}
      </Paper>

      <Snackbar open={saved} autoHideDuration={3000} onClose={() => setSaved(false)}>
        <Alert severity="success">Налаштування збережено</Alert>
      </Snackbar>
    </Layout>
  );
}
