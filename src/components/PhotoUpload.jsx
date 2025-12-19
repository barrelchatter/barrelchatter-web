import React, { useState, useRef } from 'react';
import { useSpacesUpload } from '../hooks/useSpacesUpload';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import styles from '../styles/PhotoUpload.module.scss';

/**
 * PhotoUpload component for uploading bottle photos to DO Spaces.
 *
 * Props:
 *   bottleId    - The bottle ID to associate the photo with
 *   onUploaded  - Callback when upload completes: (photo, allPhotos, primaryUrl) => void
 *   onError     - Optional error callback
 */
function PhotoUpload({ bottleId, onUploaded, onError }) {
  const { user } = useAuth();
  const isModeratorOrAdmin = user?.role === 'moderator' || user?.role === 'admin';

  const fileInputRef = useRef(null);
  const [caption, setCaption] = useState('');
  const [photoType, setPhotoType] = useState('stock');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [registering, setRegistering] = useState(false);

  const { upload, uploading, progress, error: uploadError, reset } = useSpacesUpload();

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      onError?.('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      onError?.('File size must be less than 10 MB');
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

  function handleClear() {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setPhotoType('stock');
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleUpload() {
    if (!selectedFile || !bottleId) return;

    try {
      // Step 1: Upload to Spaces
      const { publicUrl } = await upload(selectedFile, {
        context: 'bottle',
        contextId: bottleId,
      });

      // Step 2: Register the photo with our API
      // Admin/moderator can directly add photos, regular users submit for review
      setRegistering(true);
      const endpoint = isModeratorOrAdmin
        ? `/v1/bottles/${bottleId}/photos`
        : `/v1/bottles/${bottleId}/photo-submissions`;

      const response = await api.post(endpoint, {
        image_url: publicUrl,
        caption: caption.trim() || null,
        photo_type: photoType,
      });

      const { photo, photos, primary_photo_url } = response.data;

      // Clear form
      handleClear();

      // Notify parent
      onUploaded?.(photo, photos, primary_photo_url);
    } catch (err) {
      console.error('Photo upload failed:', err);
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to upload photo';
      onError?.(message);
    } finally {
      setRegistering(false);
    }
  }

  const isProcessing = uploading || registering;

  return (
    <div className={styles.uploadContainer}>
      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
      />

      {/* Preview or dropzone */}
      {previewUrl ? (
        <div className={styles.previewContainer}>
          <img src={previewUrl} alt="Preview" className={styles.preview} />
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
      ) : (
        <button
          type="button"
          className={styles.dropzone}
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          <span className={styles.dropzoneIcon}>📷</span>
          <span className={styles.dropzoneText}>
            Click to select a photo
          </span>
          <span className={styles.dropzoneHint}>
            JPEG, PNG, WebP, or GIF (max 10 MB)
          </span>
        </button>
      )}

      {/* Photo Type & Caption inputs */}
      {selectedFile && (
        <>
          <div className={styles.photoTypeRow}>
            <label className={styles.photoTypeLabel}>
              Photo Type
              <select
                className={styles.photoTypeSelect}
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value)}
                disabled={isProcessing}
              >
                <option value="stock">Stock Photo</option>
                <option value="charm">Charm</option>
                <option value="tag">Tag</option>
                <option value="packaging">Packaging</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          <div className={styles.captionRow}>
            <input
              type="text"
              className={styles.captionInput}
              placeholder="Add a caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isProcessing}
            />
          </div>
        </>
      )}

      {/* Progress bar */}
      {isProcessing && (
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${registering ? 100 : progress}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {registering ? 'Saving...' : `Uploading... ${progress}%`}
          </span>
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className={styles.error}>{uploadError}</div>
      )}

      {/* Upload button */}
      {selectedFile && !isProcessing && (
        <button
          type="button"
          className={styles.uploadButton}
          onClick={handleUpload}
        >
          Upload Photo
        </button>
      )}
    </div>
  );
}

export default PhotoUpload;