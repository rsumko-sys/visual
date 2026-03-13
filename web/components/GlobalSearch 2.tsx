import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Search as SearchIcon, TravelExplore as ToolIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import api from '../lib/api';

interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tools/');
      const cats = (res.data as { categories?: Record<string, { tools?: Tool[] }> }).categories ?? {};
      const all = Object.values(cats).flatMap((c) => c?.tools ?? []);
      setTools(all);
    } catch {
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      fetchTools();
    }
  }, [open, fetchTools]);

  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.description?.toLowerCase().includes(query.toLowerCase()) ||
      t.category?.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (tool: Tool) => {
    router.push(`/tools?tool=${encodeURIComponent(tool.id)}`);
    onClose();
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        router.push(`/tools?tool=${encodeURIComponent(filtered[selectedIndex].id)}`);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, selectedIndex, onClose, router]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#111827',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 2,
          mt: 8,
        },
      }}
    >
      <DialogContent sx={{ p: 0, '&:first-of-type': { py: 0 } }}>
        <TextField
          fullWidth
          autoFocus
          placeholder="Пошук інструментів..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{
            '& .MuiInputBase-root': { color: '#fff', fontSize: 18 },
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 24 }} />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={32} sx={{ color: 'primary.main' }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              Нічого не знайдено
            </Typography>
          ) : (
            <List dense disablePadding>
              {filtered.slice(0, 10).map((tool, i) => (
                <ListItemButton
                  key={tool.id}
                  selected={i === selectedIndex}
                  onClick={() => handleSelect(tool)}
                  sx={{
                    py: 1.5,
                    '&.Mui-selected': { bgcolor: 'rgba(0,212,170,0.15)' },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ToolIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={tool.name}
                    secondary={tool.category}
                    primaryTypographyProps={{ color: '#fff', fontWeight: 600 }}
                    secondaryTypographyProps={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
        <Box sx={{ px: 2, py: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            ⌘K — відкрити • ↑↓ — навігація • Enter — вибрати
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
