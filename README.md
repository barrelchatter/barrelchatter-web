# BarrelChatter Web Frontend

**NFC-powered bourbon collection management for serious collectors.**

> **Stack:** React 18 • React Router 6 • SCSS Modules  
> **Platform:** Web (Desktop & Mobile Responsive)  
> **Status:** Phase 1 Complete (Private Multi-User App)

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Running BarrelChatter API server

### Development
```bash
# Install dependencies
npm install

# Configure API endpoint
cp .env.example .env
# Edit .env: REACT_APP_API_URL=http://localhost:3001

# Start development server
npm start
```

### Production Build
```bash
npm run build
# Output: /build directory ready for static hosting
```

---

## Application Structure

```
src/
├── api/                    # API client configuration
│   └── client.js           # Axios instance with auth interceptors
├── components/             # Reusable UI components
│   ├── layout/             # App shell, navigation
│   └── ...                 # Feature components
├── context/                # React contexts (Auth)
├── hooks/                  # Custom React hooks
├── pages/                  # Route-level page components
├── styles/                 # SCSS modules & design system
└── App.jsx                 # Router configuration
```

---

## Key Features

### Core Functionality
| Feature | Page | Description |
|---------|------|-------------|
| **Bottles** | `/app/bottles` | Global bottle catalog with search/filter |
| **Inventory** | `/app/inventory` | Personal collection management |
| **Tastings** | `/app/tastings` | Pour logging with ratings & notes |
| **Wishlist** | `/app/wishlists` | Bottle hunting with price targets |
| **Tags** | `/app/tags` | NFC tag management & assignment |
| **Storage** | `/app/storage-locations` | Hierarchical storage organization |

### Admin Features
| Feature | Page | Description |
|---------|------|-------------|
| **Bottle Submissions** | `/app/admin/bottles-submissions` | Moderate user-submitted bottles |
| **Tag Management** | `/app/admin/tags` | Register NFC UIDs |
| **Tag Packs** | `/app/admin/tag-packs` | Create & manage tag bundles |
| **Bulk Import** | `/app/admin/tags/bulk-import` | Rapid tag registration |
| **User Management** | `/app/admin/users` | User & invite administration |
| **Purchase Locations** | `/app/admin/purchase-locations` | Store catalog moderation |
| **Audit Logs** | `/app/admin/audit-logs` | System activity monitoring |

---

## Authentication

- **JWT-based** authentication via `AuthContext`
- **Role-based** access control: `collector`, `moderator`, `admin`
- Protected routes via `ProtectedRoute` component
- Token refresh handled automatically by API client

```jsx
// Check user role
const { user } = useAuth();
if (user?.role === 'admin') { /* show admin features */ }
```

---

## View Modes

Most list pages support three view modes:
- **List** — Dense table view with all details
- **Cards** — Medium-density card grid
- **Gallery** — Image-focused masonry layout

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/INDEX.md](docs/INDEX.md) | Documentation hub |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | Component reference |
| [docs/PAGES.md](docs/PAGES.md) | Page documentation |
| [docs/STYLING.md](docs/STYLING.md) | Design system & SCSS |
| [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md) | API client patterns |
| [docs/ADMIN_FEATURES.md](docs/ADMIN_FEATURES.md) | Admin panel guide |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 18 |
| **Routing** | React Router 6 |
| **Styling** | SCSS Modules |
| **HTTP Client** | Axios |
| **State** | React Context + hooks |
| **Build** | Create React App |

### Key Dependencies
```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x",
  "sass": "^1.x",
  "qrcode.react": "^3.x"
}
```

---

## Project Status

### Phase 1 — Private Multi-User App ✅
- [x] Authentication (login, register, invite system)
- [x] Bottle catalog with CRUD
- [x] Inventory management
- [x] Tasting journal
- [x] Wishlist tracking
- [x] NFC tag management
- [x] Storage location hierarchy
- [x] Admin panel (users, tags, moderation)

### Phase 2 — Public Collector App 🔜
- [ ] Public signup (OAuth)
- [ ] Public bottle catalog
- [ ] Community pricing insights
- [ ] Social features (follow, share)
- [ ] User profiles

### Phase 3 — B2B / Venues 📅
- [ ] Organization accounts
- [ ] Venue inventory
- [ ] Event management
- [ ] White-label theming

---

## Environment Variables

```bash
# Required
REACT_APP_API_URL=http://localhost:3001

# Optional
REACT_APP_ENV=development
```

---

## Scripts

```bash
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
npm run lint       # ESLint check
```

---

## Contributing

1. Follow existing code patterns
2. Use SCSS modules (not inline styles)
3. Use `api` client for all HTTP requests
4. Test all view modes (list/cards/gallery)
5. Ensure mobile responsiveness

---

## License

Proprietary — BarrelChatter © 2024