# BarrelChatter Web

A bourbon-inspired web application for collectors to track inventory, log tastings, and connect with fellow enthusiasts.

## Overview

BarrelChatter Web is the browser-based interface for the BarrelChatter platform. It provides a dark, lounge-inspired UI optimized for bourbon collectors to manage their collections, log pours, and participate in the community.

## Tech Stack

- **Framework:** React 19 with React Router 7
- **Build Tool:** Vite 7
- **Styling:** SCSS Modules with custom design system
- **HTTP Client:** Fetch API via custom `api.js` wrapper
- **State Management:** React Context (AuthContext)
- **Image Storage:** DigitalOcean Spaces (nyc3 region)

## Project Structure

```
barrelchatter-web/
├── public/                    # Static assets
├── src/
│   ├── api/
│   │   └── api.js            # API client wrapper
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.jsx # Main authenticated layout
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx   # Authentication state
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── BottlesPage.jsx
│   │   ├── BottleDetailPage.jsx
│   │   ├── InventoryPage.jsx
│   │   ├── InventoryDetailPage.jsx
│   │   ├── TastingsPage.jsx
│   │   ├── WishlistPage.jsx
│   │   ├── TagsPage.jsx
│   │   ├── AdminTagsPage.jsx
│   │   ├── AdminUsersPage.jsx
│   │   ├── AdminBottleSubmissionsPage.jsx
│   │   └── AdminAuditLogsPage.jsx
│   ├── styles/
│   │   ├── _design-system.scss  # Core design tokens & mixins
│   │   ├── _shared.module.scss  # Reusable component patterns
│   │   ├── global.scss          # Global resets & base styles
│   │   └── [Page].module.scss   # Page-specific styles
│   ├── App.jsx                  # Route definitions
│   └── main.jsx                 # Entry point
├── package.json
├── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Running BarrelChatter API server (default: `http://localhost:4000`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd barrelchatter-web

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs on `http://localhost:5173` by default.

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:4000
```

## Development

### Available Scripts

```bash
npm run dev      # Start development server with HMR
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Design System

The application uses a custom bourbon-themed design system. See `/docs/design-system.md` for complete documentation.

Key principles:
- Dark lounge aesthetic with brass accents
- 8px spacing scale
- Consistent component patterns via SCSS mixins
- Semantic color tokens for feedback states

## Features

### Current (Phase 1)

- **Authentication:** Login, registration (invite-only), password reset
- **Bottle Catalog:** Browse, search, filter verified bottles
- **Personal Inventory:** Track owned bottles with status, location, purchase info
- **Tasting Journal:** Log pours with ratings, notes, photos
- **Wishlist:** Track desired bottles with price targets
- **NFC Tags:** Claim and manage tags linked to bottles
- **User Profiles:** View stats, update info, change password
- **Admin Panel:** User management, tag administration, audit logs

### Planned (Phase 2+)

- Public signup and billing integration
- Community pricing insights
- Social features (follows, public tastings)
- Wishlist alerts
- Advanced analytics

## API Integration

The app communicates with the BarrelChatter API at `/v1/` endpoints. Authentication uses JWT tokens stored in localStorage.

See `/docs/api-integration.md` for endpoint documentation.

## Deployment

### Production Build

```bash
npm run build
```

Output is generated in the `dist/` directory.

### Hosting

Recommended: Static hosting (Vercel, Netlify, DigitalOcean App Platform) with reverse proxy to API.

Ensure CORS is configured on the API server for your production domain.

## Documentation

- [Project Index](docs/INDEX.md) - Complete documentation overview
- [Design System](docs/design-system.md) - Styling guide
- [Pages & Features](docs/pages.md) - Page-by-page documentation
- [Components](docs/components.md) - Shared component reference
- [API Integration](docs/api-integration.md) - Backend communication
- [Authentication](docs/authentication.md) - Auth flow documentation

## Contributing

1. Create a feature branch from `main`
2. Follow existing code style and patterns
3. Update documentation for new features
4. Submit a pull request

## License

Proprietary - BarrelChatter LLC

## Support

For questions or issues, contact the development team.
