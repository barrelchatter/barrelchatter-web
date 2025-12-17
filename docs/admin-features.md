# Admin Features Guide

> Comprehensive documentation for BarrelChatter administrative functionality.

---

## Overview

Admin features are restricted to users with `owner` or `admin` roles. All admin pages are protected by the `ProtectedRoute` component with `requireAdmin={true}`.

---

## Access Control

### Role Hierarchy

| Role | Description | Admin Access |
|------|-------------|--------------|
| `owner` | System owner (Nick) | Full access |
| `admin` | Trusted administrators | Full access |
| `user` | Regular users | No admin access |

### Route Protection

```jsx
// Admin routes in App.jsx
<Route 
  path="/admin/*" 
  element={
    <ProtectedRoute requireAdmin={true}>
      <AdminLayout />
    </ProtectedRoute>
  }
/>
```

### Navigation

Admin users see an additional "Admin" section in the sidebar:

```
├── Home
├── Collection
├── Tastings
├── Wishlist
├── Tags
├── Profile
└── Admin ▼
    ├── Bottle Submissions
    ├── Tags
    ├── Tag Packs
    ├── Users
    ├── Purchase Locations
    └── Audit Logs
```

---

## Admin Pages

### Bottle Submissions

**Route:** `/admin/bottle-submissions`

**Purpose:** Moderate user-submitted bottles before they enter the global catalog.

**Features:**
- List pending submissions with filters (pending, approved, rejected)
- Review submission details
- Approve to create new bottle
- Reject with reason
- Merge with existing bottle (duplicate handling)

**Workflow:**
```
User submits bottle → Pending queue → Admin reviews
                                          ↓
                    ┌─────────────────────┼─────────────────────┐
                    ↓                     ↓                     ↓
                 Approve              Reject               Merge
                    ↓                     ↓                     ↓
            Creates bottle        Notifies user       Links to existing
            in catalog            with reason         bottle record
```

**Table Columns:**
| Column | Description |
|--------|-------------|
| Name | Submitted bottle name |
| Distillery | Submitted distillery |
| Type | Bourbon, rye, etc. |
| Submitted By | User who submitted |
| Date | Submission date |
| Status | Pending/Approved/Rejected |
| Actions | Approve/Reject/Merge buttons |

**Merge Flow:**
1. Admin clicks "Merge"
2. Search modal opens with existing bottles
3. Admin selects target bottle
4. Submission linked to existing bottle
5. Original submitter's inventory updated

---

### Tags Administration

**Route:** `/admin/tags`

**Purpose:** Manage NFC tags in the system.

**Features:**
- View all tags with status and assignment
- Register new individual tags
- Reset tag ownership
- Transfer tags between users
- Delete tags
- Filter by status (unassigned, claimed, locked)

**Tag States:**
| Status | Description |
|--------|-------------|
| `unassigned` | In system, not claimed by user |
| `claimed` | Assigned to user and bottle |
| `locked` | Permanently assigned (premium) |

**Table Columns:**
| Column | Description |
|--------|-------------|
| NFC UID | Unique tag identifier |
| Label | Optional friendly name |
| Status | Current state |
| Assigned To | User (if claimed) |
| Bottle | Linked bottle (if assigned) |
| Pack | Tag pack membership |
| Actions | Reset/Transfer/Delete |

---

### Tag Packs

**Route:** `/admin/tag-packs`

**Purpose:** Manage bundled tag packages for distribution.

**Features:**
- Create new tag packs
- Add/remove tags from packs
- Generate QR codes for pack activation
- Track pack status and redemption
- View pack contents and history

**Pack Types:**
| Type | Description | Typical Size |
|------|-------------|--------------|
| `starter` | New user starter kit | 5-10 tags |
| `collector` | Enthusiast pack | 25 tags |
| `premium` | High-end collector | 50+ tags |
| `promo` | Promotional giveaway | Varies |

**Pack Detail Page:**

**Route:** `/admin/tag-packs/:id`

**Features:**
- Pack metadata (name, type, created date)
- Tag list with individual status
- Add tags (from unassigned pool)
- Remove tags (return to unassigned)
- Generate activation QR code
- View redemption history

**QR Code Modal:**
- Displays scannable QR code
- Links to pack activation URL
- Download as PNG option
- Print-friendly view

---

