import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Paper, TextField, IconButton } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import Layout from '../components/Layout';

export default function TerminalPage() {
  const [lines, setLines] = useState<string[]>([
    'OSINT Platform 2026 — Terminal',
    'Введіть команду (наприклад: tools list, run shodan 8.8.8.8)',
    '',
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView();
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLines((prev) => [...prev, `$ ${input}`]);
    setLines((prev) => [...prev, `> Команда "${input}" в розробці. Використовуйте Tools Catalog.`]);
    setInput('');
  };

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
          Terminal
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Консольний інтерфейс (в розробці)
        </Typography>
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
            <Box key={i} sx={{ mb: 0.5 }}>{line}</Box>
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
    </Layout>
  );
}
