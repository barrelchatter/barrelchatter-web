import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import LogTastingModal from '../components/LogTastingModal';
import styles from '../styles/TastingsPage.module.scss';

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatPour(oz) {
  if (oz == null) return '—';
  const num = Number(oz);
  if (Number.isNaN(num)) return '—';
  return `${num} oz`;
}

function formatRating(r) {
  if (r == null) return '—';
  const num = Number(r);
  if (Number.isNaN(num)) return '—';
  return num;
}

const INITIAL_EDIT_FORM = {
  pour_amount_oz: '',
  rating: '',
  notes: '',
};

function TastingsPage() {
  const [tastings, setTastings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM);
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Log tasting modal
  const [showLogModal, setShowLogModal] = useState(false);

  async function loadTastings() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/v1/tastings?limit=100&offset=0');
      const data = res.data || {};
      const list = data.tastings || [];
      setTastings(list);
      setTotal(typeof data.total === 'number' ? data.total : list.length);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        'Failed to load tastings. Is the API running?';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTastings();
  }, []);

  function startEdit(t) {
    setEditingId(t.id);
    setEditError('');
    setEditForm({
      pour_amount_oz:
        t.pour_amount_oz != null ? String(t.pour_amount_oz) : '',
      rating: t.rating != null ? String(t.rating) : '',
      notes: t.notes || '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(INITIAL_EDIT_FORM);
    setEditError('');
    setEditSubmitting(false);
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editingId) return;

    setEditSubmitting(true);
    setEditError('');

    try {
      const payload = {};

      if (editForm.pour_amount_oz !== '') {
        payload.pour_amount_oz = Number(editForm.pour_amount_oz);
      } else {
        payload.pour_amount_oz = null;
      }

      if (editForm.rating !== '') {
        payload.rating = Number(editForm.rating);
      } else {
        payload.rating = null;
      }

      payload.notes = editForm.notes ?? '';

      await api.patch(`/v1/tastings/${editingId}`, payload);

      await loadTastings();
      cancelEdit();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        'Failed to update tasting.';
      setEditError(msg);
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(t) {
    const confirmDelete = window.confirm(
      'Delete this tasting? This cannot be undone.'
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/v1/tastings/${t.id}`);
      setTastings((prev) => prev.filter((x) => x.id !== t.id));
      setTotal((prev) => Math.max(0, prev - 1));
      if (editingId === t.id) {
        cancelEdit();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Tastings</h1>
          <p className={styles.subtitle}>
            Your tasting history across bottles and locations.
          </p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.count}>
            {total} tasting{total === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setShowLogModal(true)}
          >
            Log Tasting
          </button>
        </div>
      </div>

      {loading && (
        <div className={styles.message}>Loading tastings...</div>
      )}
      {error && !loading && (
        <div className={styles.error}>{error}</div>
      )}

      {!loading && !error && tastings.length === 0 && (
        <div className={styles.message}>
          No tastings logged yet. Time to fix that.
        </div>
      )}

      {!loading && !error && tastings.length > 0 && (
        <div className={styles.tableWrapper}>
          <form onSubmit={handleEditSubmit}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bottle</th>
                  <th>Location</th>
                  <th>Pour</th>
                  <th>Rating</th>
                  <th>Notes</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tastings.map((t) => {
                  const isEditing = editingId === t.id;
                  const bottle = t.bottle || {};
                  const inventory = t.inventory || {};

                  return (
                    <tr key={t.id}>
                      <td>{formatDateTime(t.created_at)}</td>
                      <td>
                        {bottle.id ? (
                          <Link
                            to={`/app/bottles/${bottle.id}`}
                            className={styles.nameLink}
                          >
                            {bottle.name || 'Unknown bottle'}
                          </Link>
                        ) : (
                          bottle.name || 'Unknown bottle'
                        )}
                        <div className={styles.subRow}>
                          {bottle.brand || 'Unknown Brand'}
                          {bottle.type ? ` • ${bottle.type}` : ''}
                        </div>
                      </td>
                      <td>{inventory.location_label || '—'}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.25"
                            name="pour_amount_oz"
                            className={styles.editInput}
                            value={editForm.pour_amount_oz}
                            onChange={handleEditChange}
                            placeholder="oz"
                          />
                        ) : (
                          formatPour(t.pour_amount_oz)
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            name="rating"
                            className={styles.editInput}
                            value={editForm.rating}
                            onChange={handleEditChange}
                            placeholder="0–10"
                          />
                        ) : (
                          formatRating(t.rating)
                        )}
                      </td>
                      <td className={styles.notesCell}>
                        {isEditing ? (
                          <textarea
                            name="notes"
                            className={`${styles.editInput} ${styles.editTextarea}`}
                            rows={2}
                            value={editForm.notes}
                            onChange={handleEditChange}
                          />
                        ) : (
                          t.notes || '—'
                        )}
                      </td>
                      <td className={styles.actionsCell}>
                        {isEditing ? (
                          <div className={styles.rowActions}>
                            <button
                              type="submit"
                              className={styles.saveButton}
                              disabled={editSubmitting}
                            >
                              {editSubmitting ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className={styles.cancelButton}
                              onClick={cancelEdit}
                              disabled={editSubmitting}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className={styles.rowActions}>
                            <button
                              type="button"
                              className={styles.smallButton}
                              onClick={() => startEdit(t)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className={styles.smallDangerButton}
                              onClick={() => handleDelete(t)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {editingId && editError && (
              <div className={styles.formError}>{editError}</div>
            )}
          </form>
        </div>
      )}

      <LogTastingModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onCreated={() => {
          // Re-load tastings after logging a new one
          loadTastings();
        }}
      />
    </div>
  );
}

export default TastingsPage;
