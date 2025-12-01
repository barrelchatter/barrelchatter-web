import React, { useEffect, useState } from 'react';
import api from '../api/client';
import styles from '../styles/WishlistPage.module.scss';

const INITIAL_FORM = {
  bottle_id: '',
  preferred_price: '',
  notes: '',
  alert_enabled: true,
};

function WishlistPage() {
  const [wishlists, setWishlists] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [bottles, setBottles] = useState([]);
  const [bottlesLoading, setBottlesLoading] = useState(true);
  const [bottlesError, setBottlesError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  async function loadBottles() {
    setBottlesLoading(true);
    setBottlesError('');
    try {
      const res = await api.get('/v1/bottles?limit=200&offset=0');
      setBottles(res.data.bottles || []);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to load bottles for wishlist.';
      setBottlesError(message);
    } finally {
      setBottlesLoading(false);
    }
  }

  async function loadWishlists() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/v1/wishlists?limit=100&offset=0');
      const data = res.data;
      setWishlists(data.wishlists || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to load wishlist.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBottles();
    loadWishlists();
  }, []);

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (!form.bottle_id) {
        setFormError('Please select a bottle.');
        setFormSubmitting(false);
        return;
      }

      const payload = {
        bottle_id: form.bottle_id,
        preferred_price: form.preferred_price
          ? Number(form.preferred_price)
          : undefined,
        notes: form.notes.trim() || undefined,
        alert_enabled: form.alert_enabled,
      };

      // POST /v1/wishlists is an upsert (create or update by bottle_id)
      const res = await api.post('/v1/wishlists', payload);
      const wl = res.data?.wishlist;
      if (wl) {
        setWishlists((prev) => {
          const filtered = prev.filter((w) => w.id !== wl.id);
          return [wl, ...filtered];
        });
        // If it was a new entry, increment total; if update, total stays same.
        if (!wishlists.some((w) => w.id === wl.id)) {
          setTotal((prev) => prev + 1);
        }
      }

      setForm(INITIAL_FORM);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to save wishlist item.';
      setFormError(message);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleToggleAlert(wl) {
    try {
      const res = await api.patch(`/v1/wishlists/${wl.id}`, {
        alert_enabled: !wl.alert_enabled,
      });
      const updated = res.data?.wishlist;
      if (updated) {
        setWishlists((prev) =>
          prev.map((w) => (w.id === updated.id ? updated : w))
        );
      }
    } catch (err) {
      console.error(err);
      // light touch: no modal, just log
    }
  }

  async function handleDelete(wl) {
    const confirm = window.confirm(
      `Remove "${wl.bottle?.name || 'this bottle'}" from your wishlist?`
    );
    if (!confirm) return;

    try {
      await api.delete(`/v1/wishlists/${wl.id}`);
      setWishlists((prev) => prev.filter((w) => w.id !== wl.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Wishlist</h1>
          <p className={styles.subtitle}>
            Track bottles you’re hunting and your target prices.
          </p>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : 'Add / Update Bottle'}
        </button>
      </div>

      {(bottlesError || bottlesLoading) && (
        <div className={styles.smallNote}>
          {bottlesLoading
            ? 'Loading bottle list...'
            : `Bottle list warning: ${bottlesError}`}
        </div>
      )}

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Add or Update Wishlist Item</h2>
          <p className={styles.formHint}>
            Selecting a bottle that’s already on your wishlist will update its
            price/notes instead of creating a duplicate.
          </p>
          {formError && <div className={styles.formError}>{formError}</div>}

          <form className={styles.form} onSubmit={handleFormSubmit}>
            <div className={styles.formRow}>
              <label className={styles.label}>
                Bottle *
                <select
                  name="bottle_id"
                  className={styles.input}
                  value={form.bottle_id}
                  onChange={handleFormChange}
                  disabled={bottlesLoading || !!bottlesError}
                >
                  <option value="">
                    {bottles.length === 0
                      ? 'No bottles available'
                      : 'Select a bottle'}
                  </option>
                  {bottles.map((bottle) => (
                    <option key={bottle.id} value={bottle.id}>
                      {bottle.name}
                      {bottle.brand ? ` — ${bottle.brand}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>
                Target Price
                <input
                  className={styles.input}
                  type="number"
                  step="0.01"
                  name="preferred_price"
                  value={form.preferred_price}
                  onChange={handleFormChange}
                  placeholder="e.g. 60.00"
                />
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="alert_enabled"
                  checked={form.alert_enabled}
                  onChange={handleFormChange}
                />
                Enable alerts
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>
                Notes
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  name="notes"
                  rows={3}
                  value={form.notes}
                  onChange={handleFormChange}
                  placeholder="Store preferences, variants, or other hunt details..."
                />
              </label>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Saving...' : 'Save Wishlist Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className={styles.message}>Loading wishlist...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && wishlists.length === 0 && (
        <div className={styles.message}>
          No wishlist items yet. Your wallet thanks you.
        </div>
      )}

      {!loading && !error && wishlists.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bottle</th>
                <th>Brand</th>
                <th>Type</th>
                <th>Target Price</th>
                <th>Alerts</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {wishlists.map((wl) => (
                <tr key={wl.id}>
                  <td>{wl.bottle?.name || 'Unknown'}</td>
                  <td>{wl.bottle?.brand || '—'}</td>
                  <td>{wl.bottle?.type || '—'}</td>
                  <td>
                    {wl.preferred_price != null
                      ? `$${Number(wl.preferred_price).toFixed(2)}`
                      : '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={
                        wl.alert_enabled
                          ? styles.alertButtonOn
                          : styles.alertButtonOff
                      }
                      onClick={() => handleToggleAlert(wl)}
                    >
                      {wl.alert_enabled ? 'On' : 'Off'}
                    </button>
                  </td>
                  <td className={styles.notesCell}>
                    {wl.notes || '—'}
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => handleDelete(wl)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <div className={styles.count}>
          {total} wishlist item{total === 1 ? '' : 's'}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;
