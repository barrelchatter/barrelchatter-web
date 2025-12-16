# BarrelChatter Admin Features

Documentation for administrative functionality.

---

## Overview

Admin features are restricted to users with elevated roles:

| Role | Access Level |
|------|--------------|
| `user` | Standard features only |
| `moderator` | + Bottle submission review |
| `admin` | + Full admin panel access |

---

## Admin Navigation

Admin links appear in the sidebar only for authorized users:

```jsx
// In AppLayout.jsx
{(user.role === 'admin' || user.role === 'moderator') && (
  <div className={styles.adminSection}>
    <h4>Admin</h4>
    {user.role === 'admin' && (
      <>
        <NavLink to="/app/admin/users">Users</NavLink>
        <NavLink to="/app/admin/tags">Tags</NavLink>
        <NavLink to="/app/admin/audit-logs">Audit Logs</NavLink>
      </>
    )}
    <NavLink to="/app/admin/bottles-submissions">Submissions</NavLink>
  </div>
)}
```

---

## User Management

**Route:** `/app/admin/users`  
**Role Required:** `admin`

### Invitations Tab

Manage invite-only registration system.

**Features:**
- Generate new invitation tokens
- Set custom expiration (default: 7 days)
- Copy invitation link to clipboard
- View invitation status (pending/accepted/expired)
- Revoke pending invitations

**Invitation Link Format:**
```
https://app.barrelchatter.com/register?token=abc123...
```

**API Endpoints:**
```
GET    /v1/admin/invitations         # List all invitations
POST   /v1/admin/invitations         # Create invitation
DELETE /v1/admin/invitations/:id     # Revoke invitation
```

### Users Tab

View and manage registered users.

**Features:**
- Search users by name/email
- Filter by role (user/moderator/admin)
- Filter by status (active/locked)
- Edit user details (name, email)
- Change user role
- Lock/unlock user accounts
- View user metadata (created date, last login)

**API Endpoints:**
```
GET    /v1/admin/users              # List users
PUT    /v1/admin/users/:id          # Update user
POST   /v1/admin/users/:id/lock     # Lock account
POST   /v1/admin/users/:id/unlock   # Unlock account
```

---

## Tag Administration

**Route:** `/app/admin/tags`  
**Role Required:** `admin`

Manage the global NFC tag registry.

### Register Tags

Before users can claim tags, they must be registered in the system.

**Fields:**
- NFC UID (required, unique)
- Label (optional description)

**Bulk Registration:**
Tags can be registered individually or in bulk (comma-separated UIDs).

### Tag Management

**Features:**
- View all registered tags
- Filter by status (unassigned/claimed/locked)
- Search by UID or label
- Transfer tag ownership between users
- Lock tags (prevent release)
- Remove tags from system

**Tag Statuses:**
| Status | Description |
|--------|-------------|
| `unassigned` | Available for users to claim |
| `claimed` | Owned by a user, linked to inventory |
| `locked` | Cannot be released or transferred |

**API Endpoints:**
```
GET    /v1/admin/tags               # List all tags
POST   /v1/admin/tags               # Register new tag
PUT    /v1/admin/tags/:id           # Update tag
DELETE /v1/admin/tags/:id           # Remove tag
```

---

## Bottle Submissions

**Route:** `/app/admin/bottles-submissions`  
**Role Required:** `moderator` or `admin`

Review user-submitted bottles for catalog inclusion.

### Submission Workflow

1. User submits new bottle via BottlesPage
2. Submission created with `pending` status
3. Moderator reviews submission details
4. Approve → Bottle added to verified catalog
5. Reject → Submission marked rejected with reason

### Review Interface

**Submission Details:**
- Bottle name, brand, distillery
- Type, proof, age statement
- Description, mashbill
- Submitter info
- Submission date

**Actions:**
- **Approve** - Add to catalog (optionally edit before approving)
- **Reject** - Provide rejection reason

**Filters:**
- Pending (default view)
- Approved
- Rejected
- All

**API Endpoints:**
```
GET  /v1/bottles/submissions              # List submissions
PUT  /v1/bottles/submissions/:id/approve  # Approve
PUT  /v1/bottles/submissions/:id/reject   # Reject (with reason)
```

---

## Audit Logs

**Route:** `/app/admin/audit-logs`  
**Role Required:** `admin`

View system audit trail for security and debugging.

### Log Entry Fields

| Field | Description |
|-------|-------------|
| Timestamp | When action occurred |
| Actor | User who performed action |
| Action | Type of action (create, update, delete, login) |
| Entity | What was affected (type and ID) |
| IP Address | Request origin |
| User Agent | Browser/client info |
| Payload | JSON diff of changes |

### Filters

- **Date Range** - From/to date picker
- **Action Type** - create, update, delete, login, logout, etc.
- **User** - Filter by actor
- **Entity Type** - users, bottles, inventory, tastings, etc.

### Pagination

Logs are paginated with configurable page size:
- Default: 50 entries per page
- Options: 25, 50, 100

### Detail View

Click a log entry to see full payload:
- Before/after values for updates
- Complete entity data for creates
- Request metadata

**API Endpoints:**
```
GET /v1/admin/audit-logs?from=...&to=...&action=...&user_id=...&entity_type=...&page=...&limit=...
```

---

## Security Considerations

### Route Protection

Admin routes are protected at multiple levels:

1. **ProtectedRoute component** - Checks role before rendering
2. **API middleware** - Validates role on each request
3. **UI visibility** - Admin links hidden from non-admins

```jsx
// In App.jsx
<Route
  path="admin/users"
  element={
    <ProtectedRoute requireRoles={['admin']}>
      <AdminUsersPage />
    </ProtectedRoute>
  }
/>
```

### Audit Trail

All admin actions are logged:
- User changes (role updates, locks)
- Tag operations (register, transfer)
- Submission reviews (approve/reject)

### Sensitive Operations

Some actions require confirmation:
- Deleting users
- Revoking invitations
- Removing tags

---

## Admin Best Practices

### User Management

- Review new users periodically
- Lock suspicious accounts promptly
- Limit admin role to trusted individuals
- Use moderator role for submission review

### Tag Administration

- Register tags before distributing to users
- Use descriptive labels for tracking
- Lock tags for permanent assignments
- Audit tag transfers regularly

### Submission Review

- Review submissions within 48 hours
- Provide clear rejection reasons
- Verify distillery and proof information
- Check for duplicates before approving

### Audit Log Review

- Check logs weekly for anomalies
- Investigate failed login patterns
- Monitor bulk operations
- Export logs periodically for backup
