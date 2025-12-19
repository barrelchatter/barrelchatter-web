import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import LogTastingModal from '../components/LogTastingModal';
import StorageLocationSelect from '../components/StorageLocationSelect';
import styles from '../styles/InventoryDetailPage.module.scss';

function InventoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [bottle, setBottle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showTastingModal, setShowTastingModal] = useState(false);
  const [tastings, setTastings] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveLocation, setMoveLocation] = useState(null);
  const [moveSubmitting, setMoveSubmitting] = useState(false);

  // Fetch inventory item
  const fetchItem = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/v1/inventory/${id}`);
      // API returns { inventory: {...} }
      const inventoryData = response.data?.inventory || response.data;
      setItem(inventoryData);
      setBottle(inventoryData.bottle || null);
      setEditForm(inventoryData);

      // Fetch tastings for this inventory item
      try {
        const tastingsRes = await api.get(`/v1/tastings?inventory_id=${id}&limit=50`);
        setTastings(tastingsRes.data?.tastings || []);
      } catch (err) {
        console.log('Could not load tastings:', err);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      const message = err?.response?.data?.error || err.message || 'Failed to fetch inventory item';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  // Handle form field changes
  function handleFieldChange(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  // Save changes
  async function handleSave() {
    setSaving(true);
    try {
      const response = await api.patch(`/v1/inventory/${id}`, {
        status: editForm.status,
        storage_location_id: editForm.storage_location_id || null,
        location_label: editForm.location_label,
        notes: editForm.notes,
        msrp: editForm.msrp ? parseFloat(editForm.msrp) : null,
        price_paid: editForm.price_paid ? parseFloat(editForm.price_paid) : null,
        purchase_date: editForm.purchase_date || null,
        purchase_store: editForm.purchase_store || null,
        purchase_city: editForm.purchase_city || null,
        purchase_state: editForm.purchase_state || null,
      });

      // API returns { inventory: {...} }
      const updated = response.data?.inventory || response.data;
      setItem(updated);
      setEditing(false);
    } catch (err) {
      console.error('Error saving inventory:', err);
      const message = err?.response?.data?.error || err.message || 'Failed to save';
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  // Delete item
  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this bottle from your collection?')) {
      return;
    }

    try {
      await api.delete(`/v1/inventory/${id}`);
      navigate('/app/inventory');
    } catch (err) {
      console.error('Error deleting:', err);
      const message = err?.response?.data?.error || err.message || 'Failed to delete';
      alert(message);
    }
  }

  function handleCancel() {
    setEditForm(item);
    setEditing(false);
  }

  // Move bottle to new location
  async function handleMoveBottle() {
    if (!moveLocation && !editForm.location_label) {
      alert('Please select a location');
      return;
    }

    setMoveSubmitting(true);
    try {
      const response = await api.patch(`/v1/inventory/${id}`, {
        storage_location_id: moveLocation || null,
        location_label: moveLocation ? '' : editForm.location_label,
      });

      const updated = response.data?.inventory || response.data;
      setItem(updated);
      setEditForm(updated);
      setShowMoveModal(false);
      setMoveLocation(null);
    } catch (err) {
      console.error('Error moving bottle:', err);
      const message = err?.response?.data?.error || err.message || 'Failed to move bottle';
      alert(message);
    } finally {
      setMoveSubmitting(false);
    }
  }

  // Format currency
  function formatCurrency(value) {
    if (!value) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/app/inventory" className={styles.backLink}>
            ← Back to My Collection
          </Link>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Not Found</h2>
          <p>This collection item could not be found.</p>
          <Link to="/app/inventory" className={styles.backLink}>
            ← Back to My Collection
          </Link>
        </div>
      </div>
    );
  }

  const bottleName = bottle?.name || item.bottle_name || 'Unknown Bottle';
  const distillery = bottle?.distillery || item.distillery || '';

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link to="/app/inventory" className={styles.backLink}>
          ← Back to My Collection
        </Link>

        <div className={styles.headerMain}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>{bottleName}</h1>
            {distillery && <p className={styles.distillery}>{distillery}</p>}

            <div className={styles.badges}>
              <span className={`${styles.statusBadge} ${styles[`status_${item.status}`]}`}>
                {item.status}
              </span>
              {item.location_label && (
                <span className={styles.statusBadge}>{item.location_label}</span>
              )}
            </div>
          </div>

          <div className={styles.headerActions}>
            {!editing ? (
              <>
                <button className={styles.editButton} onClick={() => setEditing(true)}>
                  Edit
                </button>
                <button className={styles.deleteButton} onClick={handleDelete}>
                  Delete
                </button>
              </>
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
        </div>
      </header>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <button
          className={styles.logPourButton}
          onClick={() => setShowTastingModal(true)}
        >
          🥃 Log a Pour
        </button>
        <button
          className={styles.moveButton}
          onClick={() => {
            setMoveLocation(item.storage_location_id || null);
            setShowMoveModal(true);
          }}
        >
          📍 Move Bottle
        </button>
      </div>

      {/* Image */}
      {(item.photo_url || bottle?.image_url || bottle?.primary_photo_url) && (
        <div className={styles.imageSection}>
          <img
            src={item.photo_url || bottle?.image_url || bottle?.primary_photo_url}
            alt={bottleName}
            className={styles.bottleImage}
          />
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'tastings' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tastings')}
        >
          Tastings ({tastings.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'purchase' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('purchase')}
        >
          Purchase Info
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'notes' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {activeTab === 'details' && (
          <div className={styles.detailsTab}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Bottle Information</h3>

              {editing ? (
                <div className={styles.editGrid}>
                  <label className={styles.editField}>
                    <span>Status</span>
                    <select
                      value={editForm.status || ''}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                    >
                      <option value="sealed">Sealed</option>
                      <option value="open">Open</option>
                      <option value="finished">Finished</option>
                      <option value="sample">Sample</option>
                    </select>
                  </label>

                  <label className={styles.editField}>
                    <span>Storage Location</span>
                    <StorageLocationSelect
                      value={editForm.storage_location_id || null}
                      onChange={(locationId) => {
                        handleFieldChange('storage_location_id', locationId);
                        if (locationId) {
                          handleFieldChange('location_label', '');
                        }
                      }}
                      showLegacy={true}
                      legacyValue={editForm.location_label || ''}
                      onLegacyChange={(value) => {
                        handleFieldChange('location_label', value);
                        handleFieldChange('storage_location_id', null);
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Type</span>
                    <span className={styles.infoValue}>{bottle?.type || '—'}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Proof</span>
                    <span className={styles.infoValue}>
                      {bottle?.proof ? `${bottle.proof}°` : '—'}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Age</span>
                    <span className={styles.infoValue}>{bottle?.age_statement || 'NAS'}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Status</span>
                    <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>
                      {item.status}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Location</span>
                    <span className={styles.infoValue}>
                      {item.storage_location?.full_path || item.storage_location?.name || item.location_label || '—'}
                    </span>
                  </div>

                  {item.opened_at && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Opened</span>
                      <span className={styles.infoValue}>{formatDate(item.opened_at)}</span>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'purchase' && (
          <div className={styles.detailsTab}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Purchase Information</h3>

              {editing ? (
                <div className={styles.editGrid}>
                  <label className={styles.editField}>
                    <span>MSRP</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.msrp || ''}
                      onChange={(e) => handleFieldChange('msrp', e.target.value)}
                      placeholder="0.00"
                    />
                  </label>

                  <label className={styles.editField}>
                    <span>Price Paid</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.price_paid || ''}
                      onChange={(e) => handleFieldChange('price_paid', e.target.value)}
                      placeholder="0.00"
                    />
                  </label>

                  <label className={styles.editField}>
                    <span>Purchase Date</span>
                    <input
                      type="date"
                      value={editForm.purchase_date || ''}
                      onChange={(e) => handleFieldChange('purchase_date', e.target.value)}
                    />
                  </label>

                  <label className={styles.editField}>
                    <span>Store</span>
                    <input
                      type="text"
                      value={editForm.purchase_store || ''}
                      onChange={(e) => handleFieldChange('purchase_store', e.target.value)}
                      placeholder="Store name"
                    />
                  </label>

                  <label className={styles.editField}>
                    <span>City</span>
                    <input
                      type="text"
                      value={editForm.purchase_city || ''}
                      onChange={(e) => handleFieldChange('purchase_city', e.target.value)}
                      placeholder="City"
                    />
                  </label>

                  <label className={styles.editField}>
                    <span>State</span>
                    <input
                      type="text"
                      value={editForm.purchase_state || ''}
                      onChange={(e) => handleFieldChange('purchase_state', e.target.value)}
                      placeholder="State"
                    />
                  </label>
                </div>
              ) : (
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>MSRP</span>
                    <span className={styles.infoValue}>{formatCurrency(item.msrp)}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Price Paid</span>
                    <span className={styles.infoValue}>{formatCurrency(item.price_paid)}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Purchase Date</span>
                    <span className={styles.infoValue}>{formatDate(item.purchase_date)}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Store</span>
                    <span className={styles.infoValue}>{item.purchase_store || '—'}</span>
                  </div>

                  <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                    <span className={styles.infoLabel}>Location</span>
                    <span className={styles.infoValue}>
                      {item.purchase_city && item.purchase_state
                        ? `${item.purchase_city}, ${item.purchase_state}`
                        : item.purchase_city || item.purchase_state || '—'}
                    </span>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className={styles.detailsTab}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Notes</h3>

              {editing ? (
                <textarea
                  className={styles.notesTextarea}
                  value={editForm.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Add notes about this bottle..."
                  rows={6}
                />
              ) : (
                <p className={styles.notesText}>
                  {item.notes || 'No notes yet.'}
                </p>
              )}
            </section>
          </div>
        )}

        {activeTab === 'tastings' && (
          <div className={styles.detailsTab}>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Tasting History</h3>
                <button 
                  className={styles.addTastingButton}
                  onClick={() => setShowTastingModal(true)}
                >
                  + Log Pour
                </button>
              </div>

              {tastings.length === 0 ? (
                <div className={styles.emptyTastings}>
                  <p>No tastings logged yet.</p>
                  <button 
                    className={styles.logFirstButton}
                    onClick={() => setShowTastingModal(true)}
                  >
                    Log Your First Pour
                  </button>
                </div>
              ) : (
                <div className={styles.tastingsList}>
                  {tastings.map((tasting) => (
                    <div key={tasting.id} className={styles.tastingCard}>
                      <div className={styles.tastingHeader}>
                        <span className={styles.tastingDate}>
                          {new Date(tasting.created_at).toLocaleDateString()}
                        </span>
                        {tasting.rating && (
                          <span className={styles.tastingRating}>
                            {'★'.repeat(Math.round(tasting.rating / 2))}
                            {'☆'.repeat(5 - Math.round(tasting.rating / 2))}
                            <span className={styles.ratingNumber}>{tasting.rating}/10</span>
                          </span>
                        )}
                      </div>
                      <div className={styles.tastingMeta}>
                        {tasting.pour_amount_oz && (
                          <span className={styles.pourAmount}>{tasting.pour_amount_oz} oz</span>
                        )}
                        <span className={styles.visibility}>{tasting.shared_scope}</span>
                      </div>
                      {tasting.notes && (
                        <p className={styles.tastingNotes}>{tasting.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Log Tasting Modal */}
      <LogTastingModal
        isOpen={showTastingModal}
        onClose={() => setShowTastingModal(false)}
        onSuccess={() => {
          setShowTastingModal(false);
          fetchItem(); // Refresh to get new tasting
        }}
        inventoryItem={item}
      />

      {/* Move Bottle Modal */}
      {showMoveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowMoveModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Move Bottle</h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowMoveModal(false)}
                disabled={moveSubmitting}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalDescription}>
                Select a new storage location for "{bottleName}"
              </p>
              <label className={styles.moveLabel}>
                <span>New Location</span>
                <StorageLocationSelect
                  value={moveLocation}
                  onChange={(locationId) => {
                    setMoveLocation(locationId);
                    if (locationId) {
                      setEditForm(prev => ({ ...prev, location_label: '' }));
                    }
                  }}
                  showLegacy={true}
                  legacyValue={editForm.location_label || ''}
                  onLegacyChange={(value) => {
                    setEditForm(prev => ({ ...prev, location_label: value }));
                    setMoveLocation(null);
                  }}
                  disabled={moveSubmitting}
                />
              </label>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowMoveModal(false)}
                disabled={moveSubmitting}
              >
                Cancel
              </button>
              <button
                className={styles.saveButton}
                onClick={handleMoveBottle}
                disabled={moveSubmitting}
              >
                {moveSubmitting ? 'Moving...' : 'Move Bottle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryDetailPage;