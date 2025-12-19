import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import NewBottleSubmissionModal from '../components/NewBottleSubmissionModal';
import LogTastingModal from '../components/LogTastingModal';
import StorageLocationSelect from '../components/StorageLocationSelect';
import PurchaseLocationSelect from '../components/PurchaseLocationSelect';
import DealBadge from '../components/DealBadge';
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

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
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
  if (inv.storage_location?.name) {
    return inv.storage_location.full_path || inv.storage_location.name;
  }
  return inv.location_label || '—';
}

function InventoryPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const [searchTerm, setSearchTerm] = useState('');
  const [showNewBottleModal, setShowNewBottleModal] = useState(false);

  const [pricingCache, setPricingCache] = useState({});

  const [showLogModal, setShowLogModal] = useState(false);
  const [logInventoryId, setLogInventoryId] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    bottle_id: '',
    status: 'sealed',
    storage_location_id: null,
    location_label: '',
    purchase_location_id: null,
    purchase_store: '',
    purchase_city: '',
    purchase_state: '',
    price_paid: '',
    purchase_date: '',
  });
  const [addFormError, setAddFormError] = useState('');
  const [addFormSubmitting, setAddFormSubmitting] = useState(false);
  const [bottles, setBottles] = useState([]);
  const [bottlesLoading, setBottlesLoading] = useState(false);

  const [selectedBottlePricing, setSelectedBottlePricing] = useState(null);

  async function loadInventory() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/v1/inventory?limit=100&offset=0');
      const data = res.data || {};
      const list = data.inventory || [];
      setItems(list);
      setTotal(typeof data.total === 'number' ? data.total : list.length);

      const uniqueBottleIds = [...new Set(list.map(inv => inv.bottle?.id).filter(Boolean))];
      loadPricingForBottles(uniqueBottleIds);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || 'Failed to load inventory. Is the API running?';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

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

  async function loadBottles() {
    setBottlesLoading(true);
    try {
      const res = await api.get('/v1/bottles?limit=200&offset=0');
      setBottles(res.data?.bottles || []);
    } catch (err) {
      console.error('Failed to load bottles:', err);
    } finally {
      setBottlesLoading(false);
    }
  }

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
    loadInventory();
  }, []);

  useEffect(() => {
    if (showAddForm && bottles.length === 0) {
      loadBottles();
    }
  }, [showAddForm]);

  const filteredItems = items.filter((inv) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    const bottle = inv.bottle || {};
    const identity = formatIdentity(inv);
    const location = formatLocation(inv);
    const haystack = [bottle.name, bottle.brand, bottle.type, location, identity]
      .filter(Boolean).join(' ').toLowerCase() || '';
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

  function handleAddFormChange(e) {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
    setAddFormError('');
    if (name === 'bottle_id') {
      loadSelectedBottlePricing(value);
    }
  }

  function handleStorageLocationChange(locationId) {
    setAddForm((prev) => ({
      ...prev,
      storage_location_id: locationId,
      location_label: locationId ? '' : prev.location_label,
    }));
  }

  function handleLegacyLocationChange(value) {
    setAddForm((prev) => ({
      ...prev,
      location_label: value,
      storage_location_id: null,
    }));
  }

  function handlePurchaseLocationChange(locationId) {
    setAddForm((prev) => ({
      ...prev,
      purchase_location_id: locationId,
      purchase_store: locationId ? '' : prev.purchase_store,
      purchase_city: locationId ? '' : prev.purchase_city,
      purchase_state: locationId ? '' : prev.purchase_state,
    }));
  }

  function handleLegacyPurchaseChange({ store, city, state }) {
    setAddForm((prev) => ({
      ...prev,
      purchase_store: store,
      purchase_city: city,
      purchase_state: state,
      purchase_location_id: null,
    }));
  }

  async function handleAddFormSubmit(e) {
    e.preventDefault();
    if (!addForm.bottle_id) {
      setAddFormError('Please select a bottle.');
      return;
    }

    if (!addForm.storage_location_id && !addForm.location_label.trim()) {
      setAddFormError('Please select a storage location or enter a location label.');
      return;
    }

    setAddFormSubmitting(true);
    setAddFormError('');

    try {
      const payload = {
        bottle_id: addForm.bottle_id,
        status: addForm.status || 'sealed',
        price_paid: addForm.price_paid ? Number(addForm.price_paid) : undefined,
        purchase_date: addForm.purchase_date || undefined,
      };

      if (addForm.storage_location_id) payload.storage_location_id = addForm.storage_location_id;
      if (addForm.location_label?.trim()) payload.location_label = addForm.location_label.trim();
      if (addForm.purchase_location_id) payload.purchase_location_id = addForm.purchase_location_id;
      if (addForm.purchase_store?.trim()) payload.purchase_store = addForm.purchase_store.trim();
      if (addForm.purchase_city?.trim()) payload.purchase_city = addForm.purchase_city.trim();
      if (addForm.purchase_state?.trim()) payload.purchase_state = addForm.purchase_state.trim();

      await api.post('/v1/inventory', payload);

      setAddForm({
        bottle_id: '', status: 'sealed', storage_location_id: null, location_label: '',
        purchase_location_id: null, purchase_store: '', purchase_city: '', purchase_state: '',
        price_paid: '', purchase_date: '',
      });
      setSelectedBottlePricing(null);
      setShowAddForm(false);
      await loadInventory();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || 'Failed to add inventory item.';
      setAddFormError(msg);
    } finally {
      setAddFormSubmitting(false);
    }
  }

  const addFormDealAnalysis = useMemo(() => {
    if (!addForm.price_paid || !selectedBottlePricing?.pricing?.avg_price) return null;

    const userPrice = Number(addForm.price_paid);
    const avgPrice = Number(selectedBottlePricing.pricing.avg_price);
    const msrp = selectedBottlePricing.bottle?.msrp ? Number(selectedBottlePricing.bottle.msrp) : null;

    const vsAvgPct = ((userPrice / avgPrice) - 1) * 100;
    const vsMsrpPct = msrp ? ((userPrice / msrp) - 1) * 100 : null;

    let dealType = 'fair';
    let message = `Fair price (within 10% of $${avgPrice} average)`;

    if (vsAvgPct <= -20) {
      dealType = 'great';
      message = `Great deal! ${Math.abs(vsAvgPct).toFixed(0)}% below average ($${avgPrice})`;
    } else if (vsAvgPct <= -10) {
      dealType = 'good';
      message = `Good price! ${Math.abs(vsAvgPct).toFixed(0)}% below average ($${avgPrice})`;
    } else if (vsAvgPct >= 30) {
      dealType = 'premium';
      message = `${vsAvgPct.toFixed(0)}% above average ($${avgPrice})`;
    } else if (vsAvgPct >= 10) {
      dealType = 'above';
      message = `${vsAvgPct.toFixed(0)}% above average ($${avgPrice})`;
    }

    return { dealType, message, vsAvgPct, vsMsrpPct, avgPrice, msrp };
  }, [addForm.price_paid, selectedBottlePricing]);

  function getDealBadgeProps(inv, pricingData) {
    if (!inv.price_paid || inv.price_paid <= 0) return null;
    if (!pricingData?.pricing?.avg_price) return null;

    const userPrice = Number(inv.price_paid);
    const avgPrice = Number(pricingData.pricing.avg_price);
    const msrp = pricingData.bottle?.msrp ? Number(pricingData.bottle.msrp) : null;

    return {
      priceVsAvgPct: ((userPrice / avgPrice) - 1) * 100,
      priceVsMsrpPct: msrp ? ((userPrice / msrp) - 1) * 100 : null,
    };
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>My Collection</h1>
          <p className={styles.subtitle}>Your physical bottles across all locations.</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.count}>{total} item{total === 1 ? '' : 's'}</span>

          <div className={styles.headerActions}>
            <input
              type="text"
              placeholder="Search your collection…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <button type="button" onClick={() => setShowAddForm((v) => !v)} className={styles.addButton}>
              {showAddForm ? 'Cancel' : 'Add to Collection'}
            </button>
            <button type="button" onClick={() => setShowNewBottleModal(true)} className={styles.submitButton}>
              Submit New
            </button>
          </div>

          <div className={styles.viewToggle}>
            <button type="button" className={viewMode === 'list' ? styles.viewModeButtonActive : styles.viewModeButton} onClick={() => setViewMode('list')}>List</button>
            <button type="button" className={viewMode === 'cards' ? styles.viewModeButtonActive : styles.viewModeButton} onClick={() => setViewMode('cards')}>Cards</button>
            <button type="button" className={viewMode === 'gallery' ? styles.viewModeButtonActive : styles.viewModeButton} onClick={() => setViewMode('gallery')}>Gallery</button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className={styles.addFormCard}>
          <h2 className={styles.addFormTitle}>Add to Collection</h2>
          {addFormError && <div className={styles.addFormError}>{addFormError}</div>}

          <form className={styles.addForm} onSubmit={handleAddFormSubmit}>
            <div className={styles.addFormRow}>
              <label className={styles.addFormLabel}>
                Bottle *
                <select name="bottle_id" value={addForm.bottle_id} onChange={handleAddFormChange} className={styles.addFormSelect} disabled={bottlesLoading}>
                  <option value="">{bottlesLoading ? 'Loading bottles...' : 'Select a bottle'}</option>
                  {bottles.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} {b.brand ? `— ${b.brand}` : ''}</option>
                  ))}
                </select>
              </label>

              <label className={styles.addFormLabel}>
                Status
                <select name="status" value={addForm.status} onChange={handleAddFormChange} className={styles.addFormSelect}>
                  <option value="sealed">Sealed</option>
                  <option value="open">Open</option>
                  <option value="finished">Finished</option>
                  <option value="sample">Sample</option>
                </select>
              </label>
            </div>

            <div className={styles.addFormRow}>
              <label className={styles.addFormLabel}>
                Price Paid
                <input type="number" step="0.01" name="price_paid" value={addForm.price_paid} onChange={handleAddFormChange} className={styles.addFormInput} placeholder="e.g., 59.99" />
              </label>

              <label className={styles.addFormLabel}>
                Purchase Date
                <input type="date" name="purchase_date" value={addForm.purchase_date} onChange={handleAddFormChange} className={styles.addFormInput} />
              </label>
            </div>

            {addFormDealAnalysis && (
              <div className={`${styles.dealIndicator} ${styles[addFormDealAnalysis.dealType]}`}>
                <span className={styles.dealIcon}>
                  {addFormDealAnalysis.dealType === 'great' ? '🎉' : addFormDealAnalysis.dealType === 'good' ? '✓' : addFormDealAnalysis.dealType === 'premium' ? '📈' : addFormDealAnalysis.dealType === 'above' ? '↑' : '✓'}
                </span>
                <span className={styles.dealMessage}>{addFormDealAnalysis.message}</span>
                {addFormDealAnalysis.vsMsrpPct !== null && (
                  <span className={styles.msrpComparison}>
                    {addFormDealAnalysis.vsMsrpPct < 0 ? `${Math.abs(addFormDealAnalysis.vsMsrpPct).toFixed(0)}% below MSRP` : addFormDealAnalysis.vsMsrpPct > 0 ? `${addFormDealAnalysis.vsMsrpPct.toFixed(0)}% above MSRP` : 'At MSRP'}
                  </span>
                )}
              </div>
            )}

            {selectedBottlePricing?.pricing?.avg_price && !addForm.price_paid && (
              <div className={styles.pricingHint}>
                💡 Community average: <strong>${selectedBottlePricing.pricing.avg_price}</strong>
                {selectedBottlePricing.bottle?.msrp && (<> · MSRP: <strong>${Number(selectedBottlePricing.bottle.msrp).toFixed(2)}</strong></>)}
              </div>
            )}

            <div className={styles.addFormRow}>
              <label className={styles.addFormLabel}>
                Storage Location *
                <StorageLocationSelect value={addForm.storage_location_id} onChange={handleStorageLocationChange} showLegacy={true} legacyValue={addForm.location_label} onLegacyChange={handleLegacyLocationChange} />
              </label>
            </div>

            <div className={styles.addFormRow}>
              <label className={styles.addFormLabel}>
                Purchase Location
                <PurchaseLocationSelect value={addForm.purchase_location_id} onChange={handlePurchaseLocationChange} showLegacy={true} legacyStore={addForm.purchase_store} legacyCity={addForm.purchase_city} legacyState={addForm.purchase_state} onLegacyChange={handleLegacyPurchaseChange} />
              </label>
            </div>

            <div className={styles.addFormActions}>
              <button type="button" className={styles.addFormCancelButton} onClick={() => { setShowAddForm(false); setSelectedBottlePricing(null); }} disabled={addFormSubmitting}>Cancel</button>
              <button type="submit" className={styles.addFormSubmitButton} disabled={addFormSubmitting}>{addFormSubmitting ? 'Adding...' : 'Add to Collection'}</button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className={styles.message}>Loading collection...</div>}
      {error && !loading && <div className={styles.error}>{error}</div>}
      {!loading && !error && !hasAnyItems && <div className={styles.message}>No bottles in your collection yet. Add bottles from the Catalog page, or submit a new bottle to start tracking your collection.</div>}
      {!loading && !error && hasAnyItems && !hasVisibleItems && <div className={styles.message}>No bottles matched this search. Try a different term, or submit a new bottle if you&apos;re trying to track something new.</div>}

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
                    <th>Purchased</th>
                    <th>Links</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((inv) => {
                    const bottle = inv.bottle || {};
                    const pricing = pricingCache[bottle.id];
                    const dealProps = getDealBadgeProps(inv, pricing);

                    return (
                      <tr key={inv.id}>
                        <td>
                          <Link to={`/app/inventory/${inv.id}`} className={styles.nameLink}>{bottle.name || 'Unknown bottle'}</Link>
                          <div className={styles.subRow}>{bottle.brand || 'Unknown Brand'}{bottle.type ? ` • ${bottle.type}` : ''}</div>
                        </td>
                        <td>{formatStatus(inv.status)}</td>
                        <td>
                          <span className={styles.locationCell}>
                            {formatLocation(inv)}
                            {inv.storage_location && <span className={styles.locationIcon} title="Linked to storage location">📍</span>}
                          </span>
                        </td>
                        <td>{formatIdentity(inv)}</td>
                        <td>
                          <span className={styles.priceCell}>
                            {formatPrice(inv.price_paid)}
                            {dealProps && <DealBadge priceVsAvgPct={dealProps.priceVsAvgPct} priceVsMsrpPct={dealProps.priceVsMsrpPct} size="sm" showLabel={false} />}
                          </span>
                        </td>
                        <td>{formatDate(inv.purchase_date)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <Link to={`/app/inventory/${inv.id}`} className={styles.smallLinkButton}>Details</Link>
                            {bottle.id && <Link to={`/app/bottles/${bottle.id}`} className={styles.smallLinkButton}>Bottle</Link>}
                            <button type="button" className={styles.smallLinkButton} onClick={() => openLogModal(inv)}>Log tasting</button>
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
                const pricing = pricingCache[bottle.id];
                const dealProps = getDealBadgeProps(inv, pricing);

                return (
                  <div key={inv.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.cardTitle}>
                          <Link to={`/app/inventory/${inv.id}`} className={styles.nameLink}>{bottle.name || 'Unknown bottle'}</Link>
                        </div>
                        <div className={styles.cardSubtitle}>{bottle.brand || 'Unknown Brand'}{bottle.type ? ` • ${bottle.type}` : ''}</div>
                      </div>
                      <div className={styles.statusPill}>{formatStatus(inv.status)}</div>
                    </div>
                    <div className={styles.cardMetaRow}><span><strong>Location:</strong> {formatLocation(inv)}</span></div>
                    <div className={styles.cardMetaRow}><span><strong>Identity:</strong> {identity}</span></div>
                    <div className={styles.cardMetaRow}>
                      <span><strong>Price:</strong> {formatPrice(inv.price_paid)}</span>
                      {dealProps && <DealBadge priceVsAvgPct={dealProps.priceVsAvgPct} priceVsMsrpPct={dealProps.priceVsMsrpPct} size="sm" />}
                    </div>
                    {inv.purchase_date && <div className={styles.cardMetaRow}><span><strong>Purchased:</strong> {formatDate(inv.purchase_date)}</span></div>}
                    <div className={styles.cardActions}>
                      <Link to={`/app/inventory/${inv.id}`} className={styles.smallLinkButton}>Collection details</Link>
                      {bottle.id && <Link to={`/app/bottles/${bottle.id}`} className={styles.smallLinkButton}>Bottle details</Link>}
                      <button type="button" className={styles.smallLinkButton} onClick={() => openLogModal(inv)}>Log tasting</button>
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
                const img = bottle.primary_photo_url ? resolveImageUrl(bottle.primary_photo_url) : null;
                const pricing = pricingCache[bottle.id];
                const dealProps = getDealBadgeProps(inv, pricing);

                return (
                  <div key={inv.id} className={styles.galleryCard}>
                    <div className={styles.galleryImageWrap}>
                      {img ? (
                        <img src={img} alt={bottle.name || 'Bottle'} className={styles.galleryImage} />
                      ) : (
                        <div className={styles.galleryPlaceholder}><span>{(bottle.name || 'B').charAt(0).toUpperCase()}</span></div>
                      )}
                      <div className={styles.galleryStatusChip}>{formatStatus(inv.status)}</div>
                      {dealProps && (
                        <div className={styles.galleryDealBadge}>
                          <DealBadge priceVsAvgPct={dealProps.priceVsAvgPct} priceVsMsrpPct={dealProps.priceVsMsrpPct} size="sm" showLabel={false} />
                        </div>
                      )}
                    </div>
                    <div className={styles.galleryBody}>
                      <div className={styles.galleryTitle}>
                        <Link to={`/app/inventory/${inv.id}`} className={styles.nameLink}>{bottle.name || 'Unknown bottle'}</Link>
                      </div>
                      <div className={styles.gallerySubtitle}>{formatLocation(inv)}</div>
                      <div className={styles.galleryMetaRow}>
                        <span>{formatIdentity(inv)}</span>
                        {inv.price_paid && <span>{formatPrice(inv.price_paid)}</span>}
                      </div>
                      <div className={styles.galleryLinkRow}>
                        <button type="button" className={styles.galleryDetailsLink} onClick={() => openLogModal(inv)}>Log tasting →</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <NewBottleSubmissionModal isOpen={showNewBottleModal} initialName={searchTerm} onClose={() => setShowNewBottleModal(false)} onCreated={() => { loadInventory(); }} />
      <LogTastingModal isOpen={showLogModal} initialInventoryId={logInventoryId} onClose={closeLogModal} onCreated={() => { closeLogModal(); }} />
    </div>
  );
}

export default InventoryPage;
