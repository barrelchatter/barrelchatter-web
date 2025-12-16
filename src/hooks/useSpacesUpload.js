import { useState, useCallback } from 'react';
import api from '../api/client';

/**
 * Hook for uploading files directly to DO Spaces via presigned URLs.
 * 
 * Usage:
 *   const { upload, uploading, progress, error } = useSpacesUpload();
 *   
 *   const result = await upload(file, { context: 'bottle', contextId: bottleId });
 *   // result = { key, publicUrl }
 */
export function useSpacesUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  /**
   * Upload a file to DO Spaces
   * 
   * @param {File} file - The file to upload
   * @param {Object} options
   * @param {string} options.context - Upload context: 'bottle', 'inventory', 'user', 'tasting'
   * @param {string} options.contextId - Optional ID for organizing
   * @returns {Promise<{key: string, publicUrl: string}>}
   */
  const upload = useCallback(async (file, options = {}) => {
    const { context = 'uploads', contextId } = options;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Get presigned URL from our API
      console.log('[Upload] Step 1: Getting presigned URL...');
      const presignResponse = await api.post('/v1/uploads/presign', {
        filename: file.name,
        contentType: file.type,
        context,
        contextId,
      });

      const { uploadUrl, key, publicUrl } = presignResponse.data;
      console.log('[Upload] Step 1 complete. Key:', key);

      // Step 2: Upload directly to Spaces using the presigned URL
      console.log('[Upload] Step 2: Uploading to Spaces...');
      await uploadToSpaces(uploadUrl, file, (pct) => {
        setProgress(pct);
      });
      console.log('[Upload] Step 2 complete. File uploaded to Spaces.');

      // Step 3: Optionally confirm the upload
      console.log('[Upload] Step 3: Confirming upload...');
      await api.post('/v1/uploads/confirm', {
        key,
        publicUrl,
        context,
        contextId,
      });
      console.log('[Upload] Step 3 complete. Upload confirmed.');

      setProgress(100);
      setUploading(false);

      return { key, publicUrl };
    } catch (err) {
      console.error('[Upload] Failed at some step:', err);
      console.error('[Upload] Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Upload failed';
      setError(message);
      setUploading(false);
      throw err;
    }
  }, []);

  /**
   * Reset the upload state
   */
  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    upload,
    uploading,
    progress,
    error,
    reset,
  };
}

/**
 * Upload file directly to S3/Spaces using presigned URL
 * 
 * @param {string} presignedUrl - The presigned PUT URL
 * @param {File} file - The file to upload
 * @param {function} onProgress - Progress callback (0-100)
 */
async function uploadToSpaces(presignedUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        onProgress?.(pct);
      }
    });

    xhr.addEventListener('load', () => {
      console.log('[Upload] Spaces response status:', xhr.status);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        console.error('[Upload] Spaces error response:', xhr.responseText);
        reject(new Error(`Upload to Spaces failed with status ${xhr.status}: ${xhr.responseText}`));
      }
    });

    xhr.addEventListener('error', (event) => {
      console.error('[Upload] XHR error event:', event);
      reject(new Error('Upload failed - network error (possible CORS issue)'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('x-amz-acl', 'public-read');
    // Important: Don't send auth headers to S3
    xhr.send(file);
  });
}

export default useSpacesUpload;