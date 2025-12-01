import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../api/client';
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

function BottleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bottle, setBottle] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [tastings, setTastings] = useState([]);
  const [wishlist, setWishlist] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    brand: '',
    distillery: '',
    type: '',
    proof: '',
    age_statement: '',
    description: '',
    release_name: '',
    is_single_barrel: false,
    is_limited_release: false,
    limited_bottle_count: '',
    finish_description: '',
    mash_bill: '',
  });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [wishSubmitting, setWishSubmitting] = useState(false);
  const [wishError, setWishError] = useState('');

  // photo upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

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

      const payload = {
        name: editForm.name.trim(),
        brand: editForm.brand.trim() || undefined,
        distillery: editForm.distillery.trim() || undefined,
        type: editForm.type.trim() || undefined,
        proof: editForm.proof ? Number(editForm.proof) : undefined,
        age_statement: editForm.age_statement.trim() || undefined,
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

  function handlePhotoFileChange(e) {
    const file = e.target.files && e.target.files[0];
    setUploadFile(file || null);
  }

  async function handlePhotoUpload(e) {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please choose an image file first.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadCaption.trim()) {
        formData.append('caption', uploadCaption.trim());
      }

      const res = await api.post(
        `/v1/bottles/${id}/photos/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      const newPhoto = res.data?.photo;

      if (newPhoto) {
        setBottle((prev) => {
          const prevPhotos = prev?.photos || [];
          const newPhotos = [newPhoto, ...prevPhotos];
          return {
            ...(prev || {}),
            photos: newPhotos,
            primary_photo_url: newPhoto.is_primary
              ? newPhoto.image_url
              : prev?.primary_photo_url ?? null,
          };
        });
      }

      setUploadFile(null);
      setUploadCaption('');
      if (e.target && e.target.reset) {
        e.target.reset();
      }
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        'Failed to upload photo.';
      setUploadError(msg);
    } finally {
      setUploading(false);
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
      // low priority: we can show a toast later
    }
  }

  async function handleRemovePhoto(photoId) {
    // optional: simple confirmation
    const confirm = window.confirm(
      'Remove this photo? This cannot be undone.'
    );
    if (!confirm) return;

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
      // If you want, you can set a photo-specific error here
      setUploadError(
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

                {uploadError && (
                  <div className={styles.photoError}>{uploadError}</div>
                )}

                <form
                  className={styles.photoUploadForm}
                  onSubmit={handlePhotoUpload}
                >
                  <div className={styles.photoUploadRow}>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.photoFileInput}
                      onChange={handlePhotoFileChange}
                    />
                    <input
                      type="text"
                      className={styles.photoCaptionInput}
                      placeholder="Caption (optional)"
                      value={uploadCaption}
                      onChange={(e) =>
                        setUploadCaption(e.target.value)
                      }
                    />
                    <button
                      type="submit"
                      className={styles.photoUploadButton}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </form>

                {bottle.photos && bottle.photos.length > 0 ? (
                  <div className={styles.photoGrid}>
                    {bottle.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className={styles.photoCard}
                      >
                        <div className={styles.photoThumbWrap}>
                          <img
                            src={resolveImageUrl(photo.image_url)}
                            alt={photo.caption || bottle.name}
                            className={styles.photoThumb}
                          />
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
                                onClick={() => handleMakePrimary(photo.id)}
                              >
                                Make primary
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.photoRemoveButton}
                              onClick={() => handleRemovePhoto(photo.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.photoEmpty}>
                    No photos yet. Upload a bottle shot to use in
                    gallery and list views.
                  </div>
                )}
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
