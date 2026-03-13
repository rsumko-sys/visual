import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Button } from '@mui/material';
import { CheckCircle, Warning } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function SecurityPage() {
  const router = useRouter();
  const checks = [
    { ok: true, text: 'API доступний через HTTPS (локально: HTTP)' },
    { ok: true, text: 'JWT автентифікація активна' },
    { ok: true, text: 'Rate limiting увімкнено' },
    { ok: false, text: 'API-ключі зберігаються лише в браузері (localStorage)' },
  ];

  return (
    <Layout>
      <Box sx={{ position: 'relative', zIndex: 2, pointerEvents: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
          Безпека
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Статус безпеки платформи
        </Typography>
      </Box>

      <Paper sx={{ p: 4, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}>
        <List>
          {checks.map((c, i) => (
            <ListItem 
              key={i} 
              sx={!c.ok ? { 
                bgcolor: 'rgba(239, 68, 68, 0.12)', 
                borderRadius: 2, 
                mb: 1,
                border: '1px solid rgba(239, 68, 68, 0.3)',
              } : {}}
            >
              <ListItemIcon>
                {c.ok ? <CheckCircle color="success" /> : <Warning sx={{ color: '#f97316' }} />}
              </ListItemIcon>
              <ListItemText 
                primary={c.text} 
                primaryTypographyProps={{ 
                  color: !c.ok ? '#fca5a5' : 'rgba(255,255,255,0.9)',
                  fontWeight: !c.ok ? 600 : 400,
                }} 
              />
              {!c.ok && (
                <Button 
                  type="button"
                  size="small" 
                  variant="outlined" 
                  color="warning"
                  sx={{ ml: 1, flexShrink: 0 }}
                  onClick={() => router.push('/settings')}
                >
                  Як це виправити?
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      </Paper>
      </Box>
    </Layout>
  );
}
