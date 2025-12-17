import React, { useEffect, useState } from 'react';
import api from '../api/client';
import NewBottleSubmissionModal from '../components/NewBottleSubmissionModal';
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

  // Pricing cache by bottle_id (Migration 011)
  const [pricingCache, setPricingCache] = useState({});

  // Selected bottle pricing for form (Migration 011)
  const [selectedBottlePricing, setSelectedBottlePricing] = useState(null);

  // New: modal for submitting a new bottle from wishlist context
  const [showNewBottleModal, setShowNewBottleModal] = useState(false);

  async function loadBottles() {
    setBottlesLoading(true);
    setBottlesError('');
    try {
      const res = await api.get('/v1/bottles?limit=100&offset=0');
      setBottles(res.data.bottles || []);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error ||
        'Failed to load bottles for wishlist.';
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
      const wlList = data.wishlists || [];
      setWishlists(wlList);
      setTotal(data.total || 0);

      // Load pricing for all bottles in wishlist (Migration 011)
      const bottleIds = [...new Set(wlList.map(wl => wl.bottle_id || wl.bottle?.id).filter(Boolean))];
      loadPricingForBottles(bottleIds);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to load wishlist.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Load pricing data for multiple bottles (Migration 011)
  async function loadPricingForBottles(bottleIds) {
    const results = await Promise.allSettled(
      bottleIds.map(id => 
        api.get(`/v1/pricing/bottles/${id}?months=12&min_samples=3`)
          .then(res => ({ id, data: res.data }))
          .catch(() => ({ id, data: null }))
      )
    );

    const newCache = {};
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.data) {
        newCache[result.value.id] = result.value.data;
      }
    });

    setPricingCache(prev => ({ ...prev, ...newCache }));
  }

  // Load pricing when bottle is selected in form (Migration 011)
  async function loadSelectedBottlePricing(bottleId) {
    if (!bottleId) {
      setSelectedBottlePricing(null);
      return;
    }

    try {
      const res = await api.get(`/v1/pricing/bottles/${bottleId}?months=12&min_samples=3`);
      setSelectedBottlePricing(res.data);
    } catch (err) {
      console.error('Failed to load bottle pricing:', err);
      setSelectedBottlePricing(null);
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

    // Load pricing when bottle changes (Migration 011)
    if (name === 'bottle_id') {
      loadSelectedBottlePricing(value);
    }
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

        // Load pricing for the new bottle if not cached
        const bottleId = wl.bottle_id || wl.bottle?.id;
        if (bottleId && !pricingCache[bottleId]) {
          loadPricingForBottles([bottleId]);
        }
      }

      setForm(INITIAL_FORM);
      setSelectedBottlePricing(null);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error ||
        'Failed to save wishlist item.';
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
    const confirmRemove = window.confirm(
      `Remove "${wl.bottle?.name || 'this bottle'}" from your wishlist?`
    );
    if (!confirmRemove) return;

    try {
      await api.delete(`/v1/wishlists/${wl.id}`);
      setWishlists((prev) => prev.filter((w) => w.id !== wl.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  }

  // Helper to format price comparison (Migration 011)
  function formatPriceComparison(wl, pricing) {
    if (!wl.preferred_price || !pricing?.pricing?.avg_price) return null;

    const targetPrice = Number(wl.preferred_price);
    const avgPrice = Number(pricing.pricing.avg_price);
    const diff = ((targetPrice / avgPrice) - 1) * 100;

    if (diff <= -15) {
      return { label: 'Ambitious', variant: 'warning', diff };
    } else if (diff <= -5) {
      return { label: 'Below avg', variant: 'good', diff };
    } else if (diff <= 5) {
      return { label: 'Fair', variant: 'neutral', diff };
    } else {
      return { label: 'Above avg', variant: 'neutral', diff };
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Wishlist</h1>
          <p className={styles.subtitle}>
            Track bottles you're hunting and your target prices.
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
            Selecting a bottle that's already on your wishlist will
            update its price/notes instead of creating a duplicate.
          </p>
          {formError && (
            <div className={styles.formError}>{formError}</div>
          )}

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

            {/* Pricing context when bottle is selected (Migration 011) */}
            {selectedBottlePricing?.pricing?.avg_price && (
              <div className={styles.pricingContext}>
                <span className={styles.pricingLabel}>Community Pricing:</span>
                <span className={styles.pricingValue}>
                  Avg: <strong>${selectedBottlePricing.pricing.avg_price}</strong>
                </span>
                <span className={styles.pricingValue}>
                  Range: ${selectedBottlePricing.pricing.min_price} - ${selectedBottlePricing.pricing.max_price}
                </span>
                {selectedBottlePricing.bottle?.msrp && (
                  <span className={styles.pricingValue}>
                    MSRP: <strong>${Number(selectedBottlePricing.bottle.msrp).toFixed(2)}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Helper to submit a new bottle from here */}
            <div className={styles.formRow}>
              <div className={styles.smallNote}>
                Don&apos;t see your bottle in the list?{' '}
                <button
                  type="button"
                  className={styles.linkLikeButton}
                  onClick={() => setShowNewBottleModal(true)}
                >
                  Submit a new bottle for review
                </button>
                .
              </div>
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

            {/* Target price analysis (Migration 011) */}
            {form.preferred_price && selectedBottlePricing?.pricing?.avg_price && (
              <div className={styles.targetAnalysis}>
                {(() => {
                  const targetPrice = Number(form.preferred_price);
                  const avgPrice = Number(selectedBottlePricing.pricing.avg_price);
                  const diff = ((targetPrice / avgPrice) - 1) * 100;

                  if (diff <= -20) {
                    return (
                      <span className={styles.targetWarning}>
                        ⚠️ Your target is {Math.abs(diff).toFixed(0)}% below average — might be hard to find!
                      </span>
                    );
                  } else if (diff <= -5) {
                    return (
                      <span className={styles.targetGood}>
                        ✓ Good target! {Math.abs(diff).toFixed(0)}% below average
                      </span>
                    );
                  } else if (diff <= 5) {
                    return (
                      <span className={styles.targetNeutral}>
                        Target is around average price
                      </span>
                    );
                  } else {
                    return (
                      <span className={styles.targetNeutral}>
                        Target is {diff.toFixed(0)}% above average — should be easy to find
                      </span>
                    );
                  }
                })()}
              </div>
            )}

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

      {loading && (
        <div className={styles.message}>Loading wishlist...</div>
      )}
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
                <th>Avg Price</th>
                <th>Alerts</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {wishlists.map((wl) => {
                const bottleId = wl.bottle_id || wl.bottle?.id;
                const pricing = pricingCache[bottleId];
                const comparison = formatPriceComparison(wl, pricing);

                return (
                  <tr key={wl.id}>
                    <td>{wl.bottle?.name || 'Unknown'}</td>
                    <td>{wl.bottle?.brand || '—'}</td>
                    <td>{wl.bottle?.type || '—'}</td>
                    <td>
                      {wl.preferred_price != null ? (
                        <span className={styles.priceCell}>
                          ${Number(wl.preferred_price).toFixed(2)}
                          {comparison && (
                            <span className={`${styles.comparisonBadge} ${styles[comparison.variant]}`}>
                              {comparison.diff < 0 ? '↓' : '↑'} {Math.abs(comparison.diff).toFixed(0)}%
                            </span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {pricing?.pricing?.avg_price ? (
                        <span className={styles.avgPrice}>
                          ${pricing.pricing.avg_price}
                          <span className={styles.sampleCount}>
                            ({pricing.pricing.sample_count})
                          </span>
                        </span>
                      ) : (
                        <span className={styles.noData}>—</span>
                      )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <div className={styles.count}>
          {total} wishlist item{total === 1 ? '' : 's'}
        </div>
      )}

      {/* New bottle submission modal for wishlist context */}
      <NewBottleSubmissionModal
        isOpen={showNewBottleModal}
        initialName=""
        onClose={() => setShowNewBottleModal(false)}
        onCreated={({ bottle }) => {
          // Refresh bottle list so the new bottle appears in the select
          loadBottles();

          // If we got a bottle back, pre-select it and show the form
          if (bottle?.id) {
            setShowForm(true);
            setForm((prev) => ({
              ...prev,
              bottle_id: bottle.id,
            }));
            loadSelectedBottlePricing(bottle.id);
          }

          // Close modal
          setShowNewBottleModal(false);
        }}
      />
    </div>
  );
}

export default WishlistPage;
