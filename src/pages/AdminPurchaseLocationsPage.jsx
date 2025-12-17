import React, { useEffect, useState } from 'react';
import api from '../api/client';
import styles from '../styles/AdminPurchaseLocationsPage.module.scss';

const LOCATION_TYPES = [
  { value: 'liquor_store', label: 'Liquor Store' },
  { value: 'grocery_store', label: 'Grocery Store' },
  { value: 'bar', label: 'Bar' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'distillery', label: 'Distillery' },
  { value: 'online', label: 'Online Retailer' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

function getTypeLabel(typeValue) {
  const found = LOCATION_TYPES.find((t) => t.value === typeValue);
  return found?.label || typeValue || '—';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function AdminPurchaseLocationsPage() {
  const [locations, setLocations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Moderation modal
  const [moderating, setModerating] = useState(null);
  const [moderateAction, setModerateAction] = useState('approved');
  const [moderateNotes, setModerateNotes] = useState('');
  const [moderateSubmitting, setModerateSubmitting] = useState(false);
  const [moderateError, setModerateError] = useState('');
  
  // Editable fields during moderation
  const [editFields, setEditFields] = useState({
    name: '',
    location_type: 'liquor_store',
    address_line1: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    website: '',
    logo_url: '',
  });

  // Detail view
  const [viewingDetail, setViewingDetail] = useState(null);

  async function loadLocations() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ limit: '50', offset: '0' });
      if (statusFilter) params.set('status', statusFilter);
      if (searchTerm) params.set('q', searchTerm);
      if (typeFilter) params.set('type', typeFilter);

      const res = await api.get(`/v1/purchase-locations?${params}`);
      setLocations(res.data?.locations || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || 'Failed to load purchase locations';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLocations();
  }, [statusFilter, typeFilter]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadLocations();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  function openModerate(location, action) {
    setModerating(location);
    setModerateAction(action);
    setModerateNotes('');
    setModerateError('');
    // Populate edit fields with current values
    setEditFields({
      name: location.name || '',
      location_type: location.location_type || 'liquor_store',
      address_line1: location.address_line1 || '',
      city: location.city || '',
      state: location.state || '',
      postal_code: location.postal_code || '',
      phone: location.phone || '',
      website: location.website || '',
      logo_url: location.logo_url || '',
    });
  }

  function closeModerate() {
    setModerating(null);
    setModerateAction('approved');
    setModerateNotes('');
    setModerateError('');
    setEditFields({
      name: '',
      location_type: 'liquor_store',
      address_line1: '',
      city: '',
      state: '',
      postal_code: '',
      phone: '',
      website: '',
      logo_url: '',
    });
  }

  function handleEditFieldChange(e) {
    const { name, value } = e.target;
    setEditFields(prev => ({ ...prev, [name]: value }));
  }

  async function handleModerateSubmit(e) {
    e.preventDefault();
    if (!moderating) return;

    setModerateSubmitting(true);
    setModerateError('');

    try {
      // First update the location fields if approving
      if (moderateAction === 'approved') {
        await api.patch(`/v1/purchase-locations/${moderating.id}`, {
          name: editFields.name,
          type: editFields.location_type,
          address_line1: editFields.address_line1 || null,
          city: editFields.city,
          state: editFields.state,
          postal_code: editFields.postal_code || null,
          phone: editFields.phone || null,
          website: editFields.website || null,
          logo_url: editFields.logo_url || null,
        });
      }

      // Then moderate (approve/reject)
      const res = await api.post(`/v1/purchase-locations/${moderating.id}/moderate`, {
        status: moderateAction,
        moderator_notes: moderateNotes.trim() || undefined,
      });

      const linkedCount = res.data?.linked_inventory_count || 0;
      if (linkedCount > 0) {
        alert(`Location ${moderateAction}! ${linkedCount} inventory item(s) were automatically linked.`);
      }

      closeModerate();
      await loadLocations();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || 'Failed to moderate location';
      setModerateError(msg);
    } finally {
      setModerateSubmitting(false);
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'approved':
        return styles.statusApproved;
      case 'rejected':
        return styles.statusRejected;
      case 'pending':
      default:
        return styles.statusPending;
    }
  }

  const pendingCount = locations.filter((l) => l.status === 'pending').length;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Purchase Locations</h1>
          <p className={styles.subtitle}>
            Manage the global catalog of stores, bars, and distilleries.
          </p>
        </div>
        {statusFilter === 'pending' && pendingCount > 0 && (
          <span className={styles.pendingBadge}>
            {pendingCount} pending review
          </span>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <input
          type="text"
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name..."
        />

        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {LOCATION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <span className={styles.countLabel}>{total} location{total === 1 ? '' : 's'}</span>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading && <div className={styles.message}>Loading...</div>}

      {!loading && !error && locations.length === 0 && (
        <div className={styles.emptyState}>
          <p>No locations found matching your filters.</p>
        </div>
      )}

      {!loading && !error && locations.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.id}>
                  <td>
                    <button
                      type="button"
                      className={styles.nameLink}
                      onClick={() => setViewingDetail(loc)}
                    >
                      {loc.name}
                    </button>
                    {loc.website && (
                      <a
                        href={loc.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.websiteLink}
                      >
                        ↗
                      </a>
                    )}
                  </td>
                  <td>{getTypeLabel(loc.location_type)}</td>
                  <td>
                    {loc.city}, {loc.state}
                    {loc.address_line1 && (
                      <div className={styles.addressLine}>{loc.address_line1}</div>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(loc.status)}`}>
                      {loc.status}
                    </span>
                  </td>
                  <td>
                    <div>{formatDate(loc.submitted_at)}</div>
                    {loc.submitted_by_name && (
                      <div className={styles.submittedBy}>by {loc.submitted_by_name}</div>
                    )}
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      {loc.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            className={styles.approveButton}
                            onClick={() => openModerate(loc, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className={styles.rejectButton}
                            onClick={() => openModerate(loc, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {loc.status === 'approved' && (
                        <button
                          type="button"
                          className={styles.rejectButton}
                          onClick={() => openModerate(loc, 'rejected')}
                        >
                          Reject
                        </button>
                      )}
                      {loc.status === 'rejected' && (
                        <button
                          type="button"
                          className={styles.approveButton}
                          onClick={() => openModerate(loc, 'approved')}
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Moderation Modal */}
      {moderating && (
        <div className={styles.modalOverlay} onClick={closeModerate}>
          <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {moderateAction === 'approved' ? 'Approve' : 'Reject'} Location
              </h2>
              <button type="button" className={styles.modalClose} onClick={closeModerate}>
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {moderateError && <div className={styles.modalError}>{moderateError}</div>}

              <form onSubmit={handleModerateSubmit}>
                <div className={styles.moderateSection}>
                  <label className={styles.modalLabel}>
                    Action
                    <select
                      className={styles.modalSelect}
                      value={moderateAction}
                      onChange={(e) => setModerateAction(e.target.value)}
                      disabled={moderateSubmitting}
                    >
                      <option value="approved">Approve</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </label>
                </div>

                {moderateAction === 'approved' && (
                  <div className={styles.editFieldsSection}>
                    <h4>Location Details</h4>
                    <p className={styles.editFieldsHint}>Review and update before approving:</p>
                    
                    <div className={styles.editFieldsGrid}>
                      <label className={styles.modalLabel}>
                        Name *
                        <input
                          type="text"
                          name="name"
                          className={styles.modalInput}
                          value={editFields.name}
                          onChange={handleEditFieldChange}
                          disabled={moderateSubmitting}
                          required
                        />
                      </label>

                      <label className={styles.modalLabel}>
                        Type *
                        <select
                          name="location_type"
                          className={styles.modalSelect}
                          value={editFields.location_type}
                          onChange={handleEditFieldChange}
                          disabled={moderateSubmitting}
                        >
                          {LOCATION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className={styles.modalLabel}>
                        Street Address
                        <input
                          type="text"
                          name="address_line1"
                          className={styles.modalInput}
                          value={editFields.address_line1}
                          onChange={handleEditFieldChange}
                          placeholder="123 Main St"
                          disabled={moderateSubmitting}
                        />
                      </label>

                      <label className={styles.modalLabel}>
                        City *
                        <input
                          type="text"
                          name="city"
                          className={styles.modalInput}
                          value={editFields.city}
                          onChange={handleEditFieldChange}
                          disabled={moderateSubmitting}
                          required
                        />
                      </label>

                      <label className={styles.modalLabel}>
                        State *
                        <input
                          type="text"
                          name="state"
                          className={styles.modalInput}
                          value={editFields.state}
                          onChange={handleEditFieldChange}
                          placeholder="IN"
                          maxLength={2}
                          disabled={moderateSubmitting}
                          required
                        />
                      </label>

                      <label className={styles.modalLabel}>
                        ZIP Code
                        <input
                          type="text"
                          name="postal_code"
                          className={styles.modalInput}
                          value={editFields.postal_code}
                          onChange={handleEditFieldChange}
                          placeholder="12345"
                          disabled={moderateSubmitting}
                        />
                      </label>

                      <label className={styles.modalLabel}>
                        Phone
                        <input
                          type="text"
                          name="phone"
                          className={styles.modalInput}
                          value={editFields.phone}
                          onChange={handleEditFieldChange}
                          placeholder="(555) 123-4567"
                          disabled={moderateSubmitting}
                        />
                      </label>

                      <label className={styles.modalLabel}>
                        Website
                        <input
                          type="url"
                          name="website"
                          className={styles.modalInput}
                          value={editFields.website}
                          onChange={handleEditFieldChange}
                          placeholder="https://..."
                          disabled={moderateSubmitting}
                        />
                      </label>

                      <label className={styles.modalLabelFull}>
                        Logo URL
                        <input
                          type="url"
                          name="logo_url"
                          className={styles.modalInput}
                          value={editFields.logo_url}
                          onChange={handleEditFieldChange}
                          placeholder="https://example.com/logo.png"
                          disabled={moderateSubmitting}
                        />
                        {editFields.logo_url && (
                          <div className={styles.logoPreview}>
                            <img src={editFields.logo_url} alt="Logo preview" />
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                <label className={styles.modalLabel}>
                  Notes {moderateAction === 'rejected' ? '(reason for rejection)' : '(optional)'}
                  <textarea
                    className={styles.modalTextarea}
                    value={moderateNotes}
                    onChange={(e) => setModerateNotes(e.target.value)}
                    placeholder={
                      moderateAction === 'rejected'
                        ? 'Reason for rejection...'
                        : 'Any notes about this location...'
                    }
                    rows={3}
                    disabled={moderateSubmitting}
                  />
                </label>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalCancelButton}
                    onClick={closeModerate}
                    disabled={moderateSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={
                      moderateAction === 'approved'
                        ? styles.modalApproveButton
                        : styles.modalRejectButton
                    }
                    disabled={moderateSubmitting}
                  >
                    {moderateSubmitting
                      ? 'Saving...'
                      : moderateAction === 'approved'
                      ? 'Approve'
                      : 'Reject'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {viewingDetail && (
        <div className={styles.modalOverlay} onClick={() => setViewingDetail(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{viewingDetail.name}</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setViewingDetail(null)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Type</span>
                  <span>{getTypeLabel(viewingDetail.location_type)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Status</span>
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(viewingDetail.status)}`}>
                    {viewingDetail.status}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Address</span>
                  <span>
                    {viewingDetail.address_line1 && <div>{viewingDetail.address_line1}</div>}
                    {viewingDetail.city}, {viewingDetail.state} {viewingDetail.postal_code}
                  </span>
                </div>
                {viewingDetail.phone && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Phone</span>
                    <span>{viewingDetail.phone}</span>
                  </div>
                )}
                {viewingDetail.website && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Website</span>
                    <a href={viewingDetail.website} target="_blank" rel="noopener noreferrer">
                      {viewingDetail.website}
                    </a>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Submitted</span>
                  <span>
                    {formatDate(viewingDetail.submitted_at)}
                    {viewingDetail.submitted_by_name && ` by ${viewingDetail.submitted_by_name}`}
                  </span>
                </div>
                {viewingDetail.purchase_count != null && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Purchases</span>
                    <span>{viewingDetail.purchase_count} recorded</span>
                  </div>
                )}
              </div>

              {viewingDetail.status === 'pending' && (
                <div className={styles.detailActions}>
                  <button
                    type="button"
                    className={styles.approveButton}
                    onClick={() => {
                      setViewingDetail(null);
                      openModerate(viewingDetail, 'approved');
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className={styles.rejectButton}
                    onClick={() => {
                      setViewingDetail(null);
                      openModerate(viewingDetail, 'rejected');
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPurchaseLocationsPage;
