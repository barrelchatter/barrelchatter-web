# BarrelChatter Authentication

Documentation for authentication flows and session management.

---

## Overview

BarrelChatter uses JWT (JSON Web Token) authentication:

1. User logs in with email/password
2. Server returns JWT token and user data
3. Token is stored in localStorage
4. All API requests include token in Authorization header
5. Token expires after 7 days (configurable)

---

## Authentication Flow

### Login

```
┌─────────┐          ┌─────────┐          ┌─────────┐
│  User   │          │   Web   │          │   API   │
└────┬────┘          └────┬────┘          └────┬────┘
     │                    │                    │
     │ Enter credentials  │                    │
     │───────────────────>│                    │
     │                    │                    │
     │                    │ POST /auth/login   │
     │                    │───────────────────>│
     │                    │                    │
     │                    │ {token, user}      │
     │                    │<───────────────────│
     │                    │                    │
     │                    │ Store in localStorage
     │                    │──────────┐         │
     │                    │          │         │
     │                    │<─────────┘         │
     │                    │                    │
     │ Redirect to /app   │                    │
     │<───────────────────│                    │
     │                    │                    │
```

### Registration (Invite-Only)

```
┌─────────┐          ┌─────────┐          ┌─────────┐
│  User   │          │   Web   │          │   API   │
└────┬────┘          └────┬────┘          └────┬────┘
     │                    │                    │
     │ Click invite link  │                    │
     │───────────────────>│                    │
     │                    │                    │
     │                    │ GET /validate-token│
     │                    │───────────────────>│
     │                    │                    │
     │                    │ {valid: true}      │
     │                    │<───────────────────│
     │                    │                    │
     │ Fill registration  │                    │
     │───────────────────>│                    │
     │                    │                    │
     │                    │ POST /auth/register│
     │                    │───────────────────>│
     │                    │                    │
     │                    │ {token, user}      │
     │                    │<───────────────────│
     │                    │                    │
     │ Redirect to /app   │                    │
     │<───────────────────│                    │
     │                    │                    │
```

---

## Implementation

### AuthContext

**File:** `src/context/AuthContext.jsx`

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('bc_token');
    const storedUser = localStorage.getItem('bc_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Optionally validate token with API
    }
    
    setIsLoading(false);
  }, []);
  
  async function login(email, password) {
    const response = await api.post('/v1/auth/login', { email, password });
    
    setToken(response.token);
    setUser(response.user);
    
    localStorage.setItem('bc_token', response.token);
    localStorage.setItem('bc_user', JSON.stringify(response.user));
    
    return response.user;
  }
  
  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bc_token');
    localStorage.removeItem('bc_user');
  }
  
  async function refreshUser() {
    if (!token) return;
    
    const response = await api.get('/v1/users/me');
    setUser(response);
    localStorage.setItem('bc_user', JSON.stringify(response));
  }
  
  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    refreshUser
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### ProtectedRoute

**File:** `src/components/ProtectedRoute.jsx`

```jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requireRoles = null }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  
  // Still checking auth status
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check role requirements
  if (requireRoles && !requireRoles.includes(user.role)) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }
  
  return children;
}

export default ProtectedRoute;
```

---

## Storage

### localStorage Keys

| Key | Content | Type |
|-----|---------|------|
| `bc_token` | JWT token | string |
| `bc_user` | User object | JSON string |

### Token Structure

