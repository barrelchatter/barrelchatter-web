import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../api/client';
import styles from '../styles/InventoryPage.module.scss';

const apiBase = (API_BASE_URL || '').replace(/\/$/, '');
function resolveImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${apiBase}${path}`;
}

function formatStatus(status) {
  if (!status) return '—';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatPrice(value) {
  if (value == null) return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return `$${num.toFixed(2)}`;
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

function InventoryPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list'); // list | cards | gallery

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/v1/inventory?limit=500&offset=0');
        const data = res.data || {};
        const list = data.inventory || [];
        setItems(list);
        setTotal(
          typeof data.total === 'number' ? data.total : list.length
        );
      } catch (err) {
        console.error(err);
        const msg =
          err?.response?.data?.error ||
          'Failed to load inventory. Is the API running?';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Inventory</h1>
          <p className={styles.subtitle}>
            Your physical bottles across all locations.
          </p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.count}>
            {total} item{total === 1 ? '' : 's'}
          </span>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={
                viewMode === 'list'
                  ? styles.viewModeButtonActive
                  : styles.viewModeButton
              }
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              type="button"
              className={
                viewMode === 'cards'
                  ? styles.viewModeButtonActive
                  : styles.viewModeButton
              }
              onClick={() => setViewMode('cards')}
            >
              Cards
            </button>
            <button
              type="button"
              className={
                viewMode === 'gallery'
                  ? styles.viewModeButtonActive
                  : styles.viewModeButton
              }
              onClick={() => setViewMode('gallery')}
            >
              Gallery
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className={styles.message}>Loading inventory...</div>
      )}
      {error && !loading && (
        <div className={styles.error}>{error}</div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className={styles.message}>
          No inventory items yet. Add bottles from the Bottles page.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          {viewMode === 'list' && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Bottle</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Identity</th>
                    <th>Price Paid</th>
                    <th>Links</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((inv) => {
                    const bottle = inv.bottle || {};
                    return (
                      <tr key={inv.id}>
                        <td>
                          <Link
                            to={`/app/inventory/${inv.id}`}
                            className={styles.nameLink}
                          >
                            {bottle.name || 'Unknown bottle'}
                          </Link>
                          <div className={styles.subRow}>
                            {bottle.brand || 'Unknown Brand'}
                            {bottle.type
                              ? ` • ${bottle.type}`
                              : ''}
                          </div>
                        </td>
                        <td>{formatStatus(inv.status)}</td>
                        <td>{inv.location_label || '—'}</td>
                        <td>{formatIdentity(inv)}</td>
                        <td>{formatPrice(inv.price_paid)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <Link
                              to={`/app/inventory/${inv.id}`}
                              className={styles.smallLinkButton}
                            >
                              Inventory
                            </Link>
                            {bottle.id && (
                              <Link
                                to={`/app/bottles/${bottle.id}`}
                                className={styles.smallLinkButton}
                              >
                                Bottle
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'cards' && (
            <div className={styles.cardGrid}>
              {items.map((inv) => {
                const bottle = inv.bottle || {};
                const identity = formatIdentity(inv);
                return (
                  <div key={inv.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.cardTitle}>
                          <Link
                            to={`/app/inventory/${inv.id}`}
                            className={styles.nameLink}
                          >
                            {bottle.name || 'Unknown bottle'}
                          </Link>
                        </div>
                        <div className={styles.cardSubtitle}>
                          {bottle.brand || 'Unknown Brand'}
                          {bottle.type
                            ? ` • ${bottle.type}`
                            : ''}
                        </div>
                      </div>
                      <div className={styles.statusPill}>
                        {formatStatus(inv.status)}
                      </div>
                    </div>
                    <div className={styles.cardMetaRow}>
                      <span>
                        <strong>Location:</strong>{' '}
                        {inv.location_label || '—'}
                      </span>
                    </div>
                    <div className={styles.cardMetaRow}>
                      <span>
                        <strong>Identity:</strong> {identity}
                      </span>
                    </div>
                    <div className={styles.cardMetaRow}>
                      <span>
                        <strong>Price:</strong>{' '}
                        {formatPrice(inv.price_paid)}
                      </span>
                    </div>
                    <div className={styles.cardActions}>
                      <Link
                        to={`/app/inventory/${inv.id}`}
                        className={styles.smallLinkButton}
                      >
                        Inventory details
                      </Link>
                      {bottle.id && (
                        <Link
                          to={`/app/bottles/${bottle.id}`}
                          className={styles.smallLinkButton}
                        >
                          Bottle details
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'gallery' && (
            <div className={styles.galleryGrid}>
              {items.map((inv) => {
                const bottle = inv.bottle || {};
                const img = bottle.primary_photo_url
                  ? resolveImageUrl(bottle.primary_photo_url)
                  : null;

                return (
                  <div
                    key={inv.id}
                    className={styles.galleryCard}
                  >
                    <div className={styles.galleryImageWrap}>
                      {img ? (
                        <img
                          src={img}
                          alt={bottle.name || 'Bottle'}
                          className={styles.galleryImage}
                        />
                      ) : (
                        <div
                          className={styles.galleryPlaceholder}
                        >
                          <span>
                            {(bottle.name || 'B')
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className={styles.galleryStatusChip}>
                        {formatStatus(inv.status)}
                      </div>
                    </div>
                    <div className={styles.galleryBody}>
                      <div className={styles.galleryTitle}>
                        <Link
                          to={`/app/inventory/${inv.id}`}
                          className={styles.nameLink}
                        >
                          {bottle.name || 'Unknown bottle'}
                        </Link>
                      </div>
                      <div className={styles.gallerySubtitle}>
                        {inv.location_label || 'No location set'}
                      </div>
                      <div className={styles.galleryMetaRow}>
                        <span>{formatIdentity(inv)}</span>
                        {bottle.type && (
                          <span>{bottle.type}</span>
                        )}
                      </div>
                      <div className={styles.galleryLinkRow}>
                        <Link
                          to={`/app/inventory/${inv.id}`}
                          className={styles.galleryDetailsLink}
                        >
                          View inventory →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default InventoryPage;
