import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/AdminTagsPage.module.scss';

function AdminTagsPage() {
  const { user } = useAuth();

  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters and search
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [nfcUid, setNfcUid] = useState('');
  const [label, setLabel] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTagId, setTransferTagId] = useState(null);
  const [transferUserId, setTransferUserId] = useState('');
  const [transferInventoryId, setTransferInventoryId] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');

  async function loadTags() {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 50,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const res = await api.get('/v1/admin/tags', { params });
      setTags(res.data.tags || []);

      // Handle pagination if API returns it
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.total_pages || 1);
      }
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to load admin tag list.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadTags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, searchQuery, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    const uid = nfcUid.trim();
    if (!uid) {
      setFormError('NFC UID is required.');
      return;
    }

    setSubmitting(true);
    try {
      // Use bulk endpoint with single UID
      await api.post('/v1/admin/tags/bulk', {
        nfc_uids: [uid],
        label: label.trim() || undefined,
      });
      setNfcUid('');
      setLabel('');
      setFormSuccess('Tag registered successfully!');
      await loadTags();
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error ||
        'Failed to register tag.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetTag(tagId) {
    if (!confirm('Are you sure you want to reset this tag? This will unassign it from any user or inventory item.')) {
      return;
    }

    try {
      await api.post(`/v1/admin/tags/${tagId}/reset`);
      await loadTags();
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error || 'Failed to reset tag.';
      alert(message);
    }
  }

  async function handleDeleteTag(tagId) {
    if (!confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/v1/admin/tags/${tagId}`);
      await loadTags();
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error || 'Failed to delete tag.';
      alert(message);
    }
  }

  function openTransferModal(tagId) {
    setTransferTagId(tagId);
    setTransferUserId('');
    setTransferInventoryId('');
    setUserSearchQuery('');
    setUserSearchResults([]);
    setTransferError('');
    setShowTransferModal(true);
  }

  function closeTransferModal() {
    setShowTransferModal(false);
    setTransferTagId(null);
    setTransferUserId('');
    setTransferInventoryId('');
    setUserSearchQuery('');
    setUserSearchResults([]);
    setTransferError('');
  }

  async function searchUsers() {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const res = await api.get('/v1/admin/users', {
        params: { search: userSearchQuery.trim(), limit: 10 }
      });
      setUserSearchResults(res.data.users || []);
    } catch (err) {
      console.error(err);
      setTransferError('Failed to search users.');
    } finally {
      setSearchingUsers(false);
    }
  }

  async function handleTransfer() {
    if (!transferUserId) {
      setTransferError('Please select a user.');
      return;
    }

    setTransferring(true);
    setTransferError('');
    try {
      const payload = { new_user_id: transferUserId };
      if (transferInventoryId.trim()) {
        payload.inventory_id = transferInventoryId.trim();
      }

      await api.post(`/v1/admin/tags/${transferTagId}/transfer`, payload);
      closeTransferModal();
      await loadTags();
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error || 'Failed to transfer tag.';
      setTransferError(message);
    } finally {
      setTransferring(false);
    }
  }

  function handleFilterChange(newStatus) {
    setStatusFilter(newStatus);
    setPage(1);
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className={styles.page}>
        <div className={styles.accessDenied}>
          Admin access required to manage tag registrations.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Admin Tags</h1>
          <p className={styles.subtitle}>
            Register NFC UIDs and manage labels for tags before users claim them.
          </p>
        </div>
      </div>

      <div className={styles.formCard}>
        <h2 className={styles.formTitle}>Register Tag</h2>
        <p className={styles.formHint}>
          Register a single NFC tag. For bulk registration, use the tag packs feature.
        </p>
        {formError && <div className={styles.formError}>{formError}</div>}
        {formSuccess && <div className={styles.formSuccess}>{formSuccess}</div>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label className={styles.label}>
              NFC UID *
              <input
                className={styles.input}
                type="text"
                value={nfcUid}
                onChange={(e) => setNfcUid(e.target.value)}
                placeholder="e.g. TEST-TAG-001"
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>
              Label
              <input
                className={styles.input}
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Home - Cabinet A / Shelf 2"
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={submitting}
            >
              {submitting ? 'Registering...' : 'Register Tag'}
            </button>
          </div>
        </form>
      </div>

      {/* Filters and Search */}
      <div className={styles.filtersCard}>
        <div className={styles.filterRow}>
          <div className={styles.searchBox}>
            <input
              type="text"
              className={styles.input}
              placeholder="Search by NFC UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Status:</label>
            <select
              className={styles.select}
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="">All</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned</option>
              <option value="active">Active</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <div className={styles.message}>Loading tags...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && tags.length === 0 && (
        <div className={styles.message}>
          {statusFilter || searchQuery ? 'No tags found matching your filters.' : 'No tags registered yet.'}
        </div>
      )}

      {!loading && !error && tags.length > 0 && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>NFC UID</th>
                  <th>Label</th>
                  <th>Status</th>
                  <th>User</th>
                  <th>Inventory</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id}>
                    <td>{tag.nfc_uid}</td>
                    <td>{tag.label || '—'}</td>
                    <td>
                      <span className={styles.statusBadge} data-status={tag.status}>
                        {tag.status}
                      </span>
                    </td>
                    <td>
                      {tag.registered_to_user_id ? tag.registered_to_user_id : '—'}
                    </td>
                    <td>
                      {tag.registered_to_inventory_id ? tag.registered_to_inventory_id : '—'}
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        {tag.status !== 'unassigned' && (
                          <button
                            className={styles.actionButton}
                            onClick={() => handleResetTag(tag.id)}
                            title="Reset tag"
                          >
                            Reset
                          </button>
                        )}
                        <button
                          className={styles.actionButton}
                          onClick={() => openTransferModal(tag.id)}
                          title="Transfer tag"
                        >
                          Transfer
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                          onClick={() => handleDeleteTag(tag.id)}
                          title="Delete tag"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className={styles.paginationInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                className={styles.paginationButton}
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Transfer Tag</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeTransferModal}
              >
                ✕
              </button>
            </div>
            <p className={styles.modalSubtitle}>
              Transfer this tag to a different user and optionally assign it to a specific inventory item.
            </p>

            {transferError && <div className={styles.formError}>{transferError}</div>}

            <div className={styles.modalForm}>
              <div className={styles.formRow}>
                <label className={styles.label}>
                  Search for User
                  <div className={styles.searchGroup}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Enter email or username..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), searchUsers())}
                    />
                    <button
                      type="button"
                      className={styles.searchButton}
                      onClick={searchUsers}
                      disabled={searchingUsers}
                    >
                      {searchingUsers ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </label>
              </div>

              {userSearchResults.length > 0 && (
                <div className={styles.userResults}>
                  {userSearchResults.map((u) => (
                    <div
                      key={u.id}
                      className={`${styles.userResult} ${transferUserId === u.id ? styles.userResultSelected : ''}`}
                      onClick={() => setTransferUserId(u.id)}
                    >
                      <div className={styles.userInfo}>
                        <strong>{u.username || u.email}</strong>
                        {u.username && <span className={styles.userEmail}>{u.email}</span>}
                      </div>
                      {transferUserId === u.id && <span className={styles.checkmark}>✓</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.formRow}>
                <label className={styles.label}>
                  Inventory ID (optional)
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Leave blank to just assign to user"
                    value={transferInventoryId}
                    onChange={(e) => setTransferInventoryId(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeTransferModal}
                disabled={transferring}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleTransfer}
                disabled={transferring || !transferUserId}
              >
                {transferring ? 'Transferring...' : 'Transfer Tag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTagsPage;
