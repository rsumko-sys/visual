import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Switch, FormControlLabel, Snackbar, Alert, Chip, Divider } from '@mui/material';
import { Link as LinkIcon, VpnKey as KeyIcon } from '@mui/icons-material';
import Layout from '../components/Layout';
import api, { getApiBaseUrl } from '../lib/api';

const PRODUCTION_API = 'https://robust-kindness-production.up.railway.app';
import { useAuth } from '../context/auth';

const SETTINGS_STORE_KEYS_KEY = 'minimax_settings_store_keys';

const inputSx = {
  '& .MuiInputBase-root': { color: '#fff' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
  '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
  '& .MuiOutlinedInput-root:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
};

const paperSx = {
  p: 3,
  bgcolor: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 2,
};

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [storeApiKeysLocally, setStoreApiKeysLocally] = useState(true);
  const [saved, setSaved] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [isProduction, setIsProduction] = useState(false);
  const { token, login, logout } = useAuth();

  useEffect(() => {
    const prod = typeof window !== 'undefined' && window.location.hostname?.includes('railway.app');
    setIsProduction(!!prod);
    let url = getApiBaseUrl();
    // Виправлення обрізаного URL (напр. productic замість production.up.railway.app)
    if (prod && (url.includes('productic') || !url.includes('.up.railway.app'))) {
      url = PRODUCTION_API;
    }
    setApiUrl(url);
    try {
      const stored = localStorage.getItem(SETTINGS_STORE_KEYS_KEY);
      if (stored !== null) setStoreApiKeysLocally(stored === 'true');
    } catch {
      /* ignore */
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('NEXT_PUBLIC_API_URL', apiUrl.replace(/\/$/, ''));
      localStorage.setItem(SETTINGS_STORE_KEYS_KEY, String(storeApiKeysLocally));
    }
    setSaved(true);
  };

  const handleGuestToken = async () => {
    setGuestError(null);
    setGuestLoading(true);
    try {
      const res = await api.get<{ access_token: string }>('/auth/guest');
      if (res.data?.access_token) {
        login(res.data.access_token);
        setSaved(true);
      }
    } catch (e) {
      setGuestError('Не вдалося підключитися до API. Перевірте URL в налаштуваннях.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <Layout>
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          pointerEvents: 'auto',
          isolation: 'isolate',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          borderRadius: 2,
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
            Налаштування
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Конфігурація платформи та API
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Paper sx={paperSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LinkIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: '#fff' }}>API Endpoint</Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
              label="URL API (наприклад: http://localhost:8000)"
              placeholder={PRODUCTION_API}
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              sx={{ mb: 2, ...inputSx }}
            />
            {isProduction && (
              <Button
                type="button"
                variant="outlined"
                size="small"
                sx={{ mb: 2, display: 'block', borderColor: 'rgba(0,212,170,0.4)', color: 'primary.main' }}
                onClick={() => setApiUrl(PRODUCTION_API)}
              >
                Використати production API
              </Button>
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={storeApiKeysLocally}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setStoreApiKeysLocally(v);
                    try {
                      localStorage.setItem(SETTINGS_STORE_KEYS_KEY, String(v));
                    } catch {
                      /* ignore */
                    }
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Зберігати API-ключі локально</Typography>}
              sx={{ display: 'block', mb: 2 }}
            />
            <Button type="button" variant="contained" color="primary" size="medium" onClick={handleSave}>
              Зберегти
            </Button>
          </Paper>

          <Paper sx={paperSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <KeyIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: '#fff' }}>Авторизація</Typography>
            </Box>
            <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
            {token ? (
              <Box>
                <Chip
                  label="Увійшли"
                  size="small"
                  sx={{ mb: 2, bgcolor: 'rgba(0, 212, 170, 0.15)', color: 'primary.main', fontWeight: 600 }}
                />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2, display: 'block' }}>
                  Beta: JWT (guest) збережено
                </Typography>
                <Button type="button" variant="outlined" size="small" sx={{ color: 'primary.main', borderColor: 'rgba(0,212,170,0.4)' }} onClick={logout}>
                  Вийти
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                  Beta: доступ без пароля
                </Typography>
                {guestError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGuestError(null)}>
                    {guestError}
                  </Alert>
                )}
                <Button type="button" variant="contained" color="primary" size="medium" onClick={handleGuestToken} disabled={guestLoading}>
                  {guestLoading ? 'Завантаження...' : 'Отримати доступ'}
                </Button>
              </Box>
            )}
          </Paper>
        </Box>

        <Snackbar open={saved} autoHideDuration={3000} onClose={() => setSaved(false)}>
          <Alert severity="success">Налаштування збережено</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
