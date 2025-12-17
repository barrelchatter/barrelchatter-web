# BarrelChatter Frontend Documentation

> **Complete documentation for the BarrelChatter web application**

---

## Getting Started

1. **New Developer?** Start with [ARCHITECTURE.md](ARCHITECTURE.md)
2. **Building UI?** See [COMPONENTS.md](COMPONENTS.md) and [STYLING.md](STYLING.md)
3. **Adding Pages?** Check [PAGES.md](PAGES.md)
4. **API Integration?** Read [API_INTEGRATION.md](API_INTEGRATION.md)
5. **Admin Features?** Review [ADMIN_FEATURES.md](ADMIN_FEATURES.md)

---

## Documentation Index

### Architecture & Structure
| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Application structure, routing, state management |
| [API_INTEGRATION.md](API_INTEGRATION.md) | API client, authentication, error handling |

### UI Development
| Document | Description |
|----------|-------------|
| [COMPONENTS.md](COMPONENTS.md) | Reusable component reference |
| [PAGES.md](PAGES.md) | Page-level component documentation |
| [STYLING.md](STYLING.md) | Design system, SCSS patterns, theming |

### Features
| Document | Description |
|----------|-------------|
| [ADMIN_FEATURES.md](ADMIN_FEATURES.md) | Admin panel and moderation tools |
| [PRICING_INTELLIGENCE.md](PRICING_INTELLIGENCE.md) | Community pricing features |

---

## Quick Reference

### Route Structure
```
/                           → Redirect to /app or /login
/login                      → Login page
/register                   → Registration (with invite token)

/app                        → Authenticated routes (AppLayout)
  /app/home                 → Dashboard
  /app/bottles              → Bottle catalog
  /app/bottles/:id          → Bottle detail
  /app/inventory            → User inventory
  /app/inventory/:id        → Inventory item detail
  /app/tastings             → Tasting journal
  /app/wishlists            → Wishlist
  /app/tags                 → NFC tag management
  /app/storage-locations    → Storage hierarchy
  /app/profile              → User profile

/app/admin/*                → Admin routes (role-protected)
  /admin/bottles-submissions
  /admin/tags
  /admin/tag-packs
  /admin/tag-packs/:id
  /admin/tags/bulk-import
  /admin/users
  /admin/purchase-locations
  /admin/audit-logs
```

### Component Import Patterns
```jsx
// API client (ALWAYS use this, never raw fetch)
import api from '../api/client';

// Auth context
import { useAuth } from '../context/AuthContext';

// Protected routes
import ProtectedRoute from '../components/ProtectedRoute';

// Styles (SCSS modules)
import styles from '../styles/PageName.module.scss';
```

### Common API Patterns
```javascript
// GET with pagination
const res = await api.get('/v1/bottles?limit=100&offset=0');
const bottles = res.data?.bottles || [];

// POST create
const res = await api.post('/v1/inventory', payload);
const newItem = res.data?.inventory;

// PATCH update
await api.patch(`/v1/tastings/${id}`, payload);

// DELETE
await api.delete(`/v1/wishlists/${id}`);
```

### View Mode Toggle Pattern
```jsx
const [viewMode, setViewMode] = useState('list'); // 'list' | 'cards' | 'gallery'

<div className={styles.viewToggle}>
  <button 
    className={viewMode === 'list' ? styles.viewModeButtonActive : styles.viewModeButton}
    onClick={() => setViewMode('list')}
  >List</button>
  {/* ... cards, gallery buttons */}
</div>

{viewMode === 'list' && <TableView data={items} />}
{viewMode === 'cards' && <CardGrid data={items} />}
{viewMode === 'gallery' && <GalleryGrid data={items} />}
```

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Page component | `{Name}Page.jsx` | `BottlesPage.jsx` |
| Feature component | `{Name}.jsx` | `PhotoUpload.jsx` |
| Layout component | `{Name}.jsx` in `layout/` | `AppLayout.jsx` |
| SCSS module | `{ComponentName}.module.scss` | `BottlesPage.module.scss` |
| Hook | `use{Name}.js` | `usePricing.js` |

---

## Common Gotchas

### 1. Always Use `api` Client
```javascript
// ❌ Wrong - bypasses auth
const res = await fetch('/v1/bottles');

// ✅ Correct - includes auth token
const res = await api.get('/v1/bottles');
```

### 2. API Response Structure
```javascript
// Response is wrapped in data
const res = await api.get('/v1/bottles');
const bottles = res.data?.bottles || [];  // ✅ Access via .data
```

### 3. Pagination Limits
```javascript
// ❌ Wrong - limit > 100 rejected by API
api.get('/v1/bottles?limit=500');

// ✅ Correct - max 100 per request
api.get('/v1/bottles?limit=100');
```

### 4. Image URL Resolution
```javascript
// Images may be relative or absolute
function resolveImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}
```

---

## Contributing

### Adding a New Page

1. Create `src/pages/NewPage.jsx`
2. Create `src/styles/NewPage.module.scss`
3. Add route in `App.jsx`
4. Add to navigation in `AppLayout.jsx`
5. Document in [PAGES.md](PAGES.md)

### Adding a New Component

1. Create `src/components/NewComponent.jsx`
2. Create `src/styles/NewComponent.module.scss`
3. Add JSDoc comments
4. Document in [COMPONENTS.md](COMPONENTS.md)

---

## Changelog

### December 2024
- Migration 011: Barrel tracking, pricing intelligence
- Migration 012: Enhanced tracking, social features
- Tag pack system with bulk import
- Purchase location catalog
- Storage location hierarchy

### November 2024
- Initial Phase 1 release
- Core CRUD for bottles, inventory, tastings
- Admin panel foundation