import React, { useEffect, useState } from 'react';
import api from '../api/client';
import styles from '../styles/InventoryPage.module.scss';

function formatIdentity(item) {
  const serial =
    item.bottle_serial_label && String(item.bottle_serial_label).trim();
  const number = item.bottle_number;
  const total = item.bottle_total;

  if (serial) {
    return serial;
  }

  if (number != null && total != null) {
    return `Bottle ${number} / ${total}`;
  }

  if (number != null) {
    return `Bottle ${number}`;
  }

  return null;
}

function formatAcquisition(item) {
  const type = item.acquisition_type && String(item.acquisition_type).trim();
  const from = item.acquired_from && String(item.acquired_from).trim();

  if (!type && !from) return null;

  const label = type
    ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
    : 'Acquired';

  if (from) return `${label} — ${from}`;
  return label;
}

function formatDisposition(item) {
  const type =
    item.disposition_type && String(item.disposition_type).trim();
  const to = item.disposed_to && String(item.disposed_to).trim();
  const at = item.disposed_at;

  if (!type && !to && !at) return null;

  let label =
    type &&
    type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

  if (!label) label = 'Disposition';

  const parts = [];

  if (to) parts.push(`to ${to}`);
  if (at) {
    try {
      const d = new Date(at);
      parts.push(d.toLocaleDateString());
    } catch {
      // ignore parse errors
    }
  }

  if (parts.length > 0) {
    return `${label} ${parts.join(' · ')}`;
  }

  return label;
}

function formatReleaseFlags(bottle) {
  if (!bottle) return [];
  const flags = [];

  if (bottle.is_single_barrel) {
    flags.push('Single barrel');
  }
  if (bottle.is_limited_release) {
    if (bottle.limited_bottle_count != null) {
      flags.push(`Limited run (${bottle.limited_bottle_count})`);
    } else {
      flags.push('Limited run');
    }
  }
  if (bottle.finish_description) {
    flags.push(bottle.finish_description);
  }

  return flags;
}

function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wishlistByBottle, setWishlistByBottle] = useState({});

  useEffect(() => {
    let isMounted = true;

    async function fetchInventory() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/v1/inventory?limit=100&offset=0');
        if (!isMounted) return;
        setItems(response.data.inventory || []);
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        const message =
          err?.response?.data?.error ||
          'Failed to load inventory. Is the API running?';
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchInventory();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchWishlist() {
      try {
        const res = await api.get('/v1/wishlists?limit=500&offset=0');
        if (!isMounted) return;
        const map = {};
        (res.data.wishlists || []).forEach((wl) => {
          const bottleId = wl.bottle_id || wl.bottle?.id;
          if (bottleId) map[bottleId] = wl;
        });
        setWishlistByBottle(map);
      } catch (err) {
        console.error('Failed to load wishlist', err);
      }
    }

    fetchWishlist();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleWishlistAdd(bottleId) {
    if (!bottleId) return;
    try {
      const res = await api.post('/v1/wishlists', {
        bottle_id: bottleId,
        alert_enabled: true,
      });
      const wl = res.data?.wishlist;
      if (wl) {
        const id = wl.bottle_id || bottleId;
        setWishlistByBottle((prev) => ({ ...prev, [id]: wl }));
      }
    } catch (err) {
      console.error('Failed to add wishlist item', err);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>My Inventory</h1>
      </div>

      {loading && <div className={styles.message}>Loading inventory...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className={styles.message}>
          No bottles yet. Time to fix that problem.
        </div>
      )}

      <div className={styles.grid}>
        {items.map((item) => {
          const bottle = item.bottle || {};
          const identity = formatIdentity(item);
          const acquisition = formatAcquisition(item);
          const disposition = formatDisposition(item);
          const releaseFlags = formatReleaseFlags(bottle);
          const wishlisted =
            bottle.id && wishlistByBottle[bottle.id];

          return (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>
                    {bottle.name || 'Unknown Bottle'}
                  </div>
                  <div className={styles.cardSubtitle}>
                    {bottle.brand || 'Unknown Brand'}
                    {bottle.type ? ` • ${bottle.type}` : ''}
                  </div>
                  {bottle.release_name && (
                    <div className={styles.releaseName}>
                      {bottle.release_name}
                    </div>
                  )}
                </div>
                <div className={styles.chipColumn}>
                  <span className={styles.statusChip}>{item.status}</span>
                  {releaseFlags.length > 0 && (
                    <div className={styles.releaseChips}>
                      {releaseFlags.map((flag) => (
                        <span
                          key={flag}
                          className={styles.releaseChip}
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.location}>
                  {item.location_label}
                </span>
                {identity && (
                  <span className={styles.identity}>{identity}</span>
                )}
              </div>

              <div className={styles.metaRow}>
                {item.price_paid != null && (
                  <span className={styles.pricePaid}>
                    Paid ${Number(item.price_paid).toFixed(2)}
                  </span>
                )}
                {item.msrp != null && (
                  <span className={styles.msrp}>
                    MSRP ${Number(item.msrp).toFixed(2)}
                  </span>
                )}
              </div>

              {(acquisition || disposition) && (
                <div className={styles.detailBlock}>
                  {acquisition && (
                    <div className={styles.detailLine}>{acquisition}</div>
                  )}
                  {disposition && (
                    <div className={styles.detailLineMuted}>
                      {disposition}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={
                    wishlisted
                      ? styles.wishlistButtonOn
                      : styles.wishlistButton
                  }
                  onClick={() => handleWishlistAdd(bottle.id)}
                  disabled={!bottle.id || wishlisted}
                >
                  {wishlisted ? 'On Wishlist' : 'Add to Wishlist'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InventoryPage;
