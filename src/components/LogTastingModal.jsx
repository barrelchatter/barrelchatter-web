import React, { useEffect, useState } from 'react';
import api from '../api/client';
import styles from '../styles/LogTastingModal.module.scss';

/**
 * Props:
 * - isOpen: boolean
 * - initialInventoryId?: string
 * - onClose: () => void
 * - onCreated?: (tasting) => void
 */
function LogTastingModal({
  isOpen,
  initialInventoryId,
  onClose,
  onCreated,
}) {
  const [inventory, setInventory] = useState([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState('');

  const [form, setForm] = useState({
    inventory_id: '',
    pour_amount_oz: '',
    rating: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load inventory when modal opens
  useEffect(() => {
    if (!isOpen) return;

    async function loadInventory() {
      setInvLoading(true);
      setInvError('');
      try {
        const res = await api.get('/v1/inventory?limit=100&offset=0');
        const list = res.data?.inventory || [];
        setInventory(list);

        setForm((prev) => ({
          ...prev,
          inventory_id:
            initialInventoryId ||
            prev.inventory_id ||
            (list[0]?.id || ''),
        }));
      } catch (err) {
        console.error(err);
        const msg =
          err?.response?.data?.error ||
          'Failed to load inventory for tasting.';
        setInvError(msg);
      } finally {
        setInvLoading(false);
      }
    }

    loadInventory();
    setError('');
    setSubmitting(false);
  }, [isOpen, initialInventoryId]);

  function resetAndClose() {
    setForm({
      inventory_id: '',
      pour_amount_oz: '',
      rating: '',
      notes: '',
    });
    setError('');
    setSubmitting(false);
    onClose?.();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function setPourPreset(value) {
    setForm((prev) => ({
      ...prev,
      pour_amount_oz: String(value),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      if (!form.inventory_id) {
        setError('Please select a bottle from your inventory.');
        setSubmitting(false);
        return;
      }

      const payload = {
        inventory_id: form.inventory_id,
        pour_amount_oz: form.pour_amount_oz
          ? Number(form.pour_amount_oz)
          : undefined,
        rating: form.rating ? Number(form.rating) : undefined,
        notes: form.notes.trim() || undefined,
      };

      const res = await api.post('/v1/tastings', payload);
      const tasting =
        res.data?.tasting || res.data?.tastingRecord || null;

      onCreated?.(tasting);
      resetAndClose();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        'Failed to log tasting.';
      setError(msg);
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Log a Tasting</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={resetAndClose}
          >
            ✕
          </button>
        </div>

        {invError && (
          <div className={styles.error}>{invError}</div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <label className={styles.label}>
              Inventory Bottle *
              <select
                name="inventory_id"
                className={styles.input}
                value={form.inventory_id}
                onChange={handleChange}
                disabled={invLoading || !!invError}
              >
                <option value="">
                  {inventory.length === 0
                    ? 'No inventory items found'
                    : 'Select inventory item'}
                </option>
                {inventory.map((inv) => {
                  const bottle = inv.bottle || {};
                  const labelParts = [
                    bottle.name || 'Unknown bottle',
                    bottle.brand,
                    inv.location_label,
                  ].filter(Boolean);
                  return (
                    <option key={inv.id} value={inv.id}>
                      {labelParts.join(' — ')}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              Pour (oz)
              <input
                type="number"
                step="0.25"
                name="pour_amount_oz"
                className={styles.input}
                value={form.pour_amount_oz}
                onChange={handleChange}
                placeholder="1.5"
              />
            </label>
          </div>

          <div className={styles.presetsRow}>
            <span className={styles.presetsLabel}>
              Quick pour:
            </span>
            {[0.5, 1, 1.5, 2].map((val) => (
              <button
                key={val}
                type="button"
                className={styles.presetButton}
                onClick={() => setPourPreset(val)}
              >
                {val} oz
              </button>
            ))}
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              Rating (0–10)
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                name="rating"
                className={styles.input}
                value={form.rating}
                onChange={handleChange}
                placeholder="8.5"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              Notes
              <textarea
                name="notes"
                rows={3}
                className={`${styles.input} ${styles.textarea}`}
                value={form.notes}
                onChange={handleChange}
                placeholder="Aroma, palate, finish, anything memorable..."
              />
            </label>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={resetAndClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={submitting || !!invError}
            >
              {submitting ? 'Logging…' : 'Log Tasting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LogTastingModal;
