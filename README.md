# BarrelChatter Web

React + Vite single-page app for BarrelChatter. Collector UI + admin tools (tags, bottle moderation, and now **user + invite management**).

> Theme: dark, lounge-y, and quietly judging your “daily drinker” choices.

README refresh: 2025-12-12

---

## Tech Stack

- **React 19**
- **React Router 7**
- **Vite 7**
- **Axios**
- **SCSS Modules** + global SCSS
- **ESLint 9** (flat config)

---

## Quick Start

### 1) Prereqs
- Node.js LTS (recommended **Node 20+**)
- Running **BarrelChatter API**

### 2) Configure env

This app reads:

- `VITE_API_BASE_URL` — base URL of the API **without** `/v1`

```bash
cp .env.example .env
```

`.env.example`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

### 3) Install + run

```bash
npm install
npm run dev
```

Vite will print the URL (typically `http://localhost:5173`).

---

## App Routes

Top-level:
- `/login` — sign in
- `/app/*` — authenticated app
- `*` — fallback redirect

App routes (nested under `/app`):
- `/app/inventory`
- `/app/inventory/:id`
- `/app/bottles`
- `/app/bottles/:id`
- `/app/tastings`
- `/app/wishlists`
- `/app/tags`
- `/app/admin/bottles-submissions` — **moderator/admin**
- `/app/admin/tags` — **admin**
- `/app/admin/users` — **admin** ✅ NEW (user + invite management)

Routing is defined in `src/App.jsx`. Layout/nav is in `src/components/layout/AppLayout.jsx`.

---

## New: Admin Users page

`/app/admin/users` provides an admin console to manage the private instance:

### User management
- List/search users (by name/email/role/status)
- Create a user (optionally set a temporary password)
- Edit user data:
  - name
  - email
  - role (`collector`, `moderator`, `admin`)
- Lock/unlock a user (disables login without deleting data)
- Trigger password reset (generates a reset token or temp password per API behavior)

### Invite management
- Create invite (email + role + expiry)
- View invite status: pending/accepted/expired/revoked
- Revoke unused invites
- Copy invite token for sharing (Phase 1 “out-of-band” delivery)

> Phase 1 UX: admin creates invite → copies token → sends it to the user (text/email/smoke signal).

---

## Auth Model

Auth is handled in `src/context/AuthContext.jsx`:

- Stores `authToken` + `authUser` in `localStorage`
- Axios interceptor in `src/api/client.js` adds `Authorization: Bearer <token>`

`ProtectedRoute` guards `/app/*` and can enforce role access.

### Roles used in the UI
- `collector` — normal access
- `moderator` — bottle submission moderation
- `admin` — tags + users/invites + everything moderator can do

---

## API expectations (new endpoints)

The UI expects these admin endpoints to exist on the API:

### Admin Users
- `GET /v1/admin/users`
- `POST /v1/admin/users`
- `PATCH /v1/admin/users/:id`
- `POST /v1/admin/users/:id/lock`
- `POST /v1/admin/users/:id/unlock`
- `POST /v1/admin/users/:id/reset-password`

### Admin Invites
- `GET /v1/admin/invites`
- `POST /v1/admin/invites`
- `POST /v1/admin/invites/:id/revoke`

### Auth (invite-only registration)
- `POST /v1/auth/register` (requires invite token)
- `POST /v1/auth/login`

---

## Project Layout

```text
.
├─ index.html
├─ vite.config.js
├─ package.json
├─ .env.example
├─ public/
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ api/
   │  └─ client.js
   ├─ context/
   │  └─ AuthContext.jsx
   ├─ components/
   │  ├─ ProtectedRoute.jsx
   │  └─ layout/
   │     └─ AppLayout.jsx
   ├─ pages/
   │  ├─ LoginPage.jsx
   │  ├─ InventoryPage.jsx
   │  ├─ InventoryDetailPage.jsx
   │  ├─ BottlesPage.jsx
   │  ├─ BottleDetailPage.jsx
   │  ├─ TastingsPage.jsx
   │  ├─ WishlistPage.jsx
   │  ├─ TagsPage.jsx
   │  ├─ AdminBottleSubmissionsPage.jsx
   │  ├─ AdminTagsPage.jsx
   │  └─ AdminUsersPage.jsx        # NEW
   └─ styles/
      ├─ global.scss
      └─ theme.scss
```

---

## Styling

- Global styles: `src/styles/global.scss`
- Theme tokens: `src/styles/theme.scss`
- Per-component/page styling: `*.module.scss`

---

## Production Build & Deploy

```bash
npm ci
npm run build
```

Assets output to `dist/`.

Nginx SPA routing example:

```nginx
server {
  listen 80;
  server_name your.domain.example;

  root /var/www/barrelchatter-web/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

## Troubleshooting

- **API calls hitting `/v1/v1/...`**
  - Your `VITE_API_BASE_URL` includes `/v1`. Remove it.

- **403 on `/app/admin/users`**
  - You’re not an admin (or the token user role doesn’t match DB).

- **User can’t sign up**
  - Instance is invite-only; create an invite and use the token at registration.

---

## License

Private project (for now).
