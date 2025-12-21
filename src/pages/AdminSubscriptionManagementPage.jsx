import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import styles from '../styles/AdminSubscriptionManagementPage.module.scss';

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function formatDateOnly(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return String(value);
  }
}

function AdminSubscriptionManagementPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState('users');

  // User search & subscription
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  // Grant subscription form
  const [grantTier, setGrantTier] = useState('single_barrel');
  const [grantExpiresAt, setGrantExpiresAt] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [granting, setGranting] = useState(false);

  // Revoke subscription
  const [revoking, setRevoking] = useState(false);

  // Promo codes
  const [promoCodes, setPromoCodes] = useState([]);
  const [promoCodesLoading, setPromoCodesLoading] = useState(false);
  const [promoCodesError, setPromoCodesError] = useState('');

  // Create promo code form
  const [createCode, setCreateCode] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createDiscountType, setCreateDiscountType] = useState('percent');
  const [createDiscountValue, setCreateDiscountValue] = useState('');
  const [createTierGranted, setCreateTierGranted] = useState('single_barrel');
  const [createMonthsGranted, setCreateMonthsGranted] = useState('');
  const [createMaxRedemptions, setCreateMaxRedemptions] = useState('');
  const [createValidFrom, setCreateValidFrom] = useState('');
  const [createValidUntil, setCreateValidUntil] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit promo code
  const [editingId, setEditingId] = useState(null);
  const [editCode, setEditCode] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDiscountType, setEditDiscountType] = useState('percent');
  const [editDiscountValue, setEditDiscountValue] = useState('');
  const [editTierGranted, setEditTierGranted] = useState('single_barrel');
  const [editMonthsGranted, setEditMonthsGranted] = useState('');
  const [editMaxRedemptions, setEditMaxRedemptions] = useState('');
  const [editValidFrom, setEditValidFrom] = useState('');
  const [editValidUntil, setEditValidUntil] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  const [actionBusyId, setActionBusyId] = useState(null);

  if (!user || user.role !== 'admin') {
    return (
      <div className={styles.page}>
        <div className={styles.accessDenied}>
          Admin access required to manage subscriptions.
        </div>
      </div>
    );
  }

  async function searchUsers() {
    if (!userSearchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setSearching(true);
    try {
      const res = await api.get('/v1/admin/users', {
        params: { q: userSearchQuery.trim(), limit: 10 },
      });
      setSearchResults(res.data.users || []);
      if (res.data.users?.length === 0) {
        toast.info('No users found');
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to search users');
    } finally {
      setSearching(false);
    }
  }

  async function selectUser(userId) {
    setUserLoading(true);
    setSelectedUser(null);
    try {
      const res = await api.get(`/v1/admin/users/${userId}`);
      setSelectedUser(res.data.user || res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user details');
    } finally {
      setUserLoading(false);
    }
  }

  async function grantSubscription(e) {
    e.preventDefault();
    if (!selectedUser) return;

    setGranting(true);
    try {
      const payload = {
        tier: grantTier,
        reason: grantReason.trim() || undefined,
      };
      if (grantExpiresAt) {
        payload.expires_at = new Date(grantExpiresAt).toISOString();
      }

      await api.post(`/v1/admin/users/${selectedUser.id}/subscription`, payload);
      toast.success('Subscription granted successfully');

      // Reload user details
      await selectUser(selectedUser.id);

      // Reset form
      setGrantTier('single_barrel');
      setGrantExpiresAt('');
      setGrantReason('');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to grant subscription');
    } finally {
      setGranting(false);
    }
  }

  async function revokeSubscription() {
    if (!selectedUser) return;
    if (
      !window.confirm(
        `Revoke subscription for ${selectedUser.name}? This cannot be undone.`
      )
    ) {
      return;
    }

    setRevoking(true);
    try {
      await api.delete(`/v1/admin/users/${selectedUser.id}/subscription`);
      toast.success('Subscription revoked');

      // Reload user details
      await selectUser(selectedUser.id);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to revoke subscription');
    } finally {
      setRevoking(false);
    }
  }

  async function loadPromoCodes() {
    setPromoCodesLoading(true);
    setPromoCodesError('');
    try {
      const res = await api.get('/v1/admin/promo-codes');
      setPromoCodes(res.data.promo_codes || res.data.promoCodes || []);
    } catch (err) {
      console.error(err);
      const errorMsg = err?.response?.data?.error || 'Failed to load promo codes';
      setPromoCodesError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setPromoCodesLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'promo-codes' && promoCodes.length === 0 && !promoCodesLoading) {
      loadPromoCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function createPromoCode(e) {
    e.preventDefault();

    if (!createCode.trim()) {
      toast.error('Promo code is required');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        code: createCode.trim().toUpperCase(),
        description: createDescription.trim() || undefined,
        discount_type: createDiscountType,
      };

      if (createDiscountType === 'percent' || createDiscountType === 'fixed') {
        payload.discount_value = Number(createDiscountValue);
      } else if (createDiscountType === 'free_tier') {
        payload.tier_granted = createTierGranted;
      } else if (createDiscountType === 'free_months') {
        payload.months_granted = Number(createMonthsGranted);
      }

      if (createMaxRedemptions) {
        payload.max_redemptions = Number(createMaxRedemptions);
      }
      if (createValidFrom) {
        payload.valid_from = new Date(createValidFrom).toISOString();
      }
      if (createValidUntil) {
        payload.valid_until = new Date(createValidUntil).toISOString();
      }

      await api.post('/v1/admin/promo-codes', payload);
      toast.success('Promo code created');

      // Reset form
      setCreateCode('');
      setCreateDescription('');
      setCreateDiscountType('percent');
      setCreateDiscountValue('');
      setCreateTierGranted('single_barrel');
      setCreateMonthsGranted('');
      setCreateMaxRedemptions('');
      setCreateValidFrom('');
      setCreateValidUntil('');

      await loadPromoCodes();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to create promo code');
    } finally {
      setCreating(false);
    }
  }

  function startEdit(promo) {
    setEditingId(promo.id);
    setEditCode(promo.code || '');
    setEditDescription(promo.description || '');
    setEditDiscountType(promo.discount_type || 'percent');
    setEditDiscountValue(promo.discount_value || '');
    setEditTierGranted(promo.tier_granted || 'single_barrel');
    setEditMonthsGranted(promo.months_granted || '');
    setEditMaxRedemptions(promo.max_redemptions || '');
    setEditValidFrom(
      promo.valid_from ? new Date(promo.valid_from).toISOString().split('T')[0] : ''
    );
    setEditValidUntil(
      promo.valid_until
        ? new Date(promo.valid_until).toISOString().split('T')[0]
        : ''
    );
  }

  function cancelEdit() {
    setEditingId(null);
    setEditCode('');
    setEditDescription('');
    setEditDiscountType('percent');
    setEditDiscountValue('');
    setEditTierGranted('single_barrel');
    setEditMonthsGranted('');
    setEditMaxRedemptions('');
    setEditValidFrom('');
    setEditValidUntil('');
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editingId) return;

    setEditBusy(true);
    try {
      const payload = {
        code: editCode.trim().toUpperCase(),
        description: editDescription.trim() || undefined,
        discount_type: editDiscountType,
      };

      if (editDiscountType === 'percent' || editDiscountType === 'fixed') {
        payload.discount_value = Number(editDiscountValue);
      } else if (editDiscountType === 'free_tier') {
        payload.tier_granted = editTierGranted;
      } else if (editDiscountType === 'free_months') {
        payload.months_granted = Number(editMonthsGranted);
      }

      if (editMaxRedemptions) {
        payload.max_redemptions = Number(editMaxRedemptions);
      }
      if (editValidFrom) {
        payload.valid_from = new Date(editValidFrom).toISOString();
      }
      if (editValidUntil) {
        payload.valid_until = new Date(editValidUntil).toISOString();
      }

      await api.put(`/v1/admin/promo-codes/${editingId}`, payload);
      toast.success('Promo code updated');

      await loadPromoCodes();
      cancelEdit();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to update promo code');
    } finally {
      setEditBusy(false);
    }
  }

  async function deletePromoCode(id) {
    if (!window.confirm('Delete this promo code? This cannot be undone.')) {
      return;
    }

    setActionBusyId(id);
    try {
      await api.delete(`/v1/admin/promo-codes/${id}`);
      toast.success('Promo code deleted');
      await loadPromoCodes();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to delete promo code');
    } finally {
      setActionBusyId(null);
    }
  }

  function getPromoCodeStatus(promo) {
    if (!promo.is_active) return 'inactive';
    if (promo.valid_until && new Date(promo.valid_until) < new Date())
      return 'expired';
    if (
      promo.max_redemptions &&
      promo.redemption_count >= promo.max_redemptions
    )
      return 'exhausted';
    return 'active';
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Subscription Management</h1>
          <p className={styles.subtitle}>
            Grant or revoke user subscriptions and manage promotional codes.
          </p>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={tab === 'users' ? styles.tabActive : styles.tab}
            onClick={() => setTab('users')}
          >
            User Subscriptions
          </button>
          <button
            type="button"
            className={tab === 'promo-codes' ? styles.tabActive : styles.tab}
            onClick={() => setTab('promo-codes')}
          >
            Promo Codes
          </button>
        </div>
      </div>

      {tab === 'users' && (
        <>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>Search Users</div>
            <div className={styles.formRow}>
              <input
                className={styles.input}
                placeholder="Search by name or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchUsers();
                  }
                }}
              />
              <button
                className={styles.primaryBtn}
                onClick={searchUsers}
                disabled={searching}
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                <div className={styles.resultsHeader}>Search Results</div>
                {searchResults.map((u) => (
                  <div
                    key={u.id}
                    className={styles.userResult}
                    onClick={() => selectUser(u.id)}
                  >
                    <div>
                      <div className={styles.userName}>{u.name}</div>
                      <div className={styles.userEmail}>{u.email}</div>
                    </div>
                    <div className={styles.userRole}>
                      <span className={styles.badge}>{u.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {userLoading && (
            <div className={styles.panel}>
              <div className={styles.loading}>Loading user details...</div>
            </div>
          )}

          {selectedUser && !userLoading && (
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                User: {selectedUser.name} ({selectedUser.email})
              </div>

              <div className={styles.subscriptionInfo}>
                <h3>Current Subscription Status</h3>
                {selectedUser.subscription_tier ? (
                  <div className={styles.subscriptionCard}>
                    <div className={styles.subscriptionRow}>
                      <span className={styles.label}>Tier:</span>
                      <span className={styles.tierBadge}>
                        {selectedUser.subscription_tier === 'single_barrel'
                          ? 'Single Barrel'
                          : selectedUser.subscription_tier === 'barrel_proof'
                          ? 'Barrel Proof'
                          : selectedUser.subscription_tier}
                      </span>
                    </div>
                    <div className={styles.subscriptionRow}>
                      <span className={styles.label}>Expires:</span>
                      <span>
                        {selectedUser.subscription_expires_at
                          ? formatDateOnly(selectedUser.subscription_expires_at)
                          : 'Never'}
                      </span>
                    </div>
                    <div className={styles.subscriptionRow}>
                      <span className={styles.label}>Source:</span>
                      <span>
                        {selectedUser.subscription_source || 'Unknown'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      onClick={revokeSubscription}
                      disabled={revoking}
                    >
                      {revoking ? 'Revoking...' : 'Revoke Subscription'}
                    </button>
                  </div>
                ) : (
                  <div className={styles.noSubscription}>
                    No active subscription
                  </div>
                )}
              </div>

              <div className={styles.grantSection}>
                <h3>Grant Subscription</h3>
                <form onSubmit={grantSubscription} className={styles.grantForm}>
                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>Tier</span>
                      <select
                        className={styles.select}
                        value={grantTier}
                        onChange={(e) => setGrantTier(e.target.value)}
                      >
                        <option value="single_barrel">Single Barrel</option>
                        <option value="barrel_proof">Barrel Proof</option>
                      </select>
                    </label>

                    <label className={styles.field}>
                      <span>Expires At (optional)</span>
                      <input
                        type="date"
                        className={styles.input}
                        value={grantExpiresAt}
                        onChange={(e) => setGrantExpiresAt(e.target.value)}
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Reason (optional)</span>
                      <input
                        className={styles.input}
                        placeholder="e.g., Promotional grant, customer support"
                        value={grantReason}
                        onChange={(e) => setGrantReason(e.target.value)}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className={styles.primaryBtn}
                    disabled={granting}
                  >
                    {granting ? 'Granting...' : 'Grant Subscription'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'promo-codes' && (
        <>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>Create Promo Code</div>
            <form onSubmit={createPromoCode} className={styles.promoForm}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Code *</span>
                  <input
                    className={styles.input}
                    placeholder="e.g., SUMMER2024"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span>Description</span>
                  <input
                    className={styles.input}
                    placeholder="Internal note about this code"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span>Discount Type *</span>
                  <select
                    className={styles.select}
                    value={createDiscountType}
                    onChange={(e) => setCreateDiscountType(e.target.value)}
                  >
                    <option value="percent">Percent Off</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="free_months">Free Months</option>
                    <option value="free_tier">Free Tier</option>
                  </select>
                </label>

                {(createDiscountType === 'percent' ||
                  createDiscountType === 'fixed') && (
                  <label className={styles.field}>
                    <span>
                      {createDiscountType === 'percent'
                        ? 'Percent Off'
                        : 'Amount Off ($)'}
                    </span>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder={
                        createDiscountType === 'percent' ? '25' : '10'
                      }
                      value={createDiscountValue}
                      onChange={(e) => setCreateDiscountValue(e.target.value)}
                    />
                  </label>
                )}

                {createDiscountType === 'free_tier' && (
                  <label className={styles.field}>
                    <span>Tier Granted</span>
                    <select
                      className={styles.select}
                      value={createTierGranted}
                      onChange={(e) => setCreateTierGranted(e.target.value)}
                    >
                      <option value="single_barrel">Single Barrel</option>
                      <option value="barrel_proof">Barrel Proof</option>
                    </select>
                  </label>
                )}

                {createDiscountType === 'free_months' && (
                  <label className={styles.field}>
                    <span>Months Granted</span>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="12"
                      value={createMonthsGranted}
                      onChange={(e) => setCreateMonthsGranted(e.target.value)}
                    />
                  </label>
                )}

                <label className={styles.field}>
                  <span>Max Redemptions</span>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="Unlimited if empty"
                    value={createMaxRedemptions}
                    onChange={(e) => setCreateMaxRedemptions(e.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span>Valid From</span>
                  <input
                    type="date"
                    className={styles.input}
                    value={createValidFrom}
                    onChange={(e) => setCreateValidFrom(e.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span>Valid Until</span>
                  <input
                    type="date"
                    className={styles.input}
                    value={createValidUntil}
                    onChange={(e) => setCreateValidUntil(e.target.value)}
                  />
                </label>
              </div>

              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Promo Code'}
              </button>
            </form>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>Promo Codes</div>

            <div className={styles.filters}>
              <button
                className={styles.secondaryBtn}
                type="button"
                onClick={loadPromoCodes}
              >
                Refresh
              </button>
            </div>

            {promoCodesError && (
              <div className={styles.error}>{promoCodesError}</div>
            )}

            {promoCodesLoading ? (
              <div className={styles.loading}>Loading promo codes...</div>
            ) : promoCodes.length === 0 ? (
              <div className={styles.empty}>
                No promo codes have been created yet.
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Redemptions</th>
                      <th>Valid Dates</th>
                      <th>Status</th>
                      <th className={styles.actionsCol}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((promo) => {
                      const status = getPromoCodeStatus(promo);
                      const isEditing = editingId === promo.id;

                      return (
                        <React.Fragment key={promo.id}>
                          <tr
                            className={
                              status !== 'active' ? styles.rowMuted : ''
                            }
                          >
                            <td>
                              <strong>{promo.code}</strong>
                              {promo.description && (
                                <div className={styles.promoDescription}>
                                  {promo.description}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={styles.badge}>
                                {promo.discount_type}
                              </span>
                            </td>
                            <td>
                              {promo.discount_type === 'percent' &&
                                `${promo.discount_value}%`}
                              {promo.discount_type === 'fixed' &&
                                `$${promo.discount_value}`}
                              {promo.discount_type === 'free_tier' &&
                                promo.tier_granted}
                              {promo.discount_type === 'free_months' &&
                                `${promo.months_granted} months`}
                            </td>
                            <td>
                              {promo.redemption_count || 0}
                              {promo.max_redemptions
                                ? ` / ${promo.max_redemptions}`
                                : ' / ∞'}
                            </td>
                            <td>
                              <div className={styles.dateRange}>
                                {promo.valid_from && (
                                  <div>
                                    From: {formatDateOnly(promo.valid_from)}
                                  </div>
                                )}
                                {promo.valid_until && (
                                  <div>
                                    Until: {formatDateOnly(promo.valid_until)}
                                  </div>
                                )}
                                {!promo.valid_from && !promo.valid_until && (
                                  <div>Always</div>
                                )}
                              </div>
                            </td>
                            <td>
                              <span
                                className={
                                  status === 'active'
                                    ? styles.statusActive
                                    : styles.statusInactive
                                }
                              >
                                {status}
                              </span>
                            </td>
                            <td className={styles.actionsCol}>
                              <button
                                className={styles.smallBtn}
                                type="button"
                                onClick={() => startEdit(promo)}
                                disabled={actionBusyId === promo.id}
                              >
                                Edit
                              </button>
                              <button
                                className={styles.smallBtnDanger}
                                type="button"
                                onClick={() => deletePromoCode(promo.id)}
                                disabled={actionBusyId === promo.id}
                              >
                                {actionBusyId === promo.id
                                  ? 'Deleting...'
                                  : 'Delete'}
                              </button>
                            </td>
                          </tr>

                          {isEditing && (
                            <tr className={styles.editRow}>
                              <td colSpan={7}>
                                <form
                                  className={styles.editForm}
                                  onSubmit={saveEdit}
                                >
                                  <div className={styles.editGrid}>
                                    <label className={styles.field}>
                                      <span>Code</span>
                                      <input
                                        className={styles.input}
                                        value={editCode}
                                        onChange={(e) =>
                                          setEditCode(e.target.value)
                                        }
                                      />
                                    </label>

                                    <label className={styles.field}>
                                      <span>Description</span>
                                      <input
                                        className={styles.input}
                                        value={editDescription}
                                        onChange={(e) =>
                                          setEditDescription(e.target.value)
                                        }
                                      />
                                    </label>

                                    <label className={styles.field}>
                                      <span>Discount Type</span>
                                      <select
                                        className={styles.select}
                                        value={editDiscountType}
                                        onChange={(e) =>
                                          setEditDiscountType(e.target.value)
                                        }
                                      >
                                        <option value="percent">
                                          Percent Off
                                        </option>
                                        <option value="fixed">
                                          Fixed Amount
                                        </option>
                                        <option value="free_months">
                                          Free Months
                                        </option>
                                        <option value="free_tier">
                                          Free Tier
                                        </option>
                                      </select>
                                    </label>

                                    {(editDiscountType === 'percent' ||
                                      editDiscountType === 'fixed') && (
                                      <label className={styles.field}>
                                        <span>Value</span>
                                        <input
                                          type="number"
                                          className={styles.input}
                                          value={editDiscountValue}
                                          onChange={(e) =>
                                            setEditDiscountValue(
                                              e.target.value
                                            )
                                          }
                                        />
                                      </label>
                                    )}

                                    {editDiscountType === 'free_tier' && (
                                      <label className={styles.field}>
                                        <span>Tier Granted</span>
                                        <select
                                          className={styles.select}
                                          value={editTierGranted}
                                          onChange={(e) =>
                                            setEditTierGranted(e.target.value)
                                          }
                                        >
                                          <option value="single_barrel">
                                            Single Barrel
                                          </option>
                                          <option value="barrel_proof">
                                            Barrel Proof
                                          </option>
                                        </select>
                                      </label>
                                    )}

                                    {editDiscountType === 'free_months' && (
                                      <label className={styles.field}>
                                        <span>Months Granted</span>
                                        <input
                                          type="number"
                                          className={styles.input}
                                          value={editMonthsGranted}
                                          onChange={(e) =>
                                            setEditMonthsGranted(
                                              e.target.value
                                            )
                                          }
                                        />
                                      </label>
                                    )}

                                    <label className={styles.field}>
                                      <span>Max Redemptions</span>
                                      <input
                                        type="number"
                                        className={styles.input}
                                        value={editMaxRedemptions}
                                        onChange={(e) =>
                                          setEditMaxRedemptions(e.target.value)
                                        }
                                      />
                                    </label>

                                    <label className={styles.field}>
                                      <span>Valid From</span>
                                      <input
                                        type="date"
                                        className={styles.input}
                                        value={editValidFrom}
                                        onChange={(e) =>
                                          setEditValidFrom(e.target.value)
                                        }
                                      />
                                    </label>

                                    <label className={styles.field}>
                                      <span>Valid Until</span>
                                      <input
                                        type="date"
                                        className={styles.input}
                                        value={editValidUntil}
                                        onChange={(e) =>
                                          setEditValidUntil(e.target.value)
                                        }
                                      />
                                    </label>
                                  </div>

                                  <div className={styles.editActions}>
                                    <button
                                      className={styles.primaryBtn}
                                      disabled={editBusy}
                                    >
                                      {editBusy ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.secondaryBtn}
                                      onClick={cancelEdit}
                                      disabled={editBusy}
                                    >
                                      Cancel
                                    </button>
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
        </>
      )}
    </div>
  );
}

export default AdminSubscriptionManagementPage;
