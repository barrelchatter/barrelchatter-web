# BarrelChatter API Integration

Documentation for backend API communication.

---

## Overview

The web app communicates with the BarrelChatter API server via REST endpoints. All authenticated requests include a JWT token in the Authorization header.

**Base URL:**
- Development: `http://localhost:4000`
- Production: Configured via `VITE_API_URL` environment variable

**API Version:** `/v1/`

---

## API Client

**File:** `src/api/api.js`

The API client provides a wrapper around `fetch` with:
- Automatic auth header injection
- JSON request/response handling
- Error normalization
- Token refresh (future)

### Usage

```javascript
import api from '../api/api';

// GET request
const bottles = await api.get('/v1/bottles');

// GET with query params
const results = await api.get('/v1/bottles', { 
  search: 'buffalo',
  type: 'bourbon'
});

// POST request
const newItem = await api.post('/v1/inventory', {
  bottle_id: 'uuid',
  status: 'sealed',
  location_label: 'Home Bar'
});

// PUT request
await api.put('/v1/inventory/uuid', {
  status: 'open'
});

// DELETE request
await api.delete('/v1/inventory/uuid');

// File upload
const formData = new FormData();
formData.append('photo', file);
formData.append('caption', 'My bottle');
await api.upload('/v1/bottles/uuid/photos', formData);
```

### Implementation

```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('bc_token');
}

async function request(method, path, data = null, options = {}) {
  const url = new URL(path, API_BASE);
  
  // Add query params for GET
  if (method === 'GET' && data) {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
    ...options
  };
  
  if (method !== 'GET' && data && !options.isFormData) {
    config.body = JSON.stringify(data);
  }
  
  const response = await fetch(url.toString(), config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.message || 'Request failed');
    err.status = response.status;
    err.data = error;
    throw err;
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

export default {
  get: (path, params) => request('GET', path, params),
  post: (path, data) => request('POST', path, data),
  put: (path, data) => request('PUT', path, data),
  delete: (path) => request('DELETE', path),
  upload: (path, formData) => request('POST', path, null, {
    body: formData,
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    isFormData: true
  })
};
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/auth/login` | User login |
| POST | `/v1/auth/register` | User registration |
| GET | `/v1/auth/validate-token` | Validate invitation token |
| POST | `/v1/auth/forgot-password` | Request password reset |
| POST | `/v1/auth/reset-password` | Reset password |

**Login Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Login Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  }
}
```

---

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/users/me` | Current user profile |
| PUT | `/v1/users/me` | Update profile |
| PUT | `/v1/users/me/password` | Change password |
| GET | `/v1/users/me/stats` | User statistics |

**Stats Response:**
```json
{
  "bottle_count": 45,
  "inventory_count": 23,
  "tasting_count": 156,
  "wishlist_count": 12
}
```

---

### Bottles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/bottles` | List bottles |
| GET | `/v1/bottles/:id` | Get bottle details |
| PUT | `/v1/bottles/:id` | Update bottle |
| GET | `/v1/bottles/:id/photos` | List bottle photos |
| POST | `/v1/bottles/:id/photos` | Upload photo |
| DELETE | `/v1/bottles/:id/photos/:photoId` | Delete photo |
| POST | `/v1/bottles/submissions` | Submit new bottle |

**Query Parameters (GET /v1/bottles):**
- `search` - Search by name/distillery
- `type` - Filter by type
- `sort` - Sort field (prefix `-` for descending)
- `limit`, `offset` - Pagination

**Bottle Object:**
```json
{
  "id": "uuid",
  "name": "Buffalo Trace",
  "brand": "Buffalo Trace",
  "distillery": "Buffalo Trace Distillery",
  "type": "bourbon",
  "proof": 90,
  "age_statement": null,
  "description": "A classic Kentucky bourbon...",
  "status": "verified",
  "avg_rating": 4.2,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/inventory` | List user's inventory |
| POST | `/v1/inventory` | Add inventory item |
| GET | `/v1/inventory/:id` | Get item details |
| PUT | `/v1/inventory/:id` | Update item |
| DELETE | `/v1/inventory/:id` | Remove item |

**Query Parameters (GET /v1/inventory):**
- `bottle_id` - Filter by bottle
- `status` - Filter by status
- `location` - Filter by location
- `sort` - Sort field

**Inventory Object:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "bottle_id": "uuid",
  "bottle": { /* bottle object */ },
  "status": "open",
  "location_label": "Home Bar",
  "msrp": 29.99,
  "price_paid": 24.99,
  "purchase_store": "Total Wine",
  "purchase_city": "Louisville",
  "purchase_state": "KY",
  "purchase_date": "2024-01-15",
  "opened_at": "2024-02-01T00:00:00Z",
  "notes": "Great daily sipper",
  "tag_id": "uuid",
  "created_at": "2024-01-15T00:00:00Z"
}
```

---

### Tastings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/tastings` | List tastings |
| POST | `/v1/tastings` | Create tasting |
| GET | `/v1/tastings/:id` | Get tasting |
| PUT | `/v1/tastings/:id` | Update tasting |
| DELETE | `/v1/tastings/:id` | Delete tasting |

