import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import MenuSharingSettings from '../components/MenuSharingSettings';
import styles from '../styles/ProfilePage.module.scss';

function ProfilePage() {
  const { success, error: showError } = useToast();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activeTab, setActiveTab] = useState('profile');

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState(null);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/v1/users/me');
      // API returns { user: {...} }
      const userData = response.data?.user || response.data;
      setProfile(userData);
      setEditForm({
        name: userData.name || '',
        bio: userData.bio || '',
        location_city: userData.location_city || userData.location?.city || '',
        location_state: userData.location_state || userData.location?.state || '',
      });
      
      // Stats might be included in the user response or need separate fetch
      if (userData.stats) {
        setStats(userData.stats);
      } else {
        // Try to fetch stats separately if not included
        try {
          const statsRes = await api.get('/v1/users/me/stats');
          setStats(statsRes.data?.stats || statsRes.data);
        } catch (statsErr) {
          // Stats endpoint might not exist, use defaults
          console.log('Stats not available:', statsErr);
          setStats({
            bottles: userData.bottle_count || 0,
            tastings: userData.tasting_count || 0,
            showcases: 0,
            badges: userData.badge_count || 0,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchNotificationPreferences = useCallback(async () => {
    setLoadingPrefs(true);
    try {
      const response = await api.get('/v1/notification-preferences');
      // API returns preferences object
      setNotifPrefs(response.data || {});
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      showError(err?.response?.data?.error || 'Failed to load notification preferences');
    } finally {
      setLoadingPrefs(false);
    }
  }, [showError]);

  useEffect(() => {
    if (activeTab === 'notifications' && notifPrefs === null) {
      fetchNotificationPreferences();
    }
  }, [activeTab, notifPrefs, fetchNotificationPreferences]);

  function handleFieldChange(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await api.patch('/v1/users/me', {
        name: editForm.name,
        bio: editForm.bio,
        location_city: editForm.location_city,
        location_state: editForm.location_state,
      });

      // API returns { user: {...} }
      const updated = response.data?.user || response.data;
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert(err?.response?.data?.error || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditForm({
      name: profile?.name || '',
      bio: profile?.bio || '',
      location_city: profile?.location_city || profile?.location?.city || '',
      location_state: profile?.location_state || profile?.location?.state || '',
    });
    setEditing(false);
  }

  function handleNotifPrefChange(field, value) {
    setNotifPrefs((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveNotifPrefs() {
    setSavingPrefs(true);
    try {
      const response = await api.patch('/v1/notification-preferences', notifPrefs);
      setNotifPrefs(response.data || notifPrefs);
      success('Notification preferences saved successfully');
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      showError(err?.response?.data?.error || err.message || 'Failed to save notification preferences');
    } finally {
      setSavingPrefs(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} />
            ) : (
              <span>{profile?.name?.charAt(0).toUpperCase() || '?'}</span>
            )}
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.name}>{profile?.name || 'User'}</h1>
            <p className={styles.email}>{profile?.email}</p>
            <p className={styles.role}>{profile?.role}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {!editing ? (
            <button className={styles.editButton} onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          ) : (
            <>
              <button className={styles.cancelButton} onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Stats Summary */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.bottles || stats.bottle_count || 0}</span>
            <span className={styles.statLabel}>Bottles</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.tastings || stats.tasting_count || 0}</span>
            <span className={styles.statLabel}>Tastings</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.showcases || stats.showcase_count || 0}</span>
            <span className={styles.statLabel}>Showcases</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.badges || stats.badge_count || 0}</span>
            <span className={styles.statLabel}>Badges</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'account' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'notifications' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'sharing' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('sharing')}
        >
          Sharing
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {activeTab === 'profile' && (
          <div className={styles.profileTab}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>About You</h3>

              {editing ? (
                <div className={styles.editGrid}>
                  <label className={styles.editField}>
                    <span>Display Name</span>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      placeholder="Your name"
                    />
                  </label>

                  <label className={`${styles.editField} ${styles.fullWidth}`}>
                    <span>Bio</span>
                    <textarea
                      value={editForm.bio || ''}
                      onChange={(e) => handleFieldChange('bio', e.target.value)}
                      placeholder="Tell the community a bit about yourself..."
                      rows={3}
                    />
                  </label>

                  <label className={styles.editField}>
                    <span>City</span>
                    <input
                      type="text"
                      value={editForm.location_city || ''}
                      onChange={(e) => handleFieldChange('location_city', e.target.value)}
                      placeholder="City"
                    />
                  </label>

                  <label className={styles.editField}>
                    <span>State</span>
                    <input
                      type="text"
                      value={editForm.location_state || ''}
                      onChange={(e) => handleFieldChange('location_state', e.target.value)}
                      placeholder="State"
                    />
                  </label>
                </div>
              ) : (
                <div className={styles.profileInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Name</span>
                    <span className={styles.infoValue}>{profile?.name || '—'}</span>
                  </div>

                  {profile?.bio && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Bio</span>
                      <span className={styles.infoValue}>{profile.bio}</span>
                    </div>
                  )}

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Location</span>
                    <span className={styles.infoValue}>
                      {(() => {
                        const city = profile?.location_city || profile?.location?.city;
                        const state = profile?.location_state || profile?.location?.state;
                        if (city && state) return `${city}, ${state}`;
                        return city || state || '—';
                      })()}
                    </span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Member Since</span>
                    <span className={styles.infoValue}>
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString() 
                        : '—'}
                    </span>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'account' && (
          <div className={styles.accountTab}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Account Details</h3>
              <div className={styles.profileInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{profile?.email}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Member Since</span>
                  <span className={styles.infoValue}>
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Role</span>
                  <span className={styles.infoValue}>{profile?.role || 'user'}</span>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Security</h3>
              <button className={styles.secondaryButton}>Change Password</button>
            </section>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className={styles.notificationsTab}>
            {loadingPrefs ? (
              <div className={styles.loading}>Loading notification preferences...</div>
            ) : (
              <>
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Notification Settings</h3>
                  <p className={styles.sectionDescription}>
                    Choose how you want to be notified about activity on BarrelChatter.
                  </p>

                  <div className={styles.preferencesGroup}>
                    <h4 className={styles.groupTitle}>Bottle Submissions</h4>

                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={notifPrefs?.email_submission_approved || false}
                        onChange={(e) => handleNotifPrefChange('email_submission_approved', e.target.checked)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>
                        Email me when my submission is approved
                      </span>
                    </label>

                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={notifPrefs?.email_submission_rejected || false}
                        onChange={(e) => handleNotifPrefChange('email_submission_rejected', e.target.checked)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>
                        Email me when my submission is rejected
                      </span>
                    </label>
                  </div>

                  <div className={styles.preferencesGroup}>
                    <h4 className={styles.groupTitle}>Wishlist Alerts</h4>
                    <p className={styles.groupSubtext}>Coming soon</p>

                    <label className={styles.checkboxLabel} title="Coming soon">
                      <input
                        type="checkbox"
                        checked={false}
                        disabled
                        className={styles.checkbox}
                      />
                      <span className={`${styles.checkboxText} ${styles.disabled}`}>
                        Email me about price drops
                      </span>
                    </label>

                    <label className={styles.checkboxLabel} title="Coming soon">
                      <input
                        type="checkbox"
                        checked={false}
                        disabled
                        className={styles.checkbox}
                      />
                      <span className={`${styles.checkboxText} ${styles.disabled}`}>
                        Email me when bottles become available
                      </span>
                    </label>
                  </div>
                </section>

                <div className={styles.saveButtonContainer}>
                  <button
                    className={styles.saveButton}
                    onClick={handleSaveNotifPrefs}
                    disabled={savingPrefs}
                  >
                    {savingPrefs ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'sharing' && (
          <div className={styles.sharingTab}>
            <MenuSharingSettings />
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;