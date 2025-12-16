# BarrelChatter Project Structure

Detailed breakdown of the web application directory structure.

---

## Root Directory

```
barrelchatter-web/
├── public/                 # Static assets served as-is
├── src/                    # Application source code
├── .env                    # Environment variables (not in git)
├── .env.example            # Environment template
├── .gitignore
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
└── README.md
```

---

## Source Directory

```
src/
├── api/                    # API communication layer
│   └── api.js              # HTTP client wrapper
│
├── components/             # Reusable UI components
│   ├── layout/
│   │   └── AppLayout.jsx   # Main application shell
│   ├── ProtectedRoute.jsx  # Auth route guard
│   ├── LogTastingModal.jsx
│   └── NewBottleSubmissionModal.jsx
│
├── context/                # React Context providers
│   └── AuthContext.jsx     # Authentication state
│
├── pages/                  # Route-level components
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── HomePage.jsx
│   ├── ProfilePage.jsx
│   ├── BottlesPage.jsx
│   ├── BottleDetailPage.jsx
│   ├── InventoryPage.jsx
│   ├── InventoryDetailPage.jsx
│   ├── TastingsPage.jsx
│   ├── WishlistPage.jsx
│   ├── TagsPage.jsx
│   ├── AdminTagsPage.jsx
│   ├── AdminUsersPage.jsx
│   ├── AdminBottleSubmissionsPage.jsx
│   └── AdminAuditLogsPage.jsx
│
├── styles/                 # SCSS styling
│   ├── _design-system.scss # Core tokens and mixins
│   ├── _shared.module.scss # Shared component patterns
│   ├── global.scss         # Global styles and reset
│   └── [Component].module.scss # Component-specific styles
│
├── App.jsx                 # Route configuration
└── main.jsx                # Application entry point
```

---

## File Descriptions

### Entry Points

| File | Purpose |
|------|---------|
| `index.html` | HTML shell with root div |
| `main.jsx` | React initialization, providers, global styles |
| `App.jsx` | Route definitions and layout structure |

### API Layer

| File | Purpose |
|------|---------|
| `api/api.js` | HTTP client with auth headers, error handling |

### Context

| File | Purpose |
|------|---------|
| `context/AuthContext.jsx` | Authentication state, login/logout, user data |

### Components

| File | Purpose |
|------|---------|
| `components/layout/AppLayout.jsx` | Main shell with sidebar and topbar |
| `components/ProtectedRoute.jsx` | Route guard for auth/roles |
| `components/LogTastingModal.jsx` | Pour logging form |
| `components/NewBottleSubmissionModal.jsx` | Bottle submission form |

### Pages

| File | Purpose |
|------|---------|
| `pages/LoginPage.jsx` | User authentication |
| `pages/RegisterPage.jsx` | Invite-based registration |
| `pages/HomePage.jsx` | Dashboard with stats and activity |
| `pages/ProfilePage.jsx` | User settings |
| `pages/BottlesPage.jsx` | Bottle catalog browser |
| `pages/BottleDetailPage.jsx` | Individual bottle view |
| `pages/InventoryPage.jsx` | Personal collection list |
| `pages/InventoryDetailPage.jsx` | Individual inventory item |
| `pages/TastingsPage.jsx` | Tasting history |
| `pages/WishlistPage.jsx` | Wishlist management |
| `pages/TagsPage.jsx` | NFC tag management |
| `pages/AdminTagsPage.jsx` | Admin tag registration |
| `pages/AdminUsersPage.jsx` | User/invitation management |
| `pages/AdminBottleSubmissionsPage.jsx` | Bottle moderation |
| `pages/AdminAuditLogsPage.jsx` | Audit log viewer |

---

## Naming Conventions

### Files

- **Pages:** `PascalCase` + `Page.jsx` (e.g., `BottlesPage.jsx`)
- **Components:** `PascalCase.jsx` (e.g., `ProtectedRoute.jsx`)
- **Styles:** Match component name + `.module.scss`
- **Context:** `PascalCase` + `Context.jsx`

### CSS Classes

- SCSS modules generate unique class names
- Use camelCase in JavaScript: `styles.headerRow`
- Design system tokens use `--bc-` prefix

### Routes

- Lowercase with hyphens: `/app/admin/audit-logs`
- Nested under `/app` for authenticated routes
- Detail pages use `:id` param: `/bottles/:id`

---

## Import Patterns

### Component Imports

```jsx
// React
import React, { useState, useEffect } from 'react';

// Router
import { useNavigate, useParams, Link } from 'react-router-dom';

// Context
import { useAuth } from '../context/AuthContext';

// API
import api from '../api/api';

// Styles
import styles from '../styles/PageName.module.scss';
```

### Style Imports

```scss
// In .module.scss files
@use './design-system' as *;

// Use mixins
.button {
  @include button-primary;
}

// Use variables
.title {
  font-size: var(--bc-text-xl);
  color: var(--bc-text-primary);
}
```

---

## Adding New Features

### Adding a New Page

1. Create page component: `src/pages/NewPage.jsx`
2. Create styles: `src/styles/NewPage.module.scss`
3. Add route in `src/App.jsx`
4. Add navigation link in `AppLayout.jsx` (if needed)

### Adding a New Component

1. Create component: `src/components/ComponentName.jsx`
2. Create styles: `src/styles/ComponentName.module.scss`
3. Import and use in pages

### Adding API Endpoints

1. Add method to `src/api/api.js` if needed
2. Use in components with proper error handling

---

## Build Output

```
dist/
├── assets/
│   ├── index-[hash].js     # Bundled JavaScript
│   ├── index-[hash].css    # Bundled CSS
│   └── [images...]         # Optimized images
├── index.html              # Entry HTML
└── favicon.ico
```
