import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, TextField, 
  Button, Chip, Divider, List, ListItem, ListItemText,
  ListItemIcon, Paper, Stepper, Step, StepLabel, 
  IconButton, Tooltip, LinearProgress, Avatar, Snackbar, Alert,
  Menu, MenuItem
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  AutoFixHigh as AgentIcon,
  CheckCircle as CheckCircleIcon,
  Science as LabIcon,
  DataObject as JsonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountTree as GraphIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import api from '../lib/api';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import { useAuth } from '../context/auth';
import { useGraphEvidence } from '../context/graphEvidence';

interface SelectedTool {
  id: string;
  name: string;
  category: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface AvailableTool {
  id: string;
  name: string;
  category: string;
}

interface ResultItem {
  tool: string;
  toolId: string;
  data: string;
  parsed?: { sites?: Array<{ site: string; url: string }>; urls?: string[]; found?: boolean };
  timestamp: string;
}

export default function InvestigationHub() {
  const router = useRouter();
  const { token } = useAuth();
  const { addEvidenceFromMaigret } = useGraphEvidence();
  const [query, setQuery] = useState<string>('');
  const [selectedTools, setSelectedTools] = useState<SelectedTool[]>([]);
  const [investigationStatus, setInvestigationStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [currentInvestigationId, setCurrentInvestigationId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const [addToolAnchor, setAddToolAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentInvestigationId(`inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, []);

  const availableTools: AvailableTool[] = [
    { id: 'maigret_v3', name: 'Maigret v3.0', category: 'SOCMINT' },
    { id: 'shodan', name: 'Shodan', category: 'SIGINT' },
    { id: 'geospy', name: 'GeoSpy.ai', category: 'GEOINT' },
    { id: 'pimeyes', name: 'Pimeyes', category: 'IMINT' },
  ];

  const handleAddTool = (tool: AvailableTool) => {
    // #region agent log
    if (typeof fetch !== 'undefined') fetch('http://127.0.0.1:7537/ingest/962fe773-a5ea-4fe0-acc1-b47d07c341c9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b2f0f0'},body:JSON.stringify({sessionId:'b2f0f0',location:'investigation.tsx:handleAddTool',message:'add tool',data:{toolId:tool.id,toolName:tool.name,alreadySelected:!!selectedTools.find((t: SelectedTool) => t.id === tool.id)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!selectedTools.find((t: SelectedTool) => t.id === tool.id)) {
      setSelectedTools([...selectedTools, { ...tool, status: 'pending' }]);
    }
  };

  const handleRemoveTool = (id: string) => {
    setSelectedTools(selectedTools.filter((t: SelectedTool) => t.id !== id));
  };

  const handleNewInvestigation = () => {
    setQuery('');
    setSelectedTools([]);
    setResults([]);
    setInvestigationStatus('idle');
    setCurrentInvestigationId(`inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    setSaveStatus(null);
    setPdfError(null);
    setExpandedResult(null);
  };

  const handleSaveToVault = async () => {
    if (!currentInvestigationId || results.length === 0) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      for (const res of results) {
        await api.post(`/reports/${currentInvestigationId}/evidence`, {
          source: res.tool,
          data: res.data,
          target: query,
        });
      }
      setSaveStatus('Saved to Evidence Vault');
    } catch (e) {
      setSaveStatus('Error saving evidence');
    }
    setSaving(false);
  };

  const [pdfError, setPdfError] = useState<string | null>(null);
  const handleExportPDF = async () => {
    if (!currentInvestigationId) return;
    setPdfError(null);
    try {
      const response = await api.post(`/reports/${currentInvestigationId}/generate-report?format=pdf`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `osint_report_${currentInvestigationId}.pdf`;
      a.click();
    } catch (error: unknown) {
      const msg = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status === 500
          ? 'Помилка генерації PDF (сервер)'
          : 'Помилка експорту PDF'
        : 'Помилка експорту PDF';
      setPdfError(msg);
    }
  };

  const handleStartInvestigation = async () => {
    if (!query || selectedTools.length === 0) return;

    let invId = currentInvestigationId;
    if (token) {
      try {
        const invRes = await api.post<{ id: string }>('/investigations/', {
          title: query,
          description: query,
          target_identifier: query,
        });
        invId = invRes.data.id;
        setCurrentInvestigationId(invId);
      } catch {
      }
    }

    setInvestigationStatus('running');
    const currentTools = [...selectedTools];
    setResults([]);

    for (let i = 0; i < currentTools.length; i++) {
      const tool = currentTools[i];
      tool.status = 'running';
      setSelectedTools([...currentTools]);
      try {
        const response = await api.post(`/tools/${tool.id}/run`, {
          query: query,
          investigation_id: invId,
          api_key: localStorage.getItem(`api_key_${tool.id}`) || ''
        });
        const taskId = response.data.task_id;
        let ready = false;
        let attempts = 0;
        while (!ready && attempts < 30) {
          const statusRes = await api.get(`/tools/status/${taskId}`);
          if (statusRes.data.ready) {
            ready = true;
            tool.status = 'completed';
            const resData = statusRes.data.result?.data;
            const dataStr = JSON.stringify(resData, null, 2);
            let parsed: ResultItem['parsed'] | undefined;
            try {
              parsed = resData && typeof resData === 'object' ? (() => {
                const sites = resData.sites || resData.profiles || [];
                const urls = resData.urls || [];
                const siteList = Array.isArray(sites) ? sites : Object.entries(sites).map(([site, info]: [string, unknown]) => ({
                  site,
                  url: typeof info === 'object' && info && 'url' in (info as object) ? String((info as { url?: string }).url || '') : ''
                }));
                return { sites: siteList, urls, found: resData.found };
              })() : undefined;
            } catch (_) {
              parsed = undefined;
            }
            if (parsed?.sites?.length && (tool.id === 'maigret' || tool.id === 'maigret_v3')) {
              addEvidenceFromMaigret(query, parsed.sites.filter((s: { url?: string }) => s.url) as Array<{ site: string; url: string }>);
            }
            setResults((prev: ResultItem[]) => [...prev, {
              tool: tool.name,
              toolId: tool.id,
              data: dataStr,
              parsed,
              timestamp: new Date().toLocaleTimeString()
            }]);
            try {
              await api.post(`/reports/${invId}/evidence`, {
                source: tool.name,
                data: JSON.stringify(statusRes.data.result.data, null, 2),
                target: query,
              });
            } catch (e) {
            }
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
          }
        }
      } catch (error) {
        console.error(`Error running ${tool.name}:`, error);
        tool.status = 'failed';
      }
      setSelectedTools([...currentTools]);
    }

    setInvestigationStatus('completed');
  };

  const handleExportSTIX = async () => {
    if (!currentInvestigationId) return;
    try {
      const response = await api.get(`/vault/${currentInvestigationId}/export/stix`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `osint_stix_bundle_${currentInvestigationId}.json`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
          Investigation Hub
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Chain multiple tools for a deep multi-vector intelligence analysis
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ alignItems: 'flex-start', overflow: 'hidden', isolation: 'isolate' }}>
        <Grid item xs={12} md={4} sx={{ minWidth: 0, position: 'relative', pointerEvents: 'auto' }}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, minWidth: 280, overflow: 'hidden' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
              <AgentIcon color="primary" fontSize="small" /> 1. Set Target Query
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Username, Email, IP, Domain"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              sx={{ 
                mb: 4,
                bgcolor: 'rgba(0,0,0,0.2)',
                '& .MuiInputBase-root': { color: '#fff' },
                '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '& .MuiOutlinedInput-root:focus-within fieldset': { 
                  borderColor: 'primary.main', 
                  boxShadow: '0 0 0 2px rgba(0, 212, 170, 0.25)' 
                }
              }}
            />

            <Box sx={{ 
              mb: 2, 
              p: 1.5, 
              borderRadius: 1, 
              bgcolor: 'rgba(0,212,170,0.08)', 
              border: '1px solid rgba(0,212,170,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton type="button" size="small" onClick={(e) => setAddToolAnchor(e.currentTarget)} sx={{ color: 'primary.main', p: 0.5 }} aria-label="Додати інструмент">
                  <AddIcon color="primary" fontSize="small" />
                </IconButton>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>2. Chain OSINT Tools</Typography>
              </Box>
              <Button type="button" size="small" variant="text" sx={{ color: 'primary.main', textTransform: 'none', minWidth: 'auto', py: 0 }} onClick={() => router.push('/tools')}>
                Каталог →
              </Button>
            </Box>
            <Menu anchorEl={addToolAnchor} open={!!addToolAnchor} onClose={() => setAddToolAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
              {availableTools.map((tool) => (
                <MenuItem key={tool.id} onClick={() => { handleAddTool(tool); setAddToolAnchor(null); }}>
                  {tool.name} ({tool.category})
                </MenuItem>
              ))}
            </Menu>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mb: 1, display: 'block' }}>Suggested Tools</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {availableTools.map((tool: AvailableTool) => (
                  <Button
                    type="button"
                    key={tool.id}
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                    onClick={() => handleAddTool(tool)}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.05)', 
                      color: '#fff', 
                      borderColor: 'rgba(255,255,255,0.2)',
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'rgba(0, 212, 170, 0.25)', borderColor: 'primary.main' },
                    }}
                  >
                    {tool.name}
                  </Button>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.05)' }} />

            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff' }}>Selected Pipeline</Typography>
            <List sx={{ mb: 3 }}>
              {selectedTools.length === 0 && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                  No tools selected for this investigation.
                </Typography>
              )}
              {selectedTools.map((tool: SelectedTool, index: number) => (
                <ListItem 
                  key={tool.id}
                  secondaryAction={
                    <IconButton edge="end" size="small" onClick={() => handleRemoveTool(tool.id)} disabled={investigationStatus === 'running'} aria-label={`Remove ${tool.name}`}>
                      <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
                    </IconButton>
                  }
                  sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1, mb: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Typography component="span" sx={{ color: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}>
                      {index + 1}
                    </Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary={tool.name} 
                    secondary={tool.category}
                    primaryTypographyProps={{ variant: 'body2', color: '#fff' }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'rgba(255,255,255,0.4)' }}
                  />
                </ListItem>
              ))}
            </List>

