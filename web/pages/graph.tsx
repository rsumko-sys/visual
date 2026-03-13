import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Box, Typography, Paper, IconButton, Tooltip, TextField, Button, Chip, InputAdornment,
  List, ListItem, ListItemText, ListItemIcon, Divider,
  FormControlLabel, Switch, Avatar, Snackbar, Alert
} from '@mui/material';
import { 
  AccountTree as GraphIcon,
  Search as SearchIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
  Share as ShareIcon,
  FileDownload as DownloadIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Language as WebIcon,
  Dns as ServerIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AttachMoney as CryptoIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import PolishedSlider from '../components/PolishedSlider';
import { useDebounce } from '../hooks/useDebounce';
import { useRouter } from 'next/router';

// Graph Data for Demonstration
const MOCK_GRAPH = {
  nodes: [
    { data: { id: 'Target', label: 'target_user_01', type: 'person', val: 20 } },
    { data: { id: 'Email1', label: 'target@gmail.com', type: 'email', val: 15 } },
    { data: { id: 'Phone1', label: '+380 67 123 4567', type: 'phone', val: 15 } },
    { data: { id: 'IP1', label: '192.168.1.45', type: 'server', val: 12 } },
    { data: { id: 'FB', label: 'Facebook Profile', type: 'web', val: 10 } },
    { data: { id: 'TG', label: 'Telegram @target', type: 'web', val: 10 } },
    { data: { id: 'Wallet1', label: 'bc1qxy2kg...', type: 'crypto', val: 15 } },
    { data: { id: 'Comp1', label: 'Target Corp LLC', type: 'server', val: 18 } },
  ],
  edges: [
    { data: { source: 'Target', target: 'Email1' } },
    { data: { source: 'Target', target: 'Phone1' } },
    { data: { source: 'Target', target: 'FB' } },
    { data: { source: 'Target', target: 'TG' } },
    { data: { source: 'Email1', target: 'Comp1' } },
    { data: { source: 'Phone1', target: 'TG' } },
    { data: { source: 'Target', target: 'Wallet1' } },
    { data: { source: 'IP1', target: 'Comp1' } },
  ]
};

const nodeTypeColors: { [key: string]: string } = {
  person: '#00d4aa',
  email: '#ff9800',
  phone: '#4caf50',
  server: '#f44336',
  web: '#9c27b0',
  crypto: '#ffeb3b'
};

const nodeTypeIcons: { [key: string]: any } = {
  person: <PersonIcon fontSize="small" />,
  email: <EmailIcon fontSize="small" />,
  phone: <PhoneIcon fontSize="small" />,
  server: <ServerIcon fontSize="small" />,
  web: <WebIcon fontSize="small" />,
  crypto: <CryptoIcon fontSize="small" />
};

const GRAPH_SETTINGS_KEY = 'minimax_graph_settings';

interface GraphSettings {
  nodeScale: number;
  linkDistance: number;
  linkStrength: number;
  showLabels: boolean;
}

const DEFAULT_SETTINGS: GraphSettings = {
  nodeScale: 1,
  linkDistance: 100,
  linkStrength: 0.5,
  showLabels: true,
};

function loadGraphSettings(): GraphSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(GRAPH_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<GraphSettings>;
    return {
      nodeScale: Math.min(3, Math.max(0.5, parsed.nodeScale ?? DEFAULT_SETTINGS.nodeScale)),
      linkDistance: Math.min(200, Math.max(50, parsed.linkDistance ?? DEFAULT_SETTINGS.linkDistance)),
      linkStrength: Math.min(1, Math.max(0, parsed.linkStrength ?? DEFAULT_SETTINGS.linkStrength)),
      showLabels: parsed.showLabels ?? DEFAULT_SETTINGS.showLabels,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveGraphSettings(s: GraphSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GRAPH_SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export default function VisualGraphPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [graphSettings, setGraphSettings] = useState<GraphSettings>(DEFAULT_SETTINGS);
  const [snackbar, setSnackbar] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState('Target');
  const [paramHighlight, setParamHighlight] = useState(false);
  const [graphMounted, setGraphMounted] = useState(true);
  const cyRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const destroyingRef = useRef(false);

  const { nodeScale, linkDistance, linkStrength, showLabels } = graphSettings;
  const linkDistanceDebounced = useDebounce(linkDistance, 150);
  const linkStrengthDebounced = useDebounce(linkStrength, 150);

  useEffect(() => {
    setGraphSettings(loadGraphSettings());
  }, []);

  useEffect(() => {
    saveGraphSettings(graphSettings);
  }, [graphSettings]);

  const selectedNode = useMemo(() =>
    MOCK_GRAPH.nodes.find(n => n.data.id === selectedNodeId) || MOCK_GRAPH.nodes[0],
    [selectedNodeId]
  );

  const handleExportImage = () => {
    const cy = cyRef.current;
    if (cy && typeof cy.destroyed === 'function' && !cy.destroyed() && typeof cy.png === 'function') {
      try {
        const pngUri = cy.png({ bg: '#0a0c10', full: true });
        const a = document.createElement('a');
        a.href = pngUri;
        a.download = 'osint-graph.png';
        a.click();
        setSnackbar('Граф експортовано як PNG');
      } catch (e) {
        console.error('Export failed:', e);
        setSnackbar('Помилка експорту');
      }
    } else {
      setSnackbar('Зачекайте завантаження графу');
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    const handleRouteChange = (url: string) => {
      if (!url.startsWith('/graph')) {
        destroyingRef.current = true;
        setGraphMounted(false);
        const cy = cyRef.current;
        const suppress = (msg: string) => (msg?.includes?.('notify') || msg?.includes?.('null')) ? true : false;
        const origOnError = window.onerror;
        const origOnUnhandled = window.onunhandledrejection;
        window.onerror = function (msg, ..._args) {
          if (suppress(String(msg ?? ''))) return true;
          return origOnError ? (origOnError as any).apply(this, arguments) : false;
        };
        window.onunhandledrejection = function (e: PromiseRejectionEvent) {
          const msg = String(e?.reason?.message ?? e?.reason ?? '');
          if (suppress(msg)) { e.preventDefault(); return; }
          origOnUnhandled?.(e);
        };
        if (cy && typeof cy.destroyed === 'function' && !cy.destroyed()) {
          try { cy.destroy(); } catch (_) { /* ignore */ }
        }
        cyRef.current = null;
        setTimeout(() => {
          window.onerror = origOnError;
          window.onunhandledrejection = origOnUnhandled;
        }, 500);
      }
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      mountedRef.current = false;
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);

  // Raw Cytoscape (no react-cytoscapejs) - full control over lifecycle, avoids notify null error
  useEffect(() => {
    if (!graphMounted || !containerRef.current) return;
    let cancelled = false;
    import('cytoscape').then(({ default: cytoscape }) => {
      if (cancelled || !containerRef.current || !mountedRef.current) return;
      const container = containerRef.current;
      const cy = cytoscape({
        container,
        elements: [...MOCK_GRAPH.nodes, ...MOCK_GRAPH.edges],
        style: [
          {
            selector: 'node',
            style: {
              'background-color': (ele: any) => nodeTypeColors[ele.data('type')] || '#666',
              'label': 'data(label)',
              'width': (ele: any) => Math.round((30 + ((ele.data('val') ?? 15) - 10) * 3) * nodeScale),
              'height': (ele: any) => Math.round((30 + ((ele.data('val') ?? 15) - 10) * 3) * nodeScale),
              'color': '#fff',
              'font-size': 12,
              'text-outline-width': 2,
              'text-outline-color': '#222',
              'z-index': 10,
            },
          },
          { selector: 'edge', style: { 'width': 2, 'line-color': 'rgba(255,255,255,0.15)', 'target-arrow-color': 'rgba(255,255,255,0.25)', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier' } },
          { selector: 'node:selected', style: { 'border-width': 4, 'border-color': '#fff', 'z-index': 999 } },
        ],
        layout: {
          name: 'cose',
          idealEdgeLength: linkDistanceDebounced,
          nodeRepulsion: 2000 + 4000 * (1 - linkStrengthDebounced),
          animate: false,
        },
        minZoom: 0.3,
        maxZoom: 2.5,
        boxSelectionEnabled: false,
      });
      cy.on('tap', 'node', (e: any) => {
        const node = e.target;
        if (node?.isNode?.()) setSelectedNodeId(node.id());
      });
      cyRef.current = cy;
    });
    return () => {
      cancelled = true;
      destroyingRef.current = true;
      const cy = cyRef.current;
      const origOnError = window.onerror;
      const origOnUnhandled = window.onunhandledrejection;
      window.onerror = function (msg: string | Event, ..._args: any[]) {
        const s = typeof msg === 'string' ? msg : (msg as ErrorEvent)?.message ?? '';
        if (s.includes('notify') || s.includes('null')) return true;
        return origOnError ? (origOnError as any).apply(this, arguments) : false;
      };
      window.onunhandledrejection = function (e: PromiseRejectionEvent) {
        const msg = String(e?.reason?.message ?? e?.reason ?? '');
        if (msg.includes('notify') || msg.includes('null')) { e.preventDefault(); return; }
        origOnUnhandled?.(e);
      };
      if (cy && typeof cy.destroyed === 'function' && !cy.destroyed()) {
        try { cy.destroy(); } catch (_) { /* ignore */ }
      }
      cyRef.current = null;
      setTimeout(() => {
        window.onerror = origOnError;
        window.onunhandledrejection = origOnUnhandled;
      }, 500);
    };
  }, [graphMounted]);

  useEffect(() => {
    if (!mountedRef.current || destroyingRef.current || !cyRef.current) return;
    const cy = cyRef.current;
    if (typeof cy.destroyed === 'function' && !cy.destroyed()) {
      try {
      const nodeStyle: any = {
        'background-color': (ele: any) => nodeTypeColors[ele.data('type')] || '#666',
        'label': showLabels ? 'data(label)' : '',
        'width': (ele: any) => Math.round((30 + ((ele.data('val') ?? 15) - 10) * 3) * nodeScale),
        'height': (ele: any) => Math.round((30 + ((ele.data('val') ?? 15) - 10) * 3) * nodeScale),
        'color': '#fff', 'font-size': 12, 'text-outline-width': 2, 'text-outline-color': '#222', 'z-index': 10,
      };
      cy.style().fromJson([
        { selector: 'node', style: nodeStyle },
        { selector: 'edge', style: { 'width': 2, 'line-color': 'rgba(255,255,255,0.15)', 'target-arrow-color': 'rgba(255,255,255,0.25)', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier' } },
        { selector: 'node:selected', style: { 'border-width': 4, 'border-color': '#fff', 'z-index': 999 } },
      ]).update();
      cy.zoom(nodeScale);
      setParamHighlight(true);
      const t = setTimeout(() => setParamHighlight(false), 1000);
      return () => clearTimeout(t);
      } catch (_) { /* ignore cy errors during unmount */ }
    }
  }, [nodeScale, showLabels]);

  useEffect(() => {
    if (!mountedRef.current || destroyingRef.current || !cyRef.current) return;
    const cy = cyRef.current;
    if (typeof cy.destroyed === 'function' && !cy.destroyed()) {
      try {
      const layout = cy.layout({
        name: 'cose',
        idealEdgeLength: linkDistanceDebounced,
        nodeRepulsion: 2000 + 4000 * (1 - linkStrengthDebounced),
        animate: false,
      });
      layout.run();
      setParamHighlight(true);
      const t = setTimeout(() => setParamHighlight(false), 1000);
      return () => {
        clearTimeout(t);
        if (layout?.stop) layout.stop();
      };
      } catch (_) { /* ignore */ }
    }
  }, [linkDistanceDebounced, linkStrengthDebounced]);

  return (
    <Layout>
      <Box data-print-hide sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
            Visual Intelligence Graph
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)', wordBreak: 'break-word' }}>
            Visualize connections between entities and map the investigation surface
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<ShareIcon />} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }} onClick={() => { navigator.clipboard?.writeText(typeof window !== 'undefined' ? window.location.href : ''); setSnackbar('Посилання скопійовано'); }}>Share</Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExportImage}>Export Image</Button>
          <Button variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }} onClick={() => window.print()}>Print / PDF</Button>
        </Box>
      </Box>

      <Box data-print-graph-page sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'stretch' }}>
        {/* Left Toolbar - fixed width, never overlaps graph */}
        <Box sx={{ flex: { md: '0 0 300px' }, maxWidth: { md: 300 }, minWidth: { xs: 0, md: 260 }, order: 1 }}>
          <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff', wordBreak: 'break-word' }}>Graph Search</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Пошук вузла (скоро)"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 3,
                bgcolor: 'rgba(0,0,0,0.2)',
                '& .MuiInputBase-root': { color: '#fff' },
                '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' }
              }}
            />

            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff', wordBreak: 'break-word' }}>Visualization Settings</Typography>
            <FormControlLabel
              control={<Switch checked={showLabels} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGraphSettings((s) => ({ ...s, showLabels: e.target.checked }))} size="small" />}
              label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Show Labels</Typography>}
              sx={{ mb: 1, display: 'block' }}
            />
            <PolishedSlider
              label="Node Scale"
              value={nodeScale}
              onChange={(v) => setGraphSettings((s) => ({ ...s, nodeScale: v }))}
              min={0.5}
              max={3}
              step={0.01}
              unit="×"
              snapPoints={[0.5, 1, 1.5, 2, 2.5, 3]}
            />
            <PolishedSlider
              label="Link Distance"
              value={linkDistance}
              onChange={(v) => setGraphSettings((s) => ({ ...s, linkDistance: v }))}
              min={50}
              max={200}
              step={5}
              snapPoints={[50, 100, 150, 200]}
            />
            <PolishedSlider
              label="Link Strength"
              value={linkStrength}
              onChange={(v) => setGraphSettings((s) => ({ ...s, linkStrength: v }))}
              min={0}
              max={1}
              step={0.05}
              snapPoints={[0, 0.5, 1]}
            />

            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff', wordBreak: 'break-word' }}>Legend</Typography>
            <List dense>
              {Object.entries(nodeTypeColors).map(([type, color]) => (
                <ListItem key={type} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={type.charAt(0).toUpperCase() + type.slice(1)} 
                    primaryTypographyProps={{ variant: 'caption', color: 'rgba(255,255,255,0.7)', noWrap: false, sx: { wordBreak: 'break-word', minWidth: 0 } }} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff' }}>Selected Entity</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: nodeTypeColors[selectedNode?.data?.type] || 'primary.main', mb: 2 }}>
                {nodeTypeIcons[selectedNode?.data?.type] || <PersonIcon sx={{ fontSize: 32 }} />}
              </Avatar>
              <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>{selectedNode?.data?.label || '—'}</Typography>
              <Chip label={(selectedNode?.data?.type || 'unknown').toUpperCase()} size="small" sx={{ mt: 1, bgcolor: 'rgba(0, 212, 170, 0.15)', color: 'primary.main', fontWeight: 600 }} />
            </Box>
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Related Indicators: 6</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>First Seen: 2026-03-12</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Last Update: Just now</Typography>
            </Box>
            <Button fullWidth variant="outlined" size="small" sx={{ mt: 2, color: 'primary.main' }} onClick={() => router.push('/investigation')}>Deep Profile</Button>
          </Paper>
        </Box>

        {/* Main Graph Canvas - takes remaining space */}
        <Box sx={{ flex: 1, minWidth: 0, order: 2 }}>
          <Paper data-graph-canvas sx={{ 
            height: '700px', 
            bgcolor: '#0a0c10', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}>
            {/* Graph Controls Floating Bar - compact */}
            <Box sx={{ 
              position: 'absolute', 
              top: 12, 
              right: 12, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 0.5, 
              zIndex: 10,
              bgcolor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              p: 0.25,
              borderRadius: 1.5,
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <Tooltip title="Zoom In" placement="left">
                <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setGraphSettings((s) => ({ ...s, nodeScale: Math.min(3, s.nodeScale + 0.2) }))}><ZoomInIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Zoom Out" placement="left">
                <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setGraphSettings((s) => ({ ...s, nodeScale: Math.max(0.5, s.nodeScale - 0.2) }))}><ZoomOutIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Reset View" placement="left">
                <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setGraphSettings((s) => ({ ...s, nodeScale: 1 }))}><ResetIcon /></IconButton>
              </Tooltip>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
              <Tooltip title="Settings" placement="left">
                <IconButton size="small" sx={{ color: '#fff' }} onClick={() => router.push('/settings')}><SettingsIcon /></IconButton>
              </Tooltip>
            </Box>

            {/* Raw Cytoscape - no react-cytoscapejs, full lifecycle control */}
            <Box sx={{ width: '100%', height: '100%' }}>
              {graphMounted ? (
              <ErrorBoundary fallback={
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, py: 6 }}>
                  <GraphIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.12)', mb: 2 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 2, textAlign: 'center' }}>
                    Тут з&apos;являться ваші зв&apos;язки між сутностями
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 320 }}>
                    Граф тимчасово недоступний. Оновіть сторінку або спробуйте пізніше.
                  </Typography>
                </Box>
              }>
              <div ref={containerRef} style={{ width: '100%', height: '700px', background: 'transparent' }} />
              </ErrorBoundary>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'rgba(255,255,255,0.4)' }}>
                  <Typography variant="body2">Navigating...</Typography>
                </Box>
              )}
            </Box>

            {/* Bottom Status Bar */}
            <Box sx={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              p: 1.5, 
              bgcolor: 'rgba(0,0,0,0.6)', 
              backdropFilter: 'blur(8px)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Nodes: {MOCK_GRAPH.nodes.length}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Edges: {MOCK_GRAPH.edges.length}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Density: 0.28</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>● Live Sync Active</Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
      <Snackbar open={!!snackbar} autoHideDuration={2000} onClose={() => setSnackbar('')}>
        <Alert severity="success">{snackbar}</Alert>
      </Snackbar>
    </Layout>
  );
}
