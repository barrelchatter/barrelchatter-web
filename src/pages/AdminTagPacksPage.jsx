import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import styles from '../styles/AdminTagPacksPage.module.scss';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount) {
  if (amount == null) return '—';
  return `$${Number(amount).toFixed(2)}`;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'void', label: 'Voided' },
];

function AdminTagPacksPage() {
  const [packs, setPacks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  // Stats
  const [stats, setStats] = useState(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    pack_code: '',
    name: '',
    description: '',
    tag_count: 10,
    retail_price: '',
    notes: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Assign modal
  const [assigning, setAssigning] = useState(null);
  const [assignEmail, setAssignEmail] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Void modal
  const [voiding, setVoiding] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const [voidError, setVoidError] = useState('');

  async function loadPacks() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ limit: '50', offset: '0' });
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/v1/admin/tag-packs?${params}`);
      setPacks(res.data?.packs || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to load tag packs');
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const res = await api.get('/v1/admin/tag-packs/stats');
      setStats(res.data?.stats || null);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  useEffect(() => {
    loadPacks();
    loadStats();
  }, [statusFilter]);

  function handleCreateFormChange(e) {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
    setCreateError('');
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError('');

    try {
      const payload = {
        pack_code: createForm.pack_code.trim(),
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        tag_count: Number(createForm.tag_count),
        retail_price: createForm.retail_price ? Number(createForm.retail_price) : undefined,
        notes: createForm.notes.trim() || undefined,
      };

      await api.post('/v1/admin/tag-packs', payload);

      setShowCreate(false);
      setCreateForm({
        pack_code: '',
        name: '',
        description: '',
        tag_count: 10,
        retail_price: '',
        notes: '',
      });
      await loadPacks();
      await loadStats();
    } catch (err) {
      console.error(err);
      setCreateError(err?.response?.data?.error || 'Failed to create pack');
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleAssignSubmit(e) {
    e.preventDefault();
    if (!assigning) return;

    setAssignSubmitting(true);
    setAssignError('');

    try {
      const res = await api.post(`/v1/admin/tag-packs/${assigning.id}/assign-to-user`, {
        user_email: assignEmail.trim(),
      });

      alert(`Pack assigned! ${res.data.tags_claimed} tags claimed by ${res.data.user.email}`);
      setAssigning(null);
      setAssignEmail('');
      await loadPacks();
    } catch (err) {
      console.error(err);
      setAssignError(err?.response?.data?.error || 'Failed to assign pack');
    } finally {
      setAssignSubmitting(false);
    }
  }

  async function handleVoidSubmit(e) {
    e.preventDefault();
    if (!voiding) return;

    setVoidSubmitting(true);
    setVoidError('');

    try {
      await api.post(`/v1/admin/tag-packs/${voiding.id}/void`, {
        reason: voidReason.trim(),
      });

      setVoiding(null);
      setVoidReason('');
      await loadPacks();
      await loadStats();
    } catch (err) {
      console.error(err);
      setVoidError(err?.response?.data?.error || 'Failed to void pack');
    } finally {
      setVoidSubmitting(false);
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'active':
        return styles.statusActive;
      case 'claimed':
        return styles.statusClaimed;
      case 'void':
        return styles.statusVoid;
      default:
        return styles.statusDefault;
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Tag Packs</h1>
          <p className={styles.subtitle}>
            Manage NFC tag packs for distribution and sale.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link to="/app/admin/tags/bulk-import" className={styles.secondaryButton}>
            Bulk Import Tags
          </Link>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setShowCreate(true)}
          >
            + Create Pack
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.total_packs || 0}</span>
            <span className={styles.statLabel}>Total Packs</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.active_packs || 0}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.claimed_packs || 0}</span>
            <span className={styles.statLabel}>Claimed</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.tags_in_packs || 0}</span>
            <span className={styles.statLabel}>Tags in Packs</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filtersRow}>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className={styles.countLabel}>{total} pack{total === 1 ? '' : 's'}</span>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.message}>Loading...</div>}

      {!loading && !error && packs.length === 0 && (
        <div className={styles.emptyState}>
          <p>No tag packs found.</p>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setShowCreate(true)}
          >
            Create Your First Pack
          </button>
        </div>
      )}

      {!loading && !error && packs.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pack Code</th>
                <th>Name</th>
                <th>Tags</th>
                <th>Price</th>
                <th>Status</th>
                <th>Claimed By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packs.map((pack) => (
                <tr key={pack.id}>
                  <td>
                    <Link to={`/app/admin/tag-packs/${pack.id}`} className={styles.packCodeLink}>
                      {pack.pack_code}
                    </Link>
                  </td>
                  <td>{pack.name}</td>
                  <td>
                    <span className={styles.tagCount}>
                      {pack.actual_tag_count || 0} / {pack.tag_count}
                    </span>
                    {pack.actual_tag_count < pack.tag_count && (
                      <span className={styles.tagCountWarning}> (incomplete)</span>
                    )}
                  </td>
                  <td>{formatCurrency(pack.retail_price)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(pack.status)}`}>
                      {pack.status}
                    </span>
                  </td>
                  <td>
                    {pack.claimed_by_email ? (
                      <div>
                        <div>{pack.claimed_by_name}</div>
                        <div className={styles.emailSmall}>{pack.claimed_by_email}</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <Link to={`/app/admin/tag-packs/${pack.id}`} className={styles.viewButton}>
                        View
                      </Link>
                      {pack.status === 'active' && (
                        <>
                          <button
                            type="button"
                            className={styles.assignButton}
                            onClick={() => setAssigning(pack)}
                          >
                            Assign
                          </button>
                          <button
                            type="button"
                            className={styles.voidButton}
                            onClick={() => setVoiding(pack)}
                          >
                            Void
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create Tag Pack</h2>
              <button type="button" className={styles.modalClose} onClick={() => setShowCreate(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {createError && <div className={styles.modalError}>{createError}</div>}

              <form onSubmit={handleCreateSubmit}>
                <label className={styles.modalLabel}>
                  Pack Code *
                  <input
                    type="text"
                    name="pack_code"
                    className={styles.modalInput}
                    value={createForm.pack_code}
                    onChange={handleCreateFormChange}
                    placeholder="e.g., STARTER-10-001"
                    disabled={createSubmitting}
                    required
                  />
                </label>

                <label className={styles.modalLabel}>
                  Name *
                  <input
                    type="text"
                    name="name"
                    className={styles.modalInput}
                    value={createForm.name}
                    onChange={handleCreateFormChange}
                    placeholder="e.g., Starter Pack - 10 Tags"
                    disabled={createSubmitting}
                    required
                  />
                </label>

                <label className={styles.modalLabel}>
                  Description
                  <textarea
                    name="description"
                    className={styles.modalTextarea}
                    value={createForm.description}
                    onChange={handleCreateFormChange}
                    placeholder="Optional description..."
                    rows={2}
                    disabled={createSubmitting}
                  />
                </label>

                <div className={styles.modalRow}>
                  <label className={styles.modalLabel}>
                    Tag Count *
                    <input
                      type="number"
                      name="tag_count"
                      className={styles.modalInput}
                      value={createForm.tag_count}
                      onChange={handleCreateFormChange}
                      min={1}
                      max={1000}
                      disabled={createSubmitting}
                      required
                    />
                  </label>

                  <label className={styles.modalLabel}>
                    Retail Price
                    <input
                      type="number"
                      name="retail_price"
                      className={styles.modalInput}
                      value={createForm.retail_price}
                      onChange={handleCreateFormChange}
                      placeholder="0.00"
                      step="0.01"
                      min={0}
                      disabled={createSubmitting}
                    />
                  </label>
                </div>

                <label className={styles.modalLabel}>
                  Notes
                  <textarea
                    name="notes"
                    className={styles.modalTextarea}
                    value={createForm.notes}
                    onChange={handleCreateFormChange}
                    placeholder="Internal notes..."
                    rows={2}
                    disabled={createSubmitting}
                  />
                </label>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalCancelButton}
                    onClick={() => setShowCreate(false)}
                    disabled={createSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.modalSubmitButton}
                    disabled={createSubmitting}
                  >
                    {createSubmitting ? 'Creating...' : 'Create Pack'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assigning && (
        <div className={styles.modalOverlay} onClick={() => setAssigning(null)}>
          <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Assign Pack to User</h2>
              <button type="button" className={styles.modalClose} onClick={() => setAssigning(null)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.assignPackInfo}>
                <strong>{assigning.pack_code}</strong>
                <span>{assigning.name}</span>
                <span>{assigning.actual_tag_count || 0} tags</span>
              </div>

              {assignError && <div className={styles.modalError}>{assignError}</div>}

              <form onSubmit={handleAssignSubmit}>
                <label className={styles.modalLabel}>
                  User Email *
                  <input
                    type="email"
                    className={styles.modalInput}
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={assignSubmitting}
                    required
                  />
                </label>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalCancelButton}
                    onClick={() => setAssigning(null)}
                    disabled={assignSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.modalSubmitButton}
                    disabled={assignSubmitting}
                  >
                    {assignSubmitting ? 'Assigning...' : 'Assign Pack'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {voiding && (
        <div className={styles.modalOverlay} onClick={() => setVoiding(null)}>
          <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Void Pack</h2>
              <button type="button" className={styles.modalClose} onClick={() => setVoiding(null)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.voidWarning}>
                Are you sure you want to void pack <strong>{voiding.pack_code}</strong>?
                This action cannot be undone.
              </div>

              {voidError && <div className={styles.modalError}>{voidError}</div>}

              <form onSubmit={handleVoidSubmit}>
                <label className={styles.modalLabel}>
                  Reason *
                  <textarea
                    className={styles.modalTextarea}
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Why is this pack being voided?"
                    rows={3}
                    disabled={voidSubmitting}
                    required
                  />
                </label>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalCancelButton}
                    onClick={() => setVoiding(null)}
                    disabled={voidSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.voidConfirmButton}
                    disabled={voidSubmitting}
                  >
                    {voidSubmitting ? 'Voiding...' : 'Void Pack'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTagPacksPage;
