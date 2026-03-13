/**
 * API Client - єдиний клієнт для всіх запитів до backend
 * Підтримка API URL з localStorage (налаштування) або env
 */

import axios, { AxiosError } from 'axios';

const STORAGE_KEY = 'NEXT_PUBLIC_API_URL';

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

// Динамічний baseURL при кожному запиті (для змін з Settings)
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

// Глобальна обробка помилок
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message = error.response?.data?.detail
      ? (typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail))
      : error.message || 'Помилка мережі';
    window.dispatchEvent(new CustomEvent('api-error', { detail: { message, error } }));
    return Promise.reject(error);
  }
);

export default api;
