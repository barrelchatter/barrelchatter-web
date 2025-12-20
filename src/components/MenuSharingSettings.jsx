import React, { useState, useEffect } from 'react';
import { menuSettingsAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import styles from '../styles/MenuSharingSettings.module.scss';

function MenuSharingSettings() {
  const { addToast } = useToast();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Form state
  const [menuTitle, setMenuTitle] = useState('');
  const [sharingEnabled, setSharingEnabled] = useState(false);

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const response = await menuSettingsAPI.get();
        const data = response.data;
        setSettings(data);
        setMenuTitle(data.menu_title || '');
        setSharingEnabled(data.menu_sharing_enabled || false);
      } catch (err) {
        console.error('Error fetching menu settings:', err);
        addToast('Failed to load menu settings', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [addToast]);

  // Toggle sharing
  const handleToggleSharing = async () => {
    const newValue = !sharingEnabled;
    setSharingEnabled(newValue);
    setSaving(true);

    try {
      const response = await menuSettingsAPI.update({ menu_sharing_enabled: newValue });
      setSettings(prev => ({
        ...prev,
        ...response.data,
      }));
      addToast(newValue ? 'Menu sharing enabled' : 'Menu sharing disabled', 'success');
    } catch (err) {
      console.error('Error updating menu settings:', err);
      setSharingEnabled(!newValue); // Revert
      addToast('Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save title
  const handleSaveTitle = async () => {
    setSaving(true);
    try {
      const response = await menuSettingsAPI.update({ menu_title: menuTitle || null });
      setSettings(prev => ({
        ...prev,
        ...response.data,
      }));
      addToast('Menu title saved', 'success');
    } catch (err) {
      console.error('Error saving menu title:', err);
      addToast('Failed to save title', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Regenerate token
  const handleRegenerateToken = async () => {
    if (!window.confirm('This will invalidate your current share link. Anyone with the old link will no longer be able to access your menu. Continue?')) {
      return;
    }

    setRegenerating(true);
    try {
      const response = await menuSettingsAPI.regenerateToken();
      setSettings(prev => ({
        ...prev,
        menu_share_token: response.data.menu_share_token,
        share_url: response.data.share_url,
      }));
      addToast('Share link regenerated', 'success');
    } catch (err) {
      console.error('Error regenerating token:', err);
      addToast('Failed to regenerate link', 'error');
    } finally {
      setRegenerating(false);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (!settings?.share_url) return;

    try {
      await navigator.clipboard.writeText(settings.share_url);
      addToast('Link copied to clipboard', 'success');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      addToast('Failed to copy link', 'error');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading menu settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Public Menu Sharing</h3>
        <p className={styles.description}>
          Share a public link to your whiskey menu. Only bottles marked as "sealed" or "open" will be visible.
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className={styles.row}>
        <div className={styles.rowLabel}>
          <span>Enable Public Menu</span>
          <span className={styles.rowHint}>
            {settings?.item_count || 0} bottles will be visible
          </span>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={sharingEnabled}
            onChange={handleToggleSharing}
            disabled={saving}
          />
          <span className={styles.toggleSlider}></span>
        </label>
      </div>

      {/* Menu Title */}
      <div className={styles.row}>
        <div className={styles.rowLabel}>
          <span>Menu Title</span>
          <span className={styles.rowHint}>Customize the heading on your public menu</span>
        </div>
        <div className={styles.inputGroup}>
          <input
            type="text"
            className={styles.input}
            value={menuTitle}
            onChange={(e) => setMenuTitle(e.target.value)}
            placeholder="My Whiskey Collection"
            disabled={saving}
          />
          <button
            className={styles.saveButton}
            onClick={handleSaveTitle}
            disabled={saving}
          >
            Save
          </button>
        </div>
      </div>

      {/* Share URL */}
      {sharingEnabled && settings?.share_url && (
        <div className={styles.shareSection}>
          <div className={styles.rowLabel}>
            <span>Share Link</span>
            <span className={styles.rowHint}>Anyone with this link can view your menu</span>
          </div>
          <div className={styles.urlRow}>
            <input
              type="text"
              className={styles.urlInput}
              value={settings.share_url}
              readOnly
            />
            <button
              className={styles.copyButton}
              onClick={handleCopyLink}
            >
              Copy
            </button>
            <a
              className={styles.previewButton}
              href={settings.share_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Preview
            </a>
          </div>
          <button
            className={styles.regenerateButton}
            onClick={handleRegenerateToken}
            disabled={regenerating}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate Link'}
          </button>
          <p className={styles.regenerateHint}>
            Regenerating will invalidate your current link
          </p>
        </div>
      )}
    </div>
  );
}

export default MenuSharingSettings;
