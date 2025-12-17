# Page Documentation

> Documentation for all page-level components in the BarrelChatter frontend.

---

## Table of Contents

- [Public Pages](#public-pages)
- [Core User Pages](#core-user-pages)
- [Settings Pages](#settings-pages)
- [Admin Pages](#admin-pages)

---

## Public Pages

### LoginPage

**Location:** `src/pages/LoginPage.jsx`  
**Route:** `/login`

User authentication page.

**Features:**
- Email/password form
- Success message after registration redirect
- Link to registration page
- Error display

**Flow:**
1. User enters credentials
2. POST `/v1/auth/login`
3. Store token in localStorage
4. Redirect to original destination or `/app`

---

### RegisterPage

**Location:** `src/pages/RegisterPage.jsx`  
**Route:** `/register`

Invite-based account creation.

**Features:**
- Invite token validation (with debounce)
- Real-time token status display
- Pre-fill email from invite
- Password confirmation
- Link to login

**Token States:**
- `null` — No token entered
- `valid` — Token accepted, shows role
- `invalid` — Token not found or already used
- `expired` — Token past expiration

**Flow:**
1. User enters/pastes invite token
2. GET `/v1/auth/invite/:token` validates
3. User completes form
4. POST `/v1/auth/register`
5. Redirect to login with success message

---

## Core User Pages

### HomePage

**Location:** `src/pages/HomePage.jsx`  
**Route:** `/app/home`

User dashboard with stats and recent activity.

**Sections:**
1. **Hero** — Personalized greeting with time-of-day
2. **Search Bar** — Quick link to bottles page
3. **Stats Grid** — Bottles, tastings, recent pours, catalog size
4. **Top Rated** — User's highest-rated bottles
5. **Recent Activity** — Combined inventory + tasting timeline
6. **Quick Actions** — Log tasting, add bottle, view collection, wishlist

**Data Loading:**
```javascript
Promise.all([
  api.get('/v1/bottles?limit=50'),
  api.get('/v1/inventory?limit=100'),
  api.get('/v1/tastings?limit=50'),
])
```

---

### BottlesPage

**Location:** `src/pages/BottlesPage.jsx`  
**Route:** `/app/bottles`

Global bottle catalog with search, filter, and CRUD.

**Features:**
- Search by name, brand, distillery
- Filter by type (bourbon, rye, etc.)
- Three view modes: List, Cards, Gallery
- Add new bottle form (expandable)
- Quick add to inventory (inline)
- Quick add to wishlist

**View Modes:**

| Mode | Description |
|------|-------------|
| List | Table with all columns (name, brand, distillery, type, proof, age, release, limited, MSRP, actions) |
| Cards | Card grid with key details and chips |
| Gallery | Image-focused grid with minimal text |

**Add Bottle Form Fields:**
- Name*, Brand, Distillery, Type, Proof, Age Statement
- Release Name, MSRP
- Single Barrel checkbox, Limited Release checkbox, Bottle Count
- Barrel Tracking section (when single barrel / limited)
- Finish, Mash Bill
- Description

**Inline Inventory Form:**
- Location*, Status, Price Paid, Purchase Date

---

### BottleDetailPage

**Location:** `src/pages/BottleDetailPage.jsx`  
**Route:** `/app/bottles/:id`

Comprehensive bottle details with photos and pricing.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Back                    Bottles / Details            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────┐  ┌────────────────────┐│
│  │ Main Card                   │  │ Side Card          ││
│  │ - Name, Brand, Type         │  │ - Pricing Card     ││
│  │ - Edit button               │  │ - Wishlist status  ││
│  │ - Info grid                 │  │ - Quick actions    ││
│  │ - Barrel info (if exists)   │  │                    ││
│  │ - Photo upload              │  │                    ││
│  │ - Photo gallery             │  │                    ││
│  └─────────────────────────────┘  └────────────────────┘│
│                                                          │
│  ┌─────────────────────────────┐  ┌────────────────────┐│
│  │ Your Inventory              │  │ Recent Tastings    ││
│  │ - Table of inventory items  │  │ - Table of pours   ││
│  └─────────────────────────────┘  └────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Edit mode with all bottle fields
- Barrel tracking section for single barrel / limited
- Photo upload with caption
- Photo gallery with primary selection
- Pricing intelligence card
- Wishlist status and quick add
- Related inventory items
- Related tastings

---

### InventoryPage

**Location:** `src/pages/InventoryPage.jsx`  
**Route:** `/app/inventory`

Personal collection management.

**Features:**
- Search inventory
- Three view modes
- Add to inventory form
- Submit new bottle modal
- Log tasting modal
- Real-time deal indicators
- Pricing hints

**Add Form Fields:**
- Bottle selection (dropdown)
- Status (sealed, open, finished, sample)
- Price Paid with deal analysis
- Purchase Date
- Storage Location (hierarchical select)
- Purchase Location (searchable with create)

**Deal Indicator:**
Shows real-time comparison as user types price:
- 🎉 Great deal (≤ -20% vs avg)
- ✓ Good price (≤ -10% vs avg)
- ↑ Above average (≥ 10% vs avg)
- 📈 Premium (≥ 30% vs avg)

---

### InventoryDetailPage

**Location:** `src/pages/InventoryDetailPage.jsx`  
**Route:** `/app/inventory/:id`

Detailed view of a single inventory item.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Back                    Inventory / Details          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────┐  ┌────────────────────┐│
│  │ Main Card                   │  │ Side Column        ││
│  │ - Hero: Image + Bottle Name │  │ - Compact Pricing  ││
│  │ - Edit button               │  │ - Tasting Stats    ││
│  │ - Details grid:             │  │   - Count          ││
│  │   - Location                │  │   - Total oz       ││
│  │   - Status                  │  │   - Last tasting   ││
│  │   - Identity                │  │                    ││
│  │   - Price Paid + Deal badge │  │                    ││
│  │   - Purchase Date           │  │                    ││
│  │   - Added Date              │  │                    ││
│  │   - Opened Date             │  │                    ││
│  └─────────────────────────────┘  └────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ Tasting History                                      ││
│  │ - Timeline of pours with date, amount, rating, notes ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Edit Form Fields:**
- Storage Location (hierarchical)
- Purchase Location (searchable)
- Status
- Bottle Serial Label
- Bottle Number / Total
- Price Paid
- Purchase Date

---

### TastingsPage

**Location:** `src/pages/TastingsPage.jsx`  
**Route:** `/app/tastings`

Tasting journal with inline editing.

**Features:**
- Log tasting modal
- Inline edit for each row
- Delete with confirmation
- Links to bottle details

**Table Columns:**
- Date
- Bottle (with brand/type subtext)
- Location
- Pour (oz) — editable
- Rating (0-10) — editable
- Notes — editable (textarea)
- Actions (Edit/Save/Cancel, Delete)

---

### WishlistPage

**Location:** `src/pages/WishlistPage.jsx`  
**Route:** `/app/wishlists`

Bottle hunting tracker with price targets.

**Features:**
- Add/update form with bottle search
- Pricing context display
- New bottle submission modal
- Target price analysis
- Alert toggle
- Community average comparison

**Table Columns:**
- Bottle
- Brand
- Type
- Target Price + comparison badge
- Avg Price (sample count)
- Alerts toggle
- Notes
- Remove action

**Target Price Analysis:**
- ⚠️ Ambitious (≤ -20% vs avg)
- ✓ Good target (≤ -5% vs avg)
- Neutral (within 5%)
- Easy to find (> 5% vs avg)

---

### TagsPage

**Location:** `src/pages/TagsPage.jsx`  
**Route:** `/app/tags`

NFC tag management for users.

**Sections:**

1. **Simulate Scan** — Enter NFC UID to test lookup
2. **Lookup Result** — Shows tag state and actions
3. **My Tags** — Table of claimed tags

**Tag States:**
| State | Description | Actions |
|-------|-------------|---------|
| `unassigned` | Registered but not claimed | Claim with label |
| `mine_unlinked` | Claimed by me, no bottle | Update label, Assign bottle |
| `mine_linked` | Claimed and linked to inventory | Update label, Change bottle |
| `owned_by_other` | Belongs to another user | None (read-only) |

---

### ProfilePage

**Location:** `src/pages/ProfilePage.jsx`  
**Route:** `/app/profile`

User profile and account settings.

**Cards:**

1. **Profile Card**
   - Avatar (or placeholder)
   - Name, email, role badge
   - Member since date
   - Edit profile form

2. **Stats Card**
   - Bottles in collection
   - Total tastings
   - Wishlist count

3. **Security Card**
   - Change password form

4. **Account Card**
   - Sign out button

---

## Settings Pages

### StorageLocationsPage

**Location:** `src/pages/StorageLocationsPage.jsx`  
**Route:** `/app/storage-locations`

Hierarchical storage organization.

**Features:**
- Tree view with indentation
- Inline create/edit form
- Parent selection dropdown
- Location types (room, cabinet, shelf, closet, safe, other)
- Default location setting
- Inventory count display
- Delete with cascade warning

**Example Hierarchy:**
```
Home ★ (Default)
  └─ Living Room
      └─ Bar Cabinet
          └─ Shelf 1
          └─ Shelf 2
  └─ Basement
      └─ Storage Rack
Office
  └─ Desk Drawer
```

---

## Admin Pages

### AdminBottleSubmissionsPage

**Location:** `src/pages/AdminBottleSubmissionsPage.jsx`  
**Route:** `/app/admin/bottles-submissions`  
**Role:** `moderator`, `admin`

Moderate user-submitted bottles.

**Features:**
- Filter by status (pending, rejected, all)
- Approve / Reject / Merge actions
- Submitted by email display
- Link to bottle detail

**Actions:**
- **Approve** — Adds to official catalog
- **Reject** — With optional reason
- **Merge** — Into existing bottle (for duplicates)

---

### AdminTagsPage

**Location:** `src/pages/AdminTagsPage.jsx`  
**Route:** `/app/admin/tags`  
**Role:** `admin`

Register and manage NFC tags.

**Features:**
- Register new tag form
- Update existing tag label
- View all tags table

**Table Columns:**
- NFC UID
- Label
- Status
- User (registered to)
- Inventory (linked bottle)

---

### AdminTagPacksPage

**Location:** `src/pages/AdminTagPacksPage.jsx`  
**Route:** `/app/admin/tag-packs`  
**Role:** `admin`

Manage NFC tag bundles for sale/distribution.

**Features:**
- Stats grid (total, active, claimed, tags in packs)
- Create pack modal
- Assign to user modal
- Void pack modal
- Link to bulk import

**Table Columns:**
- Pack Code (links to detail)
- Name
- Tags (actual / expected)
- Price
- Status badge
- Claimed By
- Actions (View, Assign, Void)

---

### AdminTagPackDetailPage

**Location:** `src/pages/AdminTagPackDetailPage.jsx`  
**Route:** `/app/admin/tag-packs/:id`  
**Role:** `admin`

Single tag pack management.

**Features:**
- Pack info card (status, counts, price, creator)
- Claimed by card (if claimed)
- Void details card (if voided)
- QR code modal with download
- Add tags modal (paste UIDs)
- Tags table

**QR Modal:**
- SVG QR code display
- Claim URL (universal link)
- App deep link
- Barcode data
- Copy URL / Download QR buttons

---

### AdminBulkImportPage

**Location:** `src/pages/AdminBulkImportPage.jsx`  
**Route:** `/app/admin/tags/bulk-import`  
**Role:** `admin`

Rapid NFC tag registration.

**States:**

1. **No Active Session**
   - Start session button
   - Link to pack (optional)
   - Session notes

2. **Active Session**
   - Session badge with pack code
   - Stats (added / failed counts)
   - Scan input (auto-focus)
   - Recent log (last 20 tags)
   - End / Abandon buttons

**Flow:**
```
Start Session → Scan tags one by one → End Session
```

---

### AdminUsersPage

**Location:** `src/pages/AdminUsersPage.jsx`  
**Route:** `/app/admin/users`  
**Role:** `admin`

User and invite management.

**Tabs:**

1. **Users Tab**
   - Create user form
   - Search / filter by role / status
   - Inline edit (name, email, role, active)
   - Lock / Unlock / Reset Password actions

2. **Invites Tab**
   - Create invite form
   - Invites table with status
   - Revoke action

**Invite Statuses:**
- `pending` — Not yet used
- `accepted` — User registered
- `expired` — Past expiration
- `revoked` — Manually revoked

---

### AdminPurchaseLocationsPage

**Location:** `src/pages/AdminPurchaseLocationsPage.jsx`  
**Route:** `/app/admin/purchase-locations`  
**Role:** `admin`

Store catalog moderation.

**Features:**
- Search by name
- Filter by status / type
- Pending count badge
- Moderation modal with field editing
- Detail view modal

**Moderation Flow:**
1. View pending location
2. Review / edit fields
3. Approve or Reject with notes
4. Auto-link pending inventory items on approve

---

### AdminAuditLogsPage

**Location:** `src/pages/AdminAuditLogsPage.jsx`  
**Route:** `/app/admin/audit-logs`  
**Role:** `admin`

System activity monitoring.

**Filters:**
- Search (email, path, entity ID)
- Action type
- Entity type
- Status code
- Date range
- Page size

**Table Columns:**
- Time
- Actor (email + role)
- Action
- Entity (type:id)
- Path
- Status
- Details button

**Detail Modal:**
- All log fields
- Metadata JSON (pretty-printed)