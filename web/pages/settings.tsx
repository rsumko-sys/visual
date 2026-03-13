import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Switch, FormControlLabel, Snackbar, Alert } from '@mui/material';
import Layout from '../components/Layout';
import { getApiBaseUrl } from '../lib/api';

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiUrl(getApiBaseUrl());
  }, []);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('NEXT_PUBLIC_API_URL', apiUrl.replace(/\/$/, ''));
    }
    setSaved(true);
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
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          sx={{ mb: 3, '& .MuiInputBase-root': { color: '#fff' } }}
        />
        <FormControlLabel
          control={<Switch defaultChecked color="primary" />}
          label={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Зберігати API-ключі локально</span>}
        />
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" color="primary" onClick={handleSave}>Зберегти</Button>
        </Box>
      </Paper>
      <Snackbar open={saved} autoHideDuration={3000} onClose={() => setSaved(false)}>
        <Alert severity="success">Налаштування збережено</Alert>
      </Snackbar>
    </Layout>
  );
}
