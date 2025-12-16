import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/client';
import styles from '../styles/StorageLocationsPage.module.scss';

/**
 * StorageLocationsPage
 * 
 * Manages hierarchical storage locations for user inventory.
 * Supports parent-child relationships (e.g., "Home" -> "Living Room" -> "Cabinet A")
 */

function StorageLocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    parent_id: '',
    type: 'room',
    is_default: false,
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(null);

  async function loadLocations() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/v1/storage-locations');
      setLocations(res.data?.locations || res.data || []);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || 'Failed to load storage locations.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLocations();
  }, []);

  // Build hierarchical tree for display
  const locationTree = useMemo(() => {
    const map = new Map();
    const roots = [];

    // First pass: create map
    locations.forEach((loc) => {
      map.set(loc.id, { ...loc, children: [] });
    });

    // Second pass: build tree
    locations.forEach((loc) => {
      const node = map.get(loc.id);
      if (loc.parent_id && map.has(loc.parent_id)) {
        map.get(loc.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by sort_order, then name
    const sortNodes = (nodes) => {
      nodes.sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return (a.sort_order || 0) - (b.sort_order || 0);
        }
        return (a.name || '').localeCompare(b.name || '');
      });
      nodes.forEach((n) => sortNodes(n.children));
    };

    sortNodes(roots);
    return roots;
  }, [locations]);

  // Flatten tree for parent select (excluding current item and descendants)
  const parentOptions = useMemo(() => {
    const options = [{ id: '', name: '(No parent - top level)' }];

    const flatten = (nodes, depth = 0) => {
      nodes.forEach((node) => {
        // Don't allow selecting self or descendants as parent
        if (editingId && node.id === editingId) return;

        const prefix = '\u00A0\u00A0'.repeat(depth);
        options.push({
          id: node.id,
          name: `${prefix}${node.name}`,
        });
        flatten(node.children, depth + 1);
      });
    };

    flatten(locationTree);
    return options;
  }, [locationTree, editingId]);

  function resetForm() {
    setForm({
      name: '',
      description: '',
      parent_id: '',
      type: 'room',
      is_default: false,
    });
    setFormError('');
    setEditingId(null);
    setShowForm(false);
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormError('');
  }

  function startEdit(loc) {
    setEditingId(loc.id);
    setForm({
      name: loc.name || '',
      description: loc.description || '',
      parent_id: loc.parent_id || '',
      type: loc.location_type || loc.type || 'room',
      is_default: loc.is_default || false,
    });
    setFormError('');
    setShowForm(true);
  }

  function startCreate(parentId = null) {
    setEditingId(null);
    setForm({
      name: '',
      description: '',
      parent_id: parentId || '',
      type: parentId ? 'shelf' : 'room',
      is_default: false,
    });
    setFormError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        parent_id: form.parent_id || null,
        type: form.type || 'room',
        is_default: form.is_default,
      };

      if (editingId) {
        await api.patch(`/v1/storage-locations/${editingId}`, payload);
      } else {
        await api.post('/v1/storage-locations', payload);
      }

      await loadLocations();
      resetForm();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || 'Failed to save storage location.';
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDelete(loc) {
    const hasChildren = locations.some((l) => l.parent_id === loc.id);
    const message = hasChildren
      ? `Delete "${loc.name}" and move its children to the parent level?`
      : `Delete "${loc.name}"? This cannot be undone.`;

    if (!window.confirm(message)) return;

    setDeleteLoading(loc.id);
    try {
      await api.delete(`/v1/storage-locations/${loc.id}`);
      await loadLocations();
      if (editingId === loc.id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || 'Failed to delete location.';
      setError(msg);
    } finally {
      setDeleteLoading(null);
    }
  }

  async function handleSetDefault(loc) {
    try {
      await api.patch(`/v1/storage-locations/${loc.id}`, { is_default: true });
      await loadLocations();
    } catch (err) {
      console.error(err);
    }
  }

  // Render a location node and its children
  function renderLocationNode(node, depth = 0) {
    const isDeleting = deleteLoading === node.id;
    const inventoryCount = node.inventory_count || 0;

    return (
      <div key={node.id} className={styles.locationNode}>
        <div
          className={styles.locationRow}
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          <div className={styles.locationInfo}>
            <div className={styles.locationName}>
              {node.name}
              {node.is_default && (
                <span className={styles.defaultBadge}>Default</span>
              )}
            </div>
            {node.description && (
              <div className={styles.locationDescription}>
                {node.description}
              </div>
            )}
            <div className={styles.locationMeta}>
              {inventoryCount > 0 && (
                <span className={styles.inventoryCount}>
                  {inventoryCount} bottle{inventoryCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>

          <div className={styles.locationActions}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => startCreate(node.id)}
              title="Add child location"
            >
              + Child
            </button>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => startEdit(node)}
            >
              Edit
            </button>
            {!node.is_default && (
              <button
                type="button"
                className={styles.actionButtonMuted}
                onClick={() => handleSetDefault(node)}
                title="Set as default location"
              >
                Set Default
              </button>
            )}
            <button
              type="button"
              className={styles.actionButtonDanger}
              onClick={() => handleDelete(node)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className={styles.locationChildren}>
            {node.children.map((child) => renderLocationNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Storage Locations</h1>
          <p className={styles.subtitle}>
            Organize where you keep your bottles. Create a hierarchy like
            "Home → Living Room → Cabinet A".
          </p>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => startCreate()}
        >
          {showForm && !editingId ? 'Cancel' : 'Add Location'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>
            {editingId ? 'Edit Location' : 'New Location'}
          </h2>

          {formError && <div className={styles.formError}>{formError}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <label className={styles.label}>
                Name *
                <input
                  type="text"
                  name="name"
                  className={styles.input}
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g., Home Bar, Office Cabinet"
                  autoFocus
                />
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>
                Parent Location
                <select
                  name="parent_id"
                  className={styles.input}
                  value={form.parent_id}
                  onChange={handleFormChange}
                >
                  {parentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.label}>
                Type
                <select
                  name="type"
                  className={styles.input}
                  value={form.type}
                  onChange={handleFormChange}
                >
                  <option value="room">Room</option>
                  <option value="cabinet">Cabinet</option>
                  <option value="shelf">Shelf</option>
                  <option value="closet">Closet</option>
                  <option value="safe">Safe</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>
                Description
                <input
                  type="text"
                  name="description"
                  className={styles.input}
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Optional notes about this location"
                />
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_default"
                  checked={form.is_default}
                  onChange={handleFormChange}
                />
                Set as default location for new inventory
              </label>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={resetForm}
                disabled={formSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={formSubmitting}
              >
                {formSubmitting
                  ? 'Saving...'
                  : editingId
                  ? 'Update Location'
                  : 'Create Location'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className={styles.message}>Loading storage locations...</div>
      )}

      {!loading && !error && locations.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📍</div>
          <h3>No storage locations yet</h3>
          <p>
            Create locations to organize your collection. For example:
            "Home", "Office", or more specific like "Home → Bar → Top Shelf".
          </p>
          <button
            type="button"
            className={styles.emptyButton}
            onClick={() => startCreate()}
          >
            Create Your First Location
          </button>
        </div>
      )}

      {!loading && !error && locations.length > 0 && (
        <div className={styles.locationList}>
          {locationTree.map((node) => renderLocationNode(node))}
        </div>
      )}

      <div className={styles.helpSection}>
        <h3>Tips</h3>
        <ul>
          <li>
            Create top-level locations for major areas (Home, Office, Storage
            Unit)
          </li>
          <li>
            Add child locations for specific spots (Shelf 1, Cabinet A, etc.)
          </li>
          <li>
            Set a default location to speed up adding new bottles
          </li>
          <li>
            Locations with bottles can still be deleted — bottles will keep
            their location label but lose the link
          </li>
        </ul>
      </div>
    </div>
  );
}

export default StorageLocationsPage;