import React, { useState, useEffect } from 'react';
import { Link, Eye, ExternalLink, Trash2, Copy, RefreshCw, Plus, Edit2, Download, MapPin } from 'react-feather';
import { menusAPI, storageLocationsAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import MenuEditModal from '../components/MenuEditModal';
import MenuPdfExport from '../components/MenuPdfExport';
import styles from '../styles/MenusPage.module.scss';

function MenusPage() {
  const { showToast } = useToast();

  // Data state
  const [menus, setMenus] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [pdfExportMenu, setPdfExportMenu] = useState(null);

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  // Fetch menus and storage locations
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [menusRes, locationsRes] = await Promise.all([
        menusAPI.list(),
        storageLocationsAPI.list(),
      ]);
      setMenus(menusRes.data.menus || []);
      setStorageLocations(locationsRes.data.locations || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load menus. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Copy share link to clipboard
  const handleCopyLink = async (menu) => {
    try {
      await navigator.clipboard.writeText(menu.share_url);
      showToast('Link copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  // Open public menu in new tab
  const handlePreview = (menu) => {
    window.open(menu.share_url, '_blank');
  };

  // Toggle sharing enabled/disabled
  const handleToggleSharing = async (menu) => {
    const key = `toggle-${menu.id}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));

    try {
      await menusAPI.update(menu.id, { sharing_enabled: !menu.sharing_enabled });
      setMenus(prev =>
        prev.map(m => m.id === menu.id ? { ...m, sharing_enabled: !m.sharing_enabled } : m)
      );
      showToast(
        menu.sharing_enabled ? 'Menu sharing disabled' : 'Menu sharing enabled',
        'success'
      );
    } catch (err) {
      showToast('Failed to update sharing', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Regenerate share token
  const handleRegenerateToken = async (menu) => {
    const confirmed = window.confirm(
      'Regenerate share link? The current link will stop working.'
    );
    if (!confirmed) return;

    const key = `regen-${menu.id}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));

    try {
      const res = await menusAPI.regenerateToken(menu.id);
      setMenus(prev =>
        prev.map(m => m.id === menu.id ? { ...m, ...res.data.menu } : m)
      );
      showToast('Share link regenerated', 'success');
    } catch (err) {
      showToast('Failed to regenerate link', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Delete menu
  const handleDelete = async (menu) => {
    const confirmed = window.confirm(
      `Delete "${menu.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    const key = `delete-${menu.id}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));

    try {
      await menusAPI.delete(menu.id);
      setMenus(prev => prev.filter(m => m.id !== menu.id));
      showToast('Menu deleted', 'success');
    } catch (err) {
      showToast('Failed to delete menu', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Open create modal
  const handleCreate = () => {
    setEditingMenu(null);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setShowModal(true);
  };

  // Handle modal save
  const handleModalSave = async (menuData) => {
    try {
      if (editingMenu) {
        // Update existing menu
        const res = await menusAPI.update(editingMenu.id, menuData);

        // Update storage locations if changed
        if (menuData.storage_location_ids !== undefined) {
          await menusAPI.setLocations(editingMenu.id, menuData.storage_location_ids);
        }

        // Refresh menu data to get updated counts
        const updated = await menusAPI.get(editingMenu.id);
        setMenus(prev =>
          prev.map(m => m.id === editingMenu.id ? { ...m, ...updated.data.menu } : m)
        );
        showToast('Menu updated', 'success');
      } else {
        // Create new menu
        const res = await menusAPI.create(menuData);
        setMenus(prev => [res.data.menu, ...prev]);
        showToast('Menu created', 'success');
      }
      setShowModal(false);
      setEditingMenu(null);
    } catch (err) {
      console.error('Error saving menu:', err);
      showToast('Failed to save menu', 'error');
    }
  };

  // Download PDF
  const handleDownloadPdf = (menu) => {
    setPdfExportMenu(menu);
  };

  // Theme display names
  const themeLabels = {
    rustic: 'Rustic',
    elegant: 'Elegant',
    modern: 'Modern',
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading menus...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCard}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchData} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Menus</h1>
          <p className={styles.subtitle}>
            Create shareable menus of your whiskey collection
          </p>
        </div>
        <button className={styles.createButton} onClick={handleCreate}>
          <Plus size={18} />
          New Menu
        </button>
      </header>

      {menus.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Link size={48} />
          </div>
          <h2>No Menus Yet</h2>
          <p>
            Create your first shareable menu to showcase your collection.
            You can filter by storage location and customize the theme.
          </p>
          <button className={styles.createButton} onClick={handleCreate}>
            <Plus size={18} />
            Create Menu
          </button>
        </div>
      ) : (
        <div className={styles.menuGrid}>
          {menus.map(menu => (
            <div key={menu.id} className={styles.menuCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.menuName}>{menu.name}</h3>
                <div className={styles.statusBadge} data-enabled={menu.sharing_enabled}>
                  {menu.sharing_enabled ? 'Public' : 'Private'}
                </div>
              </div>

              <div className={styles.cardMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Theme:</span>
                  <span className={styles.metaValue}>
                    {themeLabels[menu.theme] || menu.theme}
                    <span className={styles.colorMode}>
                      ({menu.color_mode === 'dark' ? 'Dark' : 'Light'})
                    </span>
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Bottles:</span>
                  <span className={styles.metaValue}>{menu.item_count}</span>
                </div>
                {menu.location_count > 0 && (
                  <div className={styles.metaItem}>
                    <MapPin size={14} />
                    <span className={styles.metaValue}>
                      {menu.location_count} location{menu.location_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                <button
                  className={styles.actionButton}
                  onClick={() => handleCopyLink(menu)}
                  title="Copy share link"
                >
                  <Copy size={16} />
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => handlePreview(menu)}
                  title="Preview menu"
                  disabled={!menu.sharing_enabled}
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => handleEdit(menu)}
                  title="Edit menu"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => handleDownloadPdf(menu)}
                  title="Download PDF"
                >
                  <Download size={16} />
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => handleRegenerateToken(menu)}
                  title="Regenerate link"
                  disabled={actionLoading[`regen-${menu.id}`]}
                >
                  <RefreshCw size={16} className={actionLoading[`regen-${menu.id}`] ? styles.spinning : ''} />
                </button>
                <button
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => handleDelete(menu)}
                  title="Delete menu"
                  disabled={actionLoading[`delete-${menu.id}`]}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className={styles.cardFooter}>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={menu.sharing_enabled}
                    onChange={() => handleToggleSharing(menu)}
                    disabled={actionLoading[`toggle-${menu.id}`]}
                  />
                  <span className={styles.toggleSwitch}></span>
                  <span className={styles.toggleText}>
                    {menu.sharing_enabled ? 'Sharing enabled' : 'Sharing disabled'}
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <MenuEditModal
          menu={editingMenu}
          storageLocations={storageLocations}
          onSave={handleModalSave}
          onClose={() => {
            setShowModal(false);
            setEditingMenu(null);
          }}
        />
      )}

      {pdfExportMenu && (
        <MenuPdfExport
          menu={pdfExportMenu}
          onClose={() => setPdfExportMenu(null)}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}
    </div>
  );
}

export default MenusPage;
