import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AccountTree as GraphIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback;
    }
    if (this.state.hasError) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, py: 6 }}>
          <GraphIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.12)', mb: 2 }} />
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 2, textAlign: 'center' }}>
            Граф тимчасово недоступний
          </Typography>
          <Button variant="outlined" color="primary" onClick={() => this.setState({ hasError: false })}>
            Спробувати знову
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
