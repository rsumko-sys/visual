import React, { useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, 
  IconButton, Tooltip, TextField, Button, Chip,
  List, ListItem, ListItemText, ListItemIcon, Divider,
  Slider, FormControlLabel, Switch, Avatar, Snackbar, Alert
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
  person: '#2196f3',
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

const CytoscapeComponent = dynamic(() => import('react-cytoscapejs'), { ssr: false });

export default function VisualGraphPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [snackbar, setSnackbar] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState('Target');
  const [graphZoom, setGraphZoom] = useState(1);
  const cyRef = useRef<any>(null);

  const elements = useMemo(() => {
    let nodes = MOCK_GRAPH.nodes;
    if (searchQuery) {
      nodes = nodes.filter(n =>
        n.data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.data.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    const nodeIds = new Set(nodes.map(n => n.data.id));
    const edges = MOCK_GRAPH.edges.filter(e => nodeIds.has(e.data.source) && nodeIds.has(e.data.target));
    return [...nodes, ...edges];
  }, [searchQuery]);

  const selectedNode = useMemo(() =>
    MOCK_GRAPH.nodes.find(n => n.data.id === selectedNodeId) || MOCK_GRAPH.nodes[0],
    [selectedNodeId]
  );

  const handleNodeSelect = (event: any) => {
    const node = event.target;
    if (node && node.isNode && node.isNode()) {
      setSelectedNodeId(node.id());
    }
  };

  return (
    <Layout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
            Visual Intelligence Graph
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Visualize connections between entities and map the investigation surface
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<ShareIcon />} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }} onClick={() => { navigator.clipboard?.writeText(typeof window !== 'undefined' ? window.location.href : ''); setSnackbar('Посилання скопійовано'); }}>Share</Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => window.print()}>Export Image</Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Toolbar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff' }}>Graph Search</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Find node by name..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'rgba(255,255,255,0.3)', mr: 1, fontSize: 20 }} />,
              }}
              sx={{ 
                mb: 3,
                bgcolor: 'rgba(0,0,0,0.2)',
                '& .MuiInputBase-root': { color: '#fff' },
                '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' }
              }}
            />

            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff' }}>Visualization Settings</Typography>
            <FormControlLabel
              control={<Switch checked={showLabels} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowLabels(e.target.checked)} size="small" />}
              label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Show Labels</Typography>}
              sx={{ mb: 1, display: 'block' }}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mb: 1, display: 'block' }}>Node Scale</Typography>
            <Slider
              size="small"
              defaultValue={1.5}
              step={0.1}
              marks
              min={0.5}
              max={3}
              sx={{ mb: 3 }}
            />

            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff' }}>Legend</Typography>
            <List dense>
              {Object.entries(nodeTypeColors).map(([type, color]) => (
                <ListItem key={type} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={type.charAt(0).toUpperCase() + type.slice(1)} 
                    primaryTypographyProps={{ variant: 'caption', color: 'rgba(255,255,255,0.7)' }} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff' }}>Selected Entity</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mb: 2 }}>
                <PersonIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>target_user_01</Typography>
              <Chip label="PERSON" size="small" sx={{ mt: 1, bgcolor: 'rgba(33, 150, 243, 0.1)', color: 'primary.main', fontWeight: 600 }} />
            </Box>
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Related Indicators: 6</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>First Seen: 2026-03-12</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Last Update: Just now</Typography>
            </Box>
            <Button fullWidth variant="outlined" size="small" sx={{ mt: 2, color: 'primary.main' }} onClick={() => router.push('/investigation')}>Deep Profile</Button>
          </Paper>
        </Grid>

        {/* Main Graph Canvas */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ 
            height: '700px', 
            bgcolor: '#0a0c10', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}>
            {/* Graph Controls Floating Bar */}
            <Box sx={{ 
              position: 'absolute', 
              top: 20, 
              right: 20, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1, 
              zIndex: 10,
              bgcolor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              p: 0.5,
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Tooltip title="Zoom In" placement="left">
                <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setGraphZoom((z: number) => Math.min(z + 0.2, 3))}><ZoomInIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Zoom Out" placement="left">
                <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setGraphZoom((z: number) => Math.max(z - 0.2, 0.5))}><ZoomOutIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Reset View" placement="left">
                <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setGraphZoom(1)}><ResetIcon /></IconButton>
              </Tooltip>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
              <Tooltip title="Settings" placement="left">
                <IconButton size="small" sx={{ color: '#fff' }} onClick={() => router.push('/settings')}><SettingsIcon /></IconButton>
              </Tooltip>
            </Box>

            {/* Interactive Cytoscape Graph */}
            <Box sx={{ width: '100%', height: '100%' }}>
              <CytoscapeComponent
                elements={elements}
                style={{ width: '100%', height: '700px', background: 'transparent' }}
                cy={(cy: any) => {
                  cyRef.current = cy;
                  cy.on('tap', 'node', handleNodeSelect);
                }}
                layout={{ name: 'cose', animate: true }}
                stylesheet={[
                  {
                    selector: 'node',
                    style: {
                      'background-color': (ele: any) => nodeTypeColors[ele.data('type')],
                      'label': showLabels ? 'data(label)' : '',
                      'width': 'mapData(val, 10, 20, 30, 60)',
                      'height': 'mapData(val, 10, 20, 30, 60)',
                      'color': '#fff',
                      'font-size': 12,
                      'text-outline-width': 2,
                      'text-outline-color': '#222',
                      'z-index': 10
                    }
                  },
                  {
                    selector: 'edge',
                    style: {
                      'width': 2,
                      'line-color': 'rgba(255,255,255,0.15)',
                      'target-arrow-color': 'rgba(255,255,255,0.25)',
                      'target-arrow-shape': 'triangle',
                      'curve-style': 'bezier',
                    }
                  },
                  {
                    selector: 'node:selected',
                    style: {
                      'border-width': 4,
                      'border-color': '#fff',
                      'z-index': 999
                    }
                  }
                ]}
                boxSelectionEnabled={false}
                minZoom={0.3}
                maxZoom={2.5}
                autoungrabify={false}
                autolock={false}
                autounselectify={false}
              />
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
        </Grid>
      </Grid>
      <Snackbar open={!!snackbar} autoHideDuration={2000} onClose={() => setSnackbar('')}>
        <Alert severity="success">{snackbar}</Alert>
      </Snackbar>
    </Layout>
  );
}
