import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subscriptionAPI, stripeAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import styles from '../styles/SubscriptionSettingsPage.module.scss';

const TIER_INFO = {
  free: {
    name: 'Mash Bill',
    tagline: 'Free forever',
    price: '$0',
    description: 'Perfect for casual collectors getting started.',
  },
  single_barrel: {
    name: 'Single Barrel',
    tagline: 'Most popular',
    price: '$4.99',
    description: 'For serious collectors who want more.',
  },
  barrel_proof: {
    name: 'Barrel Proof',
    tagline: 'Full power',
    price: '$9.99',
    description: 'Everything, unlimited, plus NFC tags.',
  },
};

function SubscriptionSettingsPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [subscription, setSubscription] = useState(null);
  const [tierInfo, setTierInfo] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [upgrading, setUpgrading] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedInterval, setSelectedInterval] = useState('monthly');

  const [promoCode, setPromoCode] = useState('');
  const [redeemingPromo, setRedeemingPromo] = useState(false);

  const [portalLoading, setPortalLoading] = useState(false);

  const fetchSubscriptionStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await subscriptionAPI.getStatus();
      setSubscription(response.data.subscription);
      setTierInfo(response.data.tier_info);
      setUsage(response.data.usage);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err?.response?.data?.error || 'Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  // Check for success message from checkout redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription updated successfully!');
      // Refresh subscription status
      fetchSubscriptionStatus();
    }
  }, [searchParams, toast, fetchSubscriptionStatus]);

  async function handleUpgrade(tier) {
    setUpgrading(true);
    setSelectedTier(tier);
    try {
      const response = await stripeAPI.createCheckoutSession(tier, selectedInterval);
      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      toast.error(err?.response?.data?.error || 'Failed to start checkout');
    } finally {
      setUpgrading(false);
      setSelectedTier(null);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const response = await stripeAPI.createPortalSession();
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Failed to open subscription management');
      }
    } catch (err) {
      console.error('Error creating portal session:', err);
      toast.error(err?.response?.data?.error || 'Failed to open subscription management');
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleRedeemPromo(e) {
    e.preventDefault();
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setRedeemingPromo(true);
    try {
      const response = await subscriptionAPI.redeemPromo(promoCode.trim());
      toast.success(response.data.message || 'Promo code redeemed!');
      setPromoCode('');
      // Refresh subscription status
      fetchSubscriptionStatus();
    } catch (err) {
      console.error('Error redeeming promo code:', err);
      toast.error(err?.response?.data?.error || 'Failed to redeem promo code');
    } finally {
      setRedeemingPromo(false);
    }
  }

  function getTierBadgeClass(tier) {
    if (tier === 'barrel_proof') return styles.tierBadgeBarrelProof;
    if (tier === 'single_barrel') return styles.tierBadgeSingleBarrel;
    return styles.tierBadgeFree;
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading subscription status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={fetchSubscriptionStatus}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentTier = subscription?.tier || 'free';
  const currentTierInfo = TIER_INFO[currentTier] || TIER_INFO.free;
  const isSubscribed = currentTier !== 'free';
  const isPaidViaStripe = subscription?.source === 'stripe';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Subscription</h1>
        <p className={styles.subtitle}>Manage your BarrelChatter subscription</p>
      </div>

      {/* Current Subscription */}
      <div className={styles.section}>
        <h2>Current Plan</h2>
        <div className={styles.currentPlanCard}>
          <div className={styles.planHeader}>
            <div>
              <span className={getTierBadgeClass(currentTier)}>
                {currentTierInfo.name}
              </span>
              <span className={styles.planTagline}>{currentTierInfo.tagline}</span>
            </div>
            <div className={styles.planPrice}>
              {currentTier === 'free' ? 'Free' : currentTierInfo.price + '/mo'}
            </div>
          </div>

          <p className={styles.planDescription}>{currentTierInfo.description}</p>

          {isSubscribed && (
            <div className={styles.subscriptionDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status:</span>
                <span className={`${styles.statusBadge} ${styles['status' + (subscription.status || 'active')]}`}>
                  {subscription.status || 'Active'}
                </span>
              </div>
              {subscription.expires_at && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>
                    {subscription.status === 'canceled' ? 'Access until:' : 'Renews:'}
                  </span>
                  <span>{formatDate(subscription.expires_at)}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Payment method:</span>
                <span>{subscription.source === 'stripe' ? 'Credit Card (Stripe)' :
                       subscription.source === 'apple' ? 'Apple App Store' :
                       subscription.source === 'google' ? 'Google Play' :
                       subscription.source === 'admin' ? 'Promotional' :
                       subscription.source || 'Unknown'}</span>
              </div>
            </div>
          )}

          {isPaidViaStripe && (
            <button
              className={styles.manageBtn}
              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              {portalLoading ? 'Opening...' : 'Manage Subscription'}
            </button>
          )}
        </div>
      </div>

      {/* Usage */}
      {usage && tierInfo && (
        <div className={styles.section}>
          <h2>Usage</h2>
          <div className={styles.usageGrid}>
            <div className={styles.usageCard}>
              <div className={styles.usageLabel}>Bottles</div>
              <div className={styles.usageValue}>
                {usage.bottles?.current ?? 0}
                <span className={styles.usageLimit}>
                  / {tierInfo.limits?.bottles === -1 ? '∞' : tierInfo.limits?.bottles ?? 25}
                </span>
              </div>
              {tierInfo.limits?.bottles !== -1 && (
                <div className={styles.usageBar}>
                  <div
                    className={styles.usageBarFill}
                    style={{
                      width: `${Math.min(100, ((usage.bottles?.current ?? 0) / (tierInfo.limits?.bottles ?? 25)) * 100)}%`
                    }}
                  />
                </div>
              )}
            </div>

            <div className={styles.usageCard}>
              <div className={styles.usageLabel}>Menus</div>
              <div className={styles.usageValue}>
                {usage.menus?.current ?? 0}
                <span className={styles.usageLimit}>
                  / {tierInfo.limits?.menus === -1 ? '∞' : tierInfo.limits?.menus ?? 1}
                </span>
              </div>
              {tierInfo.limits?.menus !== -1 && (
                <div className={styles.usageBar}>
                  <div
                    className={styles.usageBarFill}
                    style={{
                      width: `${Math.min(100, ((usage.menus?.current ?? 0) / (tierInfo.limits?.menus ?? 1)) * 100)}%`
                    }}
                  />
                </div>
              )}
            </div>

            <div className={styles.usageCard}>
              <div className={styles.usageLabel}>Groups</div>
              <div className={styles.usageValue}>
                {usage.groups?.current ?? 0}
                <span className={styles.usageLimit}>
                  / {tierInfo.limits?.groups === -1 ? '∞' : tierInfo.limits?.groups ?? 1}
                </span>
              </div>
              {tierInfo.limits?.groups !== -1 && (
                <div className={styles.usageBar}>
                  <div
                    className={styles.usageBarFill}
                    style={{
                      width: `${Math.min(100, ((usage.groups?.current ?? 0) / (tierInfo.limits?.groups ?? 1)) * 100)}%`
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Options */}
      {currentTier !== 'barrel_proof' && (
        <div className={styles.section}>
          <h2>Upgrade Your Plan</h2>

          <div className={styles.intervalToggle}>
            <button
              className={selectedInterval === 'monthly' ? styles.intervalActive : styles.intervalBtn}
              onClick={() => setSelectedInterval('monthly')}
            >
              Monthly
            </button>
            <button
              className={selectedInterval === 'annual' ? styles.intervalActive : styles.intervalBtn}
              onClick={() => setSelectedInterval('annual')}
            >
              Annual <span className={styles.saveBadge}>Save 17%</span>
            </button>
          </div>

          <div className={styles.plansGrid}>
            {currentTier === 'free' && (
              <div className={styles.planCard}>
                <div className={styles.planCardHeader}>
                  <h3>Single Barrel</h3>
                  <span className={styles.popularBadge}>Most Popular</span>
                </div>
                <div className={styles.planCardPrice}>
                  {selectedInterval === 'monthly' ? '$4.99' : '$49.99'}
                  <span>/{selectedInterval === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                <ul className={styles.planFeatures}>
                  <li>500 bottles in collection</li>
                  <li>5 shareable menus</li>
                  <li>3 collector groups</li>
                  <li>Priority support</li>
                </ul>
                <button
                  className={styles.upgradeBtn}
                  onClick={() => handleUpgrade('single_barrel')}
                  disabled={upgrading}
                >
                  {upgrading && selectedTier === 'single_barrel' ? 'Loading...' : 'Upgrade to Single Barrel'}
                </button>
              </div>
            )}

            <div className={`${styles.planCard} ${styles.planCardHighlight}`}>
              <div className={styles.planCardHeader}>
                <h3>Barrel Proof</h3>
                <span className={styles.bestValueBadge}>Best Value</span>
              </div>
              <div className={styles.planCardPrice}>
                {selectedInterval === 'monthly' ? '$9.99' : '$99.99'}
                <span>/{selectedInterval === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <ul className={styles.planFeatures}>
                <li>Unlimited bottles</li>
                <li>Unlimited menus</li>
                <li>Unlimited groups</li>
                <li>NFC tag enrollment</li>
                <li>Premium support</li>
                <li>Early access to features</li>
              </ul>
              <button
                className={styles.upgradeBtnPrimary}
                onClick={() => handleUpgrade('barrel_proof')}
                disabled={upgrading}
              >
                {upgrading && selectedTier === 'barrel_proof' ? 'Loading...' : 'Upgrade to Barrel Proof'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promo Code */}
      <div className={styles.section}>
        <h2>Promo Code</h2>
        <form className={styles.promoForm} onSubmit={handleRedeemPromo}>
          <input
            type="text"
            className={styles.promoInput}
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          />
          <button
            type="submit"
            className={styles.promoBtn}
            disabled={redeemingPromo || !promoCode.trim()}
          >
            {redeemingPromo ? 'Redeeming...' : 'Redeem'}
          </button>
        </form>
      </div>

      {/* FAQ */}
      <div className={styles.section}>
        <h2>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          <details className={styles.faqItem}>
            <summary>Can I cancel anytime?</summary>
            <p>Yes! You can cancel your subscription at any time. You'll keep access until the end of your billing period.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>What happens to my data if I downgrade?</summary>
            <p>Your data is never deleted. If you exceed the free tier limits, you can still view everything but won't be able to add new items until you upgrade or remove items.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>Do you offer refunds?</summary>
            <p>Yes, we offer a 30-day money-back guarantee. Contact support if you're not satisfied.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>I subscribed via the mobile app. How do I manage my subscription?</summary>
            <p>Subscriptions purchased through iOS or Android are managed through your device's app store. Go to your device's subscription settings to manage billing.</p>
          </details>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionSettingsPage;
