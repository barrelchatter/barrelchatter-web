# BarrelChatter Role-Based Access

Documentation for the permission system and route protection.

---

## Overview

BarrelChatter uses role-based access control (RBAC) to manage permissions:

| Role | Description |
|------|-------------|
| `user` | Standard user with full collector features |
| `moderator` | Can review bottle submissions |
| `admin` | Full administrative access |

---

## Role Hierarchy

```
admin
  └── moderator
        └── user
```

Each role includes all permissions of roles below it.

---

## Permission Matrix

| Feature | User | Moderator | Admin |
|---------|:----:|:---------:|:-----:|
| View bottles | ✅ | ✅ | ✅ |
| Manage own inventory | ✅ | ✅ | ✅ |
| Log tastings | ✅ | ✅ | ✅ |
| Manage wishlist | ✅ | ✅ | ✅ |
| Claim tags | ✅ | ✅ | ✅ |
| Submit bottles | ✅ | ✅ | ✅ |
| Review submissions | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Manage invitations | ❌ | ❌ | ✅ |
| Register tags | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |

---

## Implementation

### User Object

Role is stored in the user object:

```javascript
{
  id: "uuid",
  email: "user@example.com",
  name: "User Name",
  role: "user",  // "user" | "moderator" | "admin"
  avatar_url: "https://...",
  created_at: "2024-01-01T00:00:00Z"
}
```

### Checking Roles

```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  
  // Check single role
  const isAdmin = user.role === 'admin';
  
  // Check multiple roles
  const canModerate = ['moderator', 'admin'].includes(user.role);
  
  // Conditional rendering
  return (
    <div>
      {canModerate && <ModeratorTools />}
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

---

## Route Protection

### ProtectedRoute Component

```jsx
// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requireRoles = null }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  
  // Still loading auth state
  if (isLoading) {
    return (
      <div className="loading">
        Loading...
      </div>
    );
  }
  
  // Not logged in
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }
  
  // Check role requirements
  if (requireRoles && !requireRoles.includes(user.role)) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
        <a href="/app">Return to Dashboard</a>
      </div>
    );
  }
  
  return children;
}

export default ProtectedRoute;
```

### Route Configuration

```jsx
// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Authenticated routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* All users */}
        <Route index element={<HomePage />} />
        <Route path="bottles" element={<BottlesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="tastings" element={<TastingsPage />} />
        
        {/* Moderator+ only */}
        <Route
          path="admin/bottles-submissions"
          element={
            <ProtectedRoute requireRoles={['moderator', 'admin']}>
              <AdminBottleSubmissionsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Admin only */}
        <Route
          path="admin/users"
          element={
            <ProtectedRoute requireRoles={['admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/tags"
          element={
            <ProtectedRoute requireRoles={['admin']}>
              <AdminTagsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit-logs"
          element={
            <ProtectedRoute requireRoles={['admin']}>
              <AdminAuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
```

---

## UI Visibility

### Conditional Navigation

```jsx
// In AppLayout.jsx
function AppLayout() {
  const { user } = useAuth();
  
  const canModerate = ['moderator', 'admin'].includes(user.role);
  const isAdmin = user.role === 'admin';
  
  return (
    <div className={styles.layout}>
      <nav className={styles.sidebar}>
        {/* Standard links */}
        <NavLink to="/app/home">Home</NavLink>
        <NavLink to="/app/bottles">Bottles</NavLink>
        <NavLink to="/app/inventory">Inventory</NavLink>
        <NavLink to="/app/tastings">Tastings</NavLink>
        <NavLink to="/app/wishlists">Wishlist</NavLink>
        <NavLink to="/app/tags">Tags</NavLink>
        
        {/* Admin section */}
        {(canModerate || isAdmin) && (
          <div className={styles.adminSection}>
            <h4>Admin</h4>
            
            {canModerate && (
              <NavLink to="/app/admin/bottles-submissions">
                Submissions
              </NavLink>
            )}
            
            {isAdmin && (
              <>
                <NavLink to="/app/admin/users">Users</NavLink>
                <NavLink to="/app/admin/tags">Tags</NavLink>
                <NavLink to="/app/admin/audit-logs">Audit Logs</NavLink>
              </>
            )}
          </div>
        )}
      </nav>
      
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
```

### Conditional Actions

```jsx
function BottleCard({ bottle }) {
  const { user } = useAuth();
  
  return (
    <div className={styles.card}>
      <h3>{bottle.name}</h3>
      
      {/* All users can add to wishlist */}
      <button onClick={handleAddToWishlist}>
        Add to Wishlist
      </button>
      
      {/* Only owner or admin can edit */}
      {(bottle.created_by === user.id || user.role === 'admin') && (
        <button onClick={handleEdit}>
          Edit
        </button>
      )}
      
      {/* Only admin can delete */}
      {user.role === 'admin' && (
        <button onClick={handleDelete} className={styles.danger}>
          Delete
        </button>
      )}
    </div>
  );
}
```

---

## API Authorization

### Backend Middleware

The API validates roles on protected endpoints:

```javascript
// Example middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    next();
  };
}

// Usage
app.get('/v1/admin/users', requireRole('admin'), getUsersHandler);
app.put('/v1/bottles/submissions/:id/approve', requireRole('moderator', 'admin'), approveHandler);
```

### Frontend Error Handling

```jsx
try {
  await api.get('/v1/admin/users');
} catch (err) {
  if (err.status === 401) {
    // Not authenticated - redirect to login
    logout();
    navigate('/login');
  } else if (err.status === 403) {
    // Authenticated but not authorized
    setError('You do not have permission to access this resource.');
  }
}
```

---

## Role Management

### Changing Roles (Admin Only)

```jsx
async function updateUserRole(userId, newRole) {
  await api.put(`/v1/admin/users/${userId}`, {
    role: newRole
  });
}
```

### Available Roles

| Role | Value | Use Case |
|------|-------|----------|
| Standard User | `user` | Regular collectors |
| Moderator | `moderator` | Content review team |
| Administrator | `admin` | Platform owners |

---

## Security Considerations

### Defense in Depth

Role checks happen at multiple levels:

1. **UI** - Hide unauthorized features
2. **Route** - Block access to protected routes
3. **API** - Validate on every request

### Never Trust the Client

- Always validate roles on the server
- UI hiding is for UX, not security
- JWT contains role but server re-validates

### Token Security

- Role is encoded in JWT
- Token signed by server
- Cannot be tampered with
- Refresh token for role changes (future)

---

## Common Patterns

### Role Badge Display

```jsx
function RoleBadge({ role }) {
  const roleConfig = {
    admin: { label: 'Admin', className: styles.adminBadge },
    moderator: { label: 'Mod', className: styles.modBadge },
    user: { label: 'User', className: styles.userBadge }
  };
  
  const config = roleConfig[role] || roleConfig.user;
  
  return (
    <span className={config.className}>
      {config.label}
    </span>
  );
}
```

### Permission Helper Hook

```jsx
function usePermissions() {
  const { user } = useAuth();
  
  return {
    isAdmin: user?.role === 'admin',
    isModerator: ['moderator', 'admin'].includes(user?.role),
    canEdit: (ownerId) => user?.id === ownerId || user?.role === 'admin',
    canModerate: ['moderator', 'admin'].includes(user?.role)
  };
}

// Usage
function Component() {
  const { isAdmin, canEdit } = usePermissions();
  
  return (
    <div>
      {canEdit(item.owner_id) && <EditButton />}
      {isAdmin && <DeleteButton />}
    </div>
  );
}
```
