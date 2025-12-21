import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { subscriptionAPI } from '../api/client';
import styles from '../styles/SubscriptionResultPage.module.scss';

function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await subscriptionAPI.getStatus();
        setSubscription(response.data.subscription);
      } catch (err) {
        console.error('Error fetching subscription:', err);
      } finally {
        setLoading(false);
      }
    }

    // Small delay to allow webhook to process
    const timer = setTimeout(fetchStatus, 1500);
    return () => clearTimeout(timer);
  }, []);

  const tierName = subscription?.tier === 'barrel_proof' ? 'Barrel Proof' :
                   subscription?.tier === 'single_barrel' ? 'Single Barrel' :
                   subscription?.tier || 'your new plan';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconSuccess}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h1>Welcome to {loading ? '...' : tierName}!</h1>

        <p className={styles.message}>
          Your subscription is now active. Thank you for supporting BarrelChatter!
        </p>

        {!loading && subscription && (
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span>Plan:</span>
              <strong>{tierName}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Status:</span>
              <span className={styles.statusActive}>{subscription.status || 'Active'}</span>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Link to="/app" className={styles.primaryBtn}>
            Go to Dashboard
          </Link>
          <Link to="/app/settings/subscription" className={styles.secondaryBtn}>
            View Subscription Details
          </Link>
        </div>

        <div className={styles.features}>
          <h3>What's unlocked:</h3>
          <ul>
            {subscription?.tier === 'barrel_proof' ? (
              <>
                <li>Unlimited bottles in your collection</li>
                <li>Unlimited shareable menus</li>
                <li>Unlimited collector groups</li>
                <li>NFC tag enrollment</li>
                <li>Premium support</li>
              </>
            ) : (
              <>
                <li>500 bottles in your collection</li>
                <li>5 shareable menus</li>
                <li>3 collector groups</li>
                <li>Priority support</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionSuccessPage;
