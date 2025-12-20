import React, { useState, useRef } from 'react';
import { inventoryPhotosAPI } from '../api/client';
import { useSpacesUpload } from '../hooks/useSpacesUpload';
import { useToast } from '../context/ToastContext';
import styles from '../styles/InventoryPhotoGallery.module.scss';

/**
 * InventoryPhotoGallery component for managing photos of inventory items.
 *
 * Props:
 *   inventoryId        - The inventory item ID
 *   photos             - Array of photo objects from API
 *   primaryPhotoUrl    - URL of primary photo (if set)
 *   catalogPhotoUrl    - URL of catalog/bottle photo
 *   onPhotosChange     - Callback when photos are updated
 */
function InventoryPhotoGallery({
  inventoryId,
  photos = [],
  primaryPhotoUrl,
  catalogPhotoUrl,
  onPhotosChange,
}) {
  const { success, error: showError } = useToast();
  const { upload, uploading, progress } = useSpacesUpload();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading2, setUploading2] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);

  // Handle file selection
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      showError('File size must be less than 10 MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  // Clear selected file
  function handleClear() {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Upload photo
  async function handleUpload() {
    if (!selectedFile || !inventoryId) return;

    try {
      setUploading2(true);

      // Step 1: Upload to Spaces
      const { publicUrl, key } = await upload(selectedFile, {
        context: 'inventory',
        contextId: inventoryId,
      });

      // Step 2: Register photo with API
      const response = await inventoryPhotosAPI.add(inventoryId, {
        image_url: publicUrl,
        s3_key: key,
        caption: caption.trim() || null,
        is_primary: photos.length === 0, // First photo is primary
      });

      success('Photo uploaded successfully');
      handleClear();

      // Notify parent
      if (onPhotosChange) {
        onPhotosChange(response.data);
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      const message = err?.response?.data?.error || err?.message || 'Failed to upload photo';
      showError(message);
    } finally {
      setUploading2(false);
    }
  }

  // Set photo as primary
  async function handleSetPrimary(photoId) {
    try {
      const response = await inventoryPhotosAPI.setPrimary(inventoryId, photoId);
      success('Primary photo updated');

      // Notify parent
      if (onPhotosChange) {
        onPhotosChange(response.data);
      }
    } catch (err) {
      console.error('Failed to set primary photo:', err);
      const message = err?.response?.data?.error || err?.message || 'Failed to set primary photo';
      showError(message);
    }
  }

  // Delete photo
  async function handleDelete(photoId) {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      setDeletingPhotoId(photoId);
      const response = await inventoryPhotosAPI.delete(inventoryId, photoId);
      success('Photo deleted successfully');

      // Notify parent
      if (onPhotosChange) {
        onPhotosChange(response.data);
      }
    } catch (err) {
      console.error('Failed to delete photo:', err);
      const message = err?.response?.data?.error || err?.message || 'Failed to delete photo';
      showError(message);
    } finally {
      setDeletingPhotoId(null);
    }
  }

  const isProcessing = uploading || uploading2;
  const hasUserPhotos = photos && photos.length > 0;

  return (
    <div className={styles.galleryContainer}>
      <div className={styles.galleryHeader}>
        <h3 className={styles.galleryTitle}>Photos</h3>
        <button
          className={styles.addPhotoButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          + Add Photo
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
      />

      {/* Upload preview */}
      {previewUrl && (
        <div className={styles.uploadPreview}>
          <div className={styles.previewImageContainer}>
            <img src={previewUrl} alt="Preview" className={styles.previewImage} />
            {!isProcessing && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={handleClear}
                title="Remove"
              >
                ✕
              </button>
            )}
          </div>

          <div className={styles.uploadControls}>
            <input
              type="text"
              className={styles.captionInput}
              placeholder="Add a caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isProcessing}
            />

            {isProcessing && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className={styles.progressText}>
                  {uploading2 ? 'Saving...' : `Uploading... ${progress}%`}
                </span>
              </div>
            )}

            {!isProcessing && (
              <button
                type="button"
                className={styles.uploadButton}
                onClick={handleUpload}
              >
                Upload Photo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Photo grid */}
      <div className={styles.photoGrid}>
        {/* User photos */}
        {photos.map((photo) => (
          <div key={photo.id} className={styles.photoCard}>
            <div
              className={styles.photoImageContainer}
              onClick={() => setLightboxPhoto(photo)}
            >
              <img
                src={photo.image_url}
                alt={photo.caption || 'Inventory photo'}
                className={styles.photoImage}
              />
              {photo.is_primary && (
                <div className={styles.primaryBadge} title="Primary photo">
                  ⭐
                </div>
              )}
              <div className={styles.photoOverlay}>
                <div className={styles.photoActions}>
                  {!photo.is_primary && (
                    <button
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(photo.id);
                      }}
                      title="Set as primary"
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.id);
                    }}
                    disabled={deletingPhotoId === photo.id}
                    title="Delete photo"
                  >
                    {deletingPhotoId === photo.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
            {photo.caption && (
              <div className={styles.photoCaption}>{photo.caption}</div>
            )}
          </div>
        ))}

        {/* Catalog photo with "Add Your Photo" overlay */}
        {!hasUserPhotos && catalogPhotoUrl && (
          <div className={styles.photoCard}>
            <div className={styles.photoImageContainer}>
              <img
                src={catalogPhotoUrl}
                alt="Catalog photo"
                className={styles.photoImage}
              />
              <div className={styles.catalogOverlay}>
                <button
                  className={styles.catalogAddButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  + Add Your Photo
                </button>
              </div>
            </div>
            <div className={styles.photoCaption}>Catalog Photo</div>
          </div>
        )}

        {/* Empty state */}
        {!hasUserPhotos && !catalogPhotoUrl && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📷</div>
            <p className={styles.emptyText}>No photos yet</p>
            <button
              className={styles.emptyAddButton}
              onClick={() => fileInputRef.current?.click()}
            >
              Add First Photo
            </button>
          </div>
        )}
      </div>

      {/* Lightbox modal */}
      {lightboxPhoto && (
        <div className={styles.lightbox} onClick={() => setLightboxPhoto(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.lightboxClose}
              onClick={() => setLightboxPhoto(null)}
            >
              ✕
            </button>
            <img
              src={lightboxPhoto.image_url}
              alt={lightboxPhoto.caption || 'Photo'}
              className={styles.lightboxImage}
            />
            {lightboxPhoto.caption && (
              <div className={styles.lightboxCaption}>{lightboxPhoto.caption}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryPhotoGallery;
