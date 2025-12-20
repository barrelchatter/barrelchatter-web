import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicMenuAPI } from '../api/client';
import styles from '../styles/PublicMenuPage.module.scss';

// Proof range presets
const PROOF_RANGES = [
  { label: 'All', min: 0, max: 999 },
  { label: 'Under 100', min: 0, max: 99.9 },
  { label: '100-120', min: 100, max: 120 },
  { label: '120+', min: 120.1, max: 999 },
];

function PublicMenuPage() {
  const { shareToken } = useParams();

  // Data state
  const [menu, setMenu] = useState(null);
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ distilleries: [], types: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [selectedDistillery, setSelectedDistillery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedProofRange, setSelectedProofRange] = useState(PROOF_RANGES[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch menu data
  useEffect(() => {
    async function fetchMenu() {
      try {
        setLoading(true);
        setError(null);
        const response = await publicMenuAPI.get(shareToken);
        setMenu(response.data.menu);
        setItems(response.data.items);
        setFilters(response.data.filters);
      } catch (err) {
        console.error('Error fetching menu:', err);
        if (err.response?.status === 404) {
          setError('This menu is not available. It may have been disabled or the link may be invalid.');
        } else {
          setError('Failed to load menu. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    }

    if (shareToken) {
      fetchMenu();
    }
  }, [shareToken]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const bottle = item.bottle;

      // Distillery filter
      if (selectedDistillery && bottle.distillery !== selectedDistillery) {
        return false;
      }

      // Type filter
      if (selectedType && bottle.type !== selectedType) {
        return false;
      }

      // Proof range filter
      if (bottle.proof) {
        if (bottle.proof < selectedProofRange.min || bottle.proof > selectedProofRange.max) {
          return false;
        }
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchable = [
          bottle.name,
          bottle.brand,
          bottle.distillery,
          bottle.type,
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchable.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedDistillery, selectedType, selectedProofRange, searchQuery]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedDistillery('');
    setSelectedType('');
    setSelectedProofRange(PROOF_RANGES[0]);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedDistillery || selectedType || selectedProofRange !== PROOF_RANGES[0] || searchQuery;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCard}>
          <h1>Menu Not Found</h1>
          <p>{error}</p>
          <Link to="/login" className={styles.loginLink}>
            Sign in to BarrelChatter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>BarrelChatter</div>
        <h1 className={styles.title}>{menu?.title}</h1>
        <p className={styles.subtitle}>
          {filteredItems.length} {filteredItems.length === 1 ? 'bottle' : 'bottles'} in stock
        </p>
      </header>

      <div className={styles.filterBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search bottles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className={styles.filterSelect}
          value={selectedDistillery}
          onChange={(e) => setSelectedDistillery(e.target.value)}
        >
          <option value="">All Distilleries</option>
          {filters.distilleries.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="">All Types</option>
          {filters.types.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <div className={styles.proofButtons}>
          {PROOF_RANGES.map(range => (
            <button
              key={range.label}
              className={`${styles.proofButton} ${selectedProofRange === range ? styles.active : ''}`}
              onClick={() => setSelectedProofRange(range)}
            >
              {range.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button className={styles.clearButton} onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      <main className={styles.menuContainer}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No bottles match your filters.</p>
            <button onClick={clearFilters}>Clear Filters</button>
          </div>
        ) : (
          <ul className={styles.menuList}>
            {filteredItems.map(item => (
              <li key={item.id} className={styles.menuItem}>
                <div className={styles.bottleInfo}>
                  <span className={styles.bottleName}>{item.bottle.name}</span>
                  {item.bottle.distillery && (
                    <span className={styles.bottleDistillery}>{item.bottle.distillery}</span>
                  )}
                </div>
                <div className={styles.bottleDetails}>
                  {item.bottle.age_statement && (
                    <span className={styles.age}>{item.bottle.age_statement}</span>
                  )}
                  {item.bottle.proof && (
                    <span className={styles.proof}>{item.bottle.proof}°</span>
                  )}
                  {item.bottle.type && (
                    <span className={styles.type}>{item.bottle.type}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          Powered by <a href="https://barrelchatter.com" target="_blank" rel="noopener noreferrer">BarrelChatter</a>
        </p>
      </footer>
    </div>
  );
}

export default PublicMenuPage;
