import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import styles from '../styles/BottleDetailPage.module.scss';

function formatSingleLimited(bottle) {
  if (!bottle) return '—';
  const flags = [];
  if (bottle.is_single_barrel) flags.push('Single barrel');
  if (bottle.is_limited_release) {
    if (bottle.limited_bottle_count != null) {
      flags.push(`Limited (${bottle.limited_bottle_count})`);
    } else {
      flags.push('Limited');
    }
  }
  if (!flags.length) return '—';
  return flags.join(' • ');
}

function formatProof(bottle) {
  if (!bottle || bottle.proof == null) return '—';
  return `${bottle.proof}`;
}

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatRating(t) {
  if (t.rating == null) return '—';
  return t.rating;
}

function BottleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bottle, setBottle] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [tastings, setTastings] = useState([]);
  const [wishlist, setWishlist] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [wishSubmitting, setWishSubmitting] = useState(false);
  const [wishError, setWishError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchAll() {
      setLoading(true);
      setError('');
      setWishError('');

      try {
        const [bottleRes, invRes, tastingsRes, wishlistRes] =
          await Promise.all([
            api.get(`/v1/bottles/${id}`),
            api.get('/v1/inventory?limit=500&offset=0'),
            api.get('/v1/tastings?limit=200&offset=0'),
            api.get('/v1/wishlists?limit=500&offset=0'),
          ]);

        if (!isMounted) return;

        const bottleData = bottleRes.data?.bottle || null;
        setBottle(bottleData);

        const allInv = invRes.data?.inventory || [];
        setInventory(
          allInv.filter((item) => item.bottle && item.bottle.id === id)
        );

        const allTastings = tastingsRes.data?.tastings || [];
        setTastings(
          allTastings.filter(
            (t) => t.bottle && t.bottle.id === id
          )
        );

        const allWish = wishlistRes.data?.wishlists || [];
        const wl =
          allWish.find(
            (w) =>
              (w.bottle_id && w.bottle_id === id) ||
              (w.bottle && w.bottle.id === id)
          ) || null;
        setWishlist(wl);
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        if (err?.response?.status === 404) {
          setError('Bottle not found.');
        } else {
          const msg =
            err?.response?.data?.error ||
            'Failed to load bottle details.';
          setError(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleAddToWishlist() {
    if (!bottle?.id) return;
    setWishSubmitting(true);
    setWishError('');
    try {
      const res = await api.post('/v1/wishlists', {
        bottle_id: bottle.id,
        alert_enabled: true,
      });
      setWishlist(res.data?.wishlist || null);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        'Failed to add bottle to wishlist.';
      setWishError(msg);
    } finally {
      setWishSubmitting(false);
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
            <Link to="/app/bottles" className={styles.breadcrumbLink}>
              Bottles
            </Link>{' '}
            / Details
          </span>
        </div>
      </div>

      {loading && (
        <div className={styles.message}>Loading bottle...</div>
      )}

      {error && !loading && (
        <div className={styles.error}>{error}</div>
      )}

      {!loading && !error && bottle && (
        <>
          <div className={styles.topRow}>
            <div className={styles.mainCard}>
              <h1 className={styles.title}>{bottle.name}</h1>
              <div className={styles.subtitle}>
                {bottle.brand || 'Unknown Brand'}
                {bottle.type ? ` • ${bottle.type}` : ''}
              </div>
              {bottle.release_name && (
                <div className={styles.releaseName}>
                  {bottle.release_name}
                </div>
              )}

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Distillery</div>
                  <div className={styles.infoValue}>
                    {bottle.distillery || '—'}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Proof</div>
                  <div className={styles.infoValue}>
                    {formatProof(bottle)}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Age</div>
                  <div className={styles.infoValue}>
                    {bottle.age_statement || '—'}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Single / Limited</div>
                  <div className={styles.infoValue}>
                    {formatSingleLimited(bottle)}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Finish</div>
                  <div className={styles.infoValue}>
                    {bottle.finish_description || '—'}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Mash Bill</div>
                  <div className={styles.infoValue}>
                    {bottle.mash_bill || '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sideCard}>
              <h2 className={styles.sideTitle}>Wishlist & Stats</h2>
              {wishlist ? (
                <div className={styles.wishlistBlock}>
                  <div className={styles.wishlistStatus}>
                    On your wishlist
                    {wishlist.alert_enabled ? ' (alerts on)' : ' (alerts off)'}
                  </div>
                  {wishlist.preferred_price != null && (
                    <div className={styles.wishlistField}>
                      Target price:{' '}
                      <strong>
                        $
                        {Number(
                          wishlist.preferred_price
                        ).toFixed(2)}
                      </strong>
                    </div>
                  )}
                  {wishlist.notes && (
                    <div className={styles.wishlistNotes}>
                      {wishlist.notes}
                    </div>
                  )}
                  <div className={styles.sideActions}>
                    <Link
                      to="/app/wishlists"
                      className={styles.sideLinkButton}
                    >
                      Open Wishlist
                    </Link>
                  </div>
                </div>
              ) : (
                <div className={styles.wishlistBlock}>
                  <div className={styles.wishlistStatus}>
                    Not currently on your wishlist.
                  </div>
                  {wishError && (
                    <div className={styles.wishlistError}>
                      {wishError}
                    </div>
                  )}
                  <div className={styles.sideActions}>
                    <button
                      type="button"
                      className={styles.sidePrimaryButton}
                      onClick={handleAddToWishlist}
                      disabled={wishSubmitting}
                    >
                      {wishSubmitting
                        ? 'Adding...'
                        : 'Add to Wishlist'}
                    </button>
                  </div>
                </div>
              )}
              <div className={styles.sideNote}>
                Inventory and tastings below are filtered to this bottle.
              </div>
            </div>
          </div>

          <div className={styles.sectionsRow}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Your Inventory</h2>
                <span className={styles.sectionCount}>
                  {inventory.length} item
                  {inventory.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className={styles.tableWrapper}>
                {inventory.length === 0 ? (
                  <div className={styles.message}>
                    You don&apos;t currently have this bottle in your
                    inventory.
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Identity</th>
                        <th>Price Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((inv) => {
                        const identity =
                          inv.bottle_serial_label ||
                          (inv.bottle_number != null &&
                            inv.bottle_total != null &&
                            `Bottle ${inv.bottle_number}/${inv.bottle_total}`) ||
                          (inv.bottle_number != null &&
                            `Bottle ${inv.bottle_number}`) ||
                          '—';

                        return (
                          <tr key={inv.id}>
                            <td>{inv.location_label}</td>
                            <td>{inv.status}</td>
                            <td>{identity}</td>
                            <td>
                              {inv.price_paid != null
                                ? `$${Number(
                                    inv.price_paid
                                  ).toFixed(2)}`
                                : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Recent Tastings</h2>
                <span className={styles.sectionCount}>
                  {tastings.length} tasting
                  {tastings.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className={styles.tableWrapper}>
                {tastings.length === 0 ? (
                  <div className={styles.message}>
                    No tastings logged for this bottle yet.
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Location</th>
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
                            {t.inventory?.location_label || '—'}
                          </td>
                          <td>
                            {t.pour_amount_oz != null
                              ? t.pour_amount_oz
                              : '—'}
                          </td>
                          <td>{formatRating(t)}</td>
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
          </div>
        </>
      )}
    </div>
  );
}

export default BottleDetailPage;
