import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import LogTastingModal from '../components/LogTastingModal';
import styles from '../styles/TastingSessionDetailPage.module.scss';

function TastingSessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [tastings, setTastings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showTastingModal, setShowTastingModal] = useState(false);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/v1/tasting-sessions/${id}`);
      const sessionData = response.data?.session || response.data;
      setSession(sessionData);
      setEditForm({
        title: sessionData.title || '',
        description: sessionData.description || '',
        session_date: sessionData.session_date || '',
        location: sessionData.location || '',
        notes: sessionData.notes || '',
        is_public: sessionData.is_public || false,
      });

      // Fetch tastings for this session
      try {
        const tastingsRes = await api.get(`/v1/tastings?session_id=${id}&limit=100`);
        setTastings(tastingsRes.data?.tastings || []);
      } catch (err) {
        console.log('Could not fetch session tastings:', err);
      }
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err?.response?.data?.error || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  async function handleSave() {
    setSaving(true);
    try {
      const response = await api.patch(`/v1/tasting-sessions/${id}`, editForm);
      setSession(response.data?.session || response.data);
      setEditing(false);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this tasting session? Tastings will be unlinked but not deleted.')) {
      return;
    }
    try {
      await api.delete(`/v1/tasting-sessions/${id}`);
      navigate('/app/tasting-sessions');
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to delete');
    }
  }

  async function handleRemoveTasting(tastingId) {
    if (!window.confirm('Remove this tasting from the session?')) return;
    try {
      await api.patch(`/v1/tastings/${tastingId}`, { session_id: null });
      setTastings((prev) => prev.filter((t) => t.id !== tastingId));
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to remove tasting');
    }
  }

  function getBottleName(tasting) {
    return tasting.bottle?.name || tasting.inventory?.bottle?.name || 'Unknown Bottle';
  }

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <Link to="/app/tasting-sessions">← Back to Sessions</Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Session not found</p>
          <Link to="/app/tasting-sessions">← Back to Sessions</Link>
        </div>
      </div>
    );
  }

  // Calculate session stats
  const avgRating = tastings.length > 0
    ? tastings.filter((t) => t.rating).reduce((sum, t) => sum + t.rating, 0) / tastings.filter((t) => t.rating).length
    : null;
  const totalPours = tastings.reduce((sum, t) => sum + (t.pour_amount_oz || 0), 0);

  return (
    <div className={styles.container}>
      <Link to="/app/tasting-sessions" className={styles.backLink}>
        ← Back to Sessions
      </Link>

      <header className={styles.header}>
        {editing ? (
          <div className={styles.editHeader}>
            <input
              type="text"
              className={styles.titleInput}
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Session title"
            />
          </div>
        ) : (
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>{session.title}</h1>
            {session.is_public && <span className={styles.publicBadge}>Public</span>}
          </div>
        )}

        <div className={styles.headerActions}>
          {editing ? (
            <>
              <button className={styles.cancelButton} onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </button>
              <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button className={styles.editButton} onClick={() => setEditing(true)}>
                Edit
              </button>
              <button className={styles.deleteButton} onClick={handleDelete}>
                Delete
              </button>
            </>
          )}
        </div>
      </header>

      {/* Session Info */}
      <section className={styles.infoSection}>
        {editing ? (
          <div className={styles.editForm}>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Date</label>
                <input
                  type="date"
                  value={editForm.session_date}
                  onChange={(e) => setEditForm({ ...editForm, session_date: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Where was this?"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className={styles.field}>
              <label>Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={4}
                placeholder="Session notes, thoughts, memories..."
              />
            </div>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={editForm.is_public}
                onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
              />
              Make this session public
            </label>
          </div>
        ) : (
          <>
            <div className={styles.metaRow}>
              {session.session_date && (
                <span className={styles.metaItem}>
                  📅 {new Date(session.session_date).toLocaleDateString()}
                </span>
              )}
              {session.location && (
                <span className={styles.metaItem}>📍 {session.location}</span>
              )}
            </div>

            {session.description && (
              <p className={styles.description}>{session.description}</p>
            )}

            {session.notes && (
              <div className={styles.notesSection}>
                <h3>Session Notes</h3>
                <p>{session.notes}</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Stats */}
      <section className={styles.statsSection}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{tastings.length}</span>
          <span className={styles.statLabel}>Tastings</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalPours.toFixed(1)} oz</span>
          <span className={styles.statLabel}>Total Poured</span>
        </div>
        {avgRating && (
          <div className={styles.statCard}>
            <span className={styles.statValue}>{avgRating.toFixed(1)}/10</span>
            <span className={styles.statLabel}>Avg Rating</span>
          </div>
        )}
      </section>

      {/* Tastings */}
      <section className={styles.tastingsSection}>
        <div className={styles.sectionHeader}>
          <h2>Tastings in this Session</h2>
          <button className={styles.addButton} onClick={() => setShowTastingModal(true)}>
            + Add Tasting
          </button>
        </div>

        {tastings.length === 0 ? (
          <div className={styles.emptyTastings}>
            <p>No tastings logged yet for this session.</p>
            <button className={styles.addButton} onClick={() => setShowTastingModal(true)}>
              Log Your First Pour
            </button>
          </div>
        ) : (
          <div className={styles.tastingsList}>
            {tastings.map((tasting, index) => (
              <div key={tasting.id} className={styles.tastingCard}>
                <div className={styles.tastingNumber}>{index + 1}</div>
                <div className={styles.tastingContent}>
                  <h4 className={styles.tastingBottle}>{getBottleName(tasting)}</h4>
                  <div className={styles.tastingMeta}>
                    {tasting.pour_amount_oz && <span>{tasting.pour_amount_oz} oz</span>}
                    {tasting.rating && (
                      <span className={styles.rating}>
                        {'★'.repeat(Math.round(tasting.rating / 2))}
                        {'☆'.repeat(5 - Math.round(tasting.rating / 2))}
                        {tasting.rating}/10
                      </span>
                    )}
                  </div>
                  {tasting.notes && <p className={styles.tastingNotes}>{tasting.notes}</p>}
                </div>
                <button
                  className={styles.removeButton}
                  onClick={() => handleRemoveTasting(tasting.id)}
                  title="Remove from session"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Log Tasting Modal */}
      {showTastingModal && (
        <LogTastingModal
          isOpen={showTastingModal}
          onClose={() => setShowTastingModal(false)}
          onSuccess={(newTasting) => {
            // Link tasting to session
            api.patch(`/v1/tastings/${newTasting.id}`, { session_id: id })
              .then(() => {
                setTastings((prev) => [...prev, newTasting]);
              })
              .catch((err) => console.error('Failed to link tasting:', err));
            setShowTastingModal(false);
          }}
        />
      )}
    </div>
  );
}

export default TastingSessionDetailPage;
