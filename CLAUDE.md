# BarrelChatter Web

## Overview

React web application for BarrelChatter. Provides the same functionality as the mobile app plus admin dashboard capabilities. Used primarily for admin functions and as a fallback for users who prefer web access.

## Tech Stack

- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: SCSS modules
- **HTTP Client**: fetch (native) or axios
- **Routing**: React Router v6
- **State Management**: React Context + hooks (no Redux)
- **Icons**: Feather Icons (react-feather)

## Directory Structure

```
barrelchatter-web/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── api/                 # API client and endpoint definitions
│   │   ├── client.js        # Base fetch wrapper with auth
│   │   ├── endpoints.js     # API endpoint constants
│   │   └── index.js         # Exported API functions
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Buttons, inputs, cards, modals
│   │   ├── layout/          # Header, sidebar, footer
│   │   └── index.js         # Barrel exports
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useFetch.js
│   │   └── index.js
│   ├── pages/               # Route-level page components
│   │   ├── auth/            # Login, Register, ForgotPassword
│   │   ├── collection/      # Inventory, BottleDetail
│   │   ├── tastings/        # TastingLog, TastingDetail
│   │   ├── admin/           # Admin-only pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Tags.jsx
│   │   │   ├── TagPacks.jsx
│   │   │   ├── Users.jsx
│   │   │   └── index.js
│   │   ├── Home.jsx
│   │   └── NotFound.jsx
│   ├── routes/              # Route definitions
│   │   ├── AppRoutes.jsx
│   │   ├── AdminRoutes.jsx
│   │   └── ProtectedRoute.jsx
│   ├── styles/              # Global styles and theme
│   │   ├── _variables.scss  # Colors, spacing, typography
│   │   ├── _mixins.scss     # SCSS mixins
│   │   ├── _reset.scss      # CSS reset
│   │   └── global.scss      # Global styles
│   ├── utils/               # Utility functions
│   │   ├── formatters.js    # Date, number formatting
│   │   ├── validators.js    # Form validation
│   │   └── storage.js       # localStorage helpers
│   ├── App.jsx
│   ├── main.jsx
│   └── config.js            # Environment config
├── .env.example
├── vite.config.js
├── package.json
└── CLAUDE.md
```

## Design System

### Colors (Dark Theme)

```scss
// Primary palette - matches mobile app
$color-bg-base: #1a1a1a;
$color-bg-elevated: #242424;
$color-bg-surface: #2e2e2e;

$color-accent: #d4a03c; // Gold/bourbon
$color-accent-light: #e8c068;

$color-text-primary: #ffffff;
$color-text-secondary: #a0a0a0;
$color-text-tertiary: #666666;

$color-success: #4ade80;
$color-warning: #fbbf24;
$color-danger: #f87171;
$color-info: #60a5fa;

$color-border: #3a3a3a;
```

### Typography

```scss
$font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
$font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;

$font-size-xs: 0.75rem; // 12px
$font-size-sm: 0.875rem; // 14px
$font-size-base: 1rem; // 16px
$font-size-lg: 1.125rem; // 18px
$font-size-xl: 1.25rem; // 20px
$font-size-2xl: 1.5rem; // 24px
$font-size-3xl: 1.875rem; // 30px
```

### Spacing

```scss
$spacing-1: 0.25rem; // 4px
$spacing-2: 0.5rem; // 8px
$spacing-3: 0.75rem; // 12px
$spacing-4: 1rem; // 16px
$spacing-5: 1.25rem; // 20px
$spacing-6: 1.5rem; // 24px
$spacing-8: 2rem; // 32px
$spacing-10: 2.5rem; // 40px
```

## Component Patterns

### Page Component Template

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { inventoryAPI } from '@/api';
import { PageHeader, Loading, ErrorState } from '@/components';
import styles from './CollectionPage.module.scss';

export default function CollectionPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryAPI.list();
      setInventory(data.inventory || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={loadInventory} />;

  return (
    <div className={styles.page}>
      <PageHeader title="My Collection" />
      {/* Content */}
    </div>
  );
}
```

### SCSS Module Pattern

```scss
// CollectionPage.module.scss
@import '@/styles/variables';
@import '@/styles/mixins';

.page {
  padding: $spacing-6;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $spacing-4;
}

.card {
  background: $color-bg-elevated;
  border-radius: $radius-lg;
  padding: $spacing-4;

  &:hover {
    background: $color-bg-surface;
  }
}
```

## API Integration

### API Client Setup

```javascript
// src/api/client.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  async request(method, endpoint, options = {}) {
    const { body, params } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      url += '?' + new URLSearchParams(params).toString();
    }

    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  get(endpoint, params) {
    return this.request('GET', endpoint, { params });
  }

  post(endpoint, body) {
    return this.request('POST', endpoint, { body });
  }

  put(endpoint, body) {
    return this.request('PUT', endpoint, { body });
  }

  delete(endpoint) {
    return this.request('DELETE', endpoint);
  }
}

export const api = new ApiClient();
```

### API Endpoints

```javascript
// src/api/index.js
import { api } from './client';

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const bottlesAPI = {
  list: (params) => api.get('/bottles', params),
  get: (id) => api.get(`/bottles/${id}`),
  create: (data) => api.post('/bottles', data),
  update: (id, data) => api.put(`/bottles/${id}`, data),
};

export const inventoryAPI = {
  list: (params) => api.get('/inventory', params),
  get: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
};

export const notificationsAPI = {
  list: () => api.get('/notifications'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data) => api.patch('/notifications/preferences', data),
};

