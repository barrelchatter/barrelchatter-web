import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import styles from '../styles/ShowcasesPage.module.scss';

function ShowcasesPage() {
  const [showcases, setShowcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchShowcases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/v1/showcases?limit=100');
      setShowcases(response.data?.showcases || response.data?.collection_showcases || []);
    } catch (err) {
      console.error('Error fetching showcases:', err);
      setError(err?.response?.data?.error || 'Failed to load showcases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShowcases();
  }, [fetchShowcases]);

  async function handleDelete(showcaseId) {
    if (!window.confirm('Delete this showcase?')) return;
    try {
      await api.delete(`/v1/showcases/${showcaseId}`);
      setShowcases((prev) => prev.filter((s) => s.id !== showcaseId));
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to delete showcase');
    }
  }

  async function handleTogglePublic(showcase) {
    try {
      const response = await api.patch(`/v1/showcases/${showcase.id}`, {
        is_public: !showcase.is_public,
      });
      setShowcases((prev) =>
        prev.map((s) => (s.id === showcase.id ? { ...s, ...response.data?.showcase } : s))
      );
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to update showcase');
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>My Showcases</h1>
          <p className={styles.subtitle}>
            Curated collections to highlight your best bottles
          </p>
        </div>
        <button className={styles.createButton} onClick={() => setShowCreateModal(true)}>
          + New Showcase
        </button>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading showcases...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : showcases.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎨</div>
          <h3>No Showcases Yet</h3>
          <p>Create showcases to highlight themed collections from your inventory.</p>
          <p className={styles.emptyExamples}>
            Examples: "My Single Barrels", "Kentucky Gems", "Special Occasions Only"
          </p>
          <button className={styles.emptyButton} onClick={() => setShowCreateModal(true)}>
            Create Your First Showcase
          </button>
        </div>
      ) : (
        <div className={styles.showcaseGrid}>
          {showcases.map((showcase) => (
            <ShowcaseCard
              key={showcase.id}
              showcase={showcase}
              onDelete={() => handleDelete(showcase.id)}
              onTogglePublic={() => handleTogglePublic(showcase)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateShowcaseModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newShowcase) => {
            setShowcases((prev) => [newShowcase, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function ShowcaseCard({ showcase, onDelete, onTogglePublic }) {
  const bottleCount = showcase.bottle_count || showcase.bottles?.length || 0;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>
          <Link to={`/app/showcases/${showcase.id}`}>{showcase.title}</Link>
        </h3>
        <button
          className={`${styles.visibilityToggle} ${showcase.is_public ? styles.public : ''}`}
          onClick={onTogglePublic}
          title={showcase.is_public ? 'Make private' : 'Make public'}
        >
          {showcase.is_public ? '🌍 Public' : '🔒 Private'}
        </button>
      </div>

      {showcase.description && (
        <p className={styles.cardDescription}>{showcase.description}</p>
      )}

      <div className={styles.cardStats}>
        <span className={styles.bottleCount}>
          🥃 {bottleCount} bottle{bottleCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Bottle Previews */}
      {showcase.bottles && showcase.bottles.length > 0 && (
        <div className={styles.bottlePreviews}>
          {showcase.bottles.slice(0, 4).map((bottle, idx) => (
            <div key={bottle.id || idx} className={styles.bottlePreview}>
              {bottle.image_url || bottle.inventory?.bottle?.primary_photo_url ? (
                <img
                  src={bottle.image_url || bottle.inventory?.bottle?.primary_photo_url}
                  alt={bottle.name || bottle.inventory?.bottle?.name}
                />
              ) : (
                <span className={styles.bottlePlaceholder}>
                  {(bottle.name || bottle.inventory?.bottle?.name || '?').charAt(0)}
                </span>
              )}
            </div>
          ))}
          {showcase.bottles.length > 4 && (
            <div className={styles.bottlePreviewMore}>
              +{showcase.bottles.length - 4}
            </div>
          )}
        </div>
      )}

      <div className={styles.cardActions}>
        <Link to={`/app/showcases/${showcase.id}`} className={styles.viewButton}>
          View & Edit
        </Link>
        <button className={styles.deleteButton} onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

function CreateShowcaseModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    is_public: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await api.post('/v1/showcases', {
        title: form.title.trim(),
        description: form.description.trim() || null,
        is_public: form.is_public,
      });
      onCreated(response.data?.showcase || response.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create showcase');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>Create Showcase</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., My Single Barrels, Top Shelf, etc."
            />
          </div>

          <div className={styles.field}>
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What makes this collection special?"
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              />
              Make this showcase public
            </label>
            <span className={styles.fieldHint}>
              Public showcases can be viewed by other users
            </span>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Showcase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShowcasesPage;