### Bulk Tag Import

**Route:** `/admin/tags/bulk-import`

**Purpose:** Rapidly register multiple NFC tags.

**Features:**
- Paste list of NFC UIDs
- CSV file upload
- Validation before import
- Duplicate detection
- Progress indicator
- Error reporting

**Input Formats:**
```
# Line-separated UIDs
04:A2:B3:C4:D5:E6:F7
04:B3:C4:D5:E6:F7:A8
04:C4:D5:E6:F7:A8:B9

# CSV format
nfc_uid,label
04:A2:B3:C4:D5:E6:F7,Tag 001
04:B3:C4:D5:E6:F7:A8,Tag 002
```

**Validation:**
- UID format check (hex pattern)
- Duplicate detection (in batch and existing)
- Character limit enforcement

---

### Users Administration

**Route:** `/admin/users`

**Purpose:** Manage users and invitations.

**Tabs:**
- **Users** - Active user accounts
- **Invitations** - Pending invites

**Users Tab Features:**
- List all users
- Edit user details
- Change user role
- Disable/enable accounts
- Delete users (with confirmation)
- View user statistics

**User Table Columns:**
| Column | Description |
|--------|-------------|
| Name | Display name |
| Email | Account email |
| Role | owner/admin/user |
| Created | Registration date |
| Last Active | Last login |
| Bottles | Inventory count |
| Status | Active/Disabled |
| Actions | Edit/Disable/Delete |

**Invitations Tab Features:**
- Create new invitation
- List pending invitations
- Copy invite link
- Resend invitation email
- Revoke invitation
- Track invitation status

**Invitation Table Columns:**
| Column | Description |
|--------|-------------|
| Email | Invited email |
| Invited By | Admin who sent |
| Date Sent | Invitation date |
| Expires | Expiration date |
| Status | Pending/Accepted/Expired |
| Actions | Resend/Revoke |

**Create Invitation Modal:**
```
┌─────────────────────────────────────┐
│ Invite New User                     │
├─────────────────────────────────────┤
│ Email *                             │
│ ┌─────────────────────────────────┐ │
│ │ friend@email.com                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Role                                │
│ ○ User (default)                    │
│ ○ Admin                             │
│                                     │
│ Personal Message (optional)         │
│ ┌─────────────────────────────────┐ │
│ │ Welcome to BarrelChatter!       │ │
│ └─────────────────────────────────┘ │
│                                     │
│        [Cancel]  [Send Invite]      │
└─────────────────────────────────────┘
```

---

### Purchase Locations Moderation

**Route:** `/admin/purchase-locations`

**Purpose:** Moderate community-submitted purchase locations.

**Features:**
- Review pending location submissions
- Approve new locations
- Reject with reason
- Merge duplicate locations
- Edit location details
- Mark as verified

**Location Workflow:**
```
User submits location → Pending → Admin reviews
                                      ↓
                    ┌─────────────────┼─────────────────┐
                    ↓                 ↓                 ↓
                 Approve           Reject            Merge
                    ↓                 ↓                 ↓
            Location live       Submission      Combined with
            and searchable      removed         existing location
```

**Table Columns:**
| Column | Description |
|--------|-------------|
| Name | Store/location name |
| Type | store/online/bar/auction |
| City | Location city |
| State | Location state |
| Submitted By | User who added |
| Status | pending/approved/rejected |
| Actions | Approve/Reject/Merge/Edit |

**Merge Flow:**
1. Select duplicate location
2. Search for target location
3. Review merged data
4. Confirm merge
5. All references updated to target

---

### Audit Logs

**Route:** `/admin/audit-logs`

**Purpose:** Track administrative and sensitive actions.

**Logged Actions:**
| Action | Description |
|--------|-------------|
| `user.create` | New user registered |
| `user.role_change` | User role modified |
| `user.delete` | User account deleted |
| `bottle.approve` | Submission approved |
| `bottle.reject` | Submission rejected |
| `tag.register` | New tag added |
| `tag.reset` | Tag ownership reset |
| `tag.transfer` | Tag moved between users |
| `pack.create` | Tag pack created |
| `pack.redeem` | Tag pack activated |
| `location.approve` | Location approved |
| `location.merge` | Locations merged |

