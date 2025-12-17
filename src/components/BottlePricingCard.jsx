import React, { useMemo } from 'react';
import { usePricing } from '../hooks/usePricing';
import styles from '../styles/BottlePricingCard.module.scss';

/**
 * BottlePricingCard - Displays community pricing intelligence for a bottle
 * 
 * @param {string} bottleId - UUID of the bottle
 * @param {number} userPricePaid - Optional: user's price to compare against average
 * @param {boolean} compact - Show compact version (for cards)
 */
function BottlePricingCard({ bottleId, userPricePaid, compact = false }) {
  const { data: pricing, loading, error } = usePricing(bottleId);

  // Determine if we have sufficient data
  const hasSufficientData = pricing?.pricing?.sample_count >= 3;

  // Calculate user's deal analysis
  const userDealAnalysis = useMemo(() => {
    if (!userPricePaid || !pricing?.pricing?.avg_price) return null;

    const avgPrice = parseFloat(pricing.pricing.avg_price);
    const diff = userPricePaid - avgPrice;
    const pctDiff = ((userPricePaid / avgPrice) - 1) * 100;

    return {
      difference: diff,
      percentDiff: pctDiff,
      isGoodDeal: pctDiff < -5,
      isGreatDeal: pctDiff < -15,
      isPremium: pctDiff > 20,
    };
  }, [userPricePaid, pricing]);

  // Loading state
  if (loading) {
    return (
      <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>Loading pricing data...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
        <div className={styles.error}>Unable to load pricing</div>
      </div>
    );
  }

  // No data state
  if (!pricing || !hasSufficientData) {
    return (
      <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
        <div className={styles.header}>
          <h4 className={styles.title}>Community Pricing</h4>
        </div>
        <div className={styles.noData}>
          <span className={styles.noDataIcon}>📊</span>
          <p>Not enough pricing data yet</p>
          <p className={styles.noDataHint}>
            {pricing?.pricing?.sample_count || 0} of 3 required purchases
          </p>
        </div>
      </div>
    );
  }

  const { bottle, pricing: priceData, regional_breakdown, price_trend } = pricing;

  // Compact version for inventory cards
  if (compact) {
    return (
      <div className={`${styles.card} ${styles.compact}`}>
        <div className={styles.compactContent}>
          <div className={styles.compactRow}>
            <span className={styles.compactLabel}>Avg Paid:</span>
            <span className={styles.compactValue}>${priceData.avg_price}</span>
          </div>
          {priceData.avg_msrp && (
            <div className={styles.compactRow}>
              <span className={styles.compactLabel}>MSRP:</span>
              <span className={styles.compactValue}>${priceData.avg_msrp}</span>
            </div>
          )}
          <div className={styles.compactMeta}>
            Based on {priceData.sample_count} purchases
          </div>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h4 className={styles.title}>Community Pricing</h4>
        <span className={styles.sampleCount}>
          {priceData.sample_count} purchases
        </span>
      </div>

      <div className={styles.content}>
        {/* Main pricing stats */}
        <div className={styles.statsGrid}>
          {/* Average price */}
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Average Paid</span>
            <span className={styles.statValue}>${priceData.avg_price}</span>
          </div>

          {/* MSRP */}
          {priceData.avg_msrp && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>MSRP</span>
              <span className={styles.statValue}>${priceData.avg_msrp}</span>
            </div>
          )}

          {/* Price range */}
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Price Range</span>
            <span className={styles.statValue}>
              ${priceData.min_price} - ${priceData.max_price}
            </span>
          </div>

          {/* Median */}
          {priceData.median_price && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Median</span>
              <span className={styles.statValue}>${priceData.median_price}</span>
            </div>
          )}
        </div>

        {/* MSRP comparison insight */}
        {priceData.discount_from_msrp !== null && (
          <div className={styles.insight}>
            {priceData.discount_from_msrp > 0 ? (
              <span className={styles.insightPositive}>
                📉 Typically {priceData.discount_from_msrp}% below MSRP
              </span>
            ) : priceData.discount_from_msrp < -20 ? (
              <span className={styles.insightNegative}>
                📈 Typically {Math.abs(priceData.discount_from_msrp)}% above MSRP (secondary market)
              </span>
            ) : priceData.discount_from_msrp < 0 ? (
              <span className={styles.insightWarning}>
                📈 Typically {Math.abs(priceData.discount_from_msrp)}% above MSRP
              </span>
            ) : (
              <span className={styles.insightNeutral}>
                💰 Typically sells at MSRP
              </span>
            )}
          </div>
        )}

        {/* User's deal analysis */}
        {userDealAnalysis && (
          <div className={styles.userDeal}>
            <div className={styles.userDealHeader}>Your Price Analysis</div>
            <div className={styles.userDealContent}>
              <span className={styles.userPrice}>
                You paid: <strong>${userPricePaid.toFixed(2)}</strong>
              </span>
              {userDealAnalysis.isGreatDeal ? (
                <span className={`${styles.dealBadge} ${styles.greatDeal}`}>
                  🎉 Great Deal! ({Math.abs(userDealAnalysis.percentDiff).toFixed(0)}% below avg)
                </span>
              ) : userDealAnalysis.isGoodDeal ? (
                <span className={`${styles.dealBadge} ${styles.goodDeal}`}>
                  ✓ Good Price ({Math.abs(userDealAnalysis.percentDiff).toFixed(0)}% below avg)
                </span>
              ) : userDealAnalysis.isPremium ? (
                <span className={`${styles.dealBadge} ${styles.premium}`}>
                  ↑ Premium ({userDealAnalysis.percentDiff.toFixed(0)}% above avg)
                </span>
              ) : (
                <span className={`${styles.dealBadge} ${styles.fair}`}>
                  Fair Price (within 5% of avg)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Regional breakdown */}
        {regional_breakdown && regional_breakdown.length > 0 && (
          <div className={styles.regionalSection}>
            <h5 className={styles.sectionTitle}>By Region</h5>
            <div className={styles.regionalList}>
              {regional_breakdown.slice(0, 5).map((region) => (
                <div key={region.state} className={styles.regionalItem}>
                  <span className={styles.regionState}>{region.state}</span>
                  <span className={styles.regionPrice}>${region.avg_price}</span>
                  <span className={styles.regionCount}>({region.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price trend indicator */}
        {price_trend && price_trend.length >= 2 && (
          <PriceTrendIndicator trends={price_trend} />
        )}
      </div>
    </div>
  );
}

/**
 * PriceTrendIndicator - Shows if price is trending up/down
 */
function PriceTrendIndicator({ trends }) {
  // Compare most recent to 3 months ago
  const recent = trends[0];
  const older = trends.find((t, i) => i >= 2); // At least 2 months back

  if (!recent || !older) return null;

  const recentPrice = parseFloat(recent.avg_price);
  const olderPrice = parseFloat(older.avg_price);
  const pctChange = ((recentPrice / olderPrice) - 1) * 100;

  if (Math.abs(pctChange) < 5) return null; // Ignore small changes

  const isTrendingUp = pctChange > 0;

  return (
    <div className={styles.trendSection}>
      <span className={`${styles.trendIndicator} ${isTrendingUp ? styles.trendUp : styles.trendDown}`}>
        {isTrendingUp ? '📈' : '📉'} Price {isTrendingUp ? 'trending up' : 'trending down'} ({Math.abs(pctChange).toFixed(0)}% over 3 months)
      </span>
    </div>
  );
}

export default BottlePricingCard;
