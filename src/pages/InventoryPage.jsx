import React, { useEffect, useState } from 'react';
import api from '../api/client';
import styles from '../styles/InventoryPage.module.scss';

function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchInventory() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/v1/inventory?limit=100&offset=0');
        if (!isMounted) return;
        setItems(response.data.inventory || []);
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        const message =
          err?.response?.data?.error ||
          'Failed to load inventory. Is the API running?';
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchInventory();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>My Inventory</h1>
      </div>

      {loading && <div className={styles.message}>Loading inventory...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className={styles.message}>No bottles yet. Time to shop.</div>
      )}

      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardTitle}>
              {item.bottle?.name || 'Unknown Bottle'}
            </div>
            <div className={styles.cardSubtitle}>
              {item.bottle?.brand} • {item.bottle?.type}
            </div>
            <div className={styles.metaRow}>
              <span className={styles.status}>{item.status}</span>
              <span className={styles.location}>{item.location_label}</span>
            </div>
            <div className={styles.metaRow}>
              {item.price_paid && (
                <span className={styles.pricePaid}>
                  Paid ${Number(item.price_paid).toFixed(2)}
                </span>
              )}
              {item.msrp && (
                <span className={styles.msrp}>
                  MSRP ${Number(item.msrp).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InventoryPage;
