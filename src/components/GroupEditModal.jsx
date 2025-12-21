import React, { useState, useEffect } from 'react';
import { X, Users } from 'react-feather';
import { groupsAPI } from '../api/client';
import styles from '../styles/GroupEditModal.module.scss';

/**
 * GroupEditModal
 *
 * Modal form for creating or editing a group.
 *
 * Props:
 *   group     - Existing group to edit (null for create)
 *   onClose   - Callback when modal is closed
 *   onSave    - Callback when group is saved: (group) => void
 */
function GroupEditModal({ group, onClose, onSave }) {
  const isEditing = !!group;

  const [form, setForm] = useState({
    name: '',
    description: '',
    is_discoverable: false,
    cover_image_url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with existing group data
  useEffect(() => {
    if (group) {
      setForm({
        name: group.name || '',
        description: group.description || '',
        is_discoverable: group.is_discoverable || false,
        cover_image_url: group.cover_image_url || '',
      });
    }
  }, [group]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!form.name.trim()) {
      setError('Group name is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        is_discoverable: form.is_discoverable,
        cover_image_url: form.cover_image_url.trim() || null,
      };

      let result;
      if (isEditing) {
        result = await groupsAPI.update(group.id, payload);
      } else {
        result = await groupsAPI.create(payload);
      }

      onSave?.(result.data.group);
    } catch (err) {
      console.error('Failed to save group:', err);
      const msg = err?.response?.data?.error || 'Failed to save group';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <Users size={20} />
            <h2>{isEditing ? 'Edit Group' : 'Create Group'}</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button">
            <X size={20} />
          </button>
        </header>

        <form className={styles.content} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>
              Group Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              className={styles.input}
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Bourbon Club"
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              name="description"
              className={styles.textarea}
              value={form.description}
              onChange={handleChange}
              placeholder="What's this group about?"
              disabled={submitting}
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Cover Image URL</label>
            <input
              type="url"
              name="cover_image_url"
              className={styles.input}
              value={form.cover_image_url}
              onChange={handleChange}
              placeholder="https://..."
              disabled={submitting}
            />
            <p className={styles.hint}>Optional. Add a cover image for your group.</p>
          </div>

          <div className={styles.checkboxField}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="is_discoverable"
                checked={form.is_discoverable}
                onChange={handleChange}
                disabled={submitting}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>
                Make group discoverable
              </span>
            </label>
            <p className={styles.hint}>
              Allow others to find and view this group in the Discover tab.
            </p>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GroupEditModal;
