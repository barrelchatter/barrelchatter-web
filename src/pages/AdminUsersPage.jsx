import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import styles from '../styles/AdminUsersPage.module.scss';

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function inviteStatus(inv) {
  if (inv.revoked_at) return 'revoked';
  if (inv.accepted_at) return 'accepted';
  if (inv.expires_at && new Date(inv.expires_at).getTime() < Date.now()) return 'expired';
  return 'pending';
}

function AdminUsersPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState('users');

  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userStatus, setUserStatus] = useState('');

  const [createEmail, setCreateEmail] = useState('');
  const [createName, setCreateName] = useState('');
  const [createRole, setCreateRole] = useState('collector');
  const [createPassword, setCreatePassword] = useState('');
  const [createBusy, setCreateBusy] = useState(false);
  const [createResult, setCreateResult] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('collector');
  const [editActive, setEditActive] = useState(true);
  const [editBusy, setEditBusy] = useState(false);

  const [actionBusyId, setActionBusyId] = useState(null);
  const [resetResult, setResetResult] = useState('');

  // Invites
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesError, setInvitesError] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('collector');
  const [inviteExpiryHours, setInviteExpiryHours] = useState(72);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteCreatedToken, setInviteCreatedToken] = useState('');

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return (users || []).filter((u) => {
      const matchesQ =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q);
      const matchesRole = !userRole || u.role === userRole;
      const isActive = u.is_active !== false && !u.locked_at;
      const matchesStatus =
        !userStatus ||
        (userStatus === 'active' && isActive) ||
        (userStatus === 'locked' && !isActive);

      return matchesQ && matchesRole && matchesStatus;
    });
  }, [users, userQuery, userRole, userStatus]);

  if (!user || user.role !== 'admin') {
    return (
      <div className={styles.page}>
        <div className={styles.accessDenied}>
          Admin access required to manage users and invites.
        </div>
      </div>
    );
  }

  async function loadUsers() {
    setUsersLoading(true);
    setUsersError('');
    try {
      const params = {};
      if (userQuery.trim()) params.q = userQuery.trim();
      if (userRole) params.role = userRole;
      if (userStatus) params.status = userStatus;
      const res = await api.get('/v1/admin/users', { params });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      const errorMsg = err?.response?.data?.error || 'Failed to load users.';
      setUsersError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadInvites() {
    setInvitesLoading(true);
    setInvitesError('');
    try {
      const res = await api.get('/v1/admin/invites');
      setInvites(res.data.invites || []);
    } catch (err) {
      console.error(err);
      const errorMsg = err?.response?.data?.error || 'Failed to load invites.';
      setInvitesError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setInvitesLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === 'invites' && invites.length === 0 && !invitesLoading) {
      loadInvites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function startEdit(u) {
    setEditingId(u.id);
    setEditName(u.name || '');
    setEditEmail(u.email || '');
    setEditRole(u.role || 'collector');
    setEditActive(u.is_active !== false);
    setResetResult('');
    setCreateResult('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditEmail('');
    setEditRole('collector');
    setEditActive(true);
  }

  async function createUser(e) {
    e.preventDefault();
    setCreateResult('');
    setResetResult('');
    const email = createEmail.trim().toLowerCase();
    const name = createName.trim();
    if (!email || !name) {
      setCreateResult('Name and email are required.');
      return;
    }

    setCreateBusy(true);
    try {
      const payload = {
        email,
        name,
        role: createRole,
      };
      if (createPassword.trim()) payload.password = createPassword.trim();
      const res = await api.post('/v1/admin/users', payload);

      setCreateEmail('');
      setCreateName('');
      setCreateRole('collector');
      setCreatePassword('');

      // Show success toast
      toast.success('User created successfully');

      // Some APIs return temp password info — show it if present.
      if (res?.data?.temp_password || res?.data?.reset_token) {
        const resultMsg = `User created. ${res.data.temp_password ? 'Temp password: ' + res.data.temp_password : ''}${res.data.reset_token ? ' Reset token: ' + res.data.reset_token : ''}`.trim();
        setCreateResult(resultMsg);
      } else {
        setCreateResult('User created.');
      }

      await loadUsers();
    } catch (err) {
      console.error(err);
      const errorMsg = err?.response?.data?.error || 'Failed to create user.';
      setCreateResult(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCreateBusy(false);
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editingId) return;

    setEditBusy(true);
    setUsersError('');
    setResetResult('');
    try {
      const payload = {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
        is_active: !!editActive,
      };
      await api.patch(`/v1/admin/users/${editingId}`, payload);
      toast.success('User updated successfully');
      await loadUsers();
      cancelEdit();
    } catch (err) {
      console.error(err);
      const errorMsg = err?.response?.data?.error || 'Failed to update user.';
      setUsersError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setEditBusy(false);
    }
  }

  async function lockUser(id) {
    if (!window.confirm('Lock this user account? They will not be able to log in.')) {
      return;
    }
    setActionBusyId(id);
    setResetResult('');
    try {
      await api.post(`/v1/admin/users/${id}/lock`);
      toast.success('User account locked');
      await loadUsers();
    } catch (err) {
      console.error(err);
      const errorMsg = err?.response?.data?.error || 'Failed to lock user.';
      setUsersError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionBusyId(null);
    }
  }

  async function unlockUser(id) {
    if (!window.confirm('Unlock this user account?')) {
      return;
    }
    setActionBusyId(id);
    setResetResult('');
    try {
      await api.post(`/v1/admin/users/${id}/unlock`);
      toast.success('User account unlocked');
      await loadUsers();
    } catch (err) {
      console.error(err);
      const errorMsg = err?.response?.data?.error || 'Failed to unlock user.';
      setUsersError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionBusyId(null);
    }
  }

  async function resetPassword(id) {
    if (!window.confirm('Generate a password reset token for this user?')) {
      return;
    }
    setActionBusyId(id);
    setResetResult('');
    try {
      const res = await api.post(`/v1/admin/users/${id}/reset-password`);
      setResetResult(JSON.stringify(res.data, null, 2));
      toast.success('Password reset token generated');
    } catch (err) {
      console.error(err);
      const errorMsg = err?.response?.data?.error || 'Failed to reset password.';
      setUsersError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionBusyId(null);
    }
  }

  async function createInvite(e) {
    e.preventDefault();
    setInviteCreatedToken('');
    setInvitesError('');
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setInvitesError('Email is required to create an invite.');
      return;
    }

    setInviteBusy(true);
    try {
      const res = await api.post('/v1/admin/invites', {
        email,
        role: inviteRole,
        expires_in_hours: Number(inviteExpiryHours) || 72,
      });

      const token =
        res?.data?.token || res?.data?.invite_token || res?.data?.invite?.token;

      setInviteCreatedToken(token || '');
      setInviteEmail('');
      toast.success('Invite created');
      await loadInvites();
    } catch (err) {
      console.error(err);
      const errorMsg = err?.response?.data?.error || 'Failed to create invite.';
      setInvitesError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setInviteBusy(false);
    }
  }

  async function revokeInvite(id) {
    if (!window.confirm('Revoke this invite? It cannot be undone.')) {
      return;
    }
    setActionBusyId(id);
    setInvitesError('');
    try {
      await api.post(`/v1/admin/invites/${id}/revoke`);
      toast.success('Invite revoked');
      await loadInvites();
    } catch (err) {
      console.error(err);
      const errorMsg = err?.response?.data?.error || 'Failed to revoke invite.';
      setInvitesError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionBusyId(null);
    }
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      // Fallback: old-school prompt
      window.prompt('Copy to clipboard:', text);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Admin Users</h1>
          <p className={styles.subtitle}>
            Create users, change roles, lock accounts, reset passwords, and manage invites.
          </p>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={tab === 'users' ? styles.tabActive : styles.tab}
            onClick={() => setTab('users')}
          >
            Users
          </button>
          <button
            type="button"
            className={tab === 'invites' ? styles.tabActive : styles.tab}
            onClick={() => setTab('invites')}
          >
            Invites
          </button>
        </div>
      </div>

      {tab === 'users' && (
        <>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>Create user</div>
            <form className={styles.formRow} onSubmit={createUser}>
              <input
                className={styles.input}
                placeholder="Name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
              <input
                className={styles.input}
                placeholder="Email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
              />
              <select
                className={styles.select}
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value)}
              >
                <option value="collector">collector</option>
                <option value="moderator">moderator</option>
                <option value="admin">admin</option>
              </select>
              <input
                className={styles.input}
                placeholder="Optional temp password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
              />
              <button className={styles.primaryBtn} disabled={createBusy}>
                {createBusy ? 'Creating…' : 'Create'}
              </button>
            </form>
            {createResult && <div className={styles.notice}>{createResult}</div>}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>Users</div>

            <div className={styles.filters}>
              <input
                className={styles.input}
                placeholder="Search name/email…"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              />
              <select
                className={styles.select}
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
              >
                <option value="">All roles</option>
                <option value="collector">collector</option>
                <option value="moderator">moderator</option>
                <option value="admin">admin</option>
              </select>
              <select
                className={styles.select}
                value={userStatus}
                onChange={(e) => setUserStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="active">active</option>
                <option value="locked">locked/disabled</option>
              </select>
              <button className={styles.secondaryBtn} type="button" onClick={loadUsers}>
                Refresh
              </button>
            </div>

            {usersError && <div className={styles.error}>{usersError}</div>}
            {usersLoading ? (
              <div className={styles.loading}>Loading users…</div>
            ) : filteredUsers.length === 0 ? (
              <div className={styles.empty}>
                {userQuery.trim() || userRole || userStatus
                  ? 'No users match your filters. Try adjusting your search criteria.'
                  : 'No users found.'}
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th className={styles.actionsCol}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const locked = u.is_active === false || !!u.locked_at;
                      const isEditing = editingId === u.id;

                      return (
                        <React.Fragment key={u.id}>
                          <tr className={locked ? styles.rowMuted : ''}>
                            <td>{u.name}</td>
                            <td>
                              {u.email}
                              <button
                                className={styles.copyBtn}
                                type="button"
                                onClick={() => copyToClipboard(u.email)}
                                title="Copy email"
                              >
                                copy
                              </button>
                            </td>
                            <td>
                              <span className={u.role === 'admin' ? styles.badgeAdmin : u.role === 'moderator' ? styles.badgeModerator : styles.badge}>
                                {u.role}
                              </span>
                            </td>
                            <td>
                              {locked ? (
                                <span className={styles.statusLocked}>locked</span>
                              ) : (
                                <span className={styles.statusActive}>active</span>
                              )}
                            </td>
                            <td className={styles.actionsCol}>
                              <button
                                className={styles.smallBtn}
                                type="button"
                                onClick={() => startEdit(u)}
                                disabled={actionBusyId === u.id}
                              >
                                Edit
                              </button>

                              {!locked ? (
                                <button
                                  className={styles.smallBtnDanger}
                                  type="button"
                                  onClick={() => lockUser(u.id)}
                                  disabled={actionBusyId === u.id}
                                >
                                  {actionBusyId === u.id ? 'Locking…' : 'Lock'}
                                </button>
                              ) : (
                                <button
                                  className={styles.smallBtn}
                                  type="button"
                                  onClick={() => unlockUser(u.id)}
                                  disabled={actionBusyId === u.id}
                                >
                                  {actionBusyId === u.id ? 'Unlocking…' : 'Unlock'}
                                </button>
                              )}

                              <button
                                className={styles.smallBtn}
                                type="button"
                                onClick={() => resetPassword(u.id)}
                                disabled={actionBusyId === u.id}
                              >
                                {actionBusyId === u.id ? 'Resetting…' : 'Reset PW'}
                              </button>
                            </td>
                          </tr>

                          {isEditing && (
                            <tr className={styles.editRow}>
                              <td colSpan={5}>
                                <form className={styles.editForm} onSubmit={saveEdit}>
                                  <div className={styles.editGrid}>
                                    <label className={styles.field}>
                                      <span>Name</span>
                                      <input
                                        className={styles.input}
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                      />
                                    </label>

                                    <label className={styles.field}>
                                      <span>Email</span>
                                      <input
                                        className={styles.input}
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                      />
                                    </label>

                                    <label className={styles.field}>
                                      <span>Role</span>
                                      <select
                                        className={styles.select}
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value)}
                                      >
                                        <option value="collector">collector</option>
                                        <option value="moderator">moderator</option>
                                        <option value="admin">admin</option>
                                      </select>
                                    </label>

                                    <label className={styles.checkboxField}>
                                      <input
                                        type="checkbox"
                                        checked={editActive}
                                        onChange={(e) => setEditActive(e.target.checked)}
                                      />
                                      <span>Active</span>
                                    </label>
                                  </div>

                                  <div className={styles.editActions}>
                                    <button className={styles.primaryBtn} disabled={editBusy}>
                                      {editBusy ? 'Saving…' : 'Save'}
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.secondaryBtn}
                                      onClick={cancelEdit}
                                      disabled={editBusy}
                                    >
                                      Cancel
                                    </button>

                                    <div className={styles.mutedMeta}>
                                      {u.locked_at && (
                                        <div>
                                          <strong>Locked at:</strong> {formatDate(u.locked_at)}
                                        </div>
                                      )}
                                      {u.locked_reason && (
                                        <div>
                                          <strong>Reason:</strong> {u.locked_reason}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {resetResult && (
            <div className={styles.panel}>
              <div className={styles.panelHeader}>Password reset result</div>
              <div className={styles.resetResultCard}>
                {(() => {
                  try {
                    const data = JSON.parse(resetResult);
                    const token = data.reset_token || data.token;
                    const expires = data.expires_at || data.expires;
                    return (
                      <>
                        <div className={styles.resetTokenLabel}>Reset Token:</div>
                        <div className={styles.resetTokenValue}>{token}</div>
                        {expires && (
                          <div className={styles.resetExpires}>Expires: {formatDate(expires)}</div>
                        )}
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={() => copyToClipboard(token)}
                        >
                          Copy Token
                        </button>
                      </>
                    );
                  } catch (e) {
                    return <pre className={styles.codeBlock}>{resetResult}</pre>;
                  }
                })()}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'invites' && (
        <>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>Create invite</div>
            <form className={styles.formRow} onSubmit={createInvite}>
              <input
                className={styles.input}
                placeholder="Invite email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <select
                className={styles.select}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="collector">collector</option>
                <option value="moderator">moderator</option>
                <option value="admin">admin</option>
              </select>
              <input
                className={styles.input}
                type="number"
                min="1"
                step="1"
                value={inviteExpiryHours}
                onChange={(e) => setInviteExpiryHours(e.target.value)}
                placeholder="Expiry hours"
              />
              <button className={styles.primaryBtn} disabled={inviteBusy}>
                {inviteBusy ? 'Creating…' : 'Create invite'}
              </button>
            </form>

            {inviteCreatedToken && (
              <div className={styles.notice}>
                <div className={styles.noticeRow}>
                  <div>
                    <strong>Invite token:</strong>
                    <div className={styles.token}>{inviteCreatedToken}</div>
                  </div>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => copyToClipboard(inviteCreatedToken)}
                  >
                    Copy Token
                  </button>
                </div>
                <div className={styles.inviteUrlRow}>
                  <strong>Invite URL:</strong>
                  <div className={styles.token}>
                    https://app.barrelchatter.com/register?invite={inviteCreatedToken}
                  </div>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() =>
                      copyToClipboard(
                        `https://app.barrelchatter.com/register?invite=${inviteCreatedToken}`
                      )
                    }
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            )}

            {invitesError && <div className={styles.error}>{invitesError}</div>}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>Invites</div>

            <div className={styles.filters}>
              <button className={styles.secondaryBtn} type="button" onClick={loadInvites}>
                Refresh
              </button>
            </div>

            {invitesLoading ? (
              <div className={styles.loading}>Loading invites…</div>
            ) : invites.length === 0 ? (
              <div className={styles.empty}>No invites have been created yet.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Expires</th>
                      <th>Accepted</th>
                      <th className={styles.actionsCol}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((inv) => {
                      const status = inviteStatus(inv);
                      const canRevoke = status === 'pending';
                      return (
                        <tr key={inv.id} className={status !== 'pending' ? styles.rowMuted : ''}>
                          <td>{inv.email}</td>
                          <td>
                            <span className={styles.badge}>{inv.role}</span>
                          </td>
                          <td>
                            <span
                              className={
                                status === 'pending'
                                  ? styles.statusActive
                                  : status === 'accepted'
                                  ? styles.statusAccepted
                                  : status === 'revoked'
                                  ? styles.statusLocked
                                  : styles.statusExpired
                              }
                            >
                              {status}
                            </span>
                          </td>
                          <td>{formatDate(inv.expires_at)}</td>
                          <td>{formatDate(inv.accepted_at)}</td>
                          <td className={styles.actionsCol}>
                            <button
                              className={styles.smallBtnDanger}
                              type="button"
                              onClick={() => revokeInvite(inv.id)}
                              disabled={!canRevoke || actionBusyId === inv.id}
                              title={!canRevoke ? 'Only pending invites can be revoked.' : ''}
                            >
                              {actionBusyId === inv.id ? 'Revoking…' : 'Revoke'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminUsersPage;
