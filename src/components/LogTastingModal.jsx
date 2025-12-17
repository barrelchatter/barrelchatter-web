import React, { useState, useEffect } from 'react';
import api from '../api/client';
import styles from '../styles/LogTastingModal.module.scss';

const POUR_AMOUNTS = [
  { value: 0.5, label: '½ oz' },
  { value: 1, label: '1 oz' },
  { value: 1.5, label: '1½ oz' },
  { value: 2, label: '2 oz' },
  { value: 3, label: '3 oz' },
];

/**
 * LogTastingModal - Log a pour/tasting
 * 
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   onSuccess: (tasting) => void
 *   inventoryItem: object (pre-selected inventory item with nested bottle)
 */
function LogTastingModal({
  isOpen,
  onClose,
  onSuccess,
  inventoryItem = null,
}) {
  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [selectedId, setSelectedId] = useState('');
  const [pourAmount, setPourAmount] = useState(1.5);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [sharedScope, setSharedScope] = useState('private');

  // Get bottle name helper
  function getBottleName(item) {
    if (!item) return 'Unknown Bottle';
    // Try various paths where the name might be
    return item.bottle?.name || item.bottle_name || item.name || 'Unknown Bottle';
  }

  function getDistillery(item) {
    if (!item) return '';
    return item.bottle?.distillery || item.bottle_distillery || item.distillery || '';
  }

  // Fetch inventory when modal opens (only if no pre-selected item)
  useEffect(() => {
    if (!isOpen) return;
    
    // Reset form
    setSelectedId(inventoryItem?.id || '');
    setPourAmount(1.5);
    setRating(0);
    setNotes('');
    setSharedScope('private');
    setError(null);

    // If we have a pre-selected item, no need to fetch
    if (inventoryItem) {
      return;
    }

    // Fetch inventory for dropdown
    async function fetchInventory() {
      setLoadingInventory(true);
      try {
        const response = await api.get('/v1/inventory?limit=100&offset=0');
        const allItems = response.data?.inventory || [];
        // Show all non-finished bottles
        const pourableItems = allItems.filter(item => item.status !== 'finished');
        setInventory(pourableItems);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setInventory([]);
      } finally {
        setLoadingInventory(false);
      }
    }

    fetchInventory();
  }, [isOpen, inventoryItem]);

  async function handleSubmit(e) {
    e.preventDefault();

    const inventoryId = inventoryItem?.id || selectedId;
    if (!inventoryId) {
      setError('Please select a bottle');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await api.post('/v1/tastings', {
        inventory_id: inventoryId,
        pour_amount_oz: pourAmount,
        rating: rating || null,
        notes: notes || null,
        shared_scope: sharedScope,
      });

      const tasting = response.data?.tasting || response.data;
      onSuccess?.(tasting);
      onClose();
    } catch (err) {
      console.error('Error logging tasting:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to log tasting');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  // Determine which item to show info for
  const displayItem = inventoryItem || inventory.find(i => i.id === selectedId);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2 className={styles.title}>Log a Pour</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Bottle Selection or Display */}
          <div className={styles.field}>
            <label className={styles.label}>Bottle</label>
            
            {inventoryItem ? (
              // Pre-selected bottle - just display it
              <div className={styles.selectedBottle}>
                <span className={styles.bottleName}>{getBottleName(inventoryItem)}</span>
                {getDistillery(inventoryItem) && (
                  <span className={styles.bottleDistillery}>{getDistillery(inventoryItem)}</span>
                )}
              </div>
            ) : (
              // Need to select from dropdown
              loadingInventory ? (
                <div className={styles.loadingText}>Loading bottles...</div>
              ) : inventory.length === 0 ? (
                <div className={styles.emptyText}>
                  No bottles in inventory. Add some bottles first.
                </div>
              ) : (
                <select
                  className={styles.select}
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  required
                >
                  <option value="">Choose a bottle...</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {getBottleName(item)} ({item.status}) - {item.location_label || 'No location'}
                    </option>
                  ))}
                </select>
              )
            )}
          </div>

          {/* Pour Amount */}
          <div className={styles.field}>
            <label className={styles.label}>Pour Amount</label>
            <div className={styles.pourButtons}>
              {POUR_AMOUNTS.map((amount) => (
                <button
                  key={amount.value}
                  type="button"
                  className={`${styles.pourButton} ${pourAmount === amount.value ? styles.pourButtonActive : ''}`}
                  onClick={() => setPourAmount(amount.value)}
                >
                  {amount.label}
                </button>
              ))}
              <input
                type="number"
                className={styles.customPour}
                value={pourAmount}
                onChange={(e) => setPourAmount(parseFloat(e.target.value) || 0)}
                min="0"
                max="12"
                step="0.25"
              />
            </div>
          </div>

          {/* Rating */}
          <div className={styles.field}>
            <label className={styles.label}>Rating</label>
            <div className={styles.ratingRow}>
              <div className={styles.ratingStars}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`${styles.ratingStar} ${num <= rating ? styles.ratingStarFilled : ''}`}
                    onClick={() => setRating(rating === num ? 0 : num)}
                  >
                    {num <= rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
              <span className={styles.ratingValue}>
                {rating > 0 ? `${rating}/10` : 'Not rated'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className={styles.field}>
            <label className={styles.label}>Tasting Notes</label>
            <textarea
              className={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you think?"
              rows={4}
            />
          </div>

          {/* Visibility */}
          <div className={styles.field}>
            <label className={styles.label}>Visibility</label>
            <div className={styles.visibilityOptions}>
              {[
                { value: 'private', label: '🔒 Private' },
                { value: 'friends', label: '👥 Friends' },
                { value: 'public', label: '🌍 Public' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.visibilityButton} ${sharedScope === opt.value ? styles.visibilityButtonActive : ''}`}
                  onClick={() => setSharedScope(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting || (!inventoryItem && !selectedId)}
            >
              {submitting ? 'Logging...' : 'Log Pour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LogTastingModal;