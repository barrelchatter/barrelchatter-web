# BarrelChatter Web App

React/Vite single-page application for the BarrelChatter bourbon & spirits tracking platform.

This web client is the primary UI for Phase 1 (private, multi-user instance) and is designed so it can grow into the public collector app and B2B experiences without a complete rewrite. It talks to the separate **barrelchatter-api** service over HTTP.

The web app provides:

- Login/authentication and session handling
- Bottle catalog management
- Per-user inventory views (for physical bottles)
- Tasting / pour logging and review
- Wishlist management
- NFC tag tooling (user & admin)
- Bottle photo gallery support (list / card / gallery views)

---

## 1. Tech Stack

- **Language:** JavaScript (no TypeScript)
- **Framework:** React
- **Bundler / Dev Server:** Vite
- **Routing:** React Router
- **Styling:** SCSS Modules + global theme file (no Tailwind)
- **HTTP client:** Axios (`src/api/client.js`)
- **Auth:** JWT Bearer tokens obtained from the BarrelChatter API

---

## 2. Project Structure

Repository layout (simplified to the parts you actually touch):

```text
barrelchatter-web/
├─ node_modules/
├─ public/
├─ src/
│  ├─ api/
│  │  └─ client.js                 # Axios client + API_BASE_URL helper
│  ├─ components/
│  │  └─ layout/
│  │     ├─ AppLayout.jsx          # Shell layout (sidebar, header, content)
│  │     └─ ProtectedRoute.jsx     # Guards authenticated routes
│  ├─ context/
│  │  └─ AuthContext.jsx           # Auth provider (user + token)
│  ├─ pages/
│  │  ├─ AdminTagsPage.jsx         # Admin-only NFC tag management
│  │  ├─ BottleDetailPage.jsx      # Single bottle details + photos
│  │  ├─ BottlesPage.jsx           # Bottle catalog (list / cards / gallery)
│  │  ├─ InventoryDetailPage.jsx   # Single inventory item (physical bottle)
│  │  ├─ InventoryPage.jsx         # Inventory list (list / cards / gallery)
│  │  ├─ LoginPage.jsx             # Email/password login
│  │  ├─ TagsPage.jsx              # User-facing tag lookup/claim
│  │  ├─ TastingsPage.jsx          # Tastings/pours listing
│  │  └─ WishlistPage.jsx          # Wishlist management
│  ├─ styles/
│  │  ├─ AdminTagsPage.module.scss
│  │  ├─ AppLayout.module.scss
│  │  ├─ BottleDetailPage.module.scss
│  │  ├─ BottlesPage.module.scss
│  │  ├─ InventoryDetailPage.module.scss
│  │  ├─ InventoryPage.module.scss
│  │  ├─ LoginPage.module.scss
│  │  ├─ TagsPage.module.scss
│  │  ├─ TastingsPage.module.scss
│  │  ├─ WishlistPage.module.scss
│  │  ├─ global.scss               # Global resets, typography
│  │  └─ theme.scss                # BarrelChatter dark theme variables
│  ├─ App.jsx                      # Route definitions & layout wiring
│  └─ main.jsx                     # React root + context providers
├─ .env                            # Local environment (ignored)
├─ .env.example                    # Sample env values
├─ .gitignore
├─ eslint.config.js
├─ index.html
├─ package.json
├─ package-lock.json
├─ README.md                       # This file
├─ vite.config.js                  # Vite configuration
└─ requirements.md                 # Product/feature requirements reference
```

The `requirements.md` file in the repo root describes the overall BarrelChatter product vision, phases, and requirements and should be treated as the canonical product spec for this client.

---

## 3. Environment Configuration

The web client is configured via Vite environment variables.

### 3.1 Core variables

Defined in `.env` (for local dev) and `.env.example` as a template:

- `VITE_API_BASE_URL`  
  Base URL of the BarrelChatter API.

  - Typical local value: `http://localhost:4000`
  - Used by `src/api/client.js` for all HTTP calls.
  - Also used to build absolute URLs for bottle photos (e.g., `http://localhost:4000/uploads/bottles/...`).

You can add additional `VITE_*` variables as needed; Vite will expose them to the client bundle.

### 3.2 Creating a local `.env`

```bash
cp .env.example .env
# then edit .env to point at your local API instance
```

Example `.env` for local development:

```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## 4. Installation & Local Development

From the `barrelchatter-web` directory:

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# edit .env as described above

# Start Vite dev server
npm run dev
```

By default, Vite serves the app on something like:

```text
http://localhost:5173
```

The app expects a running BarrelChatter API (see the `barrelchatter-api` README for setup). If the API is not running or `VITE_API_BASE_URL` is incorrect, you’ll see errors when logging in or loading data.

---

## 5. Build & Preview

For production builds:

```bash
# Build static assets
npm run build

# Preview production build locally
npm run preview
```

`npm run build` outputs the production bundle into `dist/`. You can serve this behind any static file host or reverse proxy that forwards API traffic to the BarrelChatter backend.

---

## 6. Routing & Layout

Routing is defined in `App.jsx` using React Router.

### 6.1 High-level route structure

- `/login` – unauthenticated login page.
- `/app/*` – authenticated area (wrapped in `ProtectedRoute` and `AppLayout`).

Within the `/app` scope, the main pages are:

- Bottles catalog
- Inventory
- Tastings
- Wishlist
- Tags
- Admin Tags (admin-only)

The default landing route for authenticated users is the **Inventory** screen so the flow is “what do I actually have” first.

> To see the exact path strings (`/app/bottles`, `/app/inventory/:id`, etc.), check `App.jsx`. Routes are nested under the `/app` base path and mapped to the corresponding components in `src/pages`.

### 6.2 Layout

`AppLayout.jsx` is responsible for:

- Top-level shell layout (sidebar + main content area).
- Sidebar navigation ordering:
  - Bottles
  - Inventory
  - Tastings
  - Wishlist
  - Tags
  - *Admin Tags* (grouped after a visual separator)
- Applying the dark theme styles from `theme.scss` / `global.scss`.

`ProtectedRoute.jsx` wraps authenticated routes and redirects to `/login` if there is no valid auth token.

---

## 7. Authentication Flow

Auth state is managed in `src/context/AuthContext.jsx`.

Typical flow:

1. User navigates to `/login`.
2. `LoginPage` posts credentials to `POST /v1/auth/login` on the API.
3. On success, the API returns:
   - A JWT bearer token.
   - Basic user info (including role).
4. The client:
   - Stores the token (e.g., in `localStorage`).
   - Stores the user object in context.
   - Redirects into the `/app` route tree.

Subsequent API calls:

- Use the Axios client (`src/api/client.js`), which attaches:

  ```http
  Authorization: Bearer <jwt-token>
  ```

- If the token is missing or invalid, many endpoints will return `401` and the UI may redirect back to `/login`.

The AuthContext ensures that refreshes keep the user logged in as long as the token is present and valid.

---

## 8. Pages & Features

### 8.1 BottlesPage

**File:** `src/pages/BottlesPage.jsx`  
**Styles:** `src/styles/BottlesPage.module.scss`

Provides the main bottle catalog view, backed by the API’s `/v1/bottles` endpoints.

Key features:

- Search/filter controls for bottle name, brand, type, and release characteristics.
- View mode toggle:
  - **List view** – tabular layout (good for scanning metadata).
  - **Card view** – compact cards showing key stats.
  - **Gallery view** – visually-driven grid focused on bottle photos.
- Uses `primary_photo_url` from the API to show images in gallery/card views.
- Actions:
  - Open Bottle Detail
  - Add bottle to inventory (shortcut)
  - Add to wishlist (shortcut)

### 8.2 BottleDetailPage

**File:** `src/pages/BottleDetailPage.jsx`  
**Styles:** `src/styles/BottleDetailPage.module.scss`

Shows complete details for a single bottle:

- Core metadata:
  - Name, brand, type, proof, age statement
  - Distillery
  - Release name, single-barrel / limited flags, bottle count
  - Finish description, mash bill
  - Long-form product description
- Bottle photos:
  - Upload new photos (multipart form to `/v1/bottles/:id/photos/upload`).
  - See thumbnail grid of existing photos.
  - Mark any photo as **Primary**.
  - Remove photos (deletes DB record and underlying image).
- Wishlist section:
  - Shows if this bottle is currently on the user’s wishlist.
  - Allows adding to wishlist from the detail view.
- Inventory + Tastings:
  - Table of inventory items for this bottle (across locations).
  - Table of recent tastings for this bottle (aggregated across inventory).

This page is also the primary place where bottle metadata can be edited via an inline edit form.

### 8.3 InventoryPage

**File:** `src/pages/InventoryPage.jsx`  
**Styles:** `src/styles/InventoryPage.module.scss`

Entry point to the user’s **physical bottle** inventory (rows in `inventory` table with joined bottle data).

Features:

- Uses `/v1/inventory` to load all inventory items for the logged-in user.
- View mode toggle:
  - **List view** – full table with status, location, identity, price, and quick links.
  - **Cards view** – medium cards focusing on location, identity, and price.
  - **Gallery view** – image-first layout showing bottle photo, location, and quick drill-in links.
- Each entry links to:
  - Inventory Detail (`InventoryDetailPage`) for that specific bottle instance.
  - Bottle Detail (`BottleDetailPage`) for the underlying bottle definition.

### 8.4 InventoryDetailPage

**File:** `src/pages/InventoryDetailPage.jsx`  
**Styles:** `src/styles/InventoryDetailPage.module.scss`

Represents a **single physical bottle** in the user’s collection. This is the core for tracking “Bottle 36 of 125” and its lifecycle.

Details shown:

- Bottle summary:
  - Image (using `primary_photo_url` from the bottle)
  - Bottle name, brand, type, release
  - Link back to Bottle Detail

- Inventory metadata:
  - Location label
  - Status (`sealed`, `open`, `finished`, `sample`)
  - Identity:
    - `bottle_serial_label` (e.g., “Bottle 36 of 125”)
    - `bottle_number` / `bottle_total`
  - Price paid
  - Created / updated timestamps

- Inline **edit** support:
  - Toggle edit mode (similar feel to Bottle Detail edits).
  - Update location, status, identity fields, and price paid.
  - Changes are persisted via `PATCH /v1/inventory/:id`.

- Pour stats:
  - Total number of tastings from this bottle instance.
  - Total ounces poured.
  - Date of last tasting.

- Tastings table:
  - List of all tastings from this inventory item (date, pour amount, rating, notes).

This page makes it much easier to manage your inventory for rare/special bottles and see their full consumption history.

### 8.5 TastingsPage

**File:** `src/pages/TastingsPage.jsx`  
**Styles:** `src/styles/TastingsPage.module.scss`

Provides a view over tasting history:

- Loads data from `/v1/tastings`.
- Shows bottle, location, pour amount, rating, and notes.
- Uses bottle thumbnails (when available) to make the list more visual.

### 8.6 WishlistPage

**File:** `src/pages/WishlistPage.jsx`  
**Styles:** `src/styles/WishlistPage.module.scss`

Manages the user’s wishlist entries:

- Backed by `/v1/wishlists`.
- Shows:
  - Target bottle
  - Preferred price
  - Notes
  - Alert enabled state
- Integrates with the Bottles and Bottle Detail flows so bottles can be quickly added or inspected.

### 8.7 TagsPage & AdminTagsPage

**Files:**

- `src/pages/TagsPage.jsx`
- `src/pages/AdminTagsPage.jsx`

These pages integrate with the NFC tag system:

- **TagsPage** – user-facing workflows for scanning/claiming tags, mapping them to inventory items, etc.
- **AdminTagsPage** – admin-only controls for seeding/managing tags (backed by admin-tag endpoints on the API).

The exact UX here will evolve with hardware integrations, but the routing and scaffolding are in place so these flows can grow without changing the rest of the app.

---

## 9. Styling & Theming

All page-level styles use SCSS Modules:

- Each page has a corresponding `*.module.scss` file.
- Shared theme variables (colors, radii, shadows, etc.) live in `styles/theme.scss`.
- Global resets, typography, and base body styles live in `styles/global.scss`.

The overall look is a dark, lounge-inspired theme with:

- Deep background colors
- Warm accent tones for highlights and buttons
- Rounded cards and subtle shadows

When adding new components:

- Prefer creating a new `ComponentName.module.scss` file.
- Import it as `import styles from '../styles/ComponentName.module.scss';`.

---

## 10. Connecting to Different Backends

Because the app uses `VITE_API_BASE_URL`, you can easily point the same build at different API instances:

- **Local dev**

  ```env
  VITE_API_BASE_URL=http://localhost:4000
  ```

- **Staging**

  ```env
  VITE_API_BASE_URL=https://api-staging.barrelchatter.com
  ```

- **Production**

  ```env
  VITE_API_BASE_URL=https://api.barrelchatter.com
  ```

As long as the API implements the same contract (see the API README), the web app should work without code changes.

---

## 11. Troubleshooting

- **Login fails or all data calls return 401**
  - Verify the API is running and reachable at `VITE_API_BASE_URL`.
  - Confirm credentials exist in the backend (e.g., via the `seedAdmin.js` script in `barrelchatter-api`).
  - Check browser dev tools → Network tab for the exact error message.

- **Bottles / Inventory show but images are broken**
  - Make sure the backend is serving `/uploads` statically.
  - Confirm `VITE_API_BASE_URL` is pointing at the same host that has the `uploads/bottles` directory.
  - Open an image URL in the browser directly (e.g., `http://localhost:4000/uploads/bottles/xxx.jpg`) to confirm it resolves.

- **CORS errors**
  - Ensure the API has CORS enabled for your web origin (e.g., `http://localhost:5173` in dev).

- **Blank or error screen after building**
  - Check the console for 404s or misconfigured `VITE_API_BASE_URL`.
  - Make sure the server hosting `dist/` is configured to serve `index.html` on unknown routes (SPA history API fallback).

---

## 12. Contributing & Next Steps

This repo is structured to support:

- Additional pages (e.g., pricing analytics, social features).
- More detailed admin dashboards for venues/distilleries.
- Future mobile apps sharing the same API and auth model.

If you add new features:

- Keep routes under the `/app` tree.
- Use SCSS Modules for styling.
- Reuse existing layout and theme tokens for consistency.
- Update `requirements.md` when product-level behavior changes.

Happy hacking, and cheers 🥃

