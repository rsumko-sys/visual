import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Security as SecurityIcon, CheckCircle, Warning } from '@mui/icons-material';
import Layout from '../components/Layout';

export default function SecurityPage() {
  const checks = [
    { ok: true, text: 'API доступний через HTTPS (локально: HTTP)' },
    { ok: true, text: 'JWT автентифікація активна' },
    { ok: true, text: 'Rate limiting увімкнено' },
    { ok: false, text: 'API-ключі зберігаються лише в браузері (localStorage)' },
  ];

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
          Безпека
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Статус безпеки платформи
        </Typography>
      </Box>

      <Paper sx={{ p: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <List>
          {checks.map((c, i) => (
            <ListItem key={i}>
              <ListItemIcon>
                {c.ok ? <CheckCircle color="success" /> : <Warning color="warning" />}
              </ListItemIcon>
              <ListItemText primary={c.text} primaryTypographyProps={{ color: 'rgba(255,255,255,0.8)' }} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Layout>
  );
}
