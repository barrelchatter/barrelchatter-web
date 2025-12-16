# BarrelChatter Pages Reference

Complete documentation for all pages in the BarrelChatter web application.

---

## Public Pages

### LoginPage

**Route:** `/login`  
**File:** `src/pages/LoginPage.jsx`  
**Style:** `src/styles/LoginPage.module.scss`

**Purpose:** User authentication entry point.

**Features:**
- Email and password form
- Remember me option (persists to localStorage)
- Link to registration page
- Error display for failed attempts
- Redirect to `/app` on success

**State:**
- `email`, `password` - Form fields
- `error` - Error message display
- `loading` - Submit button state

**API Calls:**
- `POST /v1/auth/login` - Authenticate user

---

### RegisterPage

**Route:** `/register`  
**File:** `src/pages/RegisterPage.jsx`  
**Style:** `src/styles/RegisterPage.module.scss`

**Purpose:** New user registration (invite-only in Phase 1).

**Features:**
- Invitation token validation (from URL query param)
- Name, email, password fields
- Password confirmation
- Terms acceptance checkbox
- Error handling for invalid/expired tokens

**URL Parameters:**
- `?token=<invitation_token>` - Required invitation token

**State:**
- Form fields: `name`, `email`, `password`, `confirmPassword`
- `acceptTerms` - Terms checkbox
- `error`, `loading` - UI states
- `tokenValid`, `tokenChecking` - Token validation state

**API Calls:**
- `GET /v1/auth/validate-token?token=...` - Validate invitation
- `POST /v1/auth/register` - Create account

---

## Authenticated Pages

All pages under `/app` require authentication via `ProtectedRoute`.

### HomePage

**Route:** `/app` or `/app/home`  
**File:** `src/pages/HomePage.jsx`  
**Style:** `src/styles/HomePage.module.scss`

**Purpose:** Dashboard with collection overview and recent activity.

**Sections:**
1. **Hero** - Greeting with user name and search link
2. **Stats Grid** - Counts for bottles, inventory, tastings, wishlist
3. **Top Rated** - Highest-rated bottles from user's collection
4. **Recent Activity** - Latest tastings logged
5. **Quick Actions** - Shortcuts to common tasks

**State:**
- `stats` - Collection statistics from API
- `topRated` - Top-rated bottles
- `activity` - Recent tastings
- `loading`, `error` - UI states

**API Calls:**
- `GET /v1/users/me/stats` - Dashboard statistics
- `GET /v1/tastings?limit=5&sort=-created_at` - Recent activity
- `GET /v1/inventory?sort=-avg_rating&limit=4` - Top rated

---

### ProfilePage

**Route:** `/app/profile`  
**File:** `src/pages/ProfilePage.jsx`  
**Style:** `src/styles/ProfilePage.module.scss`

**Purpose:** User profile management and account settings.

**Sections:**
1. **Profile Card** - Avatar, name, email, role badge
2. **Stats Card** - Quick collection statistics
3. **Security Card** - Password change form
4. **Danger Zone** - Logout button

**Features:**
- Edit profile (name, avatar)
- Change password
- View collection stats
- Logout action

**State:**
- `user` - Current user data (from AuthContext)
- `stats` - User statistics
- `editing` - Edit mode toggle
- `editForm` - Form fields for profile edit
- `passwordForm` - Password change fields
- `changingPassword` - Password form visibility

**API Calls:**
- `GET /v1/users/me/stats` - User statistics
- `PUT /v1/users/me` - Update profile
- `PUT /v1/users/me/password` - Change password

---

### BottlesPage

**Route:** `/app/bottles`  
**File:** `src/pages/BottlesPage.jsx`  
**Style:** `src/styles/BottlesPage.module.scss`

**Purpose:** Browse and search the verified bottle catalog.

**Features:**
- Search by name/distillery
- Filter by type (bourbon, rye, scotch, etc.)
- View modes: Table, Card, Gallery
- Sort by name, distillery, type, proof
- Submit new bottle (opens modal)
- View bottle details (links to BottleDetailPage)

**View Modes:**
- **Table** - Compact list with sortable columns
- **Card** - Image cards with key info
- **Gallery** - Large images in grid

**State:**
- `bottles` - Bottle list from API
- `search` - Search term
- `filterType` - Type filter
- `sortBy`, `sortDir` - Sort configuration
- `viewMode` - Current view (table/card/gallery)
- `showAddModal` - New bottle submission modal

**API Calls:**
- `GET /v1/bottles?search=...&type=...&sort=...` - Fetch bottles
- `POST /v1/bottles/submissions` - Submit new bottle (via modal)

---

### BottleDetailPage

**Route:** `/app/bottles/:id`  
**File:** `src/pages/BottleDetailPage.jsx`  
**Style:** `src/styles/BottleDetailPage.module.scss`

**Purpose:** Detailed view of a single bottle with photos, inventory, and tastings.

**Sections:**
1. **Main Card** - Bottle info (name, distillery, type, proof, age, description)
2. **Photos Section** - Bottle images with upload capability
3. **Side Card** - Wishlist status, add to collection action
4. **Inventory Section** - User's copies of this bottle
5. **Tastings Section** - Tastings logged for this bottle

