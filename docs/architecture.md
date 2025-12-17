# Frontend Architecture

> Technical architecture documentation for the BarrelChatter web application.

---

## Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Routing](#routing)
- [State Management](#state-management)
- [Authentication Flow](#authentication-flow)
- [API Integration](#api-integration)
- [Styling Architecture](#styling-architecture)
- [Key Patterns](#key-patterns)

---

## Overview

BarrelChatter's frontend is a React single-page application (SPA) that provides:

- **Collector Features:** Bottle catalog, inventory tracking, tasting journal, wishlist
- **Admin Features:** User management, tag administration, moderation tools
- **NFC Integration:** Tag lookup, claiming, and bottle assignment

### Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                     │
├─────────────────────────────────────────────────────────┤
│  React 18          │  UI Framework                       │
│  React Router 6    │  Client-side routing                │
│  Axios             │  HTTP client with interceptors      │
│  SCSS Modules      │  Component-scoped styling           │
│  Context API       │  Global state (auth)                │
└─────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
src/
├── api/
│   └── client.js               # Axios instance with auth
│
├── components/
│   ├── layout/
│   │   └── AppLayout.jsx       # Main app shell with sidebar
│   │
│   ├── BarrelTrackingSection.jsx
│   ├── BottlePricingCard.jsx
│   ├── DealBadge.jsx
│   ├── LogTastingModal.jsx
│   ├── NewBottleSubmissionModal.jsx
│   ├── PhotoUpload.jsx
│   ├── ProtectedRoute.jsx
│   ├── PurchaseInfoSection.jsx
│   ├── PurchaseLocationSelect.jsx
│   └── StorageLocationSelect.jsx
│
├── context/
│   └── AuthContext.jsx         # Authentication state & methods
│
├── hooks/
│   ├── usePricing.js           # Pricing data fetching
│   └── useSpacesUpload.js      # File upload to DO Spaces
│
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── HomePage.jsx
│   ├── BottlesPage.jsx
│   ├── BottleDetailPage.jsx
│   ├── InventoryPage.jsx
│   ├── InventoryDetailPage.jsx
│   ├── TastingsPage.jsx
│   ├── WishlistPage.jsx
│   ├── TagsPage.jsx
│   ├── StorageLocationsPage.jsx
│   ├── ProfilePage.jsx
│   └── Admin*.jsx              # Admin pages
│
├── styles/
│   ├── _design-system.scss     # Variables, mixins, base styles
│   ├── global.scss             # Global styles
│   ├── theme.scss              # Theme variables
│   └── *.module.scss           # Component-specific styles
│
└── App.jsx                     # Router configuration
```

---

## Routing

### Route Configuration

```jsx
// App.jsx structure
<BrowserRouter>
  <AuthProvider>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes */}
      <Route path="/app" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        {/* Nested routes render in <Outlet /> */}
        <Route path="home" element={<HomePage />} />
        <Route path="bottles" element={<BottlesPage />} />
        <Route path="bottles/:id" element={<BottleDetailPage />} />
        {/* ... */}
        
        {/* Admin routes with role check */}
        <Route path="admin/users" element={
          <ProtectedRoute requireRoles={['admin']}>
            <AdminUsersPage />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/app/home" />} />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

### Route Protection

```jsx
// ProtectedRoute.jsx
function ProtectedRoute({ children, requireRoles }) {
  const { user, initializing } = useAuth();

  if (initializing) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (requireRoles && !requireRoles.includes(user.role)) {
    return <Navigate to="/app/inventory" replace />;
  }

  return children;
}
```

---

## State Management

### Global State: AuthContext

```jsx
// context/AuthContext.jsx
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('authUser');
    if (stored) setUser(JSON.parse(stored));
    setInitializing(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/v1/auth/login', { email, password });
    const { user, token } = res.data;
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Local State Patterns

```jsx
// Page-level state
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

// Form state
const [form, setForm] = useState({ name: '', brand: '' });
const [submitting, setSubmitting] = useState(false);

// Modal/edit state
const [editMode, setEditMode] = useState(false);
const [editingId, setEditingId] = useState(null);
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User visits /login                                       │
│     ↓                                                        │
│  2. Submits credentials                                      │
│     ↓                                                        │
│  3. POST /v1/auth/login                                      │
│     ↓                                                        │
│  4. Receive { user, token }                                  │
│     ↓                                                        │
│  5. Store in localStorage                                    │
│     - authToken (JWT)                                        │
│     - authUser (user object)                                 │
│     ↓                                                        │
│  6. Update AuthContext                                       │
│     ↓                                                        │
│  7. Navigate to /app/home                                    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    Subsequent Requests                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  api.get('/v1/bottles')                                      │
│     ↓                                                        │
│  Axios interceptor adds:                                     │
│     Authorization: Bearer <token>                            │
│     ↓                                                        │
│  API validates token                                         │
│     ↓                                                        │
│  Response returned                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Token Handling

```javascript
// api/client.js
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## API Integration

### Request Patterns

```javascript
// GET list with pagination
async function loadItems() {
  setLoading(true);
  setError('');
  try {
    const res = await api.get('/v1/bottles?limit=100&offset=0');
    setItems(res.data?.bottles || []);
    setTotal(res.data?.total || 0);
  } catch (err) {
    setError(err?.response?.data?.error || 'Failed to load');
  } finally {
    setLoading(false);
  }
}

// GET single item
const res = await api.get(`/v1/bottles/${id}`);
const bottle = res.data?.bottle;

// POST create
const res = await api.post('/v1/inventory', {
  bottle_id: bottleId,
  location_label: 'Home Bar',
  status: 'sealed',
});
const newItem = res.data?.inventory;

// PATCH update
await api.patch(`/v1/tastings/${id}`, {
  rating: 8.5,
  notes: 'Updated notes',
});

// DELETE
await api.delete(`/v1/wishlists/${id}`);
```

### Error Handling Pattern

```javascript
try {
  const res = await api.post('/v1/bottles', payload);
  // Success handling
} catch (err) {
  console.error(err);
  const message = err?.response?.data?.error 
    || err?.message 
    || 'An unexpected error occurred';
  setError(message);
}
```

---

## Styling Architecture

### SCSS Module Pattern

```scss
// PageName.module.scss
@import 'design-system';

.page {
  padding: $spacing-lg;
}

.headerRow {
  display: flex;
  justify-content: space-between;
  margin-bottom: $spacing-md;
}

.table {
  @include table-base;
}
```

```jsx
// PageName.jsx
import styles from '../styles/PageName.module.scss';

function PageName() {
  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>...</div>
    </div>
  );
}
```

### Class Composition

```jsx
// Dynamic classes
<button className={
  isActive ? styles.buttonActive : styles.button
}>

// Multiple classes
<div className={`${styles.card} ${styles.compact}`}>
```

---

## Key Patterns

### 1. List Page Pattern

```jsx
function ListPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');

  async function loadItems() {
    setLoading(true);
    try {
      const res = await api.get('/v1/items?limit=100');
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadItems(); }, []);

  const filteredItems = items.filter(/* search filter */);

  return (
    <div className={styles.page}>
      {/* Header with count & actions */}
      {/* Search & filters */}
      {/* View mode toggle */}
      
      {loading && <div>Loading...</div>}
      {error && <div className={styles.error}>{error}</div>}
      
      {viewMode === 'list' && <TableView items={filteredItems} />}
      {viewMode === 'cards' && <CardGrid items={filteredItems} />}
      {viewMode === 'gallery' && <GalleryGrid items={filteredItems} />}
    </div>
  );
}
```

### 2. Detail Page Pattern

```jsx
function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/v1/items/${id}`);
        setItem(res.data?.item);
      } catch (err) {
        setError(err?.response?.status === 404 
          ? 'Not found' 
          : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <div className={styles.page}>
      <button onClick={() => navigate(-1)}>← Back</button>
      
      {loading && <div>Loading...</div>}
      {error && <div className={styles.error}>{error}</div>}
      
      {item && (
        editMode ? <EditForm item={item} /> : <DetailView item={item} />
      )}
    </div>
  );
}
```

### 3. Modal Pattern

```jsx
function Modal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <header>
          <h2>Title</h2>
          <button onClick={onClose}>✕</button>
        </header>
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
          {error && <div className={styles.error}>{error}</div>}
          <footer>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
```

### 4. Inline Edit Pattern

```jsx
function EditableRow({ item, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function startEdit() {
    setEditing(true);
    setForm({ ...item });
  }

  async function handleSave() {
    setSubmitting(true);
    try {
      await api.patch(`/v1/items/${item.id}`, form);
      onSave();
      setEditing(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <tr>
      <td>
        {editing ? (
          <input value={form.name} onChange={...} />
        ) : (
          item.name
        )}
      </td>
      <td>
        {editing ? (
          <>
            <button onClick={handleSave} disabled={submitting}>Save</button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </>
        ) : (
          <button onClick={startEdit}>Edit</button>
        )}
      </td>
    </tr>
  );
}
```

---

## Performance Considerations

### Data Loading
- Use `useEffect` cleanup to prevent state updates on unmounted components
- Implement debouncing for search inputs (300-500ms)
- Cache pricing data per bottle ID

### Rendering
- Use `useMemo` for expensive filtering/sorting operations
- Lazy load images with placeholder fallbacks
- Virtualize long lists when >100 items

### Bundle Size
- Import only needed components from libraries
- Use dynamic imports for admin pages
- Keep SCSS modules scoped to components