import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../api/client';
import StorageLocationSelect from '../components/StorageLocationSelect';
import PurchaseLocationSelect from '../components/PurchaseLocationSelect';
import DealBadge from '../components/DealBadge';
import BottlePricingCard from '../components/BottlePricingCard';
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

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
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

function formatLocation(inv) {
  if (inv?.storage_location?.name) {
    return inv.storage_location.full_path || inv.storage_location.name;
  }
  return inv?.location_label || '—';
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

  // Pricing data (Migration 011)
  const [pricingData, setPricingData] = useState(null);

  // edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    storage_location_id: null,
    location_label: '',
    purchase_location_id: null,
    purchase_store: '',
    purchase_city: '',
    purchase_state: '',
    status: 'sealed',
    bottle_serial_label: '',
    bottle_number: '',
    bottle_total: '',
    price_paid: '',
    purchase_date: '', // Migration 011
  });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Calculate deal analysis (Migration 011)
  const dealAnalysis = useMemo(() => {
    if (!item?.price_paid || item.price_paid <= 0) return null;
    if (!pricingData?.pricing?.avg_price) return null;

    const userPrice = Number(item.price_paid);
    const avgPrice = Number(pricingData.pricing.avg_price);
    const msrp = pricingData.bottle?.msrp ? Number(pricingData.bottle.msrp) : null;

    const vsAvgPct = ((userPrice / avgPrice) - 1) * 100;
    const vsMsrpPct = msrp ? ((userPrice / msrp) - 1) * 100 : null;

    return { vsAvgPct, vsMsrpPct, avgPrice, msrp };
  }, [item, pricingData]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
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

        // Load pricing data (Migration 011)
        if (found.bottle?.id) {
          try {
            const pricingRes = await api.get(`/v1/pricing/bottles/${found.bottle.id}?months=12&min_samples=3`);
            if (isMounted) setPricingData(pricingRes.data);
          } catch (pErr) {
            console.error('Failed to load pricing data', pErr);
          }

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

  useEffect(() => {
    if (!item) return;
    setEditForm({
      storage_location_id: item.storage_location_id || null,
      location_label: item.location_label || '',
      purchase_location_id: item.purchase_location_id || null,
      purchase_store: item.purchase_store || '',
      purchase_city: item.purchase_city || '',
      purchase_state: item.purchase_state || '',
      status: item.status || 'sealed',
      bottle_serial_label: item.bottle_serial_label || '',
      bottle_number:
        item.bottle_number != null ? String(item.bottle_number) : '',
      bottle_total:
        item.bottle_total != null ? String(item.bottle_total) : '',
      price_paid:
        item.price_paid != null ? String(item.price_paid) : '',
      purchase_date: item.purchase_date || '', // Migration 011
    });
  }, [item]);

  const stats = useMemo(() => {
    if (!tastings || tastings.length === 0) {
      return { count: 0, totalOz: 0, lastDate: null };
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
    return { count: tastings.length, totalOz, lastDate };
  }, [tastings]);

  const identityLabel = item ? formatIdentity(item) : '—';

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleStorageLocationChange(locationId) {
    setEditForm((prev) => ({
      ...prev,
      storage_location_id: locationId,
      location_label: locationId ? '' : prev.location_label,
    }));
  }

  function handleLegacyLocationChange(value) {
    setEditForm((prev) => ({
      ...prev,
      location_label: value,
      storage_location_id: null,
    }));
  }

  function handlePurchaseLocationChange(locationId) {
    setEditForm((prev) => ({
      ...prev,
      purchase_location_id: locationId,
      purchase_store: locationId ? '' : prev.purchase_store,
      purchase_city: locationId ? '' : prev.purchase_city,
      purchase_state: locationId ? '' : prev.purchase_state,
    }));
  }

  function handleLegacyPurchaseChange({ store, city, state }) {
    setEditForm((prev) => ({
      ...prev,
      purchase_store: store,
      purchase_city: city,
      purchase_state: state,
      purchase_location_id: null,
    }));
  }

  function handleEditCancel() {
    setEditError('');
    setEditMode(false);
    if (item) {
      setEditForm({
        storage_location_id: item.storage_location_id || null,
        location_label: item.location_label || '',
        purchase_location_id: item.purchase_location_id || null,
        purchase_store: item.purchase_store || '',
        purchase_city: item.purchase_city || '',
        purchase_state: item.purchase_state || '',
        status: item.status || 'sealed',
        bottle_serial_label: item.bottle_serial_label || '',
        bottle_number:
          item.bottle_number != null ? String(item.bottle_number) : '',
        bottle_total:
          item.bottle_total != null ? String(item.bottle_total) : '',
        price_paid:
          item.price_paid != null ? String(item.price_paid) : '',
        purchase_date: item.purchase_date || '',
      });
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError('');

    try {
      const payload = {
        status: editForm.status || null,
        bottle_serial_label: editForm.bottle_serial_label.trim() || null,
        bottle_number: editForm.bottle_number
          ? Number(editForm.bottle_number)
          : null,
        bottle_total: editForm.bottle_total
          ? Number(editForm.bottle_total)
          : null,
        price_paid: editForm.price_paid
          ? Number(editForm.price_paid)
          : null,
        purchase_date: editForm.purchase_date || null, // Migration 011
      };

      if (editForm.storage_location_id) {
        payload.storage_location_id = editForm.storage_location_id;
      }

      if (editForm.location_label && editForm.location_label.trim()) {
        payload.location_label = editForm.location_label.trim();
      }

      if (editForm.purchase_location_id) {
        payload.purchase_location_id = editForm.purchase_location_id;
      }

      if (editForm.purchase_store && editForm.purchase_store.trim()) {
        payload.purchase_store = editForm.purchase_store.trim();
      }
      if (editForm.purchase_city && editForm.purchase_city.trim()) {
        payload.purchase_city = editForm.purchase_city.trim();
      }
      if (editForm.purchase_state && editForm.purchase_state.trim()) {
        payload.purchase_state = editForm.purchase_state.trim();
      }

      const res = await api.patch(`/v1/inventory/${id}`, payload);
      const updated = res.data?.inventory;

      if (updated) {
        setItem((prev) => ({ ...(prev || {}), ...updated }));
      }

      setEditMode(false);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error || 'Failed to update inventory item.';
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
            <Link to="/app/inventory" className={styles.breadcrumbLink}>
              Inventory
            </Link>{' '}
            / Details
          </span>
        </div>
      </div>

      {loading && <div className={styles.message}>Loading inventory...</div>}

      {error && !loading && <div className={styles.error}>{error}</div>}

      {!loading && !error && item && (
        <>
          <div className={styles.topRow}>
            <div className={styles.mainCard}>
              <div className={styles.mainCardHeader}>
                <div className={styles.mainCardHeaderTitle}>Inventory Item</div>
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
                        {(bottle?.name || 'B').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.heroInfo}>
                  <h1 className={styles.heroTitle}>
                    {bottle?.name || 'Unknown bottle'}
                  </h1>
                  <div className={styles.heroSub}>
                    {bottle?.brand || 'Unknown Brand'}
                    {bottle?.type ? ` • ${bottle.type}` : ''}
                  </div>
                  {bottle?.id && (
                    <Link
                      to={`/app/bottles/${bottle.id}`}
                      className={styles.heroBottleLink}
                    >
                      View bottle details →
                    </Link>
                  )}
                </div>
              </div>

              {editError && (
                <div className={styles.editError}>{editError}</div>
              )}

              {editMode ? (
                <form className={styles.editForm} onSubmit={handleEditSubmit}>
                  <div className={styles.editGrid}>
                    <label className={styles.editLabel}>
                      Storage Location
                      <StorageLocationSelect
                        value={editForm.storage_location_id}
                        onChange={handleStorageLocationChange}
                        showLegacy={true}
                        legacyValue={editForm.location_label}
                        onLegacyChange={handleLegacyLocationChange}
                      />
                    </label>

                    <label className={styles.editLabel}>
                      Purchase Location
                      <PurchaseLocationSelect
                        value={editForm.purchase_location_id}
                        onChange={handlePurchaseLocationChange}
                        inventoryId={id}
                        showLegacy={true}
                        legacyStore={editForm.purchase_store}
                        legacyCity={editForm.purchase_city}
                        legacyState={editForm.purchase_state}
                        onLegacyChange={handleLegacyPurchaseChange}
                      />
                    </label>

                    <label className={styles.editLabel}>
                      Status
                      <select
                        name="status"
                        value={editForm.status}
                        onChange={handleEditChange}
                        className={styles.editInput}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.editLabel}>
                      Bottle Serial Label
                      <input
                        type="text"
                        name="bottle_serial_label"
                        value={editForm.bottle_serial_label}
                        onChange={handleEditChange}
                        className={styles.editInput}
                        placeholder="e.g., Barrel #123"
                      />
                    </label>

                    <label className={styles.editLabel}>
                      Bottle Number
                      <input
                        type="number"
                        name="bottle_number"
                        value={editForm.bottle_number}
                        onChange={handleEditChange}
                        className={styles.editInput}
                        placeholder="e.g., 42"
                      />
                    </label>

                    <label className={styles.editLabel}>
                      Bottle Total
                      <input
                        type="number"
                        name="bottle_total"
                        value={editForm.bottle_total}
                        onChange={handleEditChange}
                        className={styles.editInput}
                        placeholder="e.g., 200"
                      />
                    </label>

                    <label className={styles.editLabel}>
                      Price Paid
                      <input
                        type="number"
                        step="0.01"
                        name="price_paid"
                        value={editForm.price_paid}
                        onChange={handleEditChange}
                        className={styles.editInput}
                        placeholder="e.g., 59.99"
                      />
                    </label>

                    {/* Purchase Date (Migration 011) */}
                    <label className={styles.editLabel}>
                      Purchase Date
                      <input
                        type="date"
                        name="purchase_date"
                        value={editForm.purchase_date}
                        onChange={handleEditChange}
                        className={styles.editInput}
                      />
                    </label>
                  </div>

                  <div className={styles.editActions}>
                    <button
                      type="button"
                      className={styles.editButtonSecondary}
                      onClick={handleEditCancel}
                      disabled={editSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.editButton}
                      disabled={editSubmitting}
                    >
                      {editSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Location</span>
                    <span className={styles.detailValue}>
                      {formatLocation(item)}
                      {item.storage_location && (
                        <span className={styles.locationIcon} title="Linked to storage location">
                          📍
                        </span>
                      )}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Status</span>
                    <span className={styles.detailValue}>
                      {formatStatus(item.status)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Identity</span>
                    <span className={styles.detailValue}>{identityLabel}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Price Paid</span>
                    <span className={styles.detailValue}>
                      {formatPrice(item.price_paid)}
                      {/* Deal badge (Migration 011) */}
                      {dealAnalysis && (
                        <DealBadge
                          priceVsAvgPct={dealAnalysis.vsAvgPct}
                          priceVsMsrpPct={dealAnalysis.vsMsrpPct}
                          size="sm"
                        />
                      )}
                    </span>
                  </div>
                  {/* Purchase Date (Migration 011) */}
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Purchased</span>
                    <span className={styles.detailValue}>
                      {formatDate(item.purchase_date)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Added</span>
                    <span className={styles.detailValue}>
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>
                  {item.opened_at && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Opened</span>
                      <span className={styles.detailValue}>
                        {formatDateTime(item.opened_at)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.sideColumn}>
              {/* Pricing Card (Migration 011) */}
              {bottle?.id && (
                <BottlePricingCard
                  bottleId={bottle.id}
                  userPricePaid={item.price_paid ? Number(item.price_paid) : null}
                  compact
                />
              )}

              <div className={styles.statsCard}>
                <div className={styles.statsCardTitle}>Tasting Stats</div>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.count}</span>
                    <span className={styles.statLabel}>Tastings</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>
                      {stats.totalOz.toFixed(1)} oz
                    </span>
                    <span className={styles.statLabel}>Total Poured</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>
                      {stats.lastDate
                        ? stats.lastDate.toLocaleDateString()
                        : '—'}
                    </span>
                    <span className={styles.statLabel}>Last Tasting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Tasting History</h2>
            </div>
            {tastings.length === 0 ? (
              <div className={styles.noData}>
                No tastings recorded for this bottle yet.
              </div>
            ) : (
              <div className={styles.tastingList}>
                {tastings.map((t) => (
                  <div key={t.id} className={styles.tastingRow}>
                    <div className={styles.tastingDate}>
                      {formatDateTime(t.created_at)}
                    </div>
                    <div className={styles.tastingDetails}>
                      {t.pour_amount_oz != null && (
                        <span className={styles.tastingChip}>
                          {t.pour_amount_oz} oz
                        </span>
                      )}
                      {t.rating != null && (
                        <span className={styles.tastingChip}>
                          ★ {t.rating}
                        </span>
                      )}
                    </div>
                    {t.notes && (
                      <div className={styles.tastingNotes}>{t.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default InventoryDetailPage;
