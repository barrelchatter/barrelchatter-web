import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import styles from '../styles/ProfilePage.module.scss';

function ProfilePage() {
  const { user, logout } = useAuth();

  const [stats, setStats] = useState({
    inventoryCount: 0,
    tastingsCount: 0,
    wishlistCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
  });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Load stats
  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      setStatsLoading(true);
      try {
        const [invRes, tastRes, wishRes] = await Promise.all([
          api.get('/v1/inventory?limit=1&offset=0'),
          api.get('/v1/tastings?limit=1&offset=0'),
          api.get('/v1/wishlists?limit=1&offset=0'),
        ]);

        if (!isMounted) return;

        setStats({
          inventoryCount: invRes.data?.total || 0,
          tastingsCount: tastRes.data?.total || 0,
          wishlistCount: wishRes.data?.total || 0,
        });
      } catch (err) {
        console.error('Failed to load profile stats', err);
      } finally {
        if (isMounted) setStatsLoading(false);
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  // Populate edit form when user changes
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setEditError('');
    setEditSuccess('');
  }

  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordError('');
    setPasswordSuccess('');
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    if (!editForm.name.trim()) {
      setEditError('Name is required.');
      return;
    }
    if (!editForm.email.trim()) {
      setEditError('Email is required.');
      return;
    }

    setEditSubmitting(true);

    try {
      // PATCH /v1/users/me (or similar endpoint)
      await api.patch('/v1/users/me', {
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
      });

      // Update local storage user
      const updatedUser = {
        ...user,
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
      };
      localStorage.setItem('authUser', JSON.stringify(updatedUser));

      setEditSuccess('Profile updated successfully.');
      setEditMode(false);

      // Refresh page to update context (simple approach)
      window.location.reload();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        'Failed to update profile.';
      setEditError(msg);
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.current_password) {
      setPasswordError('Current password is required.');
      return;
    }
    if (!passwordForm.new_password) {
      setPasswordError('New password is required.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSubmitting(true);

    try {
      await api.post('/v1/users/me/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      setPasswordSuccess('Password changed successfully.');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setShowPasswordForm(false);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        'Failed to change password. Check your current password.';
      setPasswordError(msg);
    } finally {
      setPasswordSubmitting(false);
    }
  }

  function cancelEdit() {
    setEditMode(false);
    setEditError('');
    setEditSuccess('');
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }

  function cancelPasswordChange() {
    setShowPasswordForm(false);
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Profile</h1>
          <p className={styles.subtitle}>
            Manage your account and preferences.
          </p>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Main profile card */}
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarWrap}>
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <span>
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className={styles.profileInfo}>
              <h2 className={styles.profileName}>{user?.name || 'User'}</h2>
              <div className={styles.profileEmail}>{user?.email}</div>
              <div className={styles.profileRole}>
                <span className={styles.roleBadge}>{user?.role || 'collector'}</span>
              </div>
            </div>
            {!editMode && (
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </button>
            )}
          </div>

          {editMode && (
            <form className={styles.editForm} onSubmit={handleEditSubmit}>
              {editError && (
                <div className={styles.formError}>{editError}</div>
              )}
              {editSuccess && (
                <div className={styles.formSuccess}>{editSuccess}</div>
              )}

              <div className={styles.formRow}>
                <label className={styles.label}>
                  Name
                  <input
                    type="text"
                    name="name"
                    className={styles.input}
                    value={editForm.name}
                    onChange={handleEditChange}
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <label className={styles.label}>
                  Email
                  <input
                    type="email"
                    name="email"
                    className={styles.input}
                    value={editForm.email}
                    onChange={handleEditChange}
                  />
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={cancelEdit}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {!editMode && (
            <div className={styles.profileDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Member since</span>
                <span className={styles.detailValue}>
                  {formatDate(user?.created_at)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Stats card */}
        <div className={styles.statsCard}>
          <h3 className={styles.cardTitle}>Your Collection</h3>
          {statsLoading ? (
            <div className={styles.statsLoading}>Loading...</div>
          ) : (
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.inventoryCount}</div>
                <div className={styles.statLabel}>Bottles</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.tastingsCount}</div>
                <div className={styles.statLabel}>Tastings</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.wishlistCount}</div>
                <div className={styles.statLabel}>Wishlist</div>
              </div>
            </div>
          )}
        </div>

        {/* Security card */}
        <div className={styles.securityCard}>
          <h3 className={styles.cardTitle}>Security</h3>

          {!showPasswordForm ? (
            <div className={styles.securityContent}>
              <p className={styles.securityText}>
                Keep your account secure with a strong password.
              </p>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setShowPasswordForm(true)}
              >
                Change Password
              </button>
            </div>
          ) : (
            <form
              className={styles.passwordForm}
              onSubmit={handlePasswordSubmit}
            >
              {passwordError && (
                <div className={styles.formError}>{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className={styles.formSuccess}>{passwordSuccess}</div>
              )}

              <div className={styles.formRow}>
                <label className={styles.label}>
                  Current Password
                  <input
                    type="password"
                    name="current_password"
                    className={styles.input}
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <label className={styles.label}>
                  New Password
                  <input
                    type="password"
                    name="new_password"
                    className={styles.input}
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <label className={styles.label}>
                  Confirm New Password
                  <input
                    type="password"
                    name="confirm_password"
                    className={styles.input}
                    value={passwordForm.confirm_password}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                  />
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={cancelPasswordChange}
                  disabled={passwordSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={passwordSubmitting}
                >
                  {passwordSubmitting ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Danger zone */}
        <div className={styles.dangerCard}>
          <h3 className={styles.cardTitle}>Account</h3>
          <div className={styles.dangerContent}>
            <button
              type="button"
              className={styles.logoutButton}
              onClick={logout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;