export const adminTagsAPI = {
  list: (params) => api.get('/admin/tags', params),
  bulkCreate: (nfcUids) => api.post('/admin/tags/bulk', { nfc_uids: nfcUids }),
  reset: (id) => api.post(`/admin/tags/${id}/reset`),
  delete: (id) => api.delete(`/admin/tags/${id}`),
};

export const adminTagPacksAPI = {
  list: (params) => api.get('/admin/tag-packs', params),
  get: (id) => api.get(`/admin/tag-packs/${id}`),
  create: (data) => api.post('/admin/tag-packs', data),
  getQrData: (id) => api.get(`/admin/tag-packs/${id}/qr-data`),
  void: (id, reason) => api.post(`/admin/tag-packs/${id}/void`, { reason }),
  addTags: (id, nfcUids) =>
    api.post(`/admin/tag-packs/${id}/add-tags`, { nfc_uids: nfcUids }),
};
```

## Routing

### Route Structure

```jsx
// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks';

// Pages
import Login from '@/pages/auth/Login';
import Home from '@/pages/Home';
import Collection from '@/pages/collection/Collection';
import BottleDetail from '@/pages/collection/BottleDetail';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminTags from '@/pages/admin/Tags';

// Guards
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected - requires auth */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/collection/:id" element={<BottleDetail />} />
        <Route path="/tastings" element={<Tastings />} />
      </Route>

      {/* Admin - requires auth + admin role */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/tags" element={<AdminTags />} />
        <Route path="/admin/tag-packs" element={<AdminTagPacks />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

### Protected Route

```jsx
// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
```

## Navigation Changes

### Updated Sidebar Navigation

The sidebar navigation has been updated to use consistent terminology:

- **"Bottles"** → **"Catalog"** - Browse global bottle database
- **"Inventory"** → **"My Collection"** - User's personal inventory

### Bottles/Catalog Page

The BottlesPage.jsx now includes a **"My Submissions"** tab that allows users to:
- View bottles they've submitted to the catalog
- Filter by status (pending, approved, rejected)
- Uses `created_by_user_id` and `status` query parameters

### Profile Page - Notifications Tab

ProfilePage.jsx has been enhanced with a **Notifications** tab for managing email preferences:
- Email notification settings (submission approved/rejected, wishlist alerts)
- Push notification preferences (managed via mobile app)

## Admin Section

### Admin Layout

Admin pages use a sidebar layout:

```
┌─────────────────────────────────────────┐
│  Header (logo, user menu)               │
├──────────┬──────────────────────────────┤
│ Sidebar  │  Main Content                │
│          │                              │
│ Dashboard│                              │
│ Tags     │                              │
│ Tag Packs│                              │
│ Users    │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

### Admin Pages

| Route                  | Component     | Purpose                          |
| ---------------------- | ------------- | -------------------------------- |
| `/admin`               | Dashboard     | Stats overview, quick actions    |
| `/admin/tags`          | Tags          | List, search, reset, delete tags |
| `/admin/tag-packs`     | TagPacks      | Create packs, generate QR codes  |
| `/admin/tag-packs/:id` | TagPackDetail | View pack, share QR, manage      |
| `/admin/users`         | Users         | Invite users, manage accounts    |

## Environment Variables

```bash
# .env.example
VITE_API_URL=http://localhost:3000/v1
VITE_APP_NAME=BarrelChatter
VITE_ENABLE_DEVTOOLS=true
```

Access in code:

```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Development

### Start Development Server

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview  # Test production build locally
```

### Linting

```bash
npm run lint      # Check for issues
npm run lint:fix  # Auto-fix issues
```

## Conventions

### File Naming

- Components: PascalCase (`TagCard.jsx`)
- Styles: PascalCase with .module.scss (`TagCard.module.scss`)
- Utilities: camelCase (`formatDate.js`)
- Constants: SCREAMING_SNAKE_CASE in file, camelCase filename

### Import Aliases

```javascript
// vite.config.js defines @ as src/
import { Button } from '@/components';
import { useAuth } from '@/hooks';
import styles from '@/styles/variables';
```

### Component Props

- Destructure props in function signature
- Use default values where sensible
- Document complex props with JSDoc

```jsx
/**
 * Tag card component
 * @param {Object} tag - Tag data
 * @param {Function} onReset - Called when reset button clicked
 * @param {boolean} showActions - Whether to show action buttons
 */
function TagCard({ tag, onReset, showActions = true }) {
  // ...
}
```

## Common Tasks

### Add a New Admin Page

1. Create component in `src/pages/admin/NewPage.jsx`
2. Add route in `src/routes/AppRoutes.jsx` under AdminRoute
3. Add link to admin sidebar
4. Create SCSS module for styles

### Add a New API Endpoint

1. Add function to appropriate file in `src/api/`
2. Follow existing patterns for error handling
3. Use in component with try/catch or useFetch hook

### Add a New Component

1. Create in `src/components/` (or subdirectory)
2. Create accompanying `.module.scss` file
3. Export from `src/components/index.js`
4. Document props if complex

## Testing

```bash
npm run test        # Run tests
npm run test:watch  # Watch mode
npm run test:coverage
```

## Key Differences from Mobile

| Aspect     | Mobile                   | Web                               |
| ---------- | ------------------------ | --------------------------------- |
| NFC        | react-native-nfc-manager | Not available (manual entry only) |
| Storage    | AsyncStorage             | localStorage                      |
| Navigation | React Navigation         | React Router                      |
| Styling    | StyleSheet.create        | SCSS Modules                      |
| Haptics    | Available                | Not available                     |

## QR Code Display

For admin tag pack pages, use `qrcode.react`:

```jsx
import { QRCodeSVG } from 'qrcode.react';

<QRCodeSVG value={claimUrl} size={200} level="M" includeMargin />;
```
