import React, { useState, useEffect } from 'react';
import { X, Check } from 'react-feather';
import { menusAPI } from '../api/client';
import styles from '../styles/MenuEditModal.module.scss';

const THEMES = [
  { id: 'rustic', name: 'Rustic', description: 'Warm wood tones, classic bourbon bar feel' },
  { id: 'elegant', name: 'Elegant', description: 'Refined serif typography, sophisticated' },
  { id: 'modern', name: 'Modern', description: 'Clean, minimal, high contrast' },
];

const COLOR_MODES = [
  { id: 'dark', name: 'Dark' },
  { id: 'light', name: 'Light' },
];

function MenuEditModal({ menu, storageLocations, onSave, onClose }) {
  const isEditing = !!menu;

  // Form state
  const [name, setName] = useState(menu?.name || '');
  const [theme, setTheme] = useState(menu?.theme || 'rustic');
  const [colorMode, setColorMode] = useState(menu?.color_mode || 'dark');
  const [includeChildLocations, setIncludeChildLocations] = useState(
    menu?.include_child_locations ?? true
  );
  const [selectedLocationIds, setSelectedLocationIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Load current menu's storage locations when editing
  useEffect(() => {
    if (menu?.id) {
      loadMenuLocations();
    }
  }, [menu?.id]);

  const loadMenuLocations = async () => {
    if (!menu?.id) return;
    setLoadingLocations(true);
    try {
      const res = await menusAPI.get(menu.id);
      const locationIds = res.data.menu.storage_locations?.map(loc => loc.id) || [];
      setSelectedLocationIds(locationIds);
    } catch (err) {
      console.error('Error loading menu locations:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  // Toggle location selection
  const toggleLocation = (locationId) => {
    setSelectedLocationIds(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        theme,
        color_mode: colorMode,
        include_child_locations: includeChildLocations,
        storage_location_ids: selectedLocationIds,
      });
    } finally {
      setSaving(false);
    }
  };

  // Group locations by parent for hierarchical display
  const rootLocations = storageLocations.filter(loc => !loc.parent_id);
  const getChildren = (parentId) =>
    storageLocations.filter(loc => loc.parent_id === parentId);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>{isEditing ? 'Edit Menu' : 'Create Menu'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.content}>
            {/* Menu Name */}
            <div className={styles.field}>
              <label htmlFor="menuName" className={styles.label}>
                Menu Name
              </label>
              <input
                id="menuName"
                type="text"
                className={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Office Bar, Home Den"
                required
                autoFocus
              />
            </div>

            {/* Theme Selection */}
            <div className={styles.field}>
              <label className={styles.label}>Theme</label>
              <div className={styles.themeGrid}>
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.themeOption} ${theme === t.id ? styles.selected : ''}`}
                    onClick={() => setTheme(t.id)}
                  >
                    <div className={styles.themePreview} data-theme={t.id}>
                      <span className={styles.previewTitle}>Aa</span>
                    </div>
                    <span className={styles.themeName}>{t.name}</span>
                    <span className={styles.themeDesc}>{t.description}</span>
                    {theme === t.id && (
                      <div className={styles.checkmark}>
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Mode */}
            <div className={styles.field}>
              <label className={styles.label}>Color Mode</label>
              <div className={styles.colorModeButtons}>
                {COLOR_MODES.map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    className={`${styles.colorModeButton} ${colorMode === mode.id ? styles.selected : ''}`}
                    onClick={() => setColorMode(mode.id)}
                  >
                    <span className={styles.colorModeIcon} data-mode={mode.id}></span>
                    {mode.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Storage Locations */}
            <div className={styles.field}>
              <label className={styles.label}>
                Storage Locations
                <span className={styles.labelHint}>
                  (leave empty to include all bottles)
                </span>
              </label>
              {loadingLocations ? (
                <div className={styles.loadingLocations}>Loading...</div>
              ) : storageLocations.length === 0 ? (
                <div className={styles.noLocations}>
                  No storage locations defined.
                </div>
              ) : (
                <div className={styles.locationList}>
                  {rootLocations.map(loc => (
                    <div key={loc.id}>
                      <label className={styles.locationItem}>
                        <input
                          type="checkbox"
                          checked={selectedLocationIds.includes(loc.id)}
                          onChange={() => toggleLocation(loc.id)}
                        />
                        <span className={styles.locationName}>{loc.name}</span>
                        <span className={styles.locationType}>{loc.location_type}</span>
                      </label>
                      {getChildren(loc.id).map(child => (
                        <label key={child.id} className={`${styles.locationItem} ${styles.childLocation}`}>
                          <input
                            type="checkbox"
                            checked={selectedLocationIds.includes(child.id)}
                            onChange={() => toggleLocation(child.id)}
                          />
                          <span className={styles.locationName}>{child.name}</span>
                          <span className={styles.locationType}>{child.location_type}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Include Child Locations Toggle */}
            <div className={styles.field}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={includeChildLocations}
                  onChange={e => setIncludeChildLocations(e.target.checked)}
                />
                <span className={styles.toggleSwitch}></span>
                <span className={styles.toggleText}>
                  Include child locations
                  <span className={styles.toggleHint}>
                    Show bottles from nested storage locations
                  </span>
                </span>
              </label>
            </div>
          </div>

          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving || !name.trim()}
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Menu'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default MenuEditModal;
