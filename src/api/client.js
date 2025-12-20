import axios from 'axios';

/**
 * IMPORTANT:
 * - Most routes in this app call the API with a `/v1/...` prefix (e.g. `/v1/bottles`).
 * - Therefore the Axios baseURL MUST NOT include `/v1`.
 *
 * This file normalizes VITE_API_BASE_URL so either of these work:
 *   - http://localhost:4000
 *   - http://localhost:4000/v1
 */
function normalizeBaseUrl(raw) {
  const fallback = 'http://localhost:4000';
  const base = (raw || fallback).trim();

  // Remove trailing slashes
  let normalized = base.replace(/\/+$/, '');

  // If someone included /v1 at the end, strip it to avoid /v1/v1 duplication
  normalized = normalized.replace(/\/v1$/i, '');

  return normalized;
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Inventory Photos API
export const inventoryPhotosAPI = {
  list: (inventoryId) => api.get(`/v1/inventory/${inventoryId}/photos`),
  add: (inventoryId, data) => api.post(`/v1/inventory/${inventoryId}/photos`, data),
  setPrimary: (inventoryId, photoId) => api.post(`/v1/inventory/${inventoryId}/photos/${photoId}/primary`),
  delete: (inventoryId, photoId) => api.delete(`/v1/inventory/${inventoryId}/photos/${photoId}`),
};

export default api;
