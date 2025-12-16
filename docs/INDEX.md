# BarrelChatter Web Documentation

## Overview

This documentation covers the BarrelChatter web application, a React-based frontend for the bourbon collection management platform.

## Documentation Index

### Getting Started
- [README.md](../README.md) - Project overview, setup, and quick start guide

### Architecture
- [Project Structure](project-structure.md) - Directory layout and file organization
- [Tech Stack](tech-stack.md) - Technologies, libraries, and tooling decisions

### Design
- [Design System](design-system.md) - Colors, typography, spacing, and component patterns
- [Styling Guide](styling-guide.md) - SCSS module patterns and best practices

### Features
- [Pages Reference](pages.md) - Complete page-by-page documentation
- [Components](components.md) - Shared and reusable components
- [Modals](modals.md) - Modal dialogs and forms

### Integration
- [API Integration](api-integration.md) - Backend API communication patterns
- [Authentication](authentication.md) - Login, registration, and session management
- [Image Upload](image-upload.md) - Photo upload to DigitalOcean Spaces

### Administration
- [Admin Features](admin-features.md) - Admin-only functionality documentation
- [Role-Based Access](role-based-access.md) - Permission system and route protection

---

## Application Overview

### Purpose

BarrelChatter Web enables bourbon enthusiasts to:

1. **Track Collections** - Maintain a personal inventory of bottles with purchase details, status, and location
2. **Log Tastings** - Record pours with ratings, tasting notes, and photos
3. **Discover Bottles** - Browse the verified bottle catalog with community ratings
4. **Manage Tags** - Link NFC tags to bottles for quick scan-to-log workflows
5. **Build Wishlists** - Track desired bottles with target prices

### Target Users

| Persona | Description | Primary Features |
|---------|-------------|------------------|
| **Collector Carl** | Serious enthusiast with 100+ bottles | Inventory, tastings, NFC tags |
| **Curious Riley** | Newer to bourbon, exploring | Bottle catalog, wishlist, tastings |
| **Admin Nick** | Platform administrator | User management, tag admin, audit logs |

### Current Phase

The application is in **Phase 1** (Private Multi-User App):

- Invite-only registration
- Core inventory and tasting features
- NFC tag management
- Basic social sharing (friends visibility)
- Admin tools for platform management

### Future Phases

**Phase 2** - Public Collector App:
- Public registration with OAuth
- Billing integration (Stripe)
- Community pricing insights
- Public profiles and follows
- Wishlist alerts

**Phase 3** - B2B/White-Label:
- Venue/organization accounts
- Event management
- Member lockers
- White-label theming
- Organization dashboards

---

## Quick Reference

### Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Route definitions and layout structure |
| `src/main.jsx` | Application entry point |
| `src/api/api.js` | API client with auth headers |
| `src/context/AuthContext.jsx` | Authentication state management |
| `src/styles/_design-system.scss` | Design tokens and mixins |
| `src/styles/global.scss` | Global styles and resets |

### Route Structure

```
/login                    - Public login page
/register                 - Public registration (invite required)

/app                      - Authenticated area (requires login)
  /app/home              - Dashboard with stats and activity
  /app/bottles           - Bottle catalog
  /app/bottles/:id       - Bottle detail page
  /app/inventory         - Personal collection
  /app/inventory/:id     - Inventory item detail
  /app/tastings          - Tasting history
  /app/wishlists         - Wishlist management
  /app/tags              - Personal tag management
  /app/profile           - User profile settings

  /app/admin/users       - User administration (admin only)
  /app/admin/tags        - Tag administration (admin only)
  /app/admin/audit-logs  - Audit log viewer (admin only)
  /app/admin/bottles-submissions - Bottle moderation (moderator+)
```

### API Base URL

Development: `http://localhost:4000`
Production: Configured via `VITE_API_URL` environment variable

### Design Tokens

Primary accent: `#c9a66b` (Bourbon Brass)
Background: `#121212` (Deep Charcoal)
Text: `#f0e6d6` (Cream)

See [Design System](design-system.md) for complete reference.

---

## Development Workflow

### Starting Development

```bash
# Ensure API is running on port 4000
cd ../barrelchatter-api && npm run dev

# Start web app
cd ../barrelchatter-web && npm run dev
```

### Making Changes

1. **Pages** - Add new pages in `src/pages/`, create matching `.module.scss`
2. **Components** - Shared components go in `src/components/`
3. **Styles** - Use design system mixins, follow existing patterns
4. **Routes** - Update `src/App.jsx` with new routes
5. **API** - Add endpoints to `src/api/api.js` if needed

### Testing

Currently manual testing. Automated testing planned for Phase 2.

### Building for Production

```bash
npm run build
# Output in dist/ directory
```

---

## Support

For technical questions, consult:
1. This documentation
2. Inline code comments
3. Development team

For feature requests or bug reports, use the project issue tracker.
