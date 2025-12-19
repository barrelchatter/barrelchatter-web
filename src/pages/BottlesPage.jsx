import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../api/client';
import BarrelTrackingSection from '../components/BarrelTrackingSection';
import styles from '../styles/BottlesPage.module.scss';

const apiBase = (API_BASE_URL || '').replace(/\/$/, '');

function resolveImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${apiBase}${path}`;
}

function renderStatusChip(bottle, styles) {
  if (!bottle.status) return null;
  if (bottle.status === 'approved') return null;

  const label =
    bottle.status === 'pending'
      ? 'Pending review'
      : bottle.status === 'rejected'
      ? 'Rejected'
      : bottle.status;

  return (
    <span className={styles.statusChip}>
      {label}
    </span>
  );
}

const INITIAL_FORM = {
  name: '',
  brand: '',
  distillery: '',
  type: '',
  proof: '',
  age_statement: '',
  // release details
  release_name: '',
  is_single_barrel: false,
  is_limited_release: false,
  limited_bottle_count: '',
  finish_description: '',
  mash_bill: '',
  // long description
  description: '',
  // Barrel tracking fields (Migration 011)
  barrel_date: '',
  bottle_date: '',
  barrel_number: '',
  rickhouse_location: '',
  msrp: '',
};

function BottlesPage() {
  const [bottles, setBottles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // wishlist state: bottle_id -> wishlist row
  const [wishlistByBottle, setWishlistByBottle] = useState({});

  // quick add-to-inventory state
  const [invFormOpenFor, setInvFormOpenFor] = useState(null); // bottle_id
  const [invForm, setInvForm] = useState({
    status: 'sealed',
    location_label: '',
    price_paid: '',
    purchase_date: '', // Migration 011
  });
  const [invSubmitting, setInvSubmitting] = useState(false);
  const [invError, setInvError] = useState('');

  // view mode: 'list' | 'cards' | 'gallery'
  const [viewMode, setViewMode] = useState('list');

  function formatSingleLimited(bottle) {
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

  async function loadBottles({ showSpinner = true } = {}) {
    if (showSpinner) {
      setLoading(true);
    } else {
      setLoadingList(true);
    }
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('limit', 100);
      params.set('offset', 0);
      if (search.trim()) params.set('q', search.trim());
      if (typeFilter.trim()) params.set('type', typeFilter.trim());

      const response = await api.get(`/v1/bottles?${params.toString()}`);
      const data = response.data;

      setBottles(data.bottles || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error ||
        'Failed to load bottles. Is the API running?';
      setError(message);
    } finally {
      setLoading(false);
      setLoadingList(false);
    }
  }

  async function loadWishlists() {
    try {
      const res = await api.get('/v1/wishlists?limit=100&offset=0');
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

  useEffect(() => {
    loadBottles();
    loadWishlists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadBottles({ showSpinner: false });
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (!form.name.trim()) {
        setFormError('Name is required.');
        setFormSubmitting(false);
        return;
      }

      // Validate barrel dates (Migration 011)
      if (form.barrel_date && form.bottle_date) {
        const barrelDate = new Date(form.barrel_date);
        const bottleDate = new Date(form.bottle_date);
        if (bottleDate < barrelDate) {
          setFormError('Bottle date cannot be before barrel date.');
          setFormSubmitting(false);
          return;
        }
      }

      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim() || undefined,
        distillery: form.distillery.trim() || undefined,
        type: form.type.trim() || undefined,
        proof: form.proof ? Number(form.proof) : undefined,
        age_statement: form.age_statement.trim() || undefined,
        release_name: form.release_name.trim() || undefined,
        is_single_barrel: form.is_single_barrel,
        is_limited_release: form.is_limited_release,
        limited_bottle_count: form.limited_bottle_count
          ? Number(form.limited_bottle_count)
          : undefined,
        finish_description: form.finish_description.trim() || undefined,
        mash_bill: form.mash_bill.trim() || undefined,
        description: form.description.trim() || undefined,
        // Barrel tracking fields (Migration 011)
        barrel_date: form.barrel_date || null,
        bottle_date: form.bottle_date || null,
        barrel_number: form.barrel_number.trim() || null,
        rickhouse_location: form.rickhouse_location.trim() || null,
        msrp: form.msrp ? Number(form.msrp) : null,
      };

      const response = await api.post('/v1/bottles', payload);
      const created = response.data?.bottle;

      setBottles((prev) => {
        if (!created) return prev;
        const next = [created, ...prev];
        const seen = new Set();
        return next.filter((b) => {
          if (seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });
      });
      setTotal((prev) => prev + 1);

      setForm(INITIAL_FORM);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to create bottle.';
      setFormError(message);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleWishlistAdd(bottle) {
    if (!bottle?.id) return;
    try {
      const res = await api.post('/v1/wishlists', {
        bottle_id: bottle.id,
        alert_enabled: true,
      });
      const wl = res.data?.wishlist;
      if (wl) {
        const id = wl.bottle_id || bottle.id;
        setWishlistByBottle((prev) => ({ ...prev, [id]: wl }));
      }
    } catch (err) {
      console.error('Failed to add wishlist item', err);
    }
  }

  function handleOpenInventoryForm(bottleId) {
    setInvError('');
    setInvFormOpenFor(bottleId);
    setInvForm((prev) => ({
      status: prev.status || 'sealed',
      location_label: prev.location_label || '',
      price_paid: prev.price_paid || '',
      purchase_date: prev.purchase_date || '',
    }));
  }

  function handleInvFormChange(e) {
    const { name, value } = e.target;
    setInvForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleInventorySubmit(e) {
    e.preventDefault();
    if (!invFormOpenFor) return;
    setInvSubmitting(true);
    setInvError('');

    try {
      const payload = {
        bottle_id: invFormOpenFor,
        status: invForm.status || 'sealed',
        location_label:
          invForm.location_label.trim() || 'My Collection',
        price_paid: invForm.price_paid
          ? Number(invForm.price_paid)
          : undefined,
        // Purchase date (Migration 011 - for pricing analytics)
        purchase_date: invForm.purchase_date || undefined,
      };

      await api.post('/v1/inventory', payload);

      setInvFormOpenFor(null);
      setInvForm({
        status: 'sealed',
        location_label: '',
        price_paid: '',
        purchase_date: '',
      });
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error ||
        'Failed to add inventory item.';
      setInvError(message);
    } finally {
      setInvSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Catalog</h1>
          <p className={styles.subtitle}>
            Canonical bottle catalog &mdash; shared across collections,
            tastings, wishlists, and tags.
          </p>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : 'Submit New Whiskey'}
        </button>
      </div>

      <div className={styles.toolbar}>
        <form className={styles.searchRow} onSubmit={handleSearchSubmit}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by name, brand, or distillery..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            className={styles.typeInput}
            type="text"
            placeholder="Type (e.g. Bourbon, Rye)"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
          <button
            type="submit"
            className={styles.searchButton}
            disabled={loadingList}
          >
            {loadingList ? 'Searching...' : 'Search'}
          </button>
        </form>
        <div className={styles.toolbarRight}>
          <div className={styles.count}>
            {total} bottle{total === 1 ? '' : 's'}
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

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Submit New Whiskey</h2>
          {formError && <div className={styles.formError}>{formError}</div>}
          <form className={styles.form} onSubmit={handleFormSubmit}>
            <div className={styles.formRow}>
              <label className={styles.label}>
                Name *
                <input
                  className={styles.input}
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Eagle Rare 10 Year"
                  required
                />
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>
                Brand
                <input
                  className={styles.input}
                  type="text"
                  name="brand"
                  value={form.brand}
                  onChange={handleFormChange}
                  placeholder="Buffalo Trace"
                />
              </label>
              <label className={styles.label}>
                Distillery
                <input
                  className={styles.input}
                  type="text"
                  name="distillery"
                  value={form.distillery}
                  onChange={handleFormChange}
                  placeholder="Buffalo Trace Distillery"
                />
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>
                Type
                <input
                  className={styles.input}
                  type="text"
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  placeholder="Bourbon, Rye, etc."
                />
              </label>
              <label className={styles.label}>
                Proof
                <input
                  className={styles.input}
                  type="number"
                  step="0.1"
                  name="proof"
                  value={form.proof}
                  onChange={handleFormChange}
                  placeholder="e.g. 90"
                />
              </label>
              <label className={styles.label}>
                Age Statement
                <input
                  className={styles.input}
                  type="text"
                  name="age_statement"
                  value={form.age_statement}
                  onChange={handleFormChange}
                  placeholder="e.g. 10 years"
                />
              </label>
            </div>

            <div className={styles.sectionTitle}>Release details</div>

            <div className={styles.formRow}>
              <label className={styles.label}>
                Release Name
                <input
                  className={styles.input}
                  type="text"
                  name="release_name"
                  value={form.release_name}
                  onChange={handleFormChange}
                  placeholder='e.g. "Mr. Dean" or "Spring 2024 Single Barrel"'
                />
              </label>
              <label className={styles.label}>
                MSRP ($)
                <input
                  className={styles.input}
                  type="number"
                  step="0.01"
                  name="msrp"
                  value={form.msrp}
                  onChange={handleFormChange}
                  placeholder="e.g. 59.99"
                />
              </label>
            </div>

            <div className={styles.formRow}>
              <div className={styles.checkboxRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_single_barrel"
                    checked={form.is_single_barrel}
                    onChange={handleFormChange}
                  />
                  Single barrel
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_limited_release"
                    checked={form.is_limited_release}
                    onChange={handleFormChange}
                  />
                  Limited release
                </label>
                <label className={styles.label}>
                  Total bottles
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    name="limited_bottle_count"
                    value={form.limited_bottle_count}
                    onChange={handleFormChange}
                    placeholder="e.g. 150"
                  />
                </label>
              </div>
            </div>

            {/* Barrel Tracking Section (Migration 011) */}
            {(form.is_single_barrel || form.is_limited_release) && (
              <BarrelTrackingSection
                formData={form}
                onChange={handleFormChange}
              />
            )}

            <div className={styles.formRow}>
              <label className={styles.label}>
                Finish
                <input
                  className={styles.input}
                  type="text"
                  name="finish_description"
                  value={form.finish_description}
                  onChange={handleFormChange}
                  placeholder="e.g. Apple brandy barrel finish"
                />
              </label>
              <label className={styles.label}>
                Mash Bill
                <input
                  className={styles.input}
                  type="text"
                  name="mash_bill"
                  value={form.mash_bill}
                  onChange={handleFormChange}
                  placeholder="e.g. 95/5 rye/malted barley"
                />
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>
                Description
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Detailed product description, tasting notes, etc."
                />
              </label>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Saving...' : 'Save Bottle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className={styles.message}>Loading bottles...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && bottles.length === 0 && (
        <div className={styles.message}>No bottles found.</div>
      )}

      {!loading && !error && bottles.length > 0 && (
        <>
          {viewMode === 'list' && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Distillery</th>
                    <th>Type</th>
                    <th>Proof</th>
                    <th>Age</th>
                    <th>Release</th>
                    <th>Single / Limited</th>
                    <th>MSRP</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bottles.map((bottle) => {
                    const wishlisted =
                      bottle.id && wishlistByBottle[bottle.id];

                    return (
                      <React.Fragment key={bottle.id}>
                        <tr>
                          <td>
                            <Link
                              to={`/app/bottles/${bottle.id}`}
                              className={styles.nameLink}
                            >
                              {bottle.name || 'Unknown bottle'}
                            </Link>
                            <div className={styles.subRow}>
                              {bottle.brand || 'Unknown Brand'}
                              {bottle.type ? ` • ${bottle.type}` : ''}
                            </div>
                            {renderStatusChip(bottle, styles)}
                          </td>
                          <td>{bottle.brand || '—'}</td>
                          <td>{bottle.distillery || '—'}</td>
                          <td>{bottle.type || '—'}</td>
                          <td>
                            {bottle.proof != null
                              ? bottle.proof
                              : '—'}
                          </td>
                          <td>{bottle.age_statement || '—'}</td>
                          <td>{bottle.release_name || '—'}</td>
                          <td>{formatSingleLimited(bottle)}</td>
                          <td>
                            {bottle.msrp != null
                              ? `$${Number(bottle.msrp).toFixed(2)}`
                              : '—'}
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              <button
                                type="button"
                                className={styles.smallButton}
                                onClick={() =>
                                  handleOpenInventoryForm(bottle.id)
                                }
                              >
                                Add to My Collection
                              </button>
                              <button
                                type="button"
                                className={
                                  wishlisted
                                    ? styles.wishlistButtonOn
                                    : styles.wishlistButton
                                }
                                onClick={() =>
                                  handleWishlistAdd(bottle)
                                }
                                disabled={!!wishlisted}
                              >
                                {wishlisted
                                  ? 'On Wishlist'
                                  : 'Add to Wishlist'}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {invFormOpenFor === bottle.id && (
                          <tr className={styles.invFormRow}>
                            <td colSpan={10}>
                              <form
                                className={styles.invForm}
                                onSubmit={handleInventorySubmit}
                              >
                                <div
                                  className={styles.invFormFields}
                                >
                                  <label className={styles.invLabel}>
                                    Location *
                                    <input
                                      className={styles.input}
                                      type="text"
                                      name="location_label"
                                      value={invForm.location_label}
                                      onChange={
                                        handleInvFormChange
                                      }
                                      placeholder="e.g. Home - Cabinet A / Shelf 2"
                                    />
                                  </label>
                                  <label className={styles.invLabel}>
                                    Status
                                    <select
                                      className={styles.input}
                                      name="status"
                                      value={invForm.status}
                                      onChange={
                                        handleInvFormChange
                                      }
                                    >
                                      <option value="sealed">
                                        Sealed
                                      </option>
                                      <option value="open">
                                        Open
                                      </option>
                                      <option value="finished">
                                        Finished
                                      </option>
                                      <option value="sample">
                                        Sample
                                      </option>
                                    </select>
                                  </label>
                                  <label className={styles.invLabel}>
                                    Price Paid
                                    <input
                                      className={styles.input}
                                      type="number"
                                      step="0.01"
                                      name="price_paid"
                                      value={invForm.price_paid}
                                      onChange={
                                        handleInvFormChange
                                      }
                                      placeholder="e.g. 60.00"
                                    />
                                  </label>
                                  <label className={styles.invLabel}>
                                    Purchase Date
                                    <input
                                      className={styles.input}
                                      type="date"
                                      name="purchase_date"
                                      value={invForm.purchase_date}
                                      onChange={
                                        handleInvFormChange
                                      }
                                    />
                                  </label>
                                </div>
                                {invError && (
                                  <div className={styles.invError}>
                                    {invError}
                                  </div>
                                )}
                                <div className={styles.invActions}>
                                  <button
                                    type="button"
                                    className={
                                      styles.invCancelButton
                                    }
                                    onClick={() =>
                                      setInvFormOpenFor(null)
                                    }
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className={
                                      styles.invSaveButton
                                    }
                                    disabled={invSubmitting}
                                  >
                                    {invSubmitting
                                      ? 'Adding...'
                                      : 'Add to My Collection'}
                                  </button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'cards' && (
            <div className={styles.cardGrid}>
              {bottles.map((bottle) => {
                const wishlisted =
                  bottle.id && wishlistByBottle[bottle.id];
                const flags = [];
                if (bottle.is_single_barrel) flags.push('Single barrel');
                if (bottle.is_limited_release) {
                  if (bottle.limited_bottle_count != null) {
                    flags.push(
                      `Limited (${bottle.limited_bottle_count})`
                    );
                  } else {
                    flags.push('Limited');
                  }
                }
                if (bottle.finish_description) {
                  flags.push(bottle.finish_description);
                }

                return (
                  <div key={bottle.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.cardTitle}>
                          <Link
                            to={`/app/bottles/${bottle.id}`}
                            className={styles.nameLink}
                          >
                            {bottle.name}
                          </Link>
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
                    </div>

                    <div className={styles.metaRow}>
                      <span className={styles.metaLeft}>
                        {bottle.proof != null
                          ? `${bottle.proof} proof`
                          : ''}
                        {bottle.age_statement
                          ? ` · ${bottle.age_statement}`
                          : ''}
                      </span>
                      {/* MSRP display (Migration 011) */}
                      {bottle.msrp && (
                        <span className={styles.msrpBadge}>
                          MSRP ${Number(bottle.msrp).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {flags.length > 0 && (
                      <div className={styles.releaseChips}>
                        {flags.map((flag) => (
                          <span
                            key={flag}
                            className={styles.releaseChip}
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.smallButton}
                        onClick={() =>
                          handleOpenInventoryForm(bottle.id)
                        }
                      >
                        Add to My Collection
                      </button>
                      <button
                        type="button"
                        className={
                          wishlisted
                            ? styles.wishlistButtonOn
                            : styles.wishlistButton
                        }
                        onClick={() => handleWishlistAdd(bottle)}
                        disabled={!!wishlisted}
                      >
                        {wishlisted
                          ? 'On Wishlist'
                          : 'Add to Wishlist'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'gallery' && (
            <div className={styles.galleryGrid}>
              {bottles.map((bottle) => (
                <div
                  key={bottle.id}
                  className={styles.galleryCard}
                >
                  <div className={styles.galleryImageWrap}>
                    {bottle.primary_photo_url ? (
                      <img
                        src={resolveImageUrl(bottle.primary_photo_url)}
                        alt={bottle.name}
                        className={styles.galleryImage}
                      />
                    ) : (
                      <div className={styles.galleryPlaceholder}>
                        <span>{bottle.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.galleryBody}>
                    <div className={styles.galleryTitle}>
                      <Link
                        to={`/app/bottles/${bottle.id}`}
                        className={styles.nameLink}
                      >
                        {bottle.name}
                      </Link>
                    </div>
                    <div className={styles.gallerySubtitle}>
                      {bottle.brand || 'Unknown Brand'}
                    </div>
                    <div className={styles.galleryMetaRow}>
                      {bottle.type && (
                        <span>{bottle.type}</span>
                      )}
                      {bottle.proof != null && (
                        <span>{bottle.proof} proof</span>
                      )}
                      {bottle.msrp != null && (
                        <span className={styles.msrpBadge}>
                          ${Number(bottle.msrp).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className={styles.galleryLinkRow}>
                      <Link
                        to={`/app/bottles/${bottle.id}`}
                        className={styles.galleryDetailsLink}
                      >
                        View details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BottlesPage;
