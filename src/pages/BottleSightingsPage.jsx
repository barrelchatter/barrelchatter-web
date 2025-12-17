import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import styles from '../styles/BottleSightingsPage.module.scss';

function BottleSightingsPage() {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('recent'); // recent, nearby, bottle
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchSightings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/v1/bottle-sightings?limit=50&offset=0';
      if (filter === 'nearby') {
        url += '&nearby=true';
      }
      if (searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }
      const response = await api.get(url);
      setSightings(response.data?.sightings || response.data?.bottle_sightings || []);
    } catch (err) {
      console.error('Error fetching sightings:', err);
      setError(err?.response?.data?.error || 'Failed to load sightings');
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchSightings();
  }, [fetchSightings]);

  function handleSearch(e) {
    e.preventDefault();
    fetchSightings();
  }

  async function handleVerify(sightingId) {
    try {
      await api.post(`/v1/bottle-sightings/${sightingId}/verify`);
      setSightings((prev) =>
        prev.map((s) =>
          s.id === sightingId ? { ...s, verified: true, verification_count: (s.verification_count || 0) + 1 } : s
        )
      );
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to verify sighting');
    }
  }

  function getQuantityLabel(qty) {
    const labels = {
      plenty: '📦 Plenty in stock',
      limited: '📉 Limited quantity',
      few_left: '⚠️ Few left',
      last_bottle: '🔥 Last bottle!',
    };
    return labels[qty] || qty;
  }

  function getTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Bottle Sightings</h1>
          <p className={styles.subtitle}>
            Community-reported bottle availability
          </p>
        </div>
        <button className={styles.reportButton} onClick={() => setShowReportModal(true)}>
          📍 Report Sighting
        </button>
      </header>

      {/* Search & Filters */}
      <div className={styles.controlsRow}>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search bottles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>Search</button>
        </form>

        <div className={styles.filters}>
          {[
            { value: 'recent', label: 'Recent' },
            { value: 'nearby', label: 'Near Me' },
          ].map((f) => (
            <button
              key={f.value}
              className={`${styles.filterButton} ${filter === f.value ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loading}>Loading sightings...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : sightings.length === 0 ? (
        <div className={styles.empty}>
          <p>No sightings found.</p>
          <p className={styles.emptySubtext}>
            Be the first to report a bottle sighting in your area!
          </p>
          <button className={styles.emptyButton} onClick={() => setShowReportModal(true)}>
            Report a Sighting
          </button>
        </div>
      ) : (
        <div className={styles.sightingsList}>
          {sightings.map((sighting) => (
            <div key={sighting.id} className={styles.sightingCard}>
              <div className={styles.cardMain}>
                <h3 className={styles.bottleName}>
                  {sighting.bottle?.name || 'Unknown Bottle'}
                </h3>
                <p className={styles.distillery}>
                  {sighting.bottle?.distillery || ''}
                </p>

                <div className={styles.locationRow}>
                  <span className={styles.storeName}>
                    {sighting.location?.name || sighting.purchase_location?.name || 'Unknown Store'}
                  </span>
                  <span className={styles.storeLocation}>
                    {sighting.location?.city || sighting.purchase_location?.city}
                    {sighting.location?.state && `, ${sighting.location.state}`}
                  </span>
                </div>

                <div className={styles.detailsRow}>
                  {sighting.price_observed && (
                    <span className={styles.price}>
                      ${Number(sighting.price_observed).toFixed(2)}
                    </span>
                  )}
                  {sighting.quantity_available && (
                    <span className={styles.quantity}>
                      {getQuantityLabel(sighting.quantity_available)}
                    </span>
                  )}
                </div>

                {sighting.notes && (
                  <p className={styles.notes}>"{sighting.notes}"</p>
                )}
              </div>

              <div className={styles.cardMeta}>
                <span className={styles.timeAgo}>
                  {getTimeAgo(sighting.sighted_date || sighting.created_at)}
                </span>
                <span className={styles.reporter}>
                  by {sighting.reported_by?.name || 'Anonymous'}
                </span>
                
                <div className={styles.verifyRow}>
                  {sighting.verified || sighting.verification_count > 0 ? (
                    <span className={styles.verifiedBadge}>
                      ✓ Verified ({sighting.verification_count || 1})
                    </span>
                  ) : (
                    <button
                      className={styles.verifyButton}
                      onClick={() => handleVerify(sighting.id)}
                    >
                      Confirm this sighting
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportSightingModal
          onClose={() => setShowReportModal(false)}
          onCreated={(newSighting) => {
            setSightings((prev) => [newSighting, ...prev]);
            setShowReportModal(false);
          }}
        />
      )}
    </div>
  );
}

function ReportSightingModal({ onClose, onCreated }) {
  const [bottles, setBottles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchingBottles, setSearchingBottles] = useState(false);
  const [searchingLocations, setSearchingLocations] = useState(false);

  const [form, setForm] = useState({
    bottle_id: '',
    bottle_search: '',
    location_id: '',
    location_search: '',
    sighted_date: new Date().toISOString().split('T')[0],
    price_observed: '',
    quantity_available: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBottle, setSelectedBottle] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  async function searchBottles(query) {
    if (query.length < 2) {
      setBottles([]);
      return;
    }
    setSearchingBottles(true);
    try {
      const res = await api.get(`/v1/bottles?q=${encodeURIComponent(query)}&limit=10`);
      setBottles(res.data?.bottles || []);
    } catch (err) {
      console.error('Bottle search error:', err);
    } finally {
      setSearchingBottles(false);
    }
  }

  async function searchLocations(query) {
    if (query.length < 2) {
      setLocations([]);
      return;
    }
    setSearchingLocations(true);
    try {
      const res = await api.get(`/v1/purchase-locations?q=${encodeURIComponent(query)}&limit=10`);
      setLocations(res.data?.locations || res.data?.purchase_locations || []);
    } catch (err) {
      console.error('Location search error:', err);
    } finally {
      setSearchingLocations(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.bottle_id) {
      setError('Please select a bottle');
      return;
    }
    if (!form.location_id) {
      setError('Please select a store location');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await api.post('/v1/bottle-sightings', {
        bottle_id: form.bottle_id,
        purchase_location_id: form.location_id,
        sighted_date: form.sighted_date,
        price_observed: form.price_observed ? parseFloat(form.price_observed) : null,
        quantity_available: form.quantity_available || null,
        notes: form.notes || null,
      });
      onCreated(response.data?.sighting || response.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to report sighting');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>Report a Sighting</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          {/* Bottle Search */}
          <div className={styles.field}>
            <label>Bottle *</label>
            {selectedBottle ? (
              <div className={styles.selectedItem}>
                <span>{selectedBottle.name}</span>
                <button type="button" onClick={() => { setSelectedBottle(null); setForm({ ...form, bottle_id: '' }); }}>
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={form.bottle_search}
                  onChange={(e) => {
                    setForm({ ...form, bottle_search: e.target.value });
                    searchBottles(e.target.value);
                  }}
                  placeholder="Search for bottle..."
                />
                {searchingBottles && <div className={styles.searching}>Searching...</div>}
                {bottles.length > 0 && (
                  <div className={styles.searchResults}>
                    {bottles.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedBottle(b);
                          setForm({ ...form, bottle_id: b.id, bottle_search: '' });
                          setBottles([]);
                        }}
                      >
                        {b.name} <span className={styles.resultMeta}>{b.distillery}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Location Search */}
          <div className={styles.field}>
            <label>Store Location *</label>
            {selectedLocation ? (
              <div className={styles.selectedItem}>
                <span>{selectedLocation.name} - {selectedLocation.city}, {selectedLocation.state}</span>
                <button type="button" onClick={() => { setSelectedLocation(null); setForm({ ...form, location_id: '' }); }}>
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={form.location_search}
                  onChange={(e) => {
                    setForm({ ...form, location_search: e.target.value });
                    searchLocations(e.target.value);
                  }}
                  placeholder="Search for store..."
                />
                {searchingLocations && <div className={styles.searching}>Searching...</div>}
                {locations.length > 0 && (
                  <div className={styles.searchResults}>
                    {locations.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(loc);
                          setForm({ ...form, location_id: loc.id, location_search: '' });
                          setLocations([]);
                        }}
                      >
                        {loc.name} <span className={styles.resultMeta}>{loc.city}, {loc.state}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Date Spotted</label>
              <input
                type="date"
                value={form.sighted_date}
                onChange={(e) => setForm({ ...form, sighted_date: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label>Price (if seen)</label>
              <input
                type="number"
                step="0.01"
                value={form.price_observed}
                onChange={(e) => setForm({ ...form, price_observed: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Stock Level</label>
            <select
              value={form.quantity_available}
              onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
            >
              <option value="">Unknown</option>
              <option value="plenty">Plenty in stock</option>
              <option value="limited">Limited quantity</option>
              <option value="few_left">Few left</option>
              <option value="last_bottle">Last bottle</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional details..."
              rows={2}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" disabled={saving}>
              {saving ? 'Reporting...' : 'Report Sighting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BottleSightingsPage;
