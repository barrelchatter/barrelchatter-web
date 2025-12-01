import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/AdminTagsPage.module.scss';

function AdminTagsPage() {
  const { user } = useAuth();

  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nfcUid, setNfcUid] = useState('');
  const [label, setLabel] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user || user.role !== 'admin') {
    return (
      <div className={styles.page}>
        <div className={styles.accessDenied}>
          Admin access required to manage tag registrations.
        </div>
      </div>
    );
  }

  async function loadTags() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/v1/admin/tags');
      setTags(res.data.tags || []);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to load admin tag list.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTags();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    const uid = nfcUid.trim();
    if (!uid) {
      setFormError('NFC UID is required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/v1/admin/tags', {
        nfc_uid: uid,
        label: label.trim() || undefined,
      });
      setNfcUid('');
      setLabel('');
      await loadTags();
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error ||
        'Failed to register/update tag.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Admin Tags</h1>
          <p className={styles.subtitle}>
            Register NFC UIDs and manage labels for tags before users
            claim them.
          </p>
        </div>
      </div>

      <div className={styles.formCard}>
        <h2 className={styles.formTitle}>Register or Update Tag</h2>
        <p className={styles.formHint}>
          If the NFC UID already exists, this will update its label. Otherwise
          it will create a new unassigned tag.
        </p>
        {formError && <div className={styles.formError}>{formError}</div>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label className={styles.label}>
              NFC UID *
              <input
                className={styles.input}
                type="text"
                value={nfcUid}
                onChange={(e) => setNfcUid(e.target.value)}
                placeholder="e.g. TEST-TAG-001"
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>
              Label
              <input
                className={styles.input}
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Home - Cabinet A / Shelf 2"
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Tag'}
            </button>
          </div>
        </form>
      </div>

      {loading && <div className={styles.message}>Loading tags...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && tags.length === 0 && (
        <div className={styles.message}>No tags registered yet.</div>
      )}

      {!loading && !error && tags.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>NFC UID</th>
                <th>Label</th>
                <th>Status</th>
                <th>User</th>
                <th>Inventory</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td>{tag.nfc_uid}</td>
                  <td>{tag.label || '—'}</td>
                  <td>{tag.status}</td>
                  <td>
                    {tag.registered_to_user_id
                      ? tag.registered_to_user_id
                      : '—'}
                  </td>
                  <td>
                    {tag.registered_to_inventory_id
                      ? tag.registered_to_inventory_id
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminTagsPage;
