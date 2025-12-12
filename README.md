# BarrelChatter Web

React + Vite single-page app for the BarrelChatter platform.  
It talks to the **barrelchatter-api** over HTTP and provides a collector-facing UI plus a small admin area.

> Theme: dark, lounge-y, and judgmental (but in a classy way).

---

## Tech Stack

- **React 19** (`react`, `react-dom`)
- **React Router 7** (`react-router-dom`)
- **Vite 7** (dev server + build)
- **Axios** for API calls
- **SCSS Modules** + global SCSS (`sass`)
- **ESLint 9** (flat config)

See `package.json` for exact versions.

---

## Quick Start

### 1) Prereqs

- **Node.js**: use a modern LTS (recommended **Node 20+**).
- A running **BarrelChatter API** (the UI expects the API routes described below).

### 2) Configure env

This app reads:

- `VITE_API_BASE_URL` — base URL of the API **without** `/v1`

Create a local `.env`:

```bash
cp .env.example .env
```

`.env.example`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

> Why “without `/v1`”?  
> The frontend calls endpoints like `/v1/auth/login`. If you include `/v1` in `VITE_API_BASE_URL`, you’ll end up with `/v1/v1/...` and everyone will be sad.

### 3) Install + run

```bash
npm install
npm run dev
```

Vite will print the local URL (typically `http://localhost:5173`).

---

## NPM Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — build production assets into `dist/`
- `npm run preview` — serve `dist/` locally
- `npm run lint` — run ESLint

---

## App Routes

Top-level routes:

- `/login` — sign in
- `/app/*` — authenticated area (wrapped in `ProtectedRoute` + `AppLayout`)
- `*` — fallback redirects to `/app`

App area routes (nested under `/app`):

- `/app/inventory` — inventory list
- `/app/inventory/:id` — inventory detail
- `/app/bottles` — bottle catalog list
- `/app/bottles/:id` — bottle detail
- `/app/tastings` — tastings list + create tasting
- `/app/wishlists` — wishlist list + create wishlist entry
- `/app/tags` — tag tools (lookup / claim / assign)
- `/app/admin/bottles-submissions` — **moderator/admin** bottle submission queue
- `/app/admin/tags` — **admin** tag administration

Routing is defined in `src/App.jsx`. Layout/nav is in `src/components/layout/AppLayout.jsx`.

---

## Features by Page

### Login (`src/pages/LoginPage.jsx`)
- Uses `AuthContext.login(email, password)`
- Dev defaults are pre-filled:
  - `admin@barrelchatter.local`
  - `ChangeMe123!`

> These are convenience defaults. If you ship them to production as-is, the internet will thank you for the free pen test.

### Inventory (`src/pages/InventoryPage.jsx`)
- Loads inventory list
- Opens **NewBottleSubmissionModal** to:
  - create a bottle entry (catalog) and/or
  - create an inventory entry

### Inventory Detail (`src/pages/InventoryDetailPage.jsx`)
- Shows an inventory item and related tastings (client-side aggregation)

### Bottles (`src/pages/BottlesPage.jsx`)
- Loads bottle catalog list
- Can:
  - submit a new bottle (`POST /v1/bottles`)
  - add bottle to wishlist (`POST /v1/wishlists`)
  - add bottle to inventory (`POST /v1/inventory`)

### Bottle Detail (`src/pages/BottleDetailPage.jsx`)
- Bottle-centric view that also pulls inventory / tastings / wishlists and filters client-side

### Tastings (`src/pages/TastingsPage.jsx`)
- Loads tastings
- Create tasting (`POST /v1/tastings`)

### Wishlists (`src/pages/WishlistPage.jsx`)
- Loads wishlists
- Create wishlist entry (`POST /v1/wishlists`)

### Tags (`src/pages/TagsPage.jsx`)
- Tag utilities:
  - lookup by NFC UID (`POST /v1/tags/lookup`)
  - claim (`POST /v1/tags/claim`)
  - assign (`POST /v1/tags/assign`)

