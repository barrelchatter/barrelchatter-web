import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { BOTTLE_SIZES, getBottleSizeLabel } from '../constants/bottleOptions';
import PhotoUpload from '../components/PhotoUpload';
import BottlePricingCard from '../components/BottlePricingCard';
import { BarrelInfoDisplay } from '../components/BarrelTrackingSection';
import BarrelTrackingSection from '../components/BarrelTrackingSection';
import styles from '../styles/BottleDetailPage.module.scss';

const apiBase = (API_BASE_URL || '').replace(/\/$/, '');

function resolveImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${apiBase}${path}`;
}

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

const PHOTO_TYPE_LABELS = {
  stock: 'Stock Photos',
  charm: 'Charms',
  tag: 'Tags',
  packaging: 'Packaging',
  other: 'Other',
};

function groupPhotosByType(photos) {
  if (!photos || photos.length === 0) return {};

  const grouped = {};
  photos.forEach((photo) => {
    const type = photo.photo_type || 'stock';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(photo);
  });

  return grouped;
}

function BottleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isModeratorOrAdmin =
    user?.role === 'moderator' || user?.role === 'admin';

  const [bottle, setBottle] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [tastings, setTastings] = useState([]);
  const [wishlist, setWishlist] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Photo tab state
  const [activePhotoTab, setActivePhotoTab] = useState('stock');

  // edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    brand: '',
    distillery: '',
    type: '',
    proof: '',
    age_statement: '',
    // Bottle size (Migration 025)
    size_ml: '',
    description: '',
    release_name: '',
    is_single_barrel: false,
    is_limited_release: false,
    limited_bottle_count: '',
    finish_description: '',
    mash_bill: '',
    // Barrel tracking fields (Migration 011)
    barrel_date: '',
    bottle_date: '',
    barrel_number: '',
    rickhouse_location: '',
    msrp: '',
  });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [wishSubmitting, setWishSubmitting] = useState(false);
  const [wishError, setWishError] = useState('');

  // Photo error state (upload handled by PhotoUpload component)
  const [photoError, setPhotoError] = useState('');

  // Calculate user's average price paid for this bottle (for pricing card)
  const userAvgPricePaid = useMemo(() => {
    const pricesWithValues = inventory
      .filter(inv => inv.price_paid != null && inv.price_paid > 0)
      .map(inv => Number(inv.price_paid));
    
    if (pricesWithValues.length === 0) return null;
    
    const sum = pricesWithValues.reduce((a, b) => a + b, 0);
    return sum / pricesWithValues.length;
  }, [inventory]);

  // Check if bottle has barrel tracking info
  const hasBarrelInfo = bottle && (
    bottle.barrel_date ||
    bottle.bottle_date ||
    bottle.barrel_number ||
    bottle.rickhouse_location
  );

  // Group photos by type
  const photosByType = useMemo(() => {
    return groupPhotosByType(bottle?.photos || []);
  }, [bottle?.photos]);

  // Get available photo tabs (only types with photos)
  const availablePhotoTabs = useMemo(() => {
    const types = Object.keys(photosByType);
    // Ensure 'stock' is first if it exists
    return types.sort((a, b) => {
      if (a === 'stock') return -1;
      if (b === 'stock') return 1;
      return 0;
    });
  }, [photosByType]);

  // Auto-select first available tab when photos change
  useEffect(() => {
    if (availablePhotoTabs.length > 0 && !availablePhotoTabs.includes(activePhotoTab)) {
      setActivePhotoTab(availablePhotoTabs[0]);
    }
  }, [availablePhotoTabs, activePhotoTab]);

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
            api.get('/v1/inventory?limit=100&offset=0'),
            api.get('/v1/tastings?limit=100&offset=0'),
            api.get('/v1/wishlists?limit=100&offset=0'),
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
          allTastings.filter((t) => t.bottle && t.bottle.id === id)
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

  // Populate edit form when bottle loads or changes
  useEffect(() => {
    if (!bottle) return;
    setEditForm({
      name: bottle.name || '',
      brand: bottle.brand || '',
      distillery: bottle.distillery || '',
      type: bottle.type || '',
      proof: bottle.proof != null ? String(bottle.proof) : '',
      age_statement: bottle.age_statement || '',
      size_ml: bottle.size_ml != null ? String(bottle.size_ml) : '',
      description: bottle.description || '',
      release_name: bottle.release_name || '',
      is_single_barrel: !!bottle.is_single_barrel,
      is_limited_release: !!bottle.is_limited_release,
      limited_bottle_count:
        bottle.limited_bottle_count != null
          ? String(bottle.limited_bottle_count)
          : '',
      finish_description: bottle.finish_description || '',
      mash_bill: bottle.mash_bill || '',
      // Barrel tracking fields (Migration 011)
      barrel_date: bottle.barrel_date || '',
      bottle_date: bottle.bottle_date || '',
      barrel_number: bottle.barrel_number || '',
      rickhouse_location: bottle.rickhouse_location || '',
      msrp: bottle.msrp != null ? String(bottle.msrp) : '',
    });
  }, [bottle]);

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

  function handleEditChange(e) {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleEditCancel() {
    setEditError('');
    setEditMode(false);
    if (bottle) {
      setEditForm({
        name: bottle.name || '',
        brand: bottle.brand || '',
        distillery: bottle.distillery || '',
        type: bottle.type || '',
        proof: bottle.proof != null ? String(bottle.proof) : '',
        age_statement: bottle.age_statement || '',
        size_ml: bottle.size_ml != null ? String(bottle.size_ml) : '',
        description: bottle.description || '',
        release_name: bottle.release_name || '',
        is_single_barrel: !!bottle.is_single_barrel,
        is_limited_release: !!bottle.is_limited_release,
        limited_bottle_count:
          bottle.limited_bottle_count != null
            ? String(bottle.limited_bottle_count)
            : '',
        finish_description: bottle.finish_description || '',
        mash_bill: bottle.mash_bill || '',
        // Barrel tracking fields (Migration 011)
        barrel_date: bottle.barrel_date || '',
        bottle_date: bottle.bottle_date || '',
        barrel_number: bottle.barrel_number || '',
        rickhouse_location: bottle.rickhouse_location || '',
        msrp: bottle.msrp != null ? String(bottle.msrp) : '',
      });
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError('');

    try {
      if (!editForm.name.trim()) {
        setEditError('Name is required.');
        setEditSubmitting(false);
        return;
      }

      // Validate barrel dates (Migration 011)
      if (editForm.barrel_date && editForm.bottle_date) {
        const barrelDate = new Date(editForm.barrel_date);
        const bottleDate = new Date(editForm.bottle_date);
        if (bottleDate < barrelDate) {
          setEditError('Bottle date cannot be before barrel date.');
          setEditSubmitting(false);
          return;
        }
      }

      const payload = {
        name: editForm.name.trim(),
        brand: editForm.brand.trim() || undefined,
        distillery: editForm.distillery.trim() || undefined,
        type: editForm.type.trim() || undefined,
        proof: editForm.proof ? Number(editForm.proof) : undefined,
        age_statement: editForm.age_statement.trim() || undefined,
        size_ml: editForm.size_ml ? Number(editForm.size_ml) : null,
        description: editForm.description.trim() || undefined,
        release_name: editForm.release_name.trim() || undefined,
        is_single_barrel: editForm.is_single_barrel,
        is_limited_release: editForm.is_limited_release,
        limited_bottle_count: editForm.limited_bottle_count
          ? Number(editForm.limited_bottle_count)
          : undefined,
        finish_description:
          editForm.finish_description.trim() || undefined,
        mash_bill: editForm.mash_bill.trim() || undefined,
        // Barrel tracking fields (Migration 011)
        barrel_date: editForm.barrel_date || null,
        bottle_date: editForm.bottle_date || null,
        barrel_number: editForm.barrel_number.trim() || null,
        rickhouse_location: editForm.rickhouse_location.trim() || null,
        msrp: editForm.msrp ? Number(editForm.msrp) : null,
      };

      const res = await api.patch(`/v1/bottles/${id}`, payload);
      const updated = res.data?.bottle;

      if (updated) {
        setBottle((prev) => ({
          ...(prev || {}),
          ...updated,
          photos: prev?.photos || [],
          primary_photo_url:
            updated.primary_photo_url ??
            prev?.primary_photo_url ??
            null,
        }));
      }

      setEditMode(false);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        'Failed to update bottle.';
      setEditError(msg);
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleMakePrimary(photoId) {
    try {
      const res = await api.post(
        `/v1/bottles/${id}/photos/${photoId}/primary`
      );
      const { photos, primary_photo_url } = res.data || {};
      setBottle((prev) => ({
        ...(prev || {}),
        photos: photos || prev?.photos || [],
        primary_photo_url:
          primary_photo_url ?? prev?.primary_photo_url ?? null,
      }));
    } catch (err) {
      console.error(err);
      setPhotoError('Failed to set primary photo');
    }
  }

  async function handleRemovePhoto(photoId) {
    const confirmRemove = window.confirm(
      'Remove this photo? This cannot be undone.'
    );
    if (!confirmRemove) return;

    try {
      const res = await api.delete(
        `/v1/bottles/${id}/photos/${photoId}`
      );
      const { photos, primary_photo_url } = res.data || {};
      setBottle((prev) => ({
        ...(prev || {}),
        photos: photos || [],
        primary_photo_url:
          primary_photo_url ?? prev?.primary_photo_url ?? null,
      }));
    } catch (err) {
      console.error('Failed to remove photo', err);
      setPhotoError(
        err?.response?.data?.error || 'Failed to remove photo.'
      );
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
              Catalog
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
              <div className={styles.mainCardHeader}>
                <div>
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

              {bottle.status === 'pending' && (
                <div className={styles.statusBanner}>
                  This bottle has been submitted for catalog review.
                  You can still use it in your inventory and tastings,
                  but details may be updated by moderators.
                </div>
              )}

              {bottle.status === 'rejected' && isModeratorOrAdmin && (
                <div className={styles.statusBannerWarning}>
                  This bottle is currently rejected from the public
                  catalog. Review moderation details and consider
                  merging it into another bottle entry.
                </div>
              )}

              {!editMode && (
                <>
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
                      <div className={styles.infoLabel}>Size</div>
                      <div className={styles.infoValue}>
                        {getBottleSizeLabel(bottle.size_ml) || '—'}
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Age</div>
                      <div className={styles.infoValue}>
                        {bottle.age_statement || '—'}
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>
                        Single / Limited
                      </div>
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
                    {/* MSRP from Migration 011 */}
                    {bottle.msrp && (
                      <div className={styles.infoItem}>
                        <div className={styles.infoLabel}>MSRP</div>
                        <div className={styles.infoValue}>
                          ${Number(bottle.msrp).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {bottle.description && (
                    <div className={styles.descriptionBlock}>
                      <div className={styles.infoLabel}>
                        Description
                      </div>
                      <div className={styles.descriptionText}>
                        {bottle.description}
                      </div>
                    </div>
                  )}

                  {/* Barrel Information Display (Migration 011) */}
                  {hasBarrelInfo && (
                    <div className={styles.barrelSection}>
                      <BarrelInfoDisplay bottle={bottle} />
                    </div>
                  )}
                </>
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
                      Name *
                      <input
                        className={styles.editInput}
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                      />
                    </label>
                  </div>
                  <div className={styles.editRow}>
                    <label className={styles.editLabel}>
                      Brand
                      <input
                        className={styles.editInput}
                        type="text"
                        name="brand"
                        value={editForm.brand}
                        onChange={handleEditChange}
                      />
                    </label>
                    <label className={styles.editLabel}>
                      Distillery
                      <input
                        className={styles.editInput}
                        type="text"
                        name="distillery"
                        value={editForm.distillery}
                        onChange={handleEditChange}
                      />
                    </label>
                  </div>
                  <div className={styles.editRow}>
                    <label className={styles.editLabel}>
                      Type
                      <input
                        className={styles.editInput}
                        type="text"
                        name="type"
                        value={editForm.type}
                        onChange={handleEditChange}
                      />
                    </label>
                    <label className={styles.editLabel}>
                      Proof
                      <input
                        className={styles.editInput}
                        type="number"
                        name="proof"
                        value={editForm.proof}
                        onChange={handleEditChange}
                      />
                    </label>
                    <label className={styles.editLabel}>
                      Size
                      <select
                        className={styles.editInput}
                        name="size_ml"
                        value={editForm.size_ml}
                        onChange={handleEditChange}
                      >
                        <option value="">Select size...</option>
                        {BOTTLE_SIZES.map((size) => (
                          <option key={size.value} value={size.value}>
                            {size.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.editLabel}>
                      Age Statement
                      <input
                        className={styles.editInput}
                        type="text"
                        name="age_statement"
                        value={editForm.age_statement}
                        onChange={handleEditChange}
                      />
                    </label>
                  </div>

                  <div className={styles.editSectionTitle}>
                    Release details
                  </div>
                  <div className={styles.editRow}>
                    <label className={styles.editLabel}>
                      Release Name
                      <input
                        className={styles.editInput}
                        type="text"
                        name="release_name"
                        value={editForm.release_name}
                        onChange={handleEditChange}
                      />
                    </label>
                    <label className={styles.editLabel}>
                      MSRP ($)
                      <input
                        className={styles.editInput}
                        type="number"
                        step="0.01"
                        name="msrp"
                        value={editForm.msrp}
                        onChange={handleEditChange}
                        placeholder="e.g. 59.99"
                      />
                    </label>
                  </div>
                  <div className={styles.editRow}>
                    <div className={styles.editCheckboxRow}>
                      <label className={styles.editCheckboxLabel}>
                        <input
                          type="checkbox"
                          name="is_single_barrel"
                          checked={editForm.is_single_barrel}
                          onChange={handleEditChange}
                        />
                        Single barrel
                      </label>
                      <label className={styles.editCheckboxLabel}>
                        <input
                          type="checkbox"
                          name="is_limited_release"
                          checked={editForm.is_limited_release}
                          onChange={handleEditChange}
                        />
                        Limited release
                      </label>
                      <label className={styles.editLabel}>
                        Total bottles
                        <input
                          className={styles.editInput}
                          type="number"
                          name="limited_bottle_count"
                          value={editForm.limited_bottle_count}
                          onChange={handleEditChange}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Barrel Tracking Section (Migration 011) */}
                  {(editForm.is_single_barrel || editForm.is_limited_release) && (
                    <BarrelTrackingSection
                      formData={editForm}
                      onChange={handleEditChange}
                    />
                  )}

                  <div className={styles.editRow}>
                    <label className={styles.editLabel}>
                      Finish
                      <input
                        className={styles.editInput}
                        type="text"
                        name="finish_description"
                        value={editForm.finish_description}
                        onChange={handleEditChange}
                      />
                    </label>
                    <label className={styles.editLabel}>
                      Mash Bill
                      <input
                        className={styles.editInput}
                        type="text"
                        name="mash_bill"
                        value={editForm.mash_bill}
                        onChange={handleEditChange}
                      />
                    </label>
                  </div>
                  <div className={styles.editRow}>
                    <label className={styles.editLabel}>
                      Description
                      <textarea
                        className={`${styles.editInput} ${styles.editTextarea}`}
                        name="description"
                        rows={4}
                        value={editForm.description}
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

              {/* Photos section */}
              <div className={styles.photosSection}>
                <div className={styles.photosHeader}>
                  <div className={styles.infoLabel}>Photos</div>
                </div>

                {photoError && (
                  <div className={styles.photoError}>{photoError}</div>
                )}

                <PhotoUpload
                  bottleId={id}
                  onUploaded={(photo, photos, primaryUrl) => {
                    setBottle((prev) => ({
                      ...(prev || {}),
                      photos: photos || [],
                      primary_photo_url: primaryUrl ?? prev?.primary_photo_url ?? null,
                    }));
                    setPhotoError('');
                  }}
                  onError={(msg) => setPhotoError(msg)}
                />

                {bottle.photos && bottle.photos.length > 0 ? (
                  <>
                    {/* Photo type tabs */}
                    {availablePhotoTabs.length > 1 && (
                      <div className={styles.photoTabs}>
                        {availablePhotoTabs.map((type) => (
                          <button
                            key={type}
                            type="button"
                            className={
                              activePhotoTab === type
                                ? styles.photoTabActive
                                : styles.photoTab
                            }
                            onClick={() => setActivePhotoTab(type)}
                          >
                            {PHOTO_TYPE_LABELS[type] || type}
                            <span className={styles.photoTabCount}>
                              {photosByType[type]?.length || 0}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Photos for active tab */}
                    <div className={styles.photoGrid}>
                      {(photosByType[activePhotoTab] || []).map((photo) => (
                        <div
                          key={photo.id}
                          className={styles.photoCard}
                        >
                          <div className={styles.photoThumbWrap}>
                            <img
                              src={photo.image_url}
                              alt={photo.caption || bottle.name}
                              className={styles.photoThumb}
                            />
                            {/* Photo type badge */}
                            <span className={styles.photoTypeBadge}>
                              {PHOTO_TYPE_LABELS[photo.photo_type || 'stock']}
                            </span>
                          </div>
                          <div className={styles.photoMetaRow}>
                            <div className={styles.photoCaption}>
                              {photo.caption || '\u00A0'}
                            </div>
                            <div className={styles.photoPrimaryArea}>
                              {photo.is_primary ? (
                                <span className={styles.photoPrimaryBadge}>
                                  Primary
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.photoPrimaryButton}
                                  onClick={() =>
                                    handleMakePrimary(photo.id)
                                  }
                                >
                                  Make primary
                                </button>
                              )}
                              <button
                                type="button"
                                className={styles.photoRemoveButton}
                                onClick={() =>
                                  handleRemovePhoto(photo.id)
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={styles.photoEmpty}>
                    No photos yet. Upload a bottle shot to use in
                    gallery and list views.
                  </div>
                )}
              </div>
            </div>

            <div className={styles.sideCard}>
              {/* Pricing Intelligence Card (Migration 011) */}
              <BottlePricingCard 
                bottleId={id}
                userPricePaid={userAvgPricePaid}
              />

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
                Collection items and tastings below are filtered to this bottle.
              </div>
            </div>
          </div>

          <div className={styles.sectionsRow}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Your Collection</h2>
                <span className={styles.sectionCount}>
                  {inventory.length} item
                  {inventory.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className={styles.tableWrapper}>
                {inventory.length === 0 ? (
                  <div className={styles.message}>
                    You don&apos;t currently have this bottle in your
                    collection.
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Identity</th>
                        <th>Price Paid</th>
                        <th>Purchased</th>
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
                            <td>
                              {inv.purchase_date
                                ? new Date(inv.purchase_date).toLocaleDateString()
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
