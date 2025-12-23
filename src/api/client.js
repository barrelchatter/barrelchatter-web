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

// Menu Settings API (authenticated)
export const menuSettingsAPI = {
  get: () => api.get('/v1/users/me/menu-settings'),
  update: (data) => api.patch('/v1/users/me/menu-settings', data),
  regenerateToken: () => api.post('/v1/users/me/menu-settings/regenerate-token'),
};

// Public Menu API (no auth required)
// Note: Uses a separate axios instance without auth interceptor
export const publicMenuAPI = {
  get: (shareToken) => axios.get(`${API_BASE_URL}/v1/menu/${shareToken}`),
};

// Menus API (multi-menu management)
export const menusAPI = {
  list: () => api.get('/v1/menus'),
  get: (id) => api.get(`/v1/menus/${id}`),
  create: (data) => api.post('/v1/menus', data),
  update: (id, data) => api.patch(`/v1/menus/${id}`, data),
  delete: (id) => api.delete(`/v1/menus/${id}`),
  regenerateToken: (id) => api.post(`/v1/menus/${id}/regenerate-token`),
  setLocations: (id, storageLocationIds) =>
    api.put(`/v1/menus/${id}/locations`, { storage_location_ids: storageLocationIds }),
};

// Storage Locations API
export const storageLocationsAPI = {
  list: (params) => api.get('/v1/storage-locations', { params }),
  get: (id) => api.get(`/v1/storage-locations/${id}`),
};

// Purchase Locations API
export const purchaseLocationsAPI = {
  list: (params) => api.get('/v1/purchase-locations', { params }),
  get: (id) => api.get(`/v1/purchase-locations/${id}`),
  create: (data) => api.post('/v1/purchase-locations', data),
  mySubmissions: (status) =>
    api.get('/v1/purchase-locations/my-submissions', { params: { status } }),
  nearby: (lat, lng, radius) =>
    api.get('/v1/purchase-locations/nearby', { params: { lat, lng, radius } }),
  // Maps integration
  geocode: (id) => api.post(`/v1/purchase-locations/${id}/geocode`),
  getMapUrls: (id) => api.get(`/v1/purchase-locations/${id}/map-urls`),
};

// Groups API
export const groupsAPI = {
  // CRUD
  list: (params) => api.get('/v1/groups', { params }),
  discover: (params) => api.get('/v1/groups/discover', { params }),
  get: (id) => api.get(`/v1/groups/${id}`),
  create: (data) => api.post('/v1/groups', data),
  update: (id, data) => api.patch(`/v1/groups/${id}`, data),
  delete: (id) => api.delete(`/v1/groups/${id}`),
  // Invites
  invites: () => api.get('/v1/groups/invites'),
  invite: (groupId, userId, message) =>
    api.post(`/v1/groups/${groupId}/invite/${userId}`, { message }),
  join: (groupId) => api.post(`/v1/groups/${groupId}/join`),
  decline: (groupId) => api.post(`/v1/groups/${groupId}/decline`),
  leave: (groupId) => api.post(`/v1/groups/${groupId}/leave`),
  removeMember: (groupId, userId) =>
    api.delete(`/v1/groups/${groupId}/members/${userId}`),
  // Activity & Bottles
  activity: (groupId, params) =>
    api.get(`/v1/groups/${groupId}/activity`, { params }),
  bottles: (groupId, params) =>
    api.get(`/v1/groups/${groupId}/bottles`, { params }),
  shareBottle: (groupId, inventoryId, notes) =>
    api.post(`/v1/groups/${groupId}/bottles`, { inventory_id: inventoryId, notes }),
  unshareBottle: (groupId, inventoryId) =>
    api.delete(`/v1/groups/${groupId}/bottles/${inventoryId}`),
};

// Users API (for searching users to invite)
export const usersAPI = {
  search: (query) => api.get('/v1/users/search', { params: { q: query } }),
};

// Subscription API
export const subscriptionAPI = {
  // Get current subscription status with usage
  getStatus: () => api.get('/v1/subscription/status'),
  // Redeem a promo code
  redeemPromo: (code) => api.post('/v1/subscription/redeem-promo', { code }),
};

// Stripe API
export const stripeAPI = {
  // Create a Stripe Checkout session and return the URL
  createCheckoutSession: (tier, interval) =>
    api.post('/v1/stripe/checkout-session', { tier, interval }),
  // Create a Stripe Customer Portal session for managing subscription
  createPortalSession: () => api.post('/v1/stripe/portal-session'),
};

// Inventory API
export const inventoryAPI = {
  // Export collection as CSV
  exportCSV: () => api.get('/v1/inventory/export/csv', { responseType: 'blob' }),
};

export default api;
