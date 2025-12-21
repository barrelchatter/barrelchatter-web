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

export const menusAPI = {
  list: () => api.get('/menus'),
  get: (id) => api.get(`/menus/${id}`),
  create: (data) => api.post('/menus', data),
  update: (id, data) => api.patch(`/menus/${id}`, data),
  delete: (id) => api.delete(`/menus/${id}`),
  regenerateToken: (id) => api.post(`/menus/${id}/regenerate-token`),
  setLocations: (id, locationIds) =>
    api.put(`/menus/${id}/locations`, { storage_location_ids: locationIds }),
};

export const storageLocationsAPI = {
  list: () => api.get('/storage-locations'),
};

export const publicMenuAPI = {
  get: (shareToken) => api.get(`/menu/${shareToken}`),
};

export const groupsAPI = {
  list: (params) => api.get('/groups', { params }),
  discover: (params) => api.get('/groups/discover', { params }),
  invites: () => api.get('/groups/invites'),
  get: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.patch(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  invite: (groupId, userId, message) => api.post(`/groups/${groupId}/invite/${userId}`, { message }),
  join: (id) => api.post(`/groups/${id}/join`),
  decline: (id) => api.post(`/groups/${id}/decline`),
  leave: (id) => api.post(`/groups/${id}/leave`),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
  activity: (id, params) => api.get(`/groups/${id}/activity`, { params }),
  bottles: (id) => api.get(`/groups/${id}/bottles`),
  shareBottle: (groupId, inventoryId, notes) => api.post(`/groups/${groupId}/bottles`, { inventory_id: inventoryId, notes }),
  unshareBottle: (groupId, inventoryId) => api.delete(`/groups/${groupId}/bottles/${inventoryId}`),
};

export const purchaseLocationsAPI = {
  list: (params) => api.get('/purchase-locations', { params }),
  get: (id) => api.get(`/purchase-locations/${id}`),
  create: (data) => api.post('/purchase-locations', data),
  mySubmissions: (params) => api.get('/purchase-locations/my-submissions', { params }),
  nearby: (lat, lng, radius) => api.get('/purchase-locations/nearby', { params: { lat, lng, radius } }),
  getMapUrls: (id) => api.get(`/purchase-locations/${id}/map-urls`),
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

### Tags Page

TagsPage.jsx provides user-facing tag management capabilities:
- **Tag Lookup** - Look up tags by NFC UID to check ownership and linked bottles
- **Tag List** - View all tags owned by the user with linked inventory information
- **Tag Actions**:
  - **Edit Label** - Update tag's custom label (uses PUT /v1/tags/:id)
  - **Unlink** - Disconnect tag from bottle while keeping ownership (uses POST /v1/tags/:id/unlink)
  - **Release** - Return tag to unassigned status (uses DELETE /v1/tags/:id)
- **Claim & Link** - Claim unassigned tags and assign them to inventory items
- **Danger Zone** - Clear visual separation for destructive actions (unlink, release)

### Menus Page (Multi-Menu Sharing)

MenusPage.jsx (`/app/menus`) provides menu management for shareable whiskey collection views:

**Components:**
- `pages/MenusPage.jsx` - Menu management dashboard
- `components/MenuEditModal.jsx` - Create/edit menu modal
- `components/MenuPdfExport.jsx` - PDF generation component

**Features:**
- **Menu List** - Card grid showing all user menus with status, theme, bottle count
- **Create Menu** - Modal with name, theme selection, storage location filters
- **Edit Menu** - Update settings, change theme/colors, modify location filters
- **Share Settings** - Enable/disable public sharing, regenerate share token
- **Copy Link** - Quick copy share URL to clipboard
- **Preview** - Open public menu in new tab
- **PDF Export** - Generate downloadable PDF of menu (uses html2pdf.js)
- **Delete** - Soft delete with confirmation

**Storage Location Filtering:**
- Multi-select storage locations to filter which bottles appear
- "Include child locations" toggle for hierarchical filtering
- No locations selected = show all bottles

### Menu Theme System

The web app supports multiple display themes for public menus:

**Theme Files:**
```
src/styles/menu-themes/
├── _index.scss      # Theme imports and class definitions
├── _rustic.scss     # Dark wood, gold accents (default)
├── _elegant.scss    # Playfair Display, refined serif
└── _modern.scss     # Clean, minimal sans-serif
```

**Theme Classes (applied to page root):**
- `.theme-rustic.mode-dark` / `.theme-rustic.mode-light`
- `.theme-elegant.mode-dark` / `.theme-elegant.mode-light`
- `.theme-modern.mode-dark` / `.theme-modern.mode-light`

**CSS Variables (set by themes):**
```scss
--menu-bg-base          // Page background
--menu-bg-surface       // Card/section backgrounds
--menu-bg-elevated      // Elevated elements
--menu-text-primary     // Main text color
--menu-text-secondary   // Secondary text
--menu-text-tertiary    // Muted text
--menu-accent           // Brand/accent color
--menu-border-subtle    // Subtle borders
--menu-border-accent    // Accent borders
--menu-font-heading     // Heading font family
--menu-font-body        // Body font family
```

**Important:** Theme classes are defined in `global.scss` (not CSS modules) so they remain unhashed and can be applied dynamically.

### PDF Export

PDF generation for menus uses html2pdf.js:

```jsx
// MenuPdfExport.jsx
import html2pdf from 'html2pdf.js';

const handleDownload = async () => {
  const element = contentRef.current;
  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: `${menuTitle}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
  };
  await html2pdf().set(opt).from(element).save();
};
```

**Dependency:** `html2pdf.js` (dynamically imported)

### Groups Page

GroupsPage.jsx (`/app/groups`) provides group management for collector groups:

**Components:**
- `pages/GroupsPage.jsx` - Groups list with tabs
- `pages/GroupDetailPage.jsx` - Single group view with activity/members/bottles
- `components/GroupEditModal.jsx` - Create/edit group modal
- `components/GroupInviteModal.jsx` - Invite members modal

**Features:**
- **My Groups Tab** - List groups user is a member of, shows role (Owner/Member)
- **Discover Tab** - Search public groups, see pending invites
- **Invites Tab** - Pending group invitations with accept/decline
- **Group Detail** - Activity feed, members list, shared bottles
- **Owner Controls** - Edit group, remove members, delete group
- **Member Controls** - Leave group, invite others

### Purchase Locations Page

PurchaseLocationsPage.jsx (`/app/locations`) provides location catalog:

**Components:**
- `pages/PurchaseLocationsPage.jsx` - 3-tab location browser
- `pages/LocationDetailPage.jsx` - Single location view with map
- `components/NewLocationModal.jsx` - Submit new location form
- `components/MapEmbed.jsx` - Google Maps iframe embed
- `components/MapLinks.jsx` - External map app links

**Features:**
- **Browse Tab** - Search/filter by name, type, state
- **My Submissions Tab** - View submitted locations with status
- **Nearby Tab** - Geolocation-based discovery with radius selector
- **Location Detail** - Address, contact, map embed, purchase stats

**Location Types:** Liquor Store, Grocery Store, Bar, Restaurant, Distillery, Online, Other

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
