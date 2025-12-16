import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../api/client';
import styles from '../styles/InventoryDetailPage.module.scss';

const apiBase = (API_BASE_URL || '').replace(/\/$/, '');

function resolveImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${apiBase}${path}`;
}

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatPrice(value) {
  if (value == null) return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return `$${num.toFixed(2)}`;
}

function formatStatus(status) {
  if (!status) return '—';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatIdentity(inv) {
  if (!inv) return '—';
  if (inv.bottle_serial_label) return inv.bottle_serial_label;
  if (inv.bottle_number != null && inv.bottle_total != null) {
    return `Bottle ${inv.bottle_number}/${inv.bottle_total}`;
  }
  if (inv.bottle_number != null) {
    return `Bottle ${inv.bottle_number}`;
  }
  return '—';
}

const STATUS_OPTIONS = ['sealed', 'open', 'finished', 'sample'];

function InventoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [bottle, setBottle] = useState(null);
  const [tastings, setTastings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    location_label: '',
    status: 'sealed',
    bottle_serial_label: '',
    bottle_number: '',
    bottle_total: '',
    price_paid: '',
  });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        // Load all inventory and tastings (same pattern as before)
        const [invRes, tastRes] = await Promise.all([
          api.get('/v1/inventory?limit=100&offset=0'),
          api.get('/v1/tastings?limit=100&offset=0'),
        ]);

        if (!isMounted) return;

        const allInv = invRes.data?.inventory || [];
        const found = allInv.find((inv) => inv.id === id);

        if (!found) {
          setError('Inventory item not found.');
          setItem(null);
          setBottle(null);
          setTastings([]);
          return;
        }

        setItem(found);
        setBottle(found.bottle || null);

        const allTastings = tastRes.data?.tastings || [];
        const relevant = allTastings.filter(
          (t) => t.inventory && t.inventory.id === id
        );
        setTastings(relevant);

        // Optionally hydrate bottle with full data (including photos)
        if (found.bottle?.id) {
          try {
            const bRes = await api.get(`/v1/bottles/${found.bottle.id}`);
            if (!isMounted) return;
            const fullBottle = bRes.data?.bottle || null;
            if (fullBottle) setBottle(fullBottle);
          } catch (bErr) {
            console.error('Failed to load full bottle details', bErr);
          }
        }
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        const msg =
          err?.response?.data?.error ||
          'Failed to load inventory details.';
        setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Sync edit form whenever the item changes
  useEffect(() => {
    if (!item) return;
    setEditForm({
      location_label: item.location_label || '',
      status: item.status || 'sealed',
      bottle_serial_label: item.bottle_serial_label || '',
      bottle_number:
        item.bottle_number != null ? String(item.bottle_number) : '',
      bottle_total:
        item.bottle_total != null ? String(item.bottle_total) : '',
      price_paid:
        item.price_paid != null ? String(item.price_paid) : '',
    });
  }, [item]);

  const stats = useMemo(() => {
    if (!tastings || tastings.length === 0) {
      return {
        count: 0,
        totalOz: 0,
        lastDate: null,
      };
    }
    let totalOz = 0;
    let lastDate = null;
    tastings.forEach((t) => {
      if (t.pour_amount_oz != null) {
        const n = Number(t.pour_amount_oz);
        if (!Number.isNaN(n)) totalOz += n;
      }
      if (t.created_at) {
        const d = new Date(t.created_at);
        if (!lastDate || d > lastDate) lastDate = d;
      }
    });
    return {
      count: tastings.length,
      totalOz,
      lastDate,
    };
  }, [tastings]);

  const identityLabel = item ? formatIdentity(item) : '—';

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleEditCancel() {
    setEditError('');
    setEditMode(false);
    // reset back to current item
    if (item) {
      setEditForm({
        location_label: item.location_label || '',
        status: item.status || 'sealed',
        bottle_serial_label: item.bottle_serial_label || '',
        bottle_number:
          item.bottle_number != null ? String(item.bottle_number) : '',
        bottle_total:
          item.bottle_total != null ? String(item.bottle_total) : '',
        price_paid:
          item.price_paid != null ? String(item.price_paid) : '',
      });
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError('');

    try {
      const payload = {
        location_label: editForm.location_label.trim() || null,
        status: editForm.status || null,
        bottle_serial_label:
          editForm.bottle_serial_label.trim() || null,
        bottle_number: editForm.bottle_number
          ? Number(editForm.bottle_number)
          : null,
        bottle_total: editForm.bottle_total
          ? Number(editForm.bottle_total)
          : null,
        price_paid: editForm.price_paid
          ? Number(editForm.price_paid)
          : null,
      };

      const res = await api.patch(`/v1/inventory/${id}`, payload);
      const updated = res.data?.inventory;

      if (updated) {
        // Merge updated fields into current item, keep bottle reference
        setItem((prev) => ({
          ...(prev || {}),
          ...updated,
        }));
      }

      setEditMode(false);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        'Failed to update inventory item.';
      setEditError(msg);
    } finally {
      setEditSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <div className={styles.headerTitleBlock}>
          <span className={styles.headerBreadcrumb}>
            <Link
              to="/app/inventory"
              className={styles.breadcrumbLink}
            >
              Inventory
            </Link>{' '}
            / Details
          </span>
        </div>
      </div>

      {loading && (
        <div className={styles.message}>Loading inventory...</div>
      )}

      {error && !loading && (
        <div className={styles.error}>{error}</div>
      )}

      {!loading && !error && item && (
        <>
          <div className={styles.topRow}>
            <div className={styles.mainCard}>
              <div className={styles.mainCardHeader}>
                <div className={styles.mainCardHeaderTitle}>
                  Inventory Item
                </div>
                <div>
                  {!editMode ? (
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => setEditMode(true)}
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.editButtonSecondary}
                      onClick={handleEditCancel}
                      disabled={editSubmitting}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.heroRow}>
                <div className={styles.heroImageWrap}>
                  {bottle?.primary_photo_url ? (
                    <img
                      src={resolveImageUrl(bottle.primary_photo_url)}
                      alt={bottle.name}
                      className={styles.heroImage}
                    />
                  ) : (
                    <div className={styles.heroPlaceholder}>
                      <span>
                        {(bottle?.name || 'B')
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles.heroText}>
                  <h1 className={styles.title}>
                    {bottle?.name || 'Unknown bottle'}
                  </h1>
                  <div className={styles.subtitle}>
                    {bottle?.brand || 'Unknown Brand'}
                    {bottle?.type ? ` • ${bottle.type}` : ''}
                  </div>
                  {bottle?.release_name && (
                    <div className={styles.releaseName}>
                      {bottle.release_name}
                    </div>
                  )}
                  <div className={styles.heroLinks}>
                    {bottle?.id && (
                      <Link
                        to={`/app/bottles/${bottle.id}`}
                        className={styles.bottleLink}
                      >
                        View bottle details →
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {!editMode && (
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Location</div>
                    <div className={styles.infoValue}>
                      {item.location_label || '—'}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Status</div>
                    <div className={styles.infoValue}>
                      <span className={styles.statusBadge}>
                        {formatStatus(item.status)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Identity</div>
                    <div className={styles.infoValue}>
                      <span className={styles.identityBadge}>
                        {identityLabel}
                      </span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Price Paid</div>
                    <div className={styles.infoValue}>
                      {formatPrice(item.price_paid)}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Created</div>
                    <div className={styles.infoValue}>
                      {formatDateTime(item.created_at)}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      Last Updated
                    </div>
                    <div className={styles.infoValue}>
                      {formatDateTime(item.updated_at)}
                    </div>
                  </div>
                </div>
              )}

              {editMode && (
                <form
                  className={styles.editForm}
                  onSubmit={handleEditSubmit}
                >
                  {editError && (
                    <div className={styles.editError}>
                      {editError}
                    </div>
                  )}

                  <div className={styles.editRow}>
                    <label className={styles.editLabel}>
                      Location
                      <input
                        type="text"
                        name="location_label"
                        className={styles.editInput}
                        value={editForm.location_label}
                        onChange={handleEditChange}
                      />
                    </label>
                  </div>

                  <div className={styles.editRow}>
                    <label className={styles.editLabel}>
                      Status
                      <select
                        name="status"
                        className={styles.editSelect}
                        value={editForm.status || ''}
                        onChange={handleEditChange}
                      >
                        <option value="">(none)</option>
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() +
                              s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className={styles.editRow}>
                    <label className={styles.editLabel}>
                      Identity Label
                      <input
                        type="text"
                        name="bottle_serial_label"
                        className={styles.editInput}
                        value={editForm.bottle_serial_label}
                        onChange={handleEditChange}
                        placeholder="e.g. Bottle 36 of 125"
                      />
                    </label>
                  </div>

                  <div className={styles.editRow}>
                    <label className={styles.editLabel}>
                      Bottle Number
                      <input
                        type="number"
                        name="bottle_number"
                        className={styles.editInput}
                        value={editForm.bottle_number}
                        onChange={handleEditChange}
                      />
                    </label>
                    <label className={styles.editLabel}>
                      Total Bottles in Release
                      <input
                        type="number"
                        name="bottle_total"
                        className={styles.editInput}
                        value={editForm.bottle_total}
                        onChange={handleEditChange}
                      />
                    </label>
                  </div>

                  <div className={styles.editRow}>
                    <label className={styles.editLabel}>
                      Price Paid
                      <input
                        type="number"
                        step="0.01"
                        name="price_paid"
                        className={styles.editInput}
                        value={editForm.price_paid}
                        onChange={handleEditChange}
                      />
                    </label>
                  </div>

                  <div className={styles.editActions}>
                    <button
                      type="submit"
                      className={styles.editSaveButton}
                      disabled={editSubmitting}
                    >
                      {editSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className={styles.sideCard}>
              <h2 className={styles.sideTitle}>Pour Stats</h2>
              <div className={styles.sideStat}>
                <div className={styles.sideStatLabel}>
                  Total tastings
                </div>
                <div className={styles.sideStatValue}>
                  {stats.count}
                </div>
              </div>
              <div className={styles.sideStat}>
                <div className={styles.sideStatLabel}>
                  Total poured
                </div>
                <div className={styles.sideStatValue}>
                  {stats.totalOz
                    ? `${stats.totalOz.toFixed(1)} oz`
                    : '—'}
                </div>
              </div>
              <div className={styles.sideStat}>
                <div className={styles.sideStatLabel}>
                  Last tasting
                </div>
                <div className={styles.sideStatValue}>
                  {stats.lastDate
                    ? stats.lastDate.toLocaleString()
                    : '—'}
                </div>
              </div>
              <div className={styles.sideActions}>
                <Link
                  to="/app/tastings"
                  className={styles.sideButton}
                >
                  View all tastings
                </Link>
              </div>
              <div className={styles.sideNote}>
                All stats and the table below are specific to this exact
                bottle instance.
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Logged Tastings</h2>
              <span className={styles.sectionCount}>
                {tastings.length} tasting
                {tastings.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className={styles.tableWrapper}>
              {tastings.length === 0 ? (
                <div className={styles.message}>
                  No tastings logged from this bottle yet.
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Pour (oz)</th>
                      <th>Rating</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tastings.map((t) => (
                      <tr key={t.id}>
                        <td>{formatDateTime(t.created_at)}</td>
                        <td>
                          {t.pour_amount_oz != null
                            ? t.pour_amount_oz
                            : '—'}
                        </td>
                        <td>
                          {t.rating != null ? t.rating : '—'}
                        </td>
                        <td className={styles.notesCell}>
                          {t.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default InventoryDetailPage;
