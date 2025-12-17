import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import styles from '../styles/WishlistPage.module.scss';

// Wishlist statuses
const WISHLIST_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'found', label: 'Found' },
  { value: 'purchased', label: 'Purchased' },
];

function WishlistPage() {
  const [allItems, setAllItems] = useState([]); // All items for counting
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch all wishlist items (no server-side filter so we can count properly)
  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/v1/wishlists?limit=100&offset=0');
      // API returns { wishlists: [...] }
      const items = response.data?.wishlists || [];
      setAllItems(items);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      const message = err?.response?.data?.error || err.message || 'Failed to load wishlist';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Filter items client-side
  const filteredItems = allItems.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'priority') {
      return (a.priority || 5) - (b.priority || 5);
    }
    if (sortBy === 'name') {
      const nameA = a.bottle?.name || '';
      const nameB = b.bottle?.name || '';
      return nameA.localeCompare(nameB);
    }
    // created_at (newest first)
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Count by status (from all items, not filtered)
  const statusCounts = {
    all: allItems.length,
    active: allItems.filter((i) => i.status === 'active').length,
    found: allItems.filter((i) => i.status === 'found').length,
    purchased: allItems.filter((i) => i.status === 'purchased').length,
  };

  // Update item
  async function updateItem(id, updates) {
    try {
      const response = await api.patch(`/v1/wishlists/${id}`, updates);
      
      // Update local state
      setAllItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...response.data?.wishlist, ...updates } : item
        )
      );
    } catch (err) {
      console.error('Error updating wishlist item:', err);
      alert(err?.response?.data?.error || err.message || 'Failed to update');
    }
  }

  // Delete item
  async function deleteItem(id) {
    if (!window.confirm('Remove this item from your wishlist?')) {
      return;
    }

    try {
      await api.delete(`/v1/wishlists/${id}`);
      // Remove from local state
      setAllItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Error deleting wishlist item:', err);
      alert(err?.response?.data?.error || err.message || 'Failed to delete');
    }
  }

  // Mark as found
  function handleMarkFound(item) {
    updateItem(item.id, { status: 'found' });
  }

  // Mark as purchased
  function handleMarkPurchased(item) {
    updateItem(item.id, { status: 'purchased' });
  }

  // Change priority
  function handlePriorityChange(item, newPriority) {
    updateItem(item.id, { priority: newPriority });
  }

  // Format currency
  function formatCurrency(value) {
    if (!value) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  // Render priority stars
  function renderPriorityStars(priority, interactive = false, onChange = null) {
    const stars = [];
    const currentPriority = priority || 5;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{ 
            color: i <= (6 - currentPriority) ? 'var(--bc-accent, #c9a66b)' : 'var(--bc-text-tertiary, #7a6f60)',
            cursor: interactive ? 'pointer' : 'default',
            fontSize: '16px',
          }}
          onClick={interactive && onChange ? () => onChange(6 - i) : undefined}
        >
          ★
        </span>
      );
    }
    return <span style={{ display: 'flex', gap: '2px' }}>{stars}</span>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Wishlist</h1>
          <p className={styles.subtitle}>
            {allItems.length} bottle{allItems.length !== 1 ? 's' : ''} on your list
          </p>
        </div>
        <button className={styles.addButton} onClick={() => setShowAddModal(true)}>
          + Add Bottle
        </button>
      </header>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.statusFilters}>
          {['all', 'active', 'found', 'purchased'].map((status) => (
            <button
              key={status}
              className={`${styles.filterButton} ${filter === status ? styles.filterActive : ''}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className={styles.filterCount}>{statusCounts[status]}</span>
            </button>
          ))}
        </div>

        <div className={styles.sortSelect}>
          <span>Sort by:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="priority">Priority</option>
            <option value="name">Name</option>
            <option value="created_at">Date Added</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loading}>Loading wishlist...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : sortedItems.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            {filter === 'all'
              ? "Your wishlist is empty. Add bottles you're looking for!"
              : `No ${filter} items in your wishlist.`}
          </p>
          {filter === 'all' && (
            <button className={styles.emptyButton} onClick={() => setShowAddModal(true)}>
              Add Your First Bottle
            </button>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className={`${styles.item} ${item.status === 'found' ? styles.item_found : ''} ${
                item.status === 'purchased' ? styles.item_purchased : ''
              }`}
            >
              <div className={styles.itemImage}>
                {item.bottle?.image_url || item.bottle?.primary_photo_url ? (
                  <img src={item.bottle.image_url || item.bottle.primary_photo_url} alt={item.bottle?.name} />
                ) : (
                  <span className={styles.itemImagePlaceholder}>🥃</span>
                )}
              </div>

              <div className={styles.itemInfo}>
                <h3 className={styles.itemName}>{item.bottle?.name || 'Unknown Bottle'}</h3>
                <p className={styles.itemDistillery}>{item.bottle?.distillery || ''}</p>

                <div className={styles.itemDetails}>
                  {item.bottle?.type && <span>{item.bottle.type}</span>}
                  {item.bottle?.proof && <span>{item.bottle.proof}°</span>}
                  {item.preferred_price && (
                    <span className={styles.targetPrice}>
                      Target: {formatCurrency(item.preferred_price)}
                    </span>
                  )}
                </div>

                {item.notes && <p className={styles.itemNotes}>"{item.notes}"</p>}
              </div>

              <div className={styles.itemPriority}>
                {renderPriorityStars(item.priority, true, (p) => handlePriorityChange(item, p))}
              </div>

              <div className={styles.itemStatus}>
                <span className={styles.statusBadge}>{item.status}</span>
              </div>

              <div className={styles.itemActions}>
                {item.status === 'active' && (
                  <button
                    className={styles.actionButtonPrimary}
                    onClick={() => handleMarkFound(item)}
                  >
                    Found It!
                  </button>
                )}
                {item.status === 'found' && (
                  <button
                    className={styles.actionButtonPrimary}
                    onClick={() => handleMarkPurchased(item)}
                  >
                    Purchased
                  </button>
                )}
                <button
                  className={styles.actionButtonDanger}
                  onClick={() => deleteItem(item.id)}
                  title="Remove from wishlist"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddWishlistModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            fetchWishlist();
          }}
        />
      )}
    </div>
  );
}

// Add Wishlist Modal Component
function AddWishlistModal({ onClose, onAdded }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedBottle, setSelectedBottle] = useState(null);
  const [preferredPrice, setPreferredPrice] = useState('');
  const [priority, setPriority] = useState(3);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Search bottles
  async function handleSearch(query) {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/v1/bottles?q=${encodeURIComponent(query)}&limit=10`);
      setSearchResults(response.data?.bottles || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }

  // Submit
  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedBottle) return;

    setSaving(true);
    try {
      await api.post('/v1/wishlists', {
        bottle_id: selectedBottle.id,
        preferred_price: preferredPrice ? parseFloat(preferredPrice) : null,
        priority: priority,
        notes: notes || null,
        status: 'active',
      });

      onAdded();
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      alert(err?.response?.data?.error || err.message || 'Failed to add to wishlist');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add to Wishlist</h2>
          <button className={styles.modalClose} onClick={onClose}>
            ×
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          {/* Bottle Search */}
          <div className={styles.field}>
            <label>Search Bottle</label>
            {selectedBottle ? (
              <div className={styles.selectedBottle}>
                <span>{selectedBottle.name}</span>
                <button type="button" onClick={() => setSelectedBottle(null)}>
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by name, brand, or distillery..."
                />
                {searching && <div className={styles.searchLoading}>Searching...</div>}
                {searchResults.length > 0 && (
                  <div className={styles.searchResults}>
                    {searchResults.map((bottle) => (
                      <button
                        key={bottle.id}
                        type="button"
                        className={styles.searchResult}
                        onClick={() => {
                          setSelectedBottle(bottle);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                      >
                        <span className={styles.resultName}>{bottle.name}</span>
                        <span className={styles.resultDistillery}>{bottle.distillery}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Target Price */}
          <div className={styles.field}>
            <label>Target Price (optional)</label>
            <input
              type="number"
              step="0.01"
              value={preferredPrice}
              onChange={(e) => setPreferredPrice(e.target.value)}
              placeholder="e.g., 59.99"
            />
          </div>

          {/* Priority */}
          <div className={styles.field}>
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
              <option value={1}>★★★★★ Must Have</option>
              <option value={2}>★★★★☆ High</option>
              <option value={3}>★★★☆☆ Medium</option>
              <option value={4}>★★☆☆☆ Low</option>
              <option value={5}>★☆☆☆☆ Someday</option>
            </select>
          </div>

          {/* Notes */}
          <div className={styles.field}>
            <label>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why you want this bottle..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={!selectedBottle || saving}>
              {saving ? 'Adding...' : 'Add to Wishlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WishlistPage;