JWT payload contains:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "user",
  "iat": 1640000000,
  "exp": 1640604800
}
```

---

## Security Considerations

### Token Storage

Currently using localStorage for simplicity. Trade-offs:

**localStorage:**
- ✅ Simple to implement
- ✅ Persists across tabs/windows
- ❌ Vulnerable to XSS attacks

**Future improvement:** Use httpOnly cookies for tokens, keeping only user data in localStorage.

### XSS Protection

- React automatically escapes rendered content
- Avoid `dangerouslySetInnerHTML`
- Sanitize any user-generated content

### CSRF Protection

API uses JWT in Authorization header (not cookies), so CSRF is not a concern.

### Token Expiration

- Tokens expire after 7 days
- On 401 response, user is logged out and redirected to login
- Future: Implement refresh token flow

---

## Login Page

**File:** `src/pages/LoginPage.jsx`

```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/LoginPage.module.scss';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    
    try {
      setLoading(true);
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1>BarrelChatter</h1>
        
        {error && <p className={styles.error}>{error}</p>}
        
        <label className={styles.label}>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.input}
            required
          />
        </label>
        
        <label className={styles.label}>
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
            required
          />
        </label>
        
        <button 
          type="submit" 
          className={styles.button}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
        
        <p className={styles.signupLink}>
          Have an invite? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
```

---

## Registration Page

**File:** `src/pages/RegisterPage.jsx`

Registration requires an invitation token passed via URL query parameter.

**URL Format:** `/register?token=abc123...`

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import styles from '../styles/RegisterPage.module.scss';

function RegisterPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [tokenValid, setTokenValid] = useState(null);
  const [tokenError, setTokenError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setTokenError('No invitation token provided');
        return;
      }
      
      try {
        const response = await api.get('/v1/auth/validate-token', { token });
        if (response.valid) {
          setTokenValid(true);
          setFormData(prev => ({ ...prev, email: response.email || '' }));
        } else {
          setTokenError('Invalid or expired invitation');
        }
      } catch (err) {
        setTokenError('Failed to validate invitation');
      }
    }
    
    validateToken();
  }, [token]);
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.post('/v1/auth/register', {
        token,
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      // Auto-login after registration
      localStorage.setItem('bc_token', response.token);
      localStorage.setItem('bc_user', JSON.stringify(response.user));
      
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }
  
  if (tokenError) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{tokenError}</div>
      </div>
    );
  }
  
  if (!tokenValid) {
    return (
      <div className={styles.container}>
        <p>Validating invitation...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1>Join BarrelChatter</h1>
        
        {error && <p className={styles.error}>{error}</p>}
        
        {/* Form fields... */}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;
```

---

## User Roles

| Role | Permissions |
|------|-------------|
| `user` | Standard user features |
| `moderator` | + Bottle submission approval |
| `admin` | + User management, tags, audit logs |

### Role Checking

```jsx
const { user } = useAuth();

// Check single role
if (user.role === 'admin') {
  // Admin-only action
}

// Check multiple roles
const canModerate = ['moderator', 'admin'].includes(user.role);
```

---

## Session Management

### Logout

```jsx
const { logout } = useAuth();

function handleLogout() {
  logout();
  navigate('/login');
}
```

### Session Persistence

Sessions persist across browser restarts via localStorage. Token is validated on each API request.

### Handling Expired Tokens

```jsx
// In api.js or a response interceptor
if (response.status === 401) {
  // Token expired
  localStorage.removeItem('bc_token');
  localStorage.removeItem('bc_user');
  window.location.href = '/login';
}
```

---

## Password Management

### Change Password

```jsx
async function changePassword(currentPassword, newPassword) {
  await api.put('/v1/users/me/password', {
    current_password: currentPassword,
    new_password: newPassword
  });
}
```

### Password Requirements

- Minimum 8 characters
- At least one number
- At least one uppercase letter
- At least one special character

---

## Future Enhancements

1. **OAuth Integration**
   - Google Sign-In
   - Apple Sign-In
   
2. **Refresh Tokens**
   - Short-lived access tokens
   - Long-lived refresh tokens
   - Silent refresh on expiration

3. **MFA/2FA**
   - TOTP support
   - SMS verification
   
4. **Session Management**
   - View active sessions
   - Revoke sessions
   - "Remember this device"

5. **Public Registration**
   - Remove invite requirement (Phase 2)
   - Email verification
   - CAPTCHA
