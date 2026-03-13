import React, { useState, useMemo, useRef, useCallback, useEffect, useDeferredValue } from 'react';
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
import { useGraphEvidence } from '../context/graphEvidence';

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

const nodeTypeColors: Record<string, string> = {
  person: '#00d4aa',
  email: '#ff9800',
  phone: '#4caf50',
  server: '#f44336',
  web: '#9c27b0',
  crypto: '#ffeb3b'
};

const nodeTypeIcons: Record<string, React.ReactNode> = {
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
  } catch { /* ignore */ }
}

function getNodePositions(nodes: Array<{ data: { id: string } }>, cx: number, cy: number, radius: number) {
  const positions: Record<string, { x: number; y: number }> = {};
  const others = nodes.filter((n) => n.data.id !== 'Target');
  positions['Target'] = { x: cx, y: cy };
  const r = Math.max(radius, 240 + others.length * 8);
  others.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, others.length) - Math.PI / 2;
    positions[n.data.id] = {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
  return positions;
}

export default function VisualGraphPage() {
  const router = useRouter();
  const { nodes: evidenceNodes, edges: evidenceEdges, clearEvidence } = useGraphEvidence();
  const [searchQuery, setSearchQuery] = useState('');
  const [graphSettings, setGraphSettings] = useState<GraphSettings>(DEFAULT_SETTINGS);
  const [snackbar, setSnackbar] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState('Target');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodeScale, linkDistance, linkStrength, showLabels } = graphSettings;
  const nodeScaleDeferred = useDeferredValue(nodeScale);
  const linkDistanceDebounced = useDebounce(linkDistance, 150);

  const graphData = useMemo(() => {
    if (evidenceNodes.length > 0) {
      return {
        nodes: evidenceNodes.map((n) => ({ data: { id: n.id, label: n.label, type: n.type, val: n.val ?? 15 } })),
        edges: evidenceEdges.map((e) => ({ data: { source: e.source, target: e.target } })),
      };
    }
    return MOCK_GRAPH;
  }, [evidenceNodes, evidenceEdges]);

  useEffect(() => {
    setGraphSettings(loadGraphSettings());
  }, []);

  useEffect(() => {
    saveGraphSettings(graphSettings);
  }, [graphSettings]);

  const selectedNode = useMemo(() =>
    graphData.nodes.find((n) => n.data.id === selectedNodeId) || graphData.nodes[0],
    [selectedNodeId, graphData.nodes]
  );

  const radius = 220 + (linkDistanceDebounced - 50) * 0.6;
  const positions = useMemo(() => getNodePositions(graphData.nodes, 350, 350, radius), [radius, graphData.nodes]);

  const handleExportImage = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) {
      setSnackbar('Зачекайте завантаження графу');
      return;
    }
    try {
      const scale = 2;
      const w = 700 * scale;
      const h = 700 * scale;
      const svgClone = svg.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute('width', String(w));
      svgClone.setAttribute('height', String(h));
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No context');
      ctx.fillStyle = '#0a0c10';
      ctx.fillRect(0, 0, w, h);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'osint-graph.png';
        a.click();
        setSnackbar('Граф експортовано як PNG');
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      console.error('Export failed:', e);
      setSnackbar('Помилка експорту');
    }
  }, []);

  const baseSize = 24;
  const nodeR = (val: number) => Math.round((baseSize + (val - 10) * 1.5) * nodeScaleDeferred);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.3, Math.min(3, z + delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      panStartRef.current = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y };
    }
  }, [pan]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const start = panStartRef.current;
      const dx = e.clientX - start.clientX;
      const dy = e.clientY - start.clientY;
      setPan({ x: start.panX + dx, y: start.panY + dy });
    };
    const onUp = () => setIsPanning(false);
    if (isPanning) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }
  }, [isPanning]);

  return (
    <Layout>
      <ErrorBoundary>
      <Box data-print-hide sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2, pointerEvents: 'auto' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
            Visual Intelligence Graph
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)', wordBreak: 'break-word' }}>
            Visualize connections between entities and map the investigation surface
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button type="button" variant="outlined" startIcon={<ResetIcon />} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => { clearEvidence(); setGraphSettings(DEFAULT_SETTINGS); setSelectedNodeId('Target'); setPan({ x: 0, y: 0 }); setZoom(1); setSnackbar('Граф скинуто'); }}>Reload</Button>
          <Button type="button" variant="outlined" startIcon={<ShareIcon />} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }} onClick={() => { navigator.clipboard?.writeText(typeof window !== 'undefined' ? window.location.href : ''); setSnackbar('Посилання скопійовано'); }}>Share</Button>
          <Button type="button" variant="contained" startIcon={<DownloadIcon />} onClick={handleExportImage}>Export Image</Button>
          <Button type="button" variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }} onClick={() => window.print()}>Print / PDF</Button>
        </Box>
      </Box>

      <Box data-print-graph-page sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'stretch', position: 'relative', zIndex: 2, pointerEvents: 'auto', isolation: 'isolate' }}>
        <Box sx={{ flex: { md: '0 0 300px' }, maxWidth: { md: 300 }, minWidth: { xs: 0, md: 260 }, order: 1, pointerEvents: 'auto' }}>
          <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff' }}>Graph Search</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Пошук вузла (скоро)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} /></InputAdornment> }}
              sx={{ mb: 3, bgcolor: 'rgba(0,0,0,0.2)', '& .MuiInputBase-root': { color: '#fff' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }}
            />
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff' }}>Visualization Settings</Typography>
            <FormControlLabel
              control={<Switch checked={showLabels} onChange={(e) => setGraphSettings((s) => ({ ...s, showLabels: e.target.checked }))} size="small" />}
              label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Show Labels</Typography>}
              sx={{ mb: 1, display: 'block' }}
            />
            <PolishedSlider label="Node Scale" value={nodeScale} onChange={(v) => setGraphSettings((s) => ({ ...s, nodeScale: v }))} min={0.5} max={3} step={0.01} unit="×" snapPoints={[0.5, 1, 1.5, 2, 2.5, 3]} />
            <PolishedSlider label="Link Distance" value={linkDistance} onChange={(v) => setGraphSettings((s) => ({ ...s, linkDistance: v }))} min={50} max={200} step={5} snapPoints={[50, 100, 150, 200]} />
            <PolishedSlider label="Link Strength" value={linkStrength} onChange={(v) => setGraphSettings((s) => ({ ...s, linkStrength: v }))} min={0} max={1} step={0.05} snapPoints={[0, 0.5, 1]} />
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff' }}>Legend</Typography>
            <List dense>
              {Object.entries(nodeTypeColors).map(([type, color]) => (
                <ListItem key={type} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color }} /></ListItemIcon>
                  <ListItemText primary={type.charAt(0).toUpperCase() + type.slice(1)} primaryTypographyProps={{ variant: 'caption', color: 'rgba(255,255,255,0.7)' }} />
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
            <Button type="button" fullWidth variant="outlined" size="small" sx={{ mt: 2, color: 'primary.main' }} onClick={() => router.push('/investigation')}>Deep Profile</Button>
          </Paper>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, order: 2, overflow: 'hidden', pointerEvents: 'auto' }}>
          <Paper data-graph-canvas sx={{ height: { xs: 400, sm: 550, md: 700 }, minHeight: 300, bgcolor: '#0a0c10', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'auto' }}>
            <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 0.5, zIndex: 10, bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', p: 0.25, borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.08)' }}>
              <Tooltip title="Zoom In" placement="left"><IconButton size="small" sx={{ color: '#fff' }} onClick={() => setGraphSettings((s) => ({ ...s, nodeScale: Math.min(3, s.nodeScale + 0.2) }))}><ZoomInIcon /></IconButton></Tooltip>
              <Tooltip title="Zoom Out" placement="left"><IconButton size="small" sx={{ color: '#fff' }} onClick={() => setGraphSettings((s) => ({ ...s, nodeScale: Math.max(0.5, s.nodeScale - 0.2) }))}><ZoomOutIcon /></IconButton></Tooltip>
              <Tooltip title="Reset View" placement="left"><IconButton size="small" sx={{ color: '#fff' }} onClick={() => { setGraphSettings((s) => ({ ...s, nodeScale: 1 })); setPan({ x: 0, y: 0 }); setZoom(1); }}><ResetIcon /></IconButton></Tooltip>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
              <Tooltip title="Settings" placement="left"><IconButton size="small" sx={{ color: '#fff' }} onClick={() => router.push('/settings')}><SettingsIcon /></IconButton></Tooltip>
            </Box>

            <Box
              ref={containerRef}
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: isPanning ? 'grabbing' : 'grab',
              }}
              onMouseDown={handleMouseDown}
              onMouseUp={() => setIsPanning(false)}
              onMouseLeave={() => setIsPanning(false)}
            >
              <Box sx={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center', transition: isPanning ? 'none' : 'transform 0.1s ease-out' }}>
                <svg ref={svgRef} viewBox="0 0 700 700" preserveAspectRatio="xMidYMid meet" style={{ width: 700, height: 700, maxWidth: '100%', maxHeight: '100%', background: 'transparent', display: 'block' }}>
                <defs>
                  <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="rgba(255,255,255,0.25)" /></marker>
                </defs>
                {graphData.edges.map((e, i) => {
                  const src = positions[e.data.source];
                  const tgt = positions[e.data.target];
                  if (!src || !tgt) return null;
                  return <line key={i} x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} stroke="rgba(255,255,255,0.15)" strokeWidth={2} markerEnd="url(#arrow)" />;
                })}
                {graphData.nodes.map((n) => {
                  const pos = positions[n.data.id];
                  if (!pos) return null;
                  const r = nodeR(n.data.val ?? 15);
                  const isSelected = selectedNodeId === n.data.id;
                  const color = nodeTypeColors[n.data.type] || '#666';
                  return (
                    <g key={n.data.id} onClick={() => setSelectedNodeId(n.data.id)} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                      <circle cx={pos.x} cy={pos.y} r={r} fill={color} stroke={isSelected ? '#00d4aa' : 'transparent'} strokeWidth={isSelected ? 4 : 0} />
                      {showLabels && <text x={pos.x} y={pos.y + r + 16} textAnchor="middle" fill="#fff" fontSize={12} style={{ textShadow: '0 1px 2px #222', pointerEvents: 'none' }}>{n.data.label}</text>}
                    </g>
                  );
                })}
              </svg>
              </Box>
            </Box>

            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5, bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Nodes: {graphData.nodes.length}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>Перетягніть • Коліщатко для масштабу</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Edges: {graphData.edges.length}</Typography>
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
      </ErrorBoundary>
    </Layout>
  );
}