**Features:**
- Edit bottle details (if user submitted it)
- Upload/manage photos
- Add to wishlist
- Add to inventory
- View related tastings

**State:**
- `bottle` - Bottle data
- `photos` - Bottle photos
- `inventory` - User's inventory items for this bottle
- `tastings` - Tastings for this bottle
- `wishlistItem` - Wishlist status
- `editing` - Edit mode
- Various loading/error states

**API Calls:**
- `GET /v1/bottles/:id` - Bottle details
- `GET /v1/bottles/:id/photos` - Bottle photos
- `GET /v1/inventory?bottle_id=...` - User's inventory
- `GET /v1/tastings?bottle_id=...` - Related tastings
- `GET /v1/wishlists?bottle_id=...` - Wishlist check
- `PUT /v1/bottles/:id` - Update bottle
- `POST /v1/bottles/:id/photos` - Upload photo

---

### InventoryPage

**Route:** `/app/inventory`  
**File:** `src/pages/InventoryPage.jsx`  
**Style:** `src/styles/InventoryPage.module.scss`

**Purpose:** Manage personal bottle collection.

**Features:**
- Add new inventory item
- Filter by status (sealed, open, finished, sample)
- Filter by location
- View modes: Table, Card, Gallery
- Quick status change
- Link to bottle details

**Status Values:**
- `sealed` - Unopened bottle
- `open` - Currently drinking
- `finished` - Empty bottle (historical record)
- `sample` - Sample/miniature

**State:**
- `inventory` - Inventory items
- `filterStatus`, `filterLocation` - Filters
- `viewMode` - Display mode
- `showAddForm` - Add form visibility
- Form fields for new item

**API Calls:**
- `GET /v1/inventory` - Fetch inventory
- `POST /v1/inventory` - Add new item
- `PUT /v1/inventory/:id` - Update item
- `DELETE /v1/inventory/:id` - Remove item

---

### InventoryDetailPage

**Route:** `/app/inventory/:id`  
**File:** `src/pages/InventoryDetailPage.jsx`  
**Style:** `src/styles/InventoryDetailPage.module.scss`

**Purpose:** Detailed view of a single inventory item.

**Sections:**
1. **Hero Row** - Bottle image, name, distillery, link to bottle
2. **Info Grid** - Status, location, purchase info, dates
3. **Side Card** - Pour stats, quick actions
4. **Tastings Section** - Tastings logged for this specific bottle

**Features:**
- Edit inventory details
- Change status
- Log new tasting (opens modal)
- View tasting history

**State:**
- `item` - Inventory item data
- `tastings` - Tastings for this item
- `editing` - Edit mode
- `showLogModal` - Tasting modal

**API Calls:**
- `GET /v1/inventory/:id` - Item details
- `GET /v1/tastings?inventory_id=...` - Item tastings
- `PUT /v1/inventory/:id` - Update item

---

### TastingsPage

**Route:** `/app/tastings`  
**File:** `src/pages/TastingsPage.jsx`  
**Style:** `src/styles/TastingsPage.module.scss`

**Purpose:** View and manage tasting history.

**Features:**
- List all tastings chronologically
- Inline editing of notes and rating
- Delete tastings
- Link to bottle/inventory details
- Log new tasting (button opens modal)

**Columns:**
- Date/time
- Bottle name
- Rating
- Pour amount
- Notes (truncated)
- Actions (edit/delete)

**State:**
- `tastings` - Tasting list
- `editingId` - Currently editing row
- `editForm` - Edit form values

**API Calls:**
- `GET /v1/tastings` - Fetch tastings
- `PUT /v1/tastings/:id` - Update tasting
- `DELETE /v1/tastings/:id` - Remove tasting

---

### WishlistPage

**Route:** `/app/wishlists`  
**File:** `src/pages/WishlistPage.jsx`  
**Style:** `src/styles/WishlistPage.module.scss`

**Purpose:** Track desired bottles with target prices.

**Features:**
- Add bottles to wishlist
- Set preferred price target
- Add notes
- Toggle price alerts
- Remove from wishlist
- Link to bottle details

**State:**
- `wishlist` - Wishlist items
- `showAddForm` - Add form visibility
- Form fields for new item

**API Calls:**
- `GET /v1/wishlists` - Fetch wishlist
- `POST /v1/wishlists` - Add item
- `PUT /v1/wishlists/:id` - Update item
- `DELETE /v1/wishlists/:id` - Remove item

---

### TagsPage

**Route:** `/app/tags`  
**File:** `src/pages/TagsPage.jsx`  
**Style:** `src/styles/TagsPage.module.scss`

**Purpose:** Manage personal NFC tags linked to bottles.

**Features:**
- Scan/lookup tag by UID
- Claim unassigned tags
- Link tags to inventory items
- Add custom labels
- Release tags

**Tag States:**
- `unassigned` - Available to claim
- `claimed` - Owned by user, linked to inventory
- `locked` - Cannot be modified

**State:**
- `lookupUid` - UID being looked up
- `lookupResult` - Tag lookup result
- `userTags` - User's claimed tags
- Form fields for linking

