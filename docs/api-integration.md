# API Integration Guide

> Complete guide to API client usage, authentication, and endpoint integration patterns in the BarrelChatter web application.

---

## Table of Contents

1. [API Client Setup](#api-client-setup)
2. [Authentication Flow](#authentication-flow)
3. [Request Patterns](#request-patterns)
4. [Response Handling](#response-handling)
5. [Error Handling](#error-handling)
6. [File Uploads](#file-uploads)
7. [Pagination](#pagination)
8. [Endpoint Reference](#endpoint-reference)

---

## API Client Setup

### Location

```
src/api/client.js
```

### Configuration

The API client is a configured Axios instance with interceptors for authentication and error handling:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - adds auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handles auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Usage

Always import the configured client, never raw axios:

```javascript
// ✅ Correct
import api from '../api/client';

// ❌ Incorrect
import axios from 'axios';
```

---

## Authentication Flow

### Login

```javascript
const handleLogin = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    setUser(user);
    navigate('/');
  } catch (error) {
    setError(error.response?.data?.error || 'Login failed');
  }
};
```

### Registration (Invite-Based)

```javascript
const handleRegister = async (token, name, email, password) => {
  try {
    const response = await api.post('/auth/register', {
      token,      // Invitation token from URL
      name,
      email,
      password
    });
    
    const { token: authToken, user } = response.data;
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    navigate('/');
  } catch (error) {
    setError(error.response?.data?.error || 'Registration failed');
  }
};
```

### Auth Context

```javascript
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Protected Routes

```javascript
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'owner' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

---

## Request Patterns

### GET - Fetching Data

```javascript
// Simple fetch
const fetchBottles = async () => {
  const response = await api.get('/bottles');
  return response.data.bottles;
};

// With query parameters
const fetchBottles = async (filters) => {
  const response = await api.get('/bottles', {
    params: {
      type: filters.type,
      search: filters.search,
      page: filters.page,
      limit: filters.limit
    }
  });
  return response.data;
};

// Fetch single item
const fetchBottle = async (id) => {
  const response = await api.get(`/bottles/${id}`);
  return response.data.bottle;
};
```

### POST - Creating Data

```javascript
// Create new item
const createInventoryItem = async (data) => {
  const response = await api.post('/inventory', {
    bottle_id: data.bottleId,
    status: data.status,
    storage_location_id: data.storageLocationId,
    purchase_location_id: data.purchaseLocationId,
    price_paid: data.pricePaid,
    purchase_date: data.purchaseDate,
    notes: data.notes
  });
  return response.data.item;
};
```

### PUT - Updating Data

```javascript
// Full update
const updateInventoryItem = async (id, data) => {
  const response = await api.put(`/inventory/${id}`, data);
  return response.data.item;
};
```

### PATCH - Partial Updates

```javascript
// Partial update (preferred for single field changes)
const updateTastingNotes = async (id, notes) => {
  const response = await api.patch(`/tastings/${id}`, { notes });
  return response.data.tasting;
};

// Inline edit pattern
const handleInlineEdit = async (id, field, value) => {
  try {
    await api.patch(`/tastings/${id}`, { [field]: value });
    // Update local state
    setTastings(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  } catch (error) {
    console.error('Update failed:', error);
  }
};
```

### DELETE - Removing Data

```javascript
const deleteInventoryItem = async (id) => {
  await api.delete(`/inventory/${id}`);
};
```

---

## Response Handling

### Standard Response Structure

All API responses follow a consistent structure:

```javascript
// Success - Single item
{
  "bottle": { ... }
}

// Success - List
{
  "bottles": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}

// Error
{
  "error": "Error message here"
}
```

### Handling Responses

```javascript
// List with pagination
const fetchInventory = async (page = 1) => {
  const response = await api.get('/inventory', { params: { page, limit: 50 } });
  
  setItems(response.data.items);
  setPagination(response.data.pagination);
};

// Single item
const fetchBottleDetail = async (id) => {
  const response = await api.get(`/bottles/${id}`);
  
  setBottle(response.data.bottle);
  setCommunityStats(response.data.communityStats);
  setPricingData(response.data.pricingData);
};
```

---

## Error Handling

### Standard Error Handler

```javascript
const handleApiError = (error, setError) => {
  if (error.response) {
    // Server responded with error
    setError(error.response.data?.error || 'An error occurred');
  } else if (error.request) {
    // Network error
    setError('Network error. Please check your connection.');
  } else {
    // Other error
    setError('An unexpected error occurred');
  }
};
```

### Usage Pattern

```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await api.get('/inventory');
    setItems(response.data.items);
  } catch (err) {
    handleApiError(err, setError);
  } finally {
    setLoading(false);
  }
};
```

### Error Display Component

```javascript
{error && (
  <div className={styles.error}>
    <span>{error}</span>
    <button onClick={() => setError(null)}>×</button>
  </div>
)}
```

### Validation Errors

```javascript
// Server returns field-specific errors
{
  "error": "Validation failed",
  "details": {
    "name": "Name is required",
    "proof": "Proof must be between 0 and 200"
  }
}

// Handling
try {
  await api.post('/bottles', data);
} catch (error) {
  if (error.response?.data?.details) {
    setFieldErrors(error.response.data.details);
  } else {
    setError(error.response?.data?.error || 'Failed to create bottle');
  }
}
```

---

## File Uploads

### Image Upload to DigitalOcean Spaces

The app uses presigned URLs for direct upload to DO Spaces:

```javascript
// Step 1: Get presigned URL from backend
const getUploadUrl = async (filename, contentType) => {
  const response = await api.post('/uploads/presign', {
    filename,
    contentType
  });
  return response.data; // { uploadUrl, publicUrl }
};

// Step 2: Upload directly to Spaces
const uploadFile = async (file) => {
  const { uploadUrl, publicUrl } = await getUploadUrl(file.name, file.type);
  
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });
  
  return publicUrl;
};
```

### PhotoUpload Component Usage

```javascript
import PhotoUpload from '../components/PhotoUpload';

<PhotoUpload
  currentPhoto={formData.photo_url}
  onPhotoChange={(url) => setFormData(prev => ({ ...prev, photo_url: url }))}
  onPhotoRemove={() => setFormData(prev => ({ ...prev, photo_url: null }))}
/>
```

### Image URL Resolution

```javascript
// Utility for resolving image URLs
export const getImageUrl = (url) => {
  if (!url) return null;
  
  // Already absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Relative path - prepend CDN/Spaces URL
  const cdnBase = import.meta.env.VITE_CDN_URL || '';
  return `${cdnBase}${url}`;
};
```

---

## Pagination

### Standard Pagination Pattern

```javascript
const [items, setItems] = useState([]);
const [pagination, setPagination] = useState({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0
});

const fetchItems = async (page = 1) => {
  const response = await api.get('/inventory', {
    params: { page, limit: pagination.limit }
  });
  
  setItems(response.data.items);
  setPagination(response.data.pagination);
};

// Pagination controls
<div className={styles.pagination}>
  <button 
    disabled={pagination.page === 1}
    onClick={() => fetchItems(pagination.page - 1)}
  >
    Previous
  </button>
  
  <span>Page {pagination.page} of {pagination.totalPages}</span>
  
  <button 
    disabled={pagination.page === pagination.totalPages}
    onClick={() => fetchItems(pagination.page + 1)}
  >
    Next
  </button>
</div>
```

### Infinite Scroll Pattern

```javascript
const [items, setItems] = useState([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [loading, setLoading] = useState(false);

const loadMore = async () => {
  if (loading || !hasMore) return;
  
  setLoading(true);
  const response = await api.get('/tastings', {
    params: { page, limit: 20 }
  });
  
  setItems(prev => [...prev, ...response.data.tastings]);
  setHasMore(page < response.data.pagination.totalPages);
  setPage(prev => prev + 1);
  setLoading(false);
};
```

---

## Endpoint Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/register` | Register with invite token |
| POST | `/auth/logout` | Logout (clears session) |
| GET | `/auth/me` | Get current user |

### Bottles (Global Catalog)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bottles` | List all bottles |
| GET | `/bottles/:id` | Get bottle details with pricing |
| POST | `/bottles` | Create new bottle |
| PUT | `/bottles/:id` | Update bottle |
| DELETE | `/bottles/:id` | Delete bottle |
| GET | `/bottles/:id/pricing` | Get community pricing data |

**Query Parameters (GET /bottles):**
- `search` - Search by name, brand, distillery
- `type` - Filter by type (bourbon, rye, scotch, etc.)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

### Inventory (User Collection)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory` | List user's inventory |
| GET | `/inventory/:id` | Get inventory item details |
| POST | `/inventory` | Add item to collection |
| PUT | `/inventory/:id` | Update inventory item |
| PATCH | `/inventory/:id` | Partial update |
| DELETE | `/inventory/:id` | Remove from collection |

**Query Parameters (GET /inventory):**
- `status` - Filter by status (sealed, open, finished, sample)
- `storage_location_id` - Filter by location
- `page`, `limit` - Pagination

### Tastings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tastings` | List user's tastings |
| GET | `/tastings/:id` | Get tasting details |
| POST | `/tastings` | Log new tasting |
| PUT | `/tastings/:id` | Update tasting |
| PATCH | `/tastings/:id` | Partial update (inline edit) |
| DELETE | `/tastings/:id` | Delete tasting |

**Query Parameters (GET /tastings):**
- `inventory_id` - Filter by bottle
- `start_date`, `end_date` - Date range
- `page`, `limit` - Pagination

### Wishlist

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wishlist` | List wishlist items |
| POST | `/wishlist` | Add to wishlist |
| PUT | `/wishlist/:id` | Update wishlist item |
| DELETE | `/wishlist/:id` | Remove from wishlist |

### Tags (NFC)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tags` | List user's tags |
| GET | `/tags/:nfc_uid` | Lookup tag by NFC UID |
| POST | `/tags/claim` | Claim unassigned tag |
| PUT | `/tags/:id` | Update tag assignment |
| DELETE | `/tags/:id/release` | Release tag |

### Storage Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/storage-locations` | List user's locations (tree) |
| POST | `/storage-locations` | Create location |
| PUT | `/storage-locations/:id` | Update location |
| DELETE | `/storage-locations/:id` | Delete location |

### Purchase Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/purchase-locations` | List approved locations |
| GET | `/purchase-locations/search` | Search locations |
| POST | `/purchase-locations` | Submit new location |

**Query Parameters (GET /purchase-locations/search):**
- `q` - Search query
- `state` - Filter by state
- `type` - Filter by type (store, online, bar, etc.)

### Admin Endpoints

All admin endpoints require `owner` or `admin` role.

#### Bottle Submissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/bottle-submissions` | List pending submissions |
| POST | `/admin/bottle-submissions/:id/approve` | Approve submission |
| POST | `/admin/bottle-submissions/:id/reject` | Reject submission |
| POST | `/admin/bottle-submissions/:id/merge` | Merge with existing |

#### Tags Administration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/tags` | List all tags |
| POST | `/admin/tags` | Register new tag |
| POST | `/admin/tags/bulk` | Bulk register tags |
| PUT | `/admin/tags/:id` | Update tag |
| DELETE | `/admin/tags/:id` | Delete tag |
| POST | `/admin/tags/:id/reset` | Reset tag ownership |

#### Tag Packs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/tag-packs` | List all tag packs |
| GET | `/admin/tag-packs/:id` | Get pack details |
| POST | `/admin/tag-packs` | Create tag pack |
| PUT | `/admin/tag-packs/:id` | Update tag pack |
| DELETE | `/admin/tag-packs/:id` | Delete tag pack |
| POST | `/admin/tag-packs/:id/add-tags` | Add tags to pack |
| POST | `/admin/tag-packs/:id/remove-tags` | Remove tags from pack |

#### Users Administration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| PUT | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Delete user |
| POST | `/admin/invitations` | Create invitation |
| GET | `/admin/invitations` | List invitations |
| DELETE | `/admin/invitations/:id` | Revoke invitation |

#### Purchase Locations Moderation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/purchase-locations` | List all (inc. pending) |
| POST | `/admin/purchase-locations/:id/approve` | Approve location |
| POST | `/admin/purchase-locations/:id/reject` | Reject location |
| POST | `/admin/purchase-locations/merge` | Merge duplicates |

#### Audit Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/audit-logs` | List audit logs |

**Query Parameters:**
- `user_id` - Filter by user
- `action` - Filter by action type
- `entity_type` - Filter by entity
- `start_date`, `end_date` - Date range

### Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/uploads/presign` | Get presigned upload URL |

---

## Common Patterns

### useEffect Data Fetching

```javascript
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory');
      setItems(response.data.items);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

### Debounced Search

```javascript
const [search, setSearch] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
  }, 300);
  
  return () => clearTimeout(timer);
}, [search]);

useEffect(() => {
  if (debouncedSearch) {
    fetchResults(debouncedSearch);
  }
}, [debouncedSearch]);
```

### Optimistic Updates

```javascript
const handleToggleFavorite = async (id) => {
  // Optimistic update
  setItems(prev => prev.map(item =>
    item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
  ));
  
  try {
    await api.patch(`/inventory/${id}`, { 
      is_favorite: !items.find(i => i.id === id).is_favorite 
    });
  } catch (error) {
    // Revert on failure
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
    ));
    setError('Failed to update');
  }
};
```

### Form Submission

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  setError(null);
  
  try {
    const response = await api.post('/inventory', formData);
    
    // Success - navigate or update state
    navigate(`/inventory/${response.data.item.id}`);
  } catch (err) {
    setError(err.response?.data?.error || 'Failed to save');
  } finally {
    setSubmitting(false);
  }
};
```

---

## Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api/v1

# CDN/Storage
VITE_CDN_URL=https://your-space.nyc3.digitaloceanspaces.com
```

---

## See Also

- [Architecture Guide](./ARCHITECTURE.md) - Overall application structure
- [Components Reference](./COMPONENTS.md) - Reusable component documentation
- [Pages Reference](./PAGES.md) - Page component documentation