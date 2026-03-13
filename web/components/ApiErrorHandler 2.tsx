import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

export default function ApiErrorHandler() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handler = (e: CustomEvent<{ message: string }>) => {
      setMessage(e.detail?.message || 'Помилка API');
      setOpen(true);
    };
    window.addEventListener('api-error', handler as EventListener);
    return () => window.removeEventListener('api-error', handler as EventListener);
  }, []);

  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert severity="error" onClose={() => setOpen(false)} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
}
