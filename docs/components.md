# BarrelChatter Components Reference

Documentation for shared and reusable components.

---

## Layout Components

### AppLayout

**File:** `src/components/layout/AppLayout.jsx`  
**Style:** `src/styles/AppLayout.module.scss`

**Purpose:** Main authenticated application shell with sidebar navigation.

**Structure:**
```
┌─────────────────────────────────────────────────┐
│ Logo                              User ▼ Logout │  ← Topbar
├────────────┬────────────────────────────────────┤
│            │                                    │
│  Navigation│         <Outlet />                 │
│            │                                    │
│  - Home    │      (Page Content)                │
│  - Bottles │                                    │
│  - Inv...  │                                    │
│  - Tast... │                                    │
│  - Wish... │                                    │
│  - Tags    │                                    │
│            │                                    │
│  ADMIN     │                                    │
│  - Users   │                                    │
│  - Tags    │                                    │
│  - Audit   │                                    │
│            │                                    │
└────────────┴────────────────────────────────────┘
     Sidebar              Content Area
```

**Features:**
- Collapsible sidebar (future)
- Active link highlighting
- Role-based admin section visibility
- User avatar in topbar
- Logout button

**Props:** None (uses AuthContext for user data)

**Usage:**
```jsx
// In App.jsx
<Route path="/app" element={
  <ProtectedRoute>
    <AppLayout />
  </ProtectedRoute>
}>
  <Route index element={<HomePage />} />
  {/* ... child routes */}
</Route>
```

---

### ProtectedRoute

**File:** `src/components/ProtectedRoute.jsx`

**Purpose:** Route guard for authentication and role-based access.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | required | Protected content |
| `requireRoles` | string[] | `null` | Required roles (admin, moderator) |

**Behavior:**
1. If not authenticated → Redirect to `/login`
2. If authenticated but missing required role → Show access denied
3. If authenticated with valid role → Render children

**Usage:**
```jsx
// Basic authentication
<ProtectedRoute>
  <HomePage />
</ProtectedRoute>

// Role-based protection
<ProtectedRoute requireRoles={['admin']}>
  <AdminUsersPage />
</ProtectedRoute>

// Multiple allowed roles
<ProtectedRoute requireRoles={['moderator', 'admin']}>
  <AdminBottleSubmissionsPage />
</ProtectedRoute>
```

---

## Modal Components

### LogTastingModal

**File:** `src/components/LogTastingModal.jsx`  
**Style:** `src/styles/LogTastingModal.module.scss`

**Purpose:** Form for logging a new pour/tasting.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `inventoryId` | string | `null` | Pre-selected inventory item |
| `onClose` | function | required | Close handler |
| `onSaved` | function | `null` | Success callback |

**State:**
- `inventoryItems` - User's open bottles for selection
- `selectedInventoryId` - Currently selected bottle
- `pourAmount` - Pour size in oz
- `rating` - 0-10 rating
- `notes` - Tasting notes
- `loading`, `error` - UI states

**Features:**
- Pour amount presets (0.5, 1, 1.5, 2 oz)
- Custom pour amount input
- Rating slider/input
- Freeform notes
- Error handling

**API Calls:**
- `GET /v1/inventory?status=open` - Load open bottles
- `POST /v1/tastings` - Create tasting

---

### NewBottleSubmissionModal

**File:** `src/components/NewBottleSubmissionModal.jsx`  
**Style:** `src/styles/NewBottleSubmissionModal.module.scss`

**Purpose:** Form for submitting a new bottle to the catalog.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onClose` | function | required | Close handler |
| `onSaved` | function | `null` | Success callback |

**Form Fields:**
- `name` - Bottle name (required)
- `brand` - Brand name
- `distillery` - Distillery (required)
- `type` - Whiskey type (required)
- `proof` - Proof/ABV
- `age_statement` - Age statement
- `description` - Detailed description
- `mashbill` - Mashbill info
- `flavorTags` - Flavor profile tags

**Type Options:**
- Bourbon
- Rye
- Scotch
- Irish
- Japanese
- Canadian
- Other

**API Calls:**
- `POST /v1/bottles/submissions` - Submit bottle

---

## Context Providers

### AuthContext

**File:** `src/context/AuthContext.jsx`

**Purpose:** Global authentication state management.

**Provided Values:**
| Value | Type | Description |
|-------|------|-------------|
| `user` | object | Current user data |
| `token` | string | JWT token |
| `isAuthenticated` | boolean | Auth status |
| `isLoading` | boolean | Initial auth check |
| `login` | function | Login handler |
| `logout` | function | Logout handler |
| `refreshUser` | function | Refresh user data |

**User Object:**
```javascript
{
  id: "uuid",
  email: "user@example.com",
  name: "User Name",
  role: "user", // user | moderator | admin
  avatar_url: "https://...",
  created_at: "2024-01-01T00:00:00Z"
}
```

**Usage:**
```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Storage:**
- Token stored in `localStorage` under `bc_token`
- User data stored in `localStorage` under `bc_user`

---

## Utility Components (Planned)

### LoadingSpinner

```jsx
<LoadingSpinner size="sm" /> // 16px
<LoadingSpinner size="md" /> // 24px
<LoadingSpinner size="lg" /> // 32px
```

### EmptyState

```jsx
<EmptyState
  icon="📦"
  title="No bottles yet"
  description="Add your first bottle to get started"
  action={<Button>Add Bottle</Button>}
/>
```

### ConfirmDialog

```jsx
<ConfirmDialog
  title="Delete Tasting?"
  message="This cannot be undone."
  confirmLabel="Delete"
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
```

### Toast

```jsx
// Via context
const { showToast } = useToast();
showToast('Tasting saved!', 'success');
showToast('Failed to save', 'error');
```

---

## Component Patterns

### Page Component Structure

```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import styles from '../styles/PageName.module.scss';

function PageName() {
  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Auth
  const { user } = useAuth();
  
  // Data fetching
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.get('/v1/endpoint');
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  
  // Render
  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  
  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1>Page Title</h1>
      </div>
      {/* Content */}
    </div>
  );
}

export default PageName;
```

### Modal Component Structure

```jsx
import React, { useState } from 'react';
import api from '../api/api';
import styles from '../styles/ModalName.module.scss';

function ModalName({ onClose, onSaved }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/v1/endpoint', formData);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Modal Title</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        {error && <p className={styles.error}>{error}</p>}
        
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Form fields */}
          
          <div className={styles.footer}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalName;
```

### Form Handling Pattern

```jsx
const [formData, setFormData] = useState({
  name: '',
  email: '',
  notes: ''
});

function handleChange(e) {
  const { name, value, type, checked } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value
  }));
}

// In JSX
<input
  name="name"
  value={formData.name}
  onChange={handleChange}
  className={styles.input}
/>
```

### API Error Handling Pattern

```jsx
try {
  const result = await api.post('/v1/endpoint', data);
  // Handle success
} catch (err) {
  if (err.status === 400) {
    setError('Invalid data. Please check your input.');
  } else if (err.status === 401) {
    // Redirect to login
  } else if (err.status === 403) {
    setError('You do not have permission to do this.');
  } else if (err.status === 404) {
    setError('Item not found.');
  } else {
    setError('Something went wrong. Please try again.');
  }
}
```
