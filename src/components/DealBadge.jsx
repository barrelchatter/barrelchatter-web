import React from 'react';
import styles from '../styles/DealBadge.module.scss';

/**
 * DealBadge - Visual indicator for pricing deals
 * 
 * @param {number} priceVsAvgPct - Percentage vs average price (negative = below avg)
 * @param {number} priceVsMsrpPct - Percentage vs MSRP (negative = below MSRP)
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} showLabel - Whether to show text label
 */
function DealBadge({ 
  priceVsAvgPct, 
  priceVsMsrpPct, 
  size = 'md',
  showLabel = true 
}) {
  // Determine badge type based on price comparison
  const getBadgeInfo = () => {
    // Great deal: significantly below average
    if (priceVsAvgPct !== null && priceVsAvgPct !== undefined) {
      if (priceVsAvgPct <= -20) {
        return {
          variant: 'great-deal',
          label: 'Great Deal!',
          icon: '🎉',
          tooltip: `${Math.abs(priceVsAvgPct).toFixed(0)}% below average`,
        };
      }
      if (priceVsAvgPct <= -10) {
        return {
          variant: 'good-deal',
          label: 'Good Price',
          icon: '✓',
          tooltip: `${Math.abs(priceVsAvgPct).toFixed(0)}% below average`,
        };
      }
      if (priceVsAvgPct >= 30) {
        return {
          variant: 'premium',
          label: 'Premium',
          icon: '↑',
          tooltip: `${priceVsAvgPct.toFixed(0)}% above average`,
        };
      }
      if (priceVsAvgPct >= 50) {
        return {
          variant: 'secondary',
          label: 'Secondary Market',
          icon: '⚡',
          tooltip: `${priceVsAvgPct.toFixed(0)}% above average`,
        };
      }
    }

    // Fall back to MSRP comparison
    if (priceVsMsrpPct !== null && priceVsMsrpPct !== undefined) {
      if (priceVsMsrpPct <= -15) {
        return {
          variant: 'below-msrp',
          label: 'Below MSRP',
          icon: '↓',
          tooltip: `${Math.abs(priceVsMsrpPct).toFixed(0)}% below MSRP`,
        };
      }
      if (priceVsMsrpPct >= 50) {
        return {
          variant: 'above-msrp',
          label: 'Above MSRP',
          icon: '↑',
          tooltip: `${priceVsMsrpPct.toFixed(0)}% above MSRP`,
        };
      }
    }

    return null;
  };

  const badgeInfo = getBadgeInfo();

  if (!badgeInfo) return null;

  return (
    <span 
      className={`${styles.badge} ${styles[badgeInfo.variant]} ${styles[size]}`}
      title={badgeInfo.tooltip}
    >
      <span className={styles.icon}>{badgeInfo.icon}</span>
      {showLabel && <span className={styles.label}>{badgeInfo.label}</span>}
    </span>
  );
}

/**
 * PriceComparisonText - Shows text comparison vs average/MSRP
 */
export function PriceComparisonText({ priceVsAvgPct, priceVsMsrpPct }) {
  if (priceVsAvgPct !== null && priceVsAvgPct !== undefined) {
    const isBelow = priceVsAvgPct < 0;
    const absValue = Math.abs(priceVsAvgPct).toFixed(0);
    
    return (
      <span className={`${styles.comparisonText} ${isBelow ? styles.positive : styles.negative}`}>
        {isBelow ? '↓' : '↑'} {absValue}% {isBelow ? 'below' : 'above'} avg
      </span>
    );
  }

  if (priceVsMsrpPct !== null && priceVsMsrpPct !== undefined) {
    const isBelow = priceVsMsrpPct < 0;
    const absValue = Math.abs(priceVsMsrpPct).toFixed(0);
    
    return (
      <span className={`${styles.comparisonText} ${isBelow ? styles.positive : styles.negative}`}>
        {isBelow ? '↓' : '↑'} {absValue}% vs MSRP
      </span>
    );
  }

  return null;
}

export default DealBadge;
