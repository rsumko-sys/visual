import React, { useState, useEffect } from 'react';
import { 
  Box, Drawer, List, ListItem, ListItemIcon, ListItemText, 
  AppBar, Toolbar, Typography, Divider, IconButton, Badge,
  Tooltip, Avatar, useTheme, Link
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Search as SearchIcon, 
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  TravelExplore as OSINTIcon,
  Terminal as TerminalIcon,
  History as HistoryIcon,
  AccountTree as GraphIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  NavigateNext as NavigateNextIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import GlobalSearch from './GlobalSearch';
import { useAuth } from '../context/auth';

const drawerWidthOpen = 260;
const drawerWidthClosed = 72;

const BREADCRUMBS: Record<string, { label: string; path?: string }> = {
  '': { label: 'Dashboard', path: '/' },
  'investigation': { label: 'Investigation Hub', path: '/investigation' },
  'tools': { label: 'Tools Catalog', path: '/tools' },
  'graph': { label: 'Visual Graph', path: '/graph' },
  'terminal': { label: 'Terminal', path: '/terminal' },
  'history': { label: 'History', path: '/history' },
  'settings': { label: 'Settings', path: '/settings' },
  'security': { label: 'Security', path: '/security' },
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const theme = useTheme();
  const router = useRouter();
  const { token } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const drawerWidth = sidebarCollapsed ? drawerWidthClosed : drawerWidthOpen;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pathParts = router.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.length === 0
    ? [BREADCRUMBS['']]
    : pathParts.map((p, i) => {
        const key = pathParts.slice(0, i + 1).join('/');
        return BREADCRUMBS[p] || { label: p.charAt(0).toUpperCase() + p.slice(1), path: `/${pathParts.slice(0, i + 1).join('/')}` };
      });

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Investigation Hub', icon: <SearchIcon />, path: '/investigation' },
    { text: 'Tools Catalog', icon: <OSINTIcon />, path: '/tools' },
    { text: 'Visual Graph', icon: <GraphIcon />, path: '/graph' },
    { text: 'Terminal', icon: <TerminalIcon />, path: '/terminal' },
    { text: 'History', icon: <HistoryIcon />, path: '/history' },
  ];

  const secondaryItems = [
    ...(!token ? [{ text: 'Увійти', icon: <LoginIcon />, path: '/login' }] : []),
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Security', icon: <SecurityIcon />, path: '/security' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#111827', color: '#fff', position: 'relative' }}>
      <Box
        sx={{ p: sidebarCollapsed ? 2 : 3, display: 'flex', alignItems: 'center', gap: sidebarCollapsed ? 0 : 2, cursor: 'pointer', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
        onClick={() => { router.push('/'); setMobileOpen(false); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') { router.push('/'); setMobileOpen(false); } }}
      >
        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
          <OSINTIcon />
        </Avatar>
        {!sidebarCollapsed && (
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1, color: '#fff' }}>
            MINIMAX <span style={{ color: theme.palette.primary.main }}>OSINT</span>
          </Typography>
        )}
      </Box>
      
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      
      <List sx={{ px: sidebarCollapsed ? 1 : 2, py: 3, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = router.pathname === item.path;
          return (
            <ListItem
              key={item.text}
              button
              component="div"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') { router.push(item.path); setMobileOpen(false); } }}
              onClick={() => { router.push(item.path); setMobileOpen(false); }}
              sx={{
                borderRadius: 2,
                mb: 1,
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                px: sidebarCollapsed ? 1 : 2,
                position: 'relative',
                bgcolor: isActive ? 'rgba(0, 212, 170, 0.15)' : 'transparent',
                color: isActive ? theme.palette.primary.main : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderLeft: isActive ? '3px solid' : '3px solid transparent',
                borderLeftColor: isActive ? theme.palette.primary.main : 'transparent',
                ml: isActive && !sidebarCollapsed ? '-3px' : 0,
                '&:hover': {
                  bgcolor: isActive ? 'rgba(0, 212, 170, 0.2)' : 'rgba(255,255,255,0.06)',
                  color: isActive ? theme.palette.primary.main : '#fff',
                  transition: 'all 0.2s ease',
                }
              }}
            >
              <Tooltip title={item.text} placement="right">
                <ListItemIcon sx={{ color: 'inherit', minWidth: sidebarCollapsed ? 0 : 40 }}>{item.icon}</ListItemIcon>
              </Tooltip>
              {!sidebarCollapsed && <ListItemText primary={item.text} primaryTypographyProps={{ variant: 'body2', fontWeight: isActive ? 600 : 400 }} />}
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      <List sx={{ px: sidebarCollapsed ? 1 : 2, py: 2 }}>
        {secondaryItems.map((item) => {
          const isActive = router.pathname === item.path;
          return (
            <ListItem
              key={item.text}
              button
              component="div"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') { router.push(item.path); setMobileOpen(false); } }}
              onClick={() => { router.push(item.path); setMobileOpen(false); }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                px: sidebarCollapsed ? 1 : 2,
                position: 'relative',
                color: isActive ? theme.palette.primary.main : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderLeft: isActive ? '3px solid' : '3px solid transparent',
                borderLeftColor: isActive ? theme.palette.primary.main : 'transparent',
                ml: isActive && !sidebarCollapsed ? '-3px' : 0,
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.06)', 
                  color: isActive ? theme.palette.primary.main : '#fff',
                  transition: 'all 0.2s ease',
                }
              }}
            >
              <Tooltip title={item.text} placement="right">
                <ListItemIcon sx={{ color: 'inherit', minWidth: sidebarCollapsed ? 0 : 40 }}>{item.icon}</ListItemIcon>
              </Tooltip>
              {!sidebarCollapsed && <ListItemText primary={item.text} primaryTypographyProps={{ variant: 'body2' }} />}
            </ListItem>
          );
        })}
      </List>
      
      <Box sx={{ p: sidebarCollapsed ? 1 : 2, bgcolor: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', alignItems: 'center' }}>
        {token ? (
          <>
            <Badge color="success" variant="dot" overlap="circular">
              <Avatar sx={{ width: 32, height: 32 }}>U</Avatar>
            </Badge>
            {!sidebarCollapsed && (
              <Box sx={{ ml: 1.5 }}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>Administrator</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Online • API Secure</Typography>
              </Box>
            )}
          </>
        ) : (
          <Box
            component="button"
            onClick={() => { router.push('/login'); setMobileOpen(false); }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'primary.main',
              borderRadius: 2,
              px: sidebarCollapsed ? 1 : 2,
              py: 1,
              '&:hover': { bgcolor: 'rgba(0,212,170,0.1)' },
            }}
          >
            <LoginIcon sx={{ fontSize: 24 }} />
            {!sidebarCollapsed && <Typography variant="body2" sx={{ fontWeight: 600 }}>Увійти</Typography>}
          </Box>
        )}
      </Box>

      <Tooltip title={sidebarCollapsed ? 'Розгорнути меню' : 'Згорнути меню'} placement="right">
        <IconButton
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          sx={{ display: { xs: 'none', sm: 'flex' }, position: 'absolute', bottom: 80, right: -12, bgcolor: '#1a1d24', color: 'rgba(255,255,255,0.6)', width: 24, height: 24, '&:hover': { bgcolor: '#252830' } }}
        >
          {sidebarCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', bgcolor: '#0a0e17' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'rgba(15, 17, 23, 0.8)',
          backdropFilter: 'blur(8px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            {breadcrumbs.map((b, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {i > 0 && <NavigateNextIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />}
                {b.path && i < breadcrumbs.length - 1 ? (
                  <Link
                    href={b.path}
                    onClick={(e) => { e.preventDefault(); router.push(b.path!); }}
                    sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                  >
                    {b.label}
                  </Link>
                ) : (
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    {b.label}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Сповіщення / Історія">
              <IconButton color="inherit" size="small" onClick={() => router.push('/history')}>
                <Badge badgeContent={0} color="error">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Глобальний пошук (⌘K)">
              <IconButton color="inherit" size="small" onClick={() => setSearchOpen(true)}>
                <SearchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid rgba(255,255,255,0.05)' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', flexGrow: 1, minWidth: 320 }}>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            width: '100%',
            maxWidth: '100%',
            mt: '64px',
            overflow: 'auto',
            minHeight: 0,
            position: 'relative',
            zIndex: 1,
            isolation: 'isolate',
          }}
        >
          {children}
        </Box>
        <Box
          component="footer"
          sx={{
            flexShrink: 0,
            py: 2,
            px: 3,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            bgcolor: 'rgba(0,0,0,0.2)',
            color: 'text.secondary',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          OSINT Command Center © 2026 | Для освітніх цілей
          <Box component="span" sx={{ display: 'block', mt: 0.5, fontSize: 11 }}>
            Created by MiniMax Agent
          </Box>
        </Box>
      </Box>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Box>
  );
}