**Table Columns:**
| Column | Description |
|--------|-------------|
| Timestamp | When action occurred |
| Action | Action type |
| User | Who performed action |
| Entity | Affected record type |
| Entity ID | Affected record ID |
| Details | JSON metadata |
| IP Address | Request origin |

**Filters:**
- Date range
- Action type
- User
- Entity type

**Detail View:**
Clicking a log entry shows full JSON details:
```json
{
  "action": "tag.transfer",
  "performed_by": "admin-uuid",
  "entity_type": "tag",
  "entity_id": "tag-uuid",
  "details": {
    "from_user": "user-1-uuid",
    "to_user": "user-2-uuid",
    "reason": "User request"
  },
  "ip_address": "192.168.1.1",
  "timestamp": "2024-01-15T14:30:00Z"
}
```

---

## API Endpoints

### Bottle Submissions

```
GET    /admin/bottle-submissions
GET    /admin/bottle-submissions/:id
POST   /admin/bottle-submissions/:id/approve
POST   /admin/bottle-submissions/:id/reject
POST   /admin/bottle-submissions/:id/merge
```

### Tags

```
GET    /admin/tags
POST   /admin/tags
POST   /admin/tags/bulk
PUT    /admin/tags/:id
DELETE /admin/tags/:id
POST   /admin/tags/:id/reset
POST   /admin/tags/:id/transfer
```

### Tag Packs

```
GET    /admin/tag-packs
GET    /admin/tag-packs/:id
POST   /admin/tag-packs
PUT    /admin/tag-packs/:id
DELETE /admin/tag-packs/:id
POST   /admin/tag-packs/:id/add-tags
POST   /admin/tag-packs/:id/remove-tags
GET    /admin/tag-packs/:id/qr
```

### Users

```
GET    /admin/users
GET    /admin/users/:id
PUT    /admin/users/:id
DELETE /admin/users/:id
POST   /admin/users/:id/disable
POST   /admin/users/:id/enable
```

### Invitations

```
GET    /admin/invitations
POST   /admin/invitations
DELETE /admin/invitations/:id
POST   /admin/invitations/:id/resend
```

### Purchase Locations

```
GET    /admin/purchase-locations
PUT    /admin/purchase-locations/:id
POST   /admin/purchase-locations/:id/approve
POST   /admin/purchase-locations/:id/reject
POST   /admin/purchase-locations/merge
```

### Audit Logs

```
GET    /admin/audit-logs
GET    /admin/audit-logs/:id
```

---

## Security Considerations

### Authorization Checks

Every admin endpoint validates:
1. User is authenticated
2. User has `owner` or `admin` role
3. Action is logged to audit trail

### Backend Middleware

```javascript
// middleware/requireAdmin.js
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};
```

### Audit Logging

```javascript
// services/auditService.js
const logAuditEvent = async (action, userId, entityType, entityId, details) => {
  await db('audit_logs').insert({
    id: uuidv4(),
    action,
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    details: JSON.stringify(details),
    ip_address: req.ip,
    created_at: new Date()
  });
};
```

### Sensitive Operations

High-risk operations require confirmation:
- User deletion
- Role changes
- Tag resets
- Bulk operations

---

## UI Patterns

### Admin Page Layout

```jsx
// Common admin page structure
export default function AdminExamplePage() {
  return (
    <div className={styles.adminPage}>
      <header className={styles.header}>
        <h1>Page Title</h1>
        <button className={styles.primaryAction}>Add New</button>
      </header>
      
      <div className={styles.filters}>
        {/* Filter controls */}
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          {/* Table content */}
        </table>
      </div>
      
      <div className={styles.pagination}>
        {/* Pagination controls */}
      </div>
    </div>
  );
}
```

### Confirmation Modal

```jsx
<ConfirmModal
  isOpen={showConfirm}
  title="Delete User"
  message="Are you sure? This cannot be undone."
  confirmLabel="Delete"
  confirmVariant="danger"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>
```

### Status Badges

```jsx
const statusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  unassigned: 'neutral',
  claimed: 'info',
  locked: 'premium'
};

<span className={`${styles.badge} ${styles[statusColors[status]]}`}>
  {status}
</span>
```

---

## See Also

- [Pages Reference](./PAGES.md) - All page documentation
- [API Integration](./API_INTEGRATION.md) - API patterns
- [Architecture](./ARCHITECTURE.md) - Auth and routing