### Admin: Bottle Submissions (`src/pages/AdminBottleSubmissionsPage.jsx`)
- Queue view of submitted bottles
- Actions:
  - approve (`POST /v1/admin/bottles/submissions/:id/approve`)
  - reject (`POST /v1/admin/bottles/submissions/:id/reject`)
  - merge (`POST /v1/admin/bottles/submissions/:id/merge`)

### Admin: Tags (`src/pages/AdminTagsPage.jsx`)
- Lists tags (`GET /v1/admin/tags`)
- Create/register a tag (`POST /v1/admin/tags` with `nfc_uid`, optional `label`)

---

## Auth Model

Auth is handled in `src/context/AuthContext.jsx`:

- On login, stores:
  - `authToken` in `localStorage`
  - `authUser` in `localStorage`
- `src/api/client.js` attaches `Authorization: Bearer <token>` automatically via Axios interceptor.

`ProtectedRoute` guards `/app/*` and optionally checks roles.

### Roles used in the UI

- `user` — regular access
- `moderator` — can access bottle submissions page
- `admin` — can access admin tags page (and also submissions)

> Note: the layout checks `moderator` or `admin` for some admin nav. Ensure the API is consistent with these role strings.

---

## API Expectations

The UI currently calls (non-exhaustive but accurate to repo):

### Auth
- `POST /v1/auth/login`

### Bottles / Inventory / Tastings / Wishlists
- `GET /v1/bottles?limit=200&offset=0`
- `POST /v1/bottles`
- `GET /v1/inventory?limit=500&offset=0` (sometimes `limit=200`)
- `POST /v1/inventory`
- `GET /v1/tastings?limit=500&offset=0` (sometimes `limit=200`)
- `POST /v1/tastings`
- `GET /v1/wishlists?limit=500&offset=0` (sometimes `limit=100`)
- `POST /v1/wishlists`

### Tags
- `GET /v1/tags`
- `POST /v1/tags/lookup`
- `POST /v1/tags/claim`
- `POST /v1/tags/assign`

### Admin
- `GET /v1/admin/bottles/submissions`
- `POST /v1/admin/bottles/submissions/:id/approve`
- `POST /v1/admin/bottles/submissions/:id/reject`
- `POST /v1/admin/bottles/submissions/:id/merge`
- `GET /v1/admin/tags`
- `POST /v1/admin/tags`

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
   ├─ main.jsx                # app bootstrap + BrowserRouter + AuthProvider
   ├─ App.jsx                 # route definitions
   ├─ api/
   │  └─ client.js            # axios instance + auth header interceptor
   ├─ context/
   │  └─ AuthContext.jsx      # login/logout + persisted user
   ├─ components/
   │  ├─ ProtectedRoute.jsx
   │  ├─ NewBottleSubmissionModal.jsx
   │  └─ layout/
   │     └─ AppLayout.jsx     # sidebar/topbar shell
   ├─ pages/                  # route pages
   └─ styles/                 # SCSS modules + global theme
```

---

## Styling

- Global styles: `src/styles/global.scss`
- Theme tokens: `src/styles/theme.scss`
- Per-page/component styling: `*.module.scss`

---

## Production Build & Deploy

### Build

```bash
npm ci
npm run build
```

Output goes to `dist/`.

### Serve with Nginx (example)

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

> SPA routing note: `try_files ... /index.html;` is required so `/app/...` works on refresh.

---

## Troubleshooting

### `vite: command not found`
Install dependencies (Vite is a devDependency):

```bash
npm install
```

or clean install:

```bash
rm -rf node_modules package-lock.json
npm install
```

### API calls hitting `/v1/v1/...`
Your `VITE_API_BASE_URL` includes `/v1`. Remove it.

### Auth guard shows “Loading...” forever
`ProtectedRoute` currently reads `{ user, loading }` from `useAuth()`, but `AuthContext` exposes `initializing`.  
If you see this, update `ProtectedRoute` to use `initializing` (or update the context to export `loading`).

---

## Notes / Known Gaps

- Several pages fetch large lists and filter client-side (fast enough for Phase 1, but we’ll likely want server-side filtering/pagination later).
- Error handling is pragmatic and UI-focused (we can standardize error shapes once the API stabilizes).

---

## License

Private project (for now). If you’re reading this in the far future after we go public: hello, lawyers.