**Query Parameters:**
- `inventory_id` - Filter by inventory item
- `bottle_id` - Filter by bottle
- `sort` - Sort field (default: `-created_at`)
- `limit`, `offset` - Pagination

**Tasting Object:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "inventory_id": "uuid",
  "inventory": { /* inventory object with bottle */ },
  "pour_amount_oz": 1.5,
  "rating": 8.5,
  "notes": "Rich caramel and vanilla...",
  "photo_url": "https://...",
  "shared_scope": "private",
  "created_at": "2024-02-15T20:30:00Z"
}
```

---

### Wishlists

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/wishlists` | List wishlist items |
| POST | `/v1/wishlists` | Add to wishlist |
| PUT | `/v1/wishlists/:id` | Update item |
| DELETE | `/v1/wishlists/:id` | Remove item |

**Wishlist Object:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "bottle_id": "uuid",
  "bottle": { /* bottle object */ },
  "preferred_price": 49.99,
  "notes": "Try to find on sale",
  "alert_enabled": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/tags/mine` | User's claimed tags |
| GET | `/v1/tags/lookup/:uid` | Look up tag by UID |
| POST | `/v1/tags/:id/claim` | Claim tag |
| PUT | `/v1/tags/:id` | Update tag |
| POST | `/v1/tags/:id/release` | Release tag |

**Tag Object:**
```json
{
  "id": "uuid",
  "nfc_uid": "04:A2:B3:C4:D5:E6:F7",
  "status": "claimed",
  "registered_to_inventory_id": "uuid",
  "registered_to_user_id": "uuid",
  "label": "Buffalo Trace #1",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### Admin Endpoints

All admin endpoints require `admin` role (or `moderator` for submissions).

#### Invitations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/admin/invitations` | List invitations |
| POST | `/v1/admin/invitations` | Create invitation |
| DELETE | `/v1/admin/invitations/:id` | Revoke invitation |

#### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/admin/users` | List users |
| PUT | `/v1/admin/users/:id` | Update user |
| POST | `/v1/admin/users/:id/lock` | Lock user |
| POST | `/v1/admin/users/:id/unlock` | Unlock user |

#### Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/admin/tags` | List all tags |
| POST | `/v1/admin/tags` | Register tag |
| PUT | `/v1/admin/tags/:id` | Update tag |
| DELETE | `/v1/admin/tags/:id` | Remove tag |

#### Bottle Submissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/bottles/submissions` | List submissions |
| PUT | `/v1/bottles/submissions/:id/approve` | Approve |
| PUT | `/v1/bottles/submissions/:id/reject` | Reject |

#### Audit Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/admin/audit-logs` | Query audit logs |

**Query Parameters:**
- `from`, `to` - Date range
- `action` - Filter by action type
- `user_id` - Filter by user
- `entity_type` - Filter by entity
- `page`, `limit` - Pagination

---

## Error Handling

**Error Response Format:**
```json
{
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { /* optional additional info */ }
}
```

**HTTP Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful delete) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Server Error |

**Frontend Error Handling:**
```javascript
try {
  await api.post('/v1/endpoint', data);
} catch (err) {
  switch (err.status) {
    case 400:
      setError(err.data?.message || 'Invalid input');
      break;
    case 401:
      // Token expired, redirect to login
      logout();
      navigate('/login');
      break;
    case 403:
      setError('Permission denied');
      break;
    case 404:
      setError('Not found');
      break;
    default:
      setError('Something went wrong');
  }
}
```

---

## File Uploads

### Bottle Photos

Photos are uploaded to DigitalOcean Spaces and stored with CDN URLs.

**Upload Flow:**
1. Frontend sends file to API
2. API uploads to DO Spaces
3. API returns CDN URL
4. Frontend displays image

**Upload Request:**
```javascript
const formData = new FormData();
formData.append('photo', fileInput.files[0]);
formData.append('caption', 'Front label');
formData.append('is_primary', 'true');

await api.upload('/v1/bottles/uuid/photos', formData);
```

**Supported Formats:** JPEG, PNG, WebP  
**Max Size:** 10MB  
**Bucket:** `barrelchatter-images` (nyc3 region)

---

## Pagination

List endpoints support pagination via `limit` and `offset`:

```javascript
// First page
const page1 = await api.get('/v1/bottles', { limit: 20, offset: 0 });

// Second page
const page2 = await api.get('/v1/bottles', { limit: 20, offset: 20 });
```

**Response includes:**
```json
{
  "data": [ /* items */ ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General:** 100 requests/minute per user
- **Auth:** 10 requests/minute for login attempts
- **Uploads:** 20 uploads/hour

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

When rate limited, API returns `429 Too Many Requests`.