            <Button
              type="button"
              fullWidth
              variant="contained"
              startIcon={<PlayIcon />}
              disabled={!query || selectedTools.length === 0 || investigationStatus === 'running'}
              onClick={handleStartInvestigation}
              sx={{ 
                py: 1.5, 
                fontWeight: 700,
                mb: 1,
                '&.Mui-disabled': { bgcolor: 'rgba(0,212,170,0.2)', color: 'rgba(255,255,255,0.5)' }
              }}
            >
              Start Multi-Vector Search
            </Button>
            <Button
              type="button"
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleNewInvestigation}
              disabled={investigationStatus === 'running'}
              sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              New Investigation (Reload)
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8} sx={{ position: 'relative', pointerEvents: 'auto', minWidth: 0 }}>
          <Paper elevation={0} sx={{ p: 0, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', minHeight: '600px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LabIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Investigation Pipeline</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button type="button" size="small" variant="outlined" onClick={handleNewInvestigation} disabled={investigationStatus === 'running'} sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.3)' }}>
                  Reload
                </Button>
                {investigationStatus !== 'idle' && currentInvestigationId && (
                  <Button type="button" size="small" variant="outlined" startIcon={<PdfIcon />} sx={{ color: 'primary.main', borderColor: 'rgba(0,212,170,0.4)' }} onClick={handleExportPDF}>
                    Download PDF Report
                  </Button>
                )}
                {investigationStatus === 'running' && (
                  <Chip label="Processing..." size="small" color="primary" variant="outlined" />
                )}
              </Box>
            </Box>

            <Box sx={{ p: 3, flexGrow: 1, position: 'relative', overflow: 'hidden', minHeight: 400, isolation: 'isolate' }}>
              {investigationStatus === 'idle' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, py: 6 }}>
                  <SearchIcon sx={{ fontSize: 48, mb: 2, color: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', px: 2 }}>Configure your investigation parameters to begin</Typography>
                </Box>
              ) : (
                <>
                  <Stepper activeStep={selectedTools.findIndex((t: SelectedTool) => t.status === 'running' || t.status === 'pending')} orientation="horizontal" sx={{ mb: 5 }}>
                    {selectedTools.map((tool: SelectedTool) => (
                      <Step key={tool.id} completed={tool.status === 'completed'}>
                        <StepLabel 
                          StepIconProps={{ sx: { color: tool.status === 'running' ? 'primary.main' : 'inherit' } }}
                        >
                          <Typography variant="caption" sx={{ color: '#fff' }}>{tool.name}</Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon fontSize="small" /> Intelligence Stream
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {results.map((res: ResultItem, i: number) => {
                      const profileCount = res.parsed?.sites?.length ?? res.parsed?.urls?.length ?? 0;
                      const isExpanded = expandedResult === i;
                      return (
                      <Card key={i} sx={{ bgcolor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <CardContent sx={{ p: '16px !important' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                              <Typography variant="subtitle2" color="primary">{res.tool}</Typography>
                              {profileCount > 0 && (
                                <Chip label={`${profileCount} профілів`} size="small" sx={{ bgcolor: 'rgba(0,212,170,0.15)', color: 'primary.main', fontSize: '0.7rem' }} />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {profileCount > 0 && (
                                <Button type="button" size="small" startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />} sx={{ fontSize: '0.7rem', color: 'primary.main' }} onClick={() => setExpandedResult(isExpanded ? null : i)}>
                                  {isExpanded ? 'Згорнути' : 'View Results'}
                                </Button>
                              )}
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>{res.timestamp}</Typography>
                            </Box>
                          </Box>
                          {isExpanded && profileCount > 0 && (
                            <List dense sx={{ mb: 2, maxHeight: 200, overflow: 'auto' }}>
                              {[
                                ...(res.parsed?.sites || []),
                                ...(res.parsed?.urls || []).map((u: string) => ({ site: 'URL', url: u }))
                              ].map((item: { site?: string; url?: string }, j: number) => {
                                const url = item.url;
                                const site = item.site || 'Link';
                                return url ? (
                                  <ListItem key={j} sx={{ py: 0.5 }}>
                                    <ListItemText primary={site} secondary={url} primaryTypographyProps={{ variant: 'caption', color: 'primary.main' }} secondaryTypographyProps={{ variant: 'caption', sx: { wordBreak: 'break-all' } }} />
                                  </ListItem>
                                ) : null;
                              })}
                            </List>
                          )}
                          {!isExpanded && (
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {res.data.length > 200 ? res.data.slice(0, 200) + '...' : res.data}
                            </Typography>
                          )}
                          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button type="button" size="small" startIcon={<JsonIcon />} sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }} onClick={() => { navigator.clipboard?.writeText(res.data); setCopyStatus('Скопійовано'); setTimeout(() => setCopyStatus(null), 2000); }}>Raw JSON</Button>
                            <Button type="button" size="small" startIcon={<GraphIcon />} sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }} onClick={() => { window.location.href = '/graph'; }}>Open Graph</Button>
                            <Button type="button" size="small" startIcon={<AgentIcon />} sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }} onClick={() => { setCopyStatus('AI Analysis — в розробці'); setTimeout(() => setCopyStatus(null), 2000); }}>AI Analysis</Button>
                            {copyStatus && <Typography variant="caption" sx={{ color: 'success.main', alignSelf: 'center', ml: 1 }}>{copyStatus}</Typography>}
                          </Box>
                        </CardContent>
                      </Card>
                    );})}
                    {investigationStatus === 'running' && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" sx={{ color: 'primary.main', mb: 1, display: 'block' }}>
                          Executing {selectedTools.find((t: SelectedTool) => t.status === 'running')?.name}...
                        </Typography>
                        <LinearProgress />
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </Box>
            
            {investigationStatus === 'completed' && (
              <Box sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.05)', borderTop: '1px solid rgba(76, 175, 80, 0.2)', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button type="button" variant="outlined" color="success" size="small" onClick={handleExportSTIX} startIcon={<JsonIcon />}>
                  Export STIX 2.1 (JSON)
                </Button>
                <Button type="button" variant="outlined" color="success" size="small" onClick={handleExportPDF}>Export Report (PDF)</Button>
                <Button type="button" variant="contained" color="success" size="small" onClick={handleSaveToVault} disabled={saving}>
                  Save to Evidence Vault
                </Button>
                {saveStatus && <Typography variant="caption" sx={{ color: saveStatus.includes('Error') ? 'error.main' : 'success.main', ml: 2 }}>{saveStatus}</Typography>}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={!!pdfError} autoHideDuration={6000} onClose={() => setPdfError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setPdfError(null)}>{pdfError}</Alert>
      </Snackbar>
    </Layout>
  );
}
