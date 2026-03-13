import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Container, Typography, Card, CardContent, Chip, Box, 
  TextField, InputAdornment, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Alert, Snackbar, Skeleton
} from '@mui/material';
import { 
  Search as SearchIcon, 
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  VpnKey as KeyIcon,
  Launch as LaunchIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import api, { getApiBaseUrl } from '../lib/api';
import Layout from '../components/Layout';
import PolishedSlider from '../components/PolishedSlider';
import { useDebounce } from '../hooks/useDebounce';

interface ToolParam {
  key: string;
  label: string;
  type: string;
  min: number;
  max: number;
  default: number;
}

interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  type: string;
  api: string;
  params?: ToolParam[];
}

interface CategoryData {
  name: string;
  count: number;
  tools: Tool[];
}

export default function ToolsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ [key: string]: CategoryData }>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Tool Detail Modal
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [runQuery, setRunQuery] = useState('');
  const [toolParams, setToolParams] = useState<Record<string, number>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'info' | 'success' | 'error' });

  useEffect(() => {
    fetchTools();
  }, []);

  useEffect(() => {
    const toolId = router.query.tool as string | undefined;
    if (toolId && !loading && Object.keys(categories).length > 0) {
      for (const cat of Object.values(categories)) {
        const t = cat.tools?.find((x: Tool) => x.id === toolId);
        if (t) {
          setSelectedTool(t);
          setApiKey(localStorage.getItem(`api_key_${t.id}`) || '');
          const defaults: Record<string, number> = {};
          ((t as Tool).params ?? []).forEach((p: ToolParam) => { defaults[p.key] = p.default; });
          setToolParams(defaults);
          router.replace('/tools', undefined, { shallow: true });
          break;
        }
      }
    }
  }, [router.query.tool, loading, categories, router]);

  const fetchTools = async (retryAfterClear = false) => {
    try {
      setLoading(true);
      setLoadError(false);
      setErrorDetail('');
      const response = await api.get('/tools/');
      setCategories(response.data?.categories ?? {});
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      const err = error as { message?: string; code?: string };
      const apiUrl = typeof window !== 'undefined' ? getApiBaseUrl() : '';
      setErrorDetail(`${err.message || 'Unknown'} | API: ${apiUrl || 'N/A'}`);
      // На production — якщо Network Error, можливо невалідний URL в localStorage
      const isProduction = typeof window !== 'undefined' && window.location.hostname?.includes('railway.app');
      const isNetworkError = err.message === 'Network Error';
      if (isProduction && isNetworkError && !retryAfterClear) {
        const stored = localStorage.getItem('NEXT_PUBLIC_API_URL');
        if (stored && (!stored.startsWith('https://') || stored.includes('localhost'))) {
          localStorage.removeItem('NEXT_PUBLIC_API_URL');
          return fetchTools(true);
        }
      }
      setLoadError(true);
      showSnackbar('Не вдалося завантажити каталог. Перевірте API URL в Налаштуваннях.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'info' | 'success' | 'error' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const searchQueryDebounced = useDebounce(searchQuery, 300);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleToolClick = useCallback((tool: Tool) => {
    setSelectedTool(tool);
    setApiKey(localStorage.getItem(`api_key_${tool.id}`) || '');
    const defaults: Record<string, number> = {};
    (tool.params ?? []).forEach((p) => { defaults[p.key] = p.default; });
    setToolParams(defaults);
  }, []);

  const handleSaveKey = () => {
    if (selectedTool) {
      // Маскування ключа перед збереженням (візуальне)
      const maskedKey = apiKey.length > 8 
        ? `${apiKey.substring(0, 4)}****${apiKey.substring(apiKey.length - 4)}`
        : '****';
      
      localStorage.setItem(`api_key_${selectedTool.id}`, apiKey);
      showSnackbar(`API Key for ${selectedTool.name} saved locally (${maskedKey})`, 'success');
    }
  };

  const handleRunTool = async () => {
    if (!selectedTool) return;
    
    try {
      showSnackbar(`Initializing ${selectedTool.name}...`, 'info');
      const options: Record<string, number> = {};
      Object.keys(toolParams).forEach((k) => { options[k] = toolParams[k]; });
      const response = await api.post(`/tools/${selectedTool.id}/run`, {
        query: runQuery,
        api_key: apiKey,
        options: Object.keys(options).length ? options : undefined,
      });
      showSnackbar(`Task started: ${response.data.task_id}`, 'success');
    } catch (error) {
      showSnackbar('Failed to run tool', 'error');
    }
  };

  const filteredTools = useMemo(() => {
    const q = searchQueryDebounced.toLowerCase().trim();
    return Object.entries(categories ?? {}).flatMap(([catKey, catData]) =>
      (catData?.tools ?? []).filter((tool: Tool) => {
        const matchesSearch = !q || (tool.name ?? '').toLowerCase().includes(q) ||
          (tool.description ?? '').toLowerCase().includes(q);
        const isQuickFilter = selectedCategory === '__top10' || selectedCategory === '__api';
        const matchesCategory = !selectedCategory || isQuickFilter || catKey === selectedCategory;
        return matchesSearch && matchesCategory;
      })
    );
  }, [categories, searchQueryDebounced, selectedCategory]);

  const quickChipStyle = {
    borderColor: 'rgba(255,255,255,0.25)',
    color: 'rgba(255,255,255,0.9)',
    border: '1px solid',
    cursor: 'pointer' as const,
  };

  const totalCategories = Object.keys(categories).length;
  const totalTools = Object.values(categories).reduce((acc, c) => acc + (c.tools?.length || 0), 0);
  const withApi = Object.values(categories).reduce((acc, c) => 
    acc + (c.tools?.filter((t: Tool) => t.api === '✓').length || 0), 0);

  const displayTools = useMemo(() => {
    const quickFilter = selectedCategory === '__top10' ? 'top10' : selectedCategory === '__api' ? 'api' : null;
    return quickFilter === 'top10'
      ? filteredTools.slice(0, 10)
      : quickFilter === 'api'
        ? filteredTools.filter((t: Tool) => t.api === '✓')
        : filteredTools;
  }, [filteredTools, selectedCategory]);

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ mx: 'auto', width: '100%', boxSizing: 'border-box', position: 'relative', zIndex: 2, pointerEvents: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: '#fff', fontSize: { xs: '1.5rem', sm: '1.75rem' }, letterSpacing: '0.02em' }}>
          Набір OSINT Інструментів
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
          <Chip label={`Категорії ${totalCategories}`} variant="outlined" size="small" sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }} />
          <Chip label={`Всього ${totalTools}`} variant="outlined" size="small" sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }} />
          <Chip label={`З API ${withApi}`} variant="outlined" size="small" sx={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: 'rgba(16, 185, 129, 0.9)' }} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
        {/* Sidebar: Categories */}
        <Box sx={{ 
          flexShrink: 0, 
          width: { xs: '100%', md: 240 }, 
          p: 2, 
          bgcolor: 'rgba(255,255,255,0.02)', 
          borderRadius: 2, 
          border: '1px solid rgba(255,255,255,0.06)',
          position: { md: 'sticky' },
          top: { md: 88 },
        }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1.5, textTransform: 'uppercase', letterSpacing: 1 }}>Quick Filters</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', mb: 2 }}>
            <Chip label="Усі" size="small" onClick={() => setSelectedCategory(null)} sx={{ ...quickChipStyle, width: '100%', justifyContent: 'flex-start', py: 0.75, px: 1.5, bgcolor: !selectedCategory ? 'rgba(0,212,170,0.15)' : 'transparent', borderColor: !selectedCategory ? 'primary.main' : 'rgba(255,255,255,0.2)' }} />
            <Chip label="Топ 10" size="small" onClick={() => setSelectedCategory(selectedCategory === '__top10' ? null : '__top10')} sx={{ ...quickChipStyle, width: '100%', justifyContent: 'flex-start', py: 0.75, px: 1.5, bgcolor: selectedCategory === '__top10' ? 'primary.main' : 'transparent', borderColor: selectedCategory === '__top10' ? 'primary.main' : 'rgba(255,255,255,0.2)' }} />
            <Chip label="З API" size="small" onClick={() => setSelectedCategory(selectedCategory === '__api' ? null : '__api')} sx={{ ...quickChipStyle, width: '100%', justifyContent: 'flex-start', py: 0.75, px: 1.5, bgcolor: selectedCategory === '__api' ? 'rgba(16,185,129,0.3)' : 'transparent', borderColor: selectedCategory === '__api' ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.2)' }} />
          </Box>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1.5, textTransform: 'uppercase', letterSpacing: 1 }}>Категорії</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(categories).map(([key, cat]) => (
              <Chip 
                key={key} 
                label={`${cat.name} (${cat.count})`} 
                size="small" 
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                sx={{ 
                  width: '100%',
                  justifyContent: 'flex-start',
                  py: 0.75,
                  px: 1.5,
                  borderColor: selectedCategory === key ? 'primary.main' : 'rgba(255,255,255,0.2)',
                  bgcolor: selectedCategory === key ? 'rgba(0,212,170,0.15)' : 'transparent',
                  color: selectedCategory === key ? 'primary.main' : 'rgba(255,255,255,0.7)',
                  border: '1px solid',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Main: Search + Grid */}
        <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Пошук за назвою, описом або можливостями..."
            value={searchQuery}
            onChange={handleSearch}
            sx={{ 
              mb: 2,
              bgcolor: 'rgba(255,255,255,0.03)',
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255,255,255,0.3)' }} />
                </InputAdornment>
              ),
            }}
          />
          {!loading && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mb: 2 }}>
              Показано {displayTools.length} інструментів
            </Typography>
          )}

      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2, mt: 2 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Box key={i} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', boxSizing: 'border-box' }}>
              <Skeleton variant="text" width="60%" height={28} sx={{ bgcolor: 'rgba(255,255,255,0.08)', mb: 1 }} />
              <Skeleton variant="text" width="100%" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
              <Skeleton variant="text" width="90%" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
              <Skeleton variant="text" width="70%" sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 2 }} />
              <Skeleton variant="rounded" width={80} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
            </Box>
          ))}
        </Box>
      ) : displayTools.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <SearchIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.12)', mb: 2, opacity: 0.8 }} />
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
            {loadError ? 'Помилка завантаження' : 'Інструменти не знайдені'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: loadError ? 2 : 0 }}>
            {loadError ? 'Перевірте підключення до API в Налаштуваннях або натисніть Повторити' : 'Спробуйте змінити критерії пошуку'}
          </Typography>
          {loadError && errorDetail && (
            <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.35)', mb: 1.5, fontFamily: 'monospace' }}>
              {errorDetail}
            </Typography>
          )}
          {loadError && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button type="button" variant="contained" color="primary" onClick={() => fetchTools()}>
                Повторити
              </Button>
              <Button
                type="button"
                variant="outlined"
                size="small"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('NEXT_PUBLIC_API_URL');
                    fetchTools();
                  }
                }}
              >
                Скинути API URL
              </Button>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: 2, 
          mt: 2,
          boxSizing: 'border-box',
          minWidth: 0,
        }}>
          {displayTools.map((tool) => (
            <Card 
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              sx={{ 
                minHeight: 0,
                minWidth: 280,
                bgcolor: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.06)',
                  transform: 'translateY(-4px)',
                  borderColor: 'primary.main'
                }
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, wordBreak: 'break-word' }}>{tool.name}</Typography>
                  <Box sx={{ flexShrink: 0 }}>
                    {tool.api === '✓' ? (
                      <Tooltip title="API Support Available">
                        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Direct Web Only">
                        <CancelIcon sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }} />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255,255,255,0.5)', 
                  mb: 2, 
                  flexGrow: 1,
                  display: '-webkit-box', 
                  WebkitLineClamp: 3, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  lineHeight: 1.5,
                }}>
                  {tool.description}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                  <Chip 
                    label={tool.type} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', maxWidth: 'calc(100% - 70px)', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} 
                  />
                  <Typography component="span" variant="caption" sx={{ color: 'primary.main', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 600 }}>Details →</Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
        </Box>
      </Box>

      {/* Tool Details & API Config Dialog */}
      <Dialog 
        open={Boolean(selectedTool)} 
        onClose={() => setSelectedTool(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1a1d24', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
        }}
      >
        {selectedTool && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{selectedTool.name}</Typography>
                <Chip label={selectedTool.category} size="small" color="primary" />
              </Box>
              <IconButton onClick={() => setSelectedTool(null)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                <CancelIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                {selectedTool.description}
              </Typography>

              {selectedTool.api === '✓' ? (
                <Box sx={{ bgcolor: 'rgba(33, 150, 243, 0.05)', p: 2, borderRadius: 2, border: '1px solid rgba(33, 150, 243, 0.2)', mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'primary.main' }}>
                    <KeyIcon fontSize="small" /> API Configuration
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'rgba(255,255,255,0.5)' }}>
                    Your API key is stored locally in your browser for security.
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="password"
                    label="API Key / Token"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    sx={{ 
                      '& .MuiInputBase-root': { color: '#fff' },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                      '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' }
                    }}
                  />
                  <Button
                    type="button"
                    size="small"
                    variant="contained"
                    onClick={handleSaveKey}
                    sx={{ mt: 1 }}
                  >
                    Save Key Locally
                  </Button>
                </Box>
              ) : (
                <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(2, 136, 209, 0.1)', color: '#fff' }}>
                  This tool does not support direct API integration. Click "Open Website" to use it manually.
                </Alert>
              )}

              {(selectedTool.params ?? []).length > 0 && (
                <Box sx={{ bgcolor: 'rgba(0, 212, 170, 0.05)', p: 2, borderRadius: 2, border: '1px solid rgba(0, 212, 170, 0.2)', mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
                    <SettingsIcon fontSize="small" /> Tool Settings
                  </Typography>
                  {(selectedTool.params ?? []).map((p) => (
                    <PolishedSlider
                      key={p.key}
                      label={p.label}
                      value={toolParams[p.key] ?? p.default}
                      onChange={(v) => setToolParams((prev) => ({ ...prev, [p.key]: v }))}
                      min={p.min}
                      max={p.max}
                      step={p.max > 20 ? 5 : 1}
                      snapPoints={[p.min, p.default, p.max]}
                    />
                  ))}
                </Box>
              )}

              <Typography variant="subtitle2" sx={{ mb: 1, color: '#fff' }}>Quick Run (MiniMax Agent)</Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Enter target (domain, email, username)..."
                value={runQuery}
                onChange={(e) => setRunQuery(e.target.value)}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.03)',
                  '& .MuiInputBase-root': { color: '#fff' },
                  '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' }
                }}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
              <Button 
                type="button"
                startIcon={<LaunchIcon />}
                sx={{ color: 'rgba(255,255,255,0.6)' }}
                onClick={() => window.open(`https://www.google.com/search?q=${selectedTool.name}+osint`, '_blank')}
              >
                Open Website
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button type="button" onClick={() => setSelectedTool(null)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancel</Button>
              <Button 
                type="button"
                variant="contained" 
                color="primary"
                startIcon={<PlayIcon />}
                disabled={selectedTool.api !== '✓'}
                onClick={handleRunTool}
              >
                Execute Tool
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Container>
    </Layout>
  );
}
