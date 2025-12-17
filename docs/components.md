# Component Reference

> Documentation for all reusable components in the BarrelChatter frontend.

---

## Table of Contents

- [Layout Components](#layout-components)
- [Form Components](#form-components)
- [Display Components](#display-components)
- [Modal Components](#modal-components)
- [Utility Components](#utility-components)

---

## Layout Components

### AppLayout

**Location:** `src/components/layout/AppLayout.jsx`

Main application shell with sidebar navigation and top bar.

```jsx
import AppLayout from './components/layout/AppLayout';

// Used in App.jsx routing
<Route path="/app" element={<AppLayout />}>
  <Route path="home" element={<HomePage />} />
  {/* Nested routes render in <Outlet /> */}
</Route>
```

**Features:**
- Sidebar navigation with role-based menu items
- User avatar and logout in top bar
- Separators between nav sections
- Admin section for moderator/admin roles

**Navigation Structure:**
```
Home
─────────────
Bottles
Inventory
Tastings
Wishlist
Tags
─────────────
Settings:
  Storage Locations
─────────────
Admin (if role allows):
  Bottle Submissions
  Admin Tags
  Admin Users
  Audit Logs
  Purchase Locations
  Tag Packs
```

---

### ProtectedRoute

**Location:** `src/components/ProtectedRoute.jsx`

Route wrapper that enforces authentication and optional role requirements.

```jsx
import ProtectedRoute from './components/ProtectedRoute';

// Basic protection (any logged-in user)
<ProtectedRoute>
  <SomePage />
</ProtectedRoute>

// Role-specific protection
<ProtectedRoute requireRoles={['admin', 'moderator']}>
  <AdminPage />
</ProtectedRoute>
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | ReactNode | Yes | Content to render when authorized |
| `requireRoles` | string[] | No | Roles allowed to access (e.g., `['admin']`) |

**Behavior:**
- Shows "Loading..." during auth initialization
- Redirects to `/login` if not authenticated
- Redirects to `/app/inventory` if role not in `requireRoles`

---

## Form Components

### StorageLocationSelect

**Location:** `src/components/StorageLocationSelect.jsx`

Hierarchical dropdown for selecting storage locations with inline creation.

```jsx
import StorageLocationSelect from './components/StorageLocationSelect';

<StorageLocationSelect
  value={form.storage_location_id}
  onChange={(locationId, location) => {
    setForm({ ...form, storage_location_id: locationId });
  }}
  allowCreate={true}
  showLegacy={true}
  legacyValue={form.location_label}
  onLegacyChange={(label) => setForm({ ...form, location_label: label })}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | string\|null | - | Selected location ID |
| `onChange` | (id, location) => void | - | Called on selection change |
| `allowCreate` | boolean | `true` | Show "Create new..." option |
| `showLegacy` | boolean | `true` | Show fallback text input |
| `legacyValue` | string | `''` | Current text input value |
| `onLegacyChange` | (value) => void | - | Called on text input change |
| `disabled` | boolean | `false` | Disable the select |
| `className` | string | `''` | Additional CSS class |

**Features:**
- Loads locations from `/v1/storage-locations`
- Displays hierarchy with indentation
- Inline create form for new locations
- Fallback to legacy text input
- Shows default location with ★

---

### PurchaseLocationSelect

**Location:** `src/components/PurchaseLocationSelect.jsx`

Searchable dropdown for selecting stores/venues with moderation workflow.

```jsx
import PurchaseLocationSelect from './components/PurchaseLocationSelect';

<PurchaseLocationSelect
  value={form.purchase_location_id}
  onChange={(locationId, location) => {
    setForm({ ...form, purchase_location_id: locationId });
  }}
  inventoryId={inventoryId}  // For pending request tracking
  allowCreate={true}
  showLegacy={true}
  legacyStore={form.purchase_store}
  legacyCity={form.purchase_city}
  legacyState={form.purchase_state}
  onLegacyChange={({ store, city, state }) => {
    setForm({ ...form, purchase_store: store, purchase_city: city, purchase_state: state });
  }}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | string\|null | - | Selected location ID |
| `onChange` | (id, location) => void | - | Called on selection change |
| `inventoryId` | string | - | Inventory ID for pending request tracking |
| `allowCreate` | boolean | `true` | Show "Submit new..." option |
| `showLegacy` | boolean | `true` | Show manual entry fallback |
| `legacyStore` | string | `''` | Legacy store name |
| `legacyCity` | string | `''` | Legacy city |
| `legacyState` | string | `''` | Legacy state |
| `onLegacyChange` | ({ store, city, state }) => void | - | Called on legacy input change |
| `disabled` | boolean | `false` | Disable the select |

**Features:**
- Debounced search (300ms)
- Shows pending approval status
- Location type icons (Liquor Store, Bar, etc.)
- Create form with moderation note
- US state dropdown

**Location Types:**
```javascript
const LOCATION_TYPES = [
  { value: 'liquor_store', label: 'Liquor Store' },
  { value: 'grocery_store', label: 'Grocery Store' },
  { value: 'bar', label: 'Bar' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'distillery', label: 'Distillery' },
  { value: 'online', label: 'Online Retailer' },
  { value: 'other', label: 'Other' },
];
```

---

### BarrelTrackingSection

**Location:** `src/components/BarrelTrackingSection.jsx`

Form section for barrel provenance on single barrel / limited releases.

```jsx
import BarrelTrackingSection, { BarrelInfoDisplay } from './components/BarrelTrackingSection';

// In edit form (when is_single_barrel or is_limited_release)
{(form.is_single_barrel || form.is_limited_release) && (
  <BarrelTrackingSection
    formData={form}
    onChange={handleChange}
    expanded={true}
    disabled={false}
  />
)}

// In detail view
<BarrelInfoDisplay bottle={bottle} />
```

**Props (BarrelTrackingSection):**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `formData` | object | - | Form state with barrel fields |
| `onChange` | (e) => void | - | Standard form change handler |
| `expanded` | boolean | `false` | Initially expanded |
| `disabled` | boolean | `false` | Disable all fields |

**Form Fields:**
- `barrel_date` - When juice entered barrel
- `bottle_date` - When bottled for sale
- `barrel_number` - From the label
- `rickhouse_location` - Where it aged
- `msrp` - Manufacturer suggested retail price

**Calculated Display:**
- Barrel age (years) computed from dates
- Date validation (bottle after barrel)

---

### PurchaseInfoSection

**Location:** `src/components/PurchaseInfoSection.jsx`

Form section for purchase details with real-time deal analysis.

```jsx
import PurchaseInfoSection, { PurchaseInfoDisplay } from './components/PurchaseInfoSection';

// In edit form
<PurchaseInfoSection
  formData={form}
  onChange={handleChange}
  pricingContext={pricingData?.pricing}
  disabled={false}
/>

// In detail view
<PurchaseInfoDisplay 
  inventory={item}
  pricingContext={pricingData?.pricing}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `formData` | object | Form state with `price_paid`, `purchase_date` |
| `onChange` | (e) => void | Form change handler |
| `pricingContext` | object | `{ avg_price, avg_msrp }` from pricing API |
| `disabled` | boolean | Disable all fields |

**Features:**
- Real-time deal indicator as you type price
- Comparison to community average
- MSRP comparison badge
- Pricing hint when no price entered

---

### PhotoUpload

**Location:** `src/components/PhotoUpload.jsx`

Photo upload component with DO Spaces integration.

```jsx
import PhotoUpload from './components/PhotoUpload';

<PhotoUpload
  bottleId={bottle.id}
  onUploaded={(photo, allPhotos, primaryUrl) => {
    setBottle({ ...bottle, photos: allPhotos, primary_photo_url: primaryUrl });
  }}
  onError={(message) => setPhotoError(message)}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `bottleId` | string | Bottle UUID to associate photo with |
| `onUploaded` | (photo, photos[], primaryUrl) => void | Success callback |
| `onError` | (message) => void | Error callback |

**Features:**
- Click-to-select file picker
- Preview before upload
- Caption input
- Progress bar
- File type validation (JPEG, PNG, WebP, GIF)
- Size validation (10MB max)

**Upload Flow:**
1. User selects file
2. Preview displayed
3. User clicks "Upload Photo"
4. File uploaded to DO Spaces via `useSpacesUpload`
5. Photo registered with API (`POST /v1/bottles/:id/photos`)
6. Callbacks invoked

---

## Display Components

### BottlePricingCard

**Location:** `src/components/BottlePricingCard.jsx`

Displays community pricing intelligence for a bottle.

```jsx
import BottlePricingCard from './components/BottlePricingCard';

// Full version
<BottlePricingCard 
  bottleId={bottle.id}
  userPricePaid={59.99}
/>

// Compact version (for inventory cards)
<BottlePricingCard 
  bottleId={bottle.id}
  userPricePaid={59.99}
  compact={true}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bottleId` | string | - | Bottle UUID |
| `userPricePaid` | number | - | User's price for comparison |
| `compact` | boolean | `false` | Show compact version |

**Displayed Data:**
- Average price paid
- MSRP (if available)
- Price range (min-max)
- Median price
- MSRP comparison insight
- User's deal analysis
- Regional breakdown (top 5 states)
- Price trend indicator

**States:**
- Loading spinner
- Error message
- "Not enough data" (< 3 samples)
- Full pricing display

---

### DealBadge

**Location:** `src/components/DealBadge.jsx`

Visual badge indicating deal quality.

```jsx
import DealBadge, { PriceComparisonText } from './components/DealBadge';

// Badge
<DealBadge
  priceVsAvgPct={-15}  // 15% below average
  priceVsMsrpPct={-5}  // 5% below MSRP
  size="md"
  showLabel={true}
/>

// Text comparison
<PriceComparisonText
  priceVsAvgPct={-15}
  priceVsMsrpPct={null}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `priceVsAvgPct` | number | - | Percentage vs average (negative = below) |
| `priceVsMsrpPct` | number | - | Percentage vs MSRP |
| `size` | 'sm'\|'md'\|'lg' | `'md'` | Badge size |
| `showLabel` | boolean | `true` | Show text label |

**Badge Variants:**
| Condition | Variant | Label | Icon |
|-----------|---------|-------|------|
| ≤ -20% vs avg | `great-deal` | Great Deal! | 🎉 |
| ≤ -10% vs avg | `good-deal` | Good Price | ✓ |
| ≥ 50% vs avg | `secondary` | Secondary Market | ⚡ |
| ≥ 30% vs avg | `premium` | Premium | ↑ |
| ≤ -15% vs MSRP | `below-msrp` | Below MSRP | ↓ |
| ≥ 50% vs MSRP | `above-msrp` | Above MSRP | ↑ |

---

## Modal Components

### LogTastingModal

**Location:** `src/components/LogTastingModal.jsx`

Modal for logging a new tasting/pour.

```jsx
import LogTastingModal from './components/LogTastingModal';

const [showModal, setShowModal] = useState(false);
const [selectedInventoryId, setSelectedInventoryId] = useState(null);

<LogTastingModal
  isOpen={showModal}
  initialInventoryId={selectedInventoryId}
  onClose={() => setShowModal(false)}
  onCreated={(tasting) => {
    console.log('Tasting logged:', tasting);
    refreshTastings();
  }}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | boolean | Whether modal is visible |
| `initialInventoryId` | string | Pre-selected inventory item |
| `onClose` | () => void | Called when modal closes |
| `onCreated` | (tasting) => void | Called after successful creation |

**Form Fields:**
- Inventory selection (dropdown)
- Pour amount (oz) with presets (0.5, 1, 1.5, 2)
- Rating (0-10)
- Notes (textarea)

---

### NewBottleSubmissionModal

**Location:** `src/components/NewBottleSubmissionModal.jsx`

Modal for submitting a new bottle to the catalog.

```jsx
import NewBottleSubmissionModal from './components/NewBottleSubmissionModal';

<NewBottleSubmissionModal
  isOpen={showModal}
  initialName={searchTerm}  // Pre-fill from failed search
  onClose={() => setShowModal(false)}
  onCreated={({ bottle, inventory }) => {
    // bottle: the created bottle
    // inventory: inventory item if "Submit & add to inventory" was clicked
    refreshBottles();
  }}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | boolean | Whether modal is visible |
| `initialName` | string | Pre-fill bottle name |
| `onClose` | () => void | Called when modal closes |
| `onCreated` | ({ bottle, inventory }) => void | Called after creation |

**Form Sections:**
1. Basic info (name*, brand*, distillery*, type*)
2. Release details (release name, single barrel, limited release, bottle count)
3. Production details (finish, mash bill)
4. Description

**Submit Options:**
- "Submit bottle only" — Just create the bottle
- "Submit & add to inventory" — Create bottle + inventory entry

---

## Utility Components

### Image URL Resolution

Common pattern used across components:

```jsx
import { API_BASE_URL } from '../api/client';

const apiBase = (API_BASE_URL || '').replace(/\/$/, '');

function resolveImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${apiBase}${path}`;
}

// Usage
<img src={resolveImageUrl(bottle.primary_photo_url)} alt={bottle.name} />
```

### Date Formatting

Common formatting functions:

```javascript
function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function formatTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
```

### Price Formatting

```javascript
function formatPrice(value) {
  if (value == null) return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return `$${num.toFixed(2)}`;
}

function formatCurrency(amount) {
  if (amount == null) return '—';
  return `$${Number(amount).toFixed(2)}`;
}
```