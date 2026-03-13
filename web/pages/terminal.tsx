import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, TextField, IconButton, Button } from '@mui/material';
import { Send as SendIcon, PlayArrow as PlayIcon } from '@mui/icons-material';
import Layout from '../components/Layout';

const DEMO_LOGS = [
  '[INFO] Initializing Maigret...',
  '[OK] Maigret v3.0 loaded',
  '[INFO] Target: target_user_01',
  '[INFO] Scanning 12 platforms...',
  '[OK] Facebook — profile found',
  '[OK] Telegram — @target linked',
  '[OK] LinkedIn — company match',
  '[INFO] Aggregating results...',
  '[OK] 3 profiles collected',
  '[DONE] Search completed in 2.4s',
];

export default function TerminalPage() {
  const [lines, setLines] = useState<string[]>([
    'OSINT Platform 2026 — Terminal',
    'Введіть команду або натисніть Start Search для демо',
    '',
  ]);
  const [input, setInput] = useState('');
  const [searchRunning, setSearchRunning] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView();
  }, [lines]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStartSearch = useCallback(() => {
    if (searchRunning) return;
    setSearchRunning(true);
    setLines((prev) => [...prev, '', `$ start search target_user_01`, '']);
    let i = 0;
    intervalRef.current = setInterval(() => {
      if (i < DEMO_LOGS.length) {
        setLines((prev) => [...prev, DEMO_LOGS[i]]);
        i++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setSearchRunning(false);
        setLines((prev) => [...prev, '']);
      }
    }, 400);
  }, [searchRunning]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLines((prev) => [...prev, `$ ${input}`]);
    setLines((prev) => [...prev, `> Команда "${input}" в розробці. Використовуйте Tools Catalog.`]);
    setInput('');
  };

  return (
    <Layout>
      <Box sx={{ position: 'relative', zIndex: 2, pointerEvents: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
          Terminal
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Консольний інтерфейс (в розробці)
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayIcon />}
          onClick={handleStartSearch}
          disabled={searchRunning}
        >
          {searchRunning ? 'Running...' : 'Start Search'}
        </Button>
      </Box>

      <Paper
        sx={{
          p: 2,
          bgcolor: '#0d1117',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: 'monospace',
          minHeight: 400,
        }}
      >
        <Box sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
          {lines.map((line, i) => (
            <Box key={i} sx={{ mb: 0.5 }}>
              {line.startsWith('[OK]') ? (
                <span style={{ color: '#10b981' }}>{line}</span>
              ) : line.startsWith('[INFO]') ? (
                <span style={{ color: '#60a5fa' }}>{line}</span>
              ) : line.startsWith('[DONE]') ? (
                <span style={{ color: '#00d4aa', fontWeight: 600 }}>{line}</span>
              ) : (
                line
              )}
            </Box>
          ))}
          <div ref={endRef} />
        </Box>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Введіть команду..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            sx={{
              '& .MuiInputBase-root': { color: '#fff', fontFamily: 'monospace' },
              '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
            }}
          />
          <IconButton type="submit" color="primary"><SendIcon /></IconButton>
        </form>
      </Paper>
      </Box>
    </Layout>
  );
}
