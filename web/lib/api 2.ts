/**
 * API Client - єдиний клієнт для всіх запитів до backend
 * Підтримка API URL з localStorage (налаштування) або env
 */

import axios, { AxiosError } from 'axios';

const STORAGE_KEY = 'NEXT_PUBLIC_API_URL';
const TOKEN_KEY = 'osint_auth_token';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored.replace(/\/$/, '');
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Динамічний baseURL та Authorization при кожному запиті
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

// Глобальна обробка помилок
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      const path = window.location.pathname;
      if (path !== '/login' && !path.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(path)}`;
      }
    }
    const data = error.response?.data as { detail?: string | object } | undefined;
    const detail = data?.detail;
    const message = detail
      ? (typeof detail === 'string' ? detail : JSON.stringify(detail))
      : error.message || 'Помилка мережі';
    window.dispatchEvent(new CustomEvent('api-error', { detail: { message, error } }));
    return Promise.reject(error);
  }
);

export default api;
