/**
 * API Client - єдиний клієнт для всіх запитів до backend
 * Підтримка API URL з localStorage (налаштування) або env
 */

import axios, { AxiosError } from 'axios';

const STORAGE_KEY = 'NEXT_PUBLIC_API_URL';
const TOKEN_KEY = 'osint_auth_token';
const PRODUCTION_API = 'https://robust-kindness-production.up.railway.app';

/** Нормалізує URL: s:// → https://, без протоколу → https:// */
export function normalizeApiUrl(url: string): string {
  const clean = url.replace(/\/$/, '').trim();
  if (!clean) return clean;
  if (clean.startsWith('s://')) return 'https://' + clean.slice(3);
  if (clean.startsWith('//')) return 'https:' + clean;
  if (!/^https?:\/\//i.test(clean)) return 'https://' + clean;
  return clean;
}

function isValidApiUrl(url: string): boolean {
  const u = url.trim();
  return u.length > 5 && /^https?:\/\/[^/]/i.test(u);
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    const isProductionDossier = window.location.hostname?.includes('railway.app');
    if (stored) {
      const clean = normalizeApiUrl(stored) || stored.replace(/\/$/, '').trim();
      // На production Dossier — не використовувати localhost
      if (isProductionDossier && (clean.includes('localhost') || clean.includes('127.0.0.1'))) {
        return PRODUCTION_API;
      }
      // Порожній або невалідний URL — fallback на production
      if (isProductionDossier && !isValidApiUrl(clean)) {
        return PRODUCTION_API;
      }
      if (isValidApiUrl(clean)) return clean;
    }
    if (isProductionDossier) return PRODUCTION_API;
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
      // Beta: не редиректимо на логін — AuthProvider отримає guest при наступному запиті
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
