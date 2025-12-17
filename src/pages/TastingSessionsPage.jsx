import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import styles from '../styles/TastingSessionsPage.module.scss';

function TastingSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, past

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/v1/tasting-sessions?limit=100&offset=0');
      setSessions(response.data?.sessions || response.data?.tasting_sessions || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err?.response?.data?.error || 'Failed to load tasting sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Filter sessions
  const today = new Date().toISOString().split('T')[0];
  const filteredSessions = sessions.filter((s) => {
    if (filter === 'upcoming') return s.session_date >= today;
    if (filter === 'past') return s.session_date < today;
    return true;
  });

  // Sort by date (upcoming first, then past)
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    return new Date(b.session_date || b.created_at) - new Date(a.session_date || a.created_at);
  });

  async function handleDelete(sessionId) {
    if (!window.confirm('Delete this tasting session?')) return;
    try {
      await api.delete(`/v1/tasting-sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to delete session');
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Tasting Sessions</h1>
          <p className={styles.subtitle}>
            Organize your tastings into flights and events
          </p>
        </div>
        <button className={styles.createButton} onClick={() => setShowCreateModal(true)}>
          + New Session
        </button>
      </header>

      {/* Filters */}
      <div className={styles.filters}>
        {['all', 'upcoming', 'past'].map((f) => (
          <button
            key={f}
            className={`${styles.filterButton} ${filter === f ? styles.filterActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loading}>Loading sessions...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : sortedSessions.length === 0 ? (
        <div className={styles.empty}>
          <p>No tasting sessions yet.</p>
          <button className={styles.emptyButton} onClick={() => setShowCreateModal(true)}>
            Create Your First Session
          </button>
        </div>
      ) : (
        <div className={styles.sessionGrid}>
          {sortedSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={() => handleDelete(session.id)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newSession) => {
            setSessions((prev) => [newSession, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function SessionCard({ session, onDelete }) {
  const tastingCount = session.tasting_count || session.tastings?.length || 0;
  const isPast = session.session_date && new Date(session.session_date) < new Date();

  return (
    <div className={`${styles.card} ${isPast ? styles.cardPast : ''}`}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>
          <Link to={`/app/tasting-sessions/${session.id}`}>{session.title}</Link>
        </h3>
        {session.is_public && <span className={styles.publicBadge}>Public</span>}
      </div>

      {session.description && (
        <p className={styles.cardDescription}>{session.description}</p>
      )}

      <div className={styles.cardMeta}>
        {session.session_date && (
          <span className={styles.metaItem}>
            📅 {new Date(session.session_date).toLocaleDateString()}
          </span>
        )}
        {session.location && (
          <span className={styles.metaItem}>📍 {session.location}</span>
        )}
        <span className={styles.metaItem}>🥃 {tastingCount} tastings</span>
      </div>

      <div className={styles.cardActions}>
        <Link to={`/app/tasting-sessions/${session.id}`} className={styles.viewButton}>
          View Details
        </Link>
        <button className={styles.deleteButton} onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

function CreateSessionModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    session_date: '',
    location: '',
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
      const response = await api.post('/v1/tasting-sessions', {
        title: form.title.trim(),
        description: form.description.trim() || null,
        session_date: form.session_date || null,
        location: form.location.trim() || null,
        is_public: form.is_public,
      });
      onCreated(response.data?.session || response.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create session');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>New Tasting Session</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Friday Night Flight, Birthday Tasting"
            />
          </div>

          <div className={styles.field}>
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's this session about?"
              rows={3}
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Date</label>
              <input
                type="date"
                value={form.session_date}
                onChange={(e) => setForm({ ...form, session_date: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label>Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Home, Bob's Place"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              />
              Make this session public
            </label>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TastingSessionsPage;
