import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import styles from '../styles/ShowcaseDetailPage.module.scss';

function ShowcaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showcase, setShowcase] = useState(null);
  const [bottles, setBottles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchShowcase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/v1/showcases/${id}`);
      const showcaseData = response.data?.showcase || response.data;
      setShowcase(showcaseData);
      setBottles(showcaseData.bottles || []);
      setEditForm({
        title: showcaseData.title || '',
        description: showcaseData.description || '',
        is_public: showcaseData.is_public || false,
      });
    } catch (err) {
      console.error('Error fetching showcase:', err);
      setError(err?.response?.data?.error || 'Failed to load showcase');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShowcase();
  }, [fetchShowcase]);

  async function handleSave() {
    setSaving(true);
    try {
      const response = await api.patch(`/v1/showcases/${id}`, editForm);
      setShowcase({ ...showcase, ...response.data?.showcase });
      setEditing(false);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this showcase?')) return;
    try {
      await api.delete(`/v1/showcases/${id}`);
      navigate('/app/showcases');
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to delete');
    }
  }

  async function handleRemoveBottle(inventoryId) {
    try {
      await api.delete(`/v1/showcases/${id}/bottles/${inventoryId}`);
      setBottles((prev) => prev.filter((b) => b.inventory_id !== inventoryId && b.id !== inventoryId));
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to remove bottle');
    }
  }

  async function handleReorder(fromIndex, toIndex) {
    const reordered = [...bottles];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setBottles(reordered);

    // Save new order to backend
    try {
      await api.patch(`/v1/showcases/${id}/reorder`, {
        bottle_order: reordered.map((b, idx) => ({
          inventory_id: b.inventory_id || b.id,
          sort_order: idx,
        })),
      });
    } catch (err) {
      console.error('Failed to save order:', err);
    }
  }

  function getBottleName(bottle) {
    return bottle.bottle?.name || bottle.inventory?.bottle?.name || bottle.name || 'Unknown Bottle';
  }

  function getBottleImage(bottle) {
    return bottle.bottle?.primary_photo_url || bottle.inventory?.bottle?.primary_photo_url || bottle.image_url;
  }

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <Link to="/app/showcases">← Back to Showcases</Link>
        </div>
      </div>
    );
  }

  if (!showcase) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Showcase not found</p>
          <Link to="/app/showcases">← Back to Showcases</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/app/showcases" className={styles.backLink}>
        ← Back to Showcases
      </Link>

      <header className={styles.header}>
        {editing ? (
          <input
            type="text"
            className={styles.titleInput}
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            placeholder="Showcase title"
          />
        ) : (
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>{showcase.title}</h1>
            {showcase.is_public && <span className={styles.publicBadge}>🌍 Public</span>}
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

      {/* Description */}
      {editing ? (
        <div className={styles.editSection}>
          <textarea
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            placeholder="Describe this showcase..."
            rows={3}
          />
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={editForm.is_public}
              onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
            />
            Make this showcase public
          </label>
        </div>
      ) : (
        showcase.description && (
          <p className={styles.description}>{showcase.description}</p>
        )
      )}

      {/* Bottles Section */}
      <section className={styles.bottlesSection}>
        <div className={styles.sectionHeader}>
          <h2>Bottles ({bottles.length})</h2>
          <button className={styles.addButton} onClick={() => setShowAddModal(true)}>
            + Add Bottles
          </button>
        </div>

        {bottles.length === 0 ? (
          <div className={styles.emptyBottles}>
            <p>No bottles in this showcase yet.</p>
            <button className={styles.addButton} onClick={() => setShowAddModal(true)}>
              Add Your First Bottle
            </button>
          </div>
        ) : (
          <div className={styles.bottleGrid}>
            {bottles.map((bottle, index) => (
              <div key={bottle.inventory_id || bottle.id} className={styles.bottleCard}>
                <div className={styles.bottleImage}>
                  {getBottleImage(bottle) ? (
                    <img src={getBottleImage(bottle)} alt={getBottleName(bottle)} />
                  ) : (
                    <span className={styles.bottlePlaceholder}>
                      {getBottleName(bottle).charAt(0)}
                    </span>
                  )}
                </div>
                <div className={styles.bottleInfo}>
                  <h4 className={styles.bottleName}>{getBottleName(bottle)}</h4>
                  <p className={styles.bottleDistillery}>
                    {bottle.bottle?.distillery || bottle.inventory?.bottle?.distillery || ''}
                  </p>
                  {bottle.notes && (
                    <p className={styles.bottleNotes}>"{bottle.notes}"</p>
                  )}
                </div>
                <div className={styles.bottleActions}>
                  {index > 0 && (
                    <button
                      className={styles.moveButton}
                      onClick={() => handleReorder(index, index - 1)}
                      title="Move up"
                    >
                      ↑
                    </button>
                  )}
                  {index < bottles.length - 1 && (
                    <button
                      className={styles.moveButton}
                      onClick={() => handleReorder(index, index + 1)}
                      title="Move down"
                    >
                      ↓
                    </button>
                  )}
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveBottle(bottle.inventory_id || bottle.id)}
                    title="Remove from showcase"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Bottles Modal */}
      {showAddModal && (
        <AddBottlesModal
          showcaseId={id}
          existingBottleIds={bottles.map((b) => b.inventory_id || b.id)}
          onClose={() => setShowAddModal(false)}
          onAdded={(newBottles) => {
            setBottles((prev) => [...prev, ...newBottles]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddBottlesModal({ showcaseId, existingBottleIds, onClose, onAdded }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchInventory() {
      try {
        const response = await api.get('/v1/inventory?limit=100&offset=0');
        const items = response.data?.inventory || [];
        // Filter out already added bottles
        const available = items.filter((i) => !existingBottleIds.includes(i.id));
        setInventory(available);
      } catch (err) {
        console.error('Error fetching inventory:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, [existingBottleIds]);

  function toggleSelect(inventoryId) {
    setSelected((prev) =>
      prev.includes(inventoryId)
        ? prev.filter((id) => id !== inventoryId)
        : [...prev, inventoryId]
    );
  }

  async function handleAdd() {
    if (selected.length === 0) return;

    setSaving(true);
    try {
      const response = await api.post(`/v1/showcases/${showcaseId}/bottles`, {
        inventory_ids: selected,
      });
      const addedBottles = response.data?.bottles || selected.map((id) => {
        const inv = inventory.find((i) => i.id === id);
        return { inventory_id: id, bottle: inv?.bottle };
      });
      onAdded(addedBottles);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to add bottles');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>Add Bottles to Showcase</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <div className={styles.modalContent}>
          {loading ? (
            <div className={styles.loading}>Loading inventory...</div>
          ) : inventory.length === 0 ? (
            <div className={styles.emptyInventory}>
              <p>All your bottles are already in this showcase, or you have no inventory.</p>
            </div>
          ) : (
            <div className={styles.inventoryList}>
              {inventory.map((item) => (
                <label key={item.id} className={styles.inventoryItem}>
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                  />
                  <span className={styles.itemName}>
                    {item.bottle?.name || 'Unknown'}
                  </span>
                  <span className={styles.itemMeta}>
                    {item.bottle?.distillery} • {item.status}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || selected.length === 0}
          >
            {saving ? 'Adding...' : `Add ${selected.length} Bottle${selected.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShowcaseDetailPage;
