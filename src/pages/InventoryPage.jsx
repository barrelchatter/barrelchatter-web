import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NewBottleSubmissionModal from '../components/NewBottleSubmissionModal';
import LogTastingModal from '../components/LogTastingModal';
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

  const [searchTerm, setSearchTerm] = useState('');
  const [showNewBottleModal, setShowNewBottleModal] = useState(false);

  // log tasting modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logInventoryId, setLogInventoryId] = useState(null);

  async function loadInventory() {
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

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredItems = items.filter((inv) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    const bottle = inv.bottle || {};
    const identity = formatIdentity(inv);
    const haystack =
      [
        bottle.name,
        bottle.brand,
        bottle.type,
        inv.location_label,
        identity,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase() || '';
    return haystack.includes(term);
  });

  const hasAnyItems = items.length > 0;
  const hasVisibleItems = filteredItems.length > 0;

  function openLogModal(inv) {
    setLogInventoryId(inv.id);
    setShowLogModal(true);
  }

  function closeLogModal() {
    setShowLogModal(false);
    setLogInventoryId(null);
  }

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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: '12px',
            }}
          >
            <input
              type="text"
              placeholder="Search your inventory…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                borderRadius: 9999,
                border: '1px solid rgba(255,255,255,0.16)',
                background: 'rgba(0,0,0,0.4)',
                padding: '4px 10px',
                color: 'inherit',
                fontSize: '13px',
                minWidth: '180px',
              }}
            />
            <button
              type="button"
              onClick={() => setShowNewBottleModal(true)}
              style={{
                borderRadius: 9999,
                border: '1px solid rgba(181,142,88,0.9)',
                background: '#5a3e36',
                color: '#e4d6c3',
                fontSize: '13px',
                padding: '4px 10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Submit new bottle
            </button>
          </div>

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

      {!loading && !error && !hasAnyItems && (
        <div className={styles.message}>
          No inventory items yet. Add bottles from the Bottles page, or
          submit a new bottle to start tracking your collection.
        </div>
      )}

      {!loading && !error && hasAnyItems && !hasVisibleItems && (
        <div className={styles.message}>
          No inventory items matched this search. Try a different term,
          or submit a new bottle if you&apos;re trying to track something
          new.
        </div>
      )}

      {!loading && !error && hasAnyItems && hasVisibleItems && (
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
                  {filteredItems.map((inv) => {
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
                            {bottle.type ? ` • ${bottle.type}` : ''}
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
                            <button
                              type="button"
                              className={styles.smallLinkButton}
                              onClick={() => openLogModal(inv)}
                            >
                              Log tasting
                            </button>
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
              {filteredItems.map((inv) => {
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
                          {bottle.type ? ` • ${bottle.type}` : ''}
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
                      <button
                        type="button"
                        className={styles.smallLinkButton}
                        onClick={() => openLogModal(inv)}
                      >
                        Log tasting
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'gallery' && (
            <div className={styles.galleryGrid}>
              {filteredItems.map((inv) => {
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
                        {bottle.type && <span>{bottle.type}</span>}
                      </div>
                      <div className={styles.galleryLinkRow}>
                        <button
                          type="button"
                          className={styles.galleryDetailsLink}
                          onClick={() => openLogModal(inv)}
                        >
                          Log tasting →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <NewBottleSubmissionModal
        isOpen={showNewBottleModal}
        initialName={searchTerm}
        onClose={() => setShowNewBottleModal(false)}
        onCreated={() => {
          loadInventory();
        }}
      />

      <LogTastingModal
        isOpen={showLogModal}
        initialInventoryId={logInventoryId}
        onClose={closeLogModal}
        onCreated={() => {
          // Tastings live on another page; no inventory refresh needed here
          closeLogModal();
        }}
      />
    </div>
  );
}

export default InventoryPage;