**API Calls:**
- `GET /v1/tags/lookup/:uid` - Look up tag
- `POST /v1/tags/:id/claim` - Claim tag
- `PUT /v1/tags/:id` - Update tag
- `POST /v1/tags/:id/release` - Release tag
- `GET /v1/tags/mine` - User's tags

---

## Admin Pages

All admin pages require `admin` role (or `moderator` for submissions).

### AdminUsersPage

**Route:** `/app/admin/users`  
**File:** `src/pages/AdminUsersPage.jsx`  
**Style:** `src/styles/AdminUsersPage.module.scss`

**Purpose:** User and invitation management.

**Tabs:**
1. **Invitations** - Create and manage invitation tokens
2. **Users** - View and edit registered users

**Invitation Features:**
- Generate new invitation tokens
- Set expiration
- Copy token link
- View pending/accepted/expired invitations

**User Features:**
- Search users
- Filter by role/status
- Edit user details
- Change user role
- Lock/unlock accounts
- View user metadata

**API Calls:**
- `GET /v1/admin/invitations` - List invitations
- `POST /v1/admin/invitations` - Create invitation
- `DELETE /v1/admin/invitations/:id` - Revoke invitation
- `GET /v1/admin/users` - List users
- `PUT /v1/admin/users/:id` - Update user
- `POST /v1/admin/users/:id/lock` - Lock user
- `POST /v1/admin/users/:id/unlock` - Unlock user

---

### AdminTagsPage

**Route:** `/app/admin/tags`  
**File:** `src/pages/AdminTagsPage.jsx`  
**Style:** `src/styles/AdminTagsPage.module.scss`

**Purpose:** Global NFC tag management.

**Features:**
- Register new tags in system
- View all tags with status
- Transfer tag ownership
- Lock/unlock tags
- Remove tags

**API Calls:**
- `GET /v1/admin/tags` - List all tags
- `POST /v1/admin/tags` - Register tag
- `PUT /v1/admin/tags/:id` - Update tag
- `DELETE /v1/admin/tags/:id` - Remove tag

---

### AdminBottleSubmissionsPage

**Route:** `/app/admin/bottles-submissions`  
**File:** `src/pages/AdminBottleSubmissionsPage.jsx`  
**Style:** `src/styles/AdminBottleSubmissionsPage.module.scss`

**Access:** `moderator` or `admin` role

**Purpose:** Review user-submitted bottles for catalog inclusion.

**Features:**
- List pending submissions
- Filter by status (pending, approved, rejected)
- Approve submissions (adds to catalog)
- Reject submissions with reason
- View submission details

**Workflow:**
1. User submits bottle via BottlesPage modal
2. Submission appears as "pending"
3. Moderator reviews and approves/rejects
4. Approved bottles join verified catalog

**API Calls:**
- `GET /v1/bottles/submissions` - List submissions
- `PUT /v1/bottles/submissions/:id/approve` - Approve
- `PUT /v1/bottles/submissions/:id/reject` - Reject

---

### AdminAuditLogsPage

**Route:** `/app/admin/audit-logs`  
**File:** `src/pages/AdminAuditLogsPage.jsx`  
**Style:** `src/styles/AdminAuditLogsPage.module.scss`

**Purpose:** View system audit trail for security and debugging.

**Features:**
- Filter by date range
- Filter by action type
- Filter by user
- Filter by entity type
- Pagination
- View detailed JSON payload

**Log Entry Fields:**
- Timestamp
- Actor (user who performed action)
- Action (create, update, delete, login, etc.)
- Entity type and ID
- IP address
- User agent
- Payload (JSON diff)

**API Calls:**
- `GET /v1/admin/audit-logs` - Paginated log query
- Query params: `from`, `to`, `action`, `user_id`, `entity_type`, `page`, `limit`

---

## Modals

### LogTastingModal

**File:** `src/components/LogTastingModal.jsx`  
**Style:** `src/styles/LogTastingModal.module.scss`

**Purpose:** Log a new pour/tasting.

**Triggered From:**
- HomePage quick actions
- InventoryDetailPage
- Floating action button (future)

**Fields:**
- Inventory item (select from user's open bottles)
- Pour amount (presets: 0.5oz, 1oz, 1.5oz, 2oz + custom)
- Rating (0-10)
- Notes (freeform text)
- Photo (optional)

**Props:**
- `inventoryId` - Pre-selected inventory item (optional)
- `onClose` - Close handler
- `onSaved` - Success callback

---

### NewBottleSubmissionModal

**File:** `src/components/NewBottleSubmissionModal.jsx`  
**Style:** `src/styles/NewBottleSubmissionModal.module.scss`

**Purpose:** Submit a new bottle to the catalog.

**Triggered From:**
- BottlesPage "Add Bottle" button

**Fields:**
- Name (required)
- Brand
- Distillery (required)
- Type (required)
- Proof/ABV
- Age statement
- Description
- Mashbill
- Flavor tags (checkboxes)

**Workflow:**
1. User fills form
2. Submission created with "pending" status
3. Moderator reviews (AdminBottleSubmissionsPage)
4. User notified of approval/rejection (future)
