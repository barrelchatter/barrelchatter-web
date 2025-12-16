import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/client';
import styles from '../styles/StorageLocationSelect.module.scss';

/**
 * StorageLocationSelect
 * 
 * A dropdown component for selecting storage locations.
 * Shows hierarchical structure with indentation.
 * Includes option to create new location inline.
 * 
 * Props:
 *   value        - Current selected location ID (or null)
 *   onChange     - Callback when selection changes: (locationId, location) => void
 *   allowCreate  - Show "Create new..." option (default: true)
 *   showLegacy   - Show legacy location_label input as fallback (default: true)
 *   legacyValue  - Current legacy location_label value
 *   onLegacyChange - Callback for legacy input changes
 *   disabled     - Disable the select
 *   className    - Additional CSS class
 */
function StorageLocationSelect({
  value,
  onChange,
  allowCreate = true,
  showLegacy = true,
  legacyValue = '',
  onLegacyChange,
  disabled = false,
  className = '',
}) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create new location inline
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createParentId, setCreateParentId] = useState('');
  const [createType, setCreateType] = useState('shelf');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  async function loadLocations() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/v1/storage-locations');
      setLocations(res.data?.locations || res.data || []);
    } catch (err) {
      console.error('Failed to load storage locations:', err);
      // Don't show error - just fall back to legacy input
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLocations();
  }, []);

  // Build flat list with indentation for select options
  const options = useMemo(() => {
    const result = [];
    const map = new Map();
    const roots = [];

    // Build tree
    locations.forEach((loc) => {
      map.set(loc.id, { ...loc, children: [] });
    });

    locations.forEach((loc) => {
      const node = map.get(loc.id);
      if (loc.parent_id && map.has(loc.parent_id)) {
        map.get(loc.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort
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

    // Flatten with depth
    const flatten = (nodes, depth = 0) => {
      nodes.forEach((node) => {
        result.push({
          id: node.id,
          name: node.name,
          depth,
          is_default: node.is_default,
          full_path: node.full_path || node.name,
        });
        flatten(node.children, depth + 1);
      });
    };
    flatten(roots);

    return result;
  }, [locations]);

  // Find default location
  const defaultLocation = useMemo(() => {
    return locations.find((l) => l.is_default);
  }, [locations]);

  function handleSelectChange(e) {
    const selectedId = e.target.value;

    if (selectedId === '__create__') {
      setShowCreate(true);
      return;
    }

    if (selectedId === '__legacy__') {
      onChange?.(null, null);
      return;
    }

    const location = locations.find((l) => l.id === selectedId) || null;
    onChange?.(selectedId || null, location);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    if (!createName.trim()) return;

    setCreateSubmitting(true);
    try {
      const res = await api.post('/v1/storage-locations', {
        name: createName.trim(),
        parent_id: createParentId || null,
        type: createType || 'shelf',
      });

      const newLocation = res.data?.location || res.data;

      // Reload locations
      await loadLocations();

      // Select the new location
      if (newLocation?.id) {
        onChange?.(newLocation.id, newLocation);
      }

      // Reset create form
      setShowCreate(false);
      setCreateName('');
      setCreateParentId('');
      setCreateType('shelf');
    } catch (err) {
      console.error('Failed to create location:', err);
    } finally {
      setCreateSubmitting(false);
    }
  }

  // If no locations exist and we have legacy support, show legacy input
  const showLegacyInput = showLegacy && locations.length === 0 && !loading;

  return (
    <div className={`${styles.container} ${className}`}>
      {loading && (
        <div className={styles.loading}>Loading locations...</div>
      )}

      {!loading && !showLegacyInput && (
        <>
          <select
            className={styles.select}
            value={value || ''}
            onChange={handleSelectChange}
            disabled={disabled || showCreate}
          >
            <option value="">
              {defaultLocation
                ? `Select location (default: ${defaultLocation.name})`
                : 'Select storage location...'}
            </option>

            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {'\u00A0\u00A0'.repeat(opt.depth)}
                {opt.name}
                {opt.is_default ? ' ★' : ''}
              </option>
            ))}

            {allowCreate && (
              <option value="__create__">+ Create new location...</option>
            )}

            {showLegacy && (
              <option value="__legacy__">
                — Use custom text instead —
              </option>
            )}
          </select>

          {/* Show selected location path */}
          {value && (
            <div className={styles.selectedPath}>
              {options.find((o) => o.id === value)?.full_path || ''}
            </div>
          )}
        </>
      )}

      {/* Legacy fallback input */}
      {showLegacyInput && (
        <div className={styles.legacyContainer}>
          <input
            type="text"
            className={styles.legacyInput}
            value={legacyValue}
            onChange={(e) => onLegacyChange?.(e.target.value)}
            placeholder="e.g., Home - Cabinet A / Shelf 2"
            disabled={disabled}
          />
          <div className={styles.legacyHint}>
            No storage locations set up yet.{' '}
            <button
              type="button"
              className={styles.legacyLink}
              onClick={() => setShowCreate(true)}
            >
              Create one
            </button>
          </div>
        </div>
      )}

      {/* Custom text input when legacy mode selected */}
      {!showLegacyInput && value === null && showLegacy && !showCreate && (
        <div className={styles.legacyContainer}>
          <input
            type="text"
            className={styles.legacyInput}
            value={legacyValue}
            onChange={(e) => onLegacyChange?.(e.target.value)}
            placeholder="Enter custom location text..."
            disabled={disabled}
          />
        </div>
      )}

      {/* Inline create form */}
      {showCreate && (
        <div className={styles.createForm}>
          <form onSubmit={handleCreateSubmit}>
            <div className={styles.createRow}>
              <input
                type="text"
                className={styles.createInput}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="New location name..."
                autoFocus
                disabled={createSubmitting}
              />
              <select
                className={styles.createTypeSelect}
                value={createType}
                onChange={(e) => setCreateType(e.target.value)}
                disabled={createSubmitting}
              >
                <option value="room">Room</option>
                <option value="cabinet">Cabinet</option>
                <option value="shelf">Shelf</option>
                <option value="closet">Closet</option>
                <option value="safe">Safe</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className={styles.createRow}>
              <select
                className={styles.createParentSelect}
                value={createParentId}
                onChange={(e) => setCreateParentId(e.target.value)}
                disabled={createSubmitting}
              >
                <option value="">No parent (top level)</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {'\u00A0\u00A0'.repeat(opt.depth)}
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.createActions}>
              <button
                type="button"
                className={styles.createCancelButton}
                onClick={() => {
                  setShowCreate(false);
                  setCreateName('');
                  setCreateParentId('');
                  setCreateType('shelf');
                }}
                disabled={createSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.createSubmitButton}
                disabled={createSubmitting || !createName.trim()}
              >
                {createSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

export default StorageLocationSelect;