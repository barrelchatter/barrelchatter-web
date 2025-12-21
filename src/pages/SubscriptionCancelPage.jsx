import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/SubscriptionResultPage.module.scss';

function SubscriptionCancelPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconCancel}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h1>Checkout Cancelled</h1>

        <p className={styles.message}>
          No worries! Your subscription wasn't changed. You can upgrade anytime.
        </p>

        <div className={styles.actions}>
          <Link to="/app/settings/subscription" className={styles.primaryBtn}>
            View Plans
          </Link>
          <Link to="/app" className={styles.secondaryBtn}>
            Back to Dashboard
          </Link>
        </div>

        <div className={styles.helpText}>
          <p>
            Have questions about our plans?{' '}
            <a href="mailto:support@barrelchatter.com">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionCancelPage;
