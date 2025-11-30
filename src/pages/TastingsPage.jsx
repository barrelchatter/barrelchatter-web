import React, { useEffect, useState } from 'react';
import api from '../api/client';
import styles from '../styles/TastingsPage.module.scss';

const INITIAL_FORM = {
  inventory_id: '',
  pour_amount_oz: '',
  rating: '',
  notes: '',
  shared_scope: 'private',
};

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function TastingsPage() {
  const [tastings, setTastings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState('');

  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState('');

  // Filters
  const [inventoryFilter, setInventoryFilter] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  async function loadInventory() {
    setInventoryLoading(true);
    setInventoryError('');
    try {
      const res = await api.get('/v1/inventory?limit=200&offset=0');
      setInventoryOptions(res.data.inventory || []);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to load inventory list.';
      setInventoryError(message);
    } finally {
      setInventoryLoading(false);
    }
  }

  async function loadTastings({ showSpinner = true } = {}) {
    if (showSpinner) {
      setLoading(true);
    } else {
      setLoadingList(true);
    }
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('limit', 100);
      params.set('offset', 0);

      if (inventoryFilter) params.set('inventory_id', inventoryFilter);
      if (minRating) params.set('min_rating', String(minRating));
      if (maxRating) params.set('max_rating', String(maxRating));

      const res = await api.get(`/v1/tastings?${params.toString()}`);
      const data = res.data;

      setTastings(data.tastings || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to load tastings.';
      setError(message);
    } finally {
      setLoading(false);
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadInventory();
    loadTastings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterSubmit(e) {
    e.preventDefault();
    loadTastings({ showSpinner: false });
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (!form.inventory_id) {
        setFormError('Please choose a bottle from your inventory.');
        setFormSubmitting(false);
        return;
      }

      const payload = {
        inventory_id: form.inventory_id,
        pour_amount_oz: form.pour_amount_oz
          ? Number(form.pour_amount_oz)
          : undefined,
        rating: form.rating ? Number(form.rating) : undefined,
        notes: form.notes.trim() || undefined,
        shared_scope: form.shared_scope || 'private',
      };

      const res = await api.post('/v1/tastings', payload);
      const created = res.data?.tasting;

      if (created) {
        setTastings((prev) => [created, ...prev]);
        setTotal((prev) => prev + 1);
      }

      setForm(INITIAL_FORM);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to save tasting.';
      setFormError(message);
    } finally {
      setFormSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Tastings</h1>
          <p className={styles.subtitle}>
            Track pours, ratings, and notes from your collection.
          </p>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : 'Add Tasting'}
        </button>
      </div>

      <div className={styles.toolbar}>
        <form className={styles.filterRow} onSubmit={handleFilterSubmit}>
          <select
            className={styles.select}
            value={inventoryFilter}
            onChange={(e) => setInventoryFilter(e.target.value)}
            disabled={inventoryLoading || inventoryError}
          >
            <option value="">All inventory</option>
            {inventoryOptions.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.bottle?.name || 'Unknown'} &mdash; {inv.location_label}
              </option>
            ))}
          </select>

          <input
            className={styles.ratingInput}
            type="number"
            step="0.1"
            placeholder="Min rating"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
          />
          <input
            className={styles.ratingInput}
            type="number"
            step="0.1"
            placeholder="Max rating"
            value={maxRating}
            onChange={(e) => setMaxRating(e.target.value)}
          />
          <button
            type="submit"
            className={styles.filterButton}
            disabled={loadingList}
          >
            {loadingList ? 'Filtering...' : 'Apply'}
          </button>
        </form>
        <div className={styles.count}>
          {total} tasting{total === 1 ? '' : 's'}
        </div>
      </div>

      {inventoryError && (
        <div className={styles.error}>
          Inventory warning: {inventoryError}
        </div>
      )}

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Add Tasting</h2>
          {formError && <div className={styles.formError}>{formError}</div>}
          <form className={styles.form} onSubmit={handleFormSubmit}>
            <div className={styles.formRow}>
              <label className={styles.label}>
                Inventory Item *
                <select
                  name="inventory_id"
                  className={styles.input}
                  value={form.inventory_id}
                  onChange={handleFormChange}
                >
                  <option value="">
                    {inventoryOptions.length === 0
                      ? 'No inventory available'
                      : 'Select a bottle'}
                  </option>
                  {inventoryOptions.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.bottle?.name || 'Unknown'} &mdash;{' '}
                      {inv.location_label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>
                Pour (oz)
                <input
                  className={styles.input}
                  type="number"
                  step="0.1"
                  name="pour_amount_oz"
                  value={form.pour_amount_oz}
                  onChange={handleFormChange}
                  placeholder="e.g. 1.5"
                />
              </label>
              <label className={styles.label}>
                Rating
                <input
                  className={styles.input}
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  name="rating"
                  value={form.rating}
                  onChange={handleFormChange}
                  placeholder="0–5"
                />
              </label>
              <label className={styles.label}>
                Visibility
                <select
                  name="shared_scope"
                  className={styles.input}
                  value={form.shared_scope}
                  onChange={handleFormChange}
                >
                  <option value="private">Private</option>
                  <option value="friends">Friends</option>
                  <option value="group">Group</option>
                  <option value="public">Public</option>
                </select>
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
                  placeholder="Tasting notes, impressions, who you shared it with..."
                />
              </label>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Saving...' : 'Save Tasting'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className={styles.message}>Loading tastings...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && tastings.length === 0 && (
        <div className={styles.message}>No tastings yet. Time to pour.</div>
      )}

      {!loading && !error && tastings.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Bottle</th>
                <th>Location</th>
                <th>Pour (oz)</th>
                <th>Rating</th>
                <th>Visibility</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {tastings.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.created_at)}</td>
                  <td>{t.bottle?.name || 'Unknown'}</td>
                  <td>{t.inventory?.location_label || '—'}</td>
                  <td>
                    {t.pour_amount_oz != null ? t.pour_amount_oz : '—'}
                  </td>
                  <td>{t.rating != null ? t.rating : '—'}</td>
                  <td>{t.shared_scope || 'private'}</td>
                  <td className={styles.notesCell}>
                    {t.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TastingsPage;
