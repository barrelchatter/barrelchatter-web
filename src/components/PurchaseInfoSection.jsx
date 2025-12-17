import React from 'react';
import styles from '../styles/PurchaseInfoSection.module.scss';

/**
 * PurchaseInfoSection - Form section for purchase details in inventory forms
 * 
 * Includes: price_paid, purchase_date, and visual deal indicators
 * 
 * @param {object} formData - Current form data
 * @param {function} onChange - Handler for form field changes  
 * @param {object} pricingContext - Optional pricing data for deal display
 * @param {boolean} disabled - Disable all fields
 */
function PurchaseInfoSection({
  formData,
  onChange,
  pricingContext,
  disabled = false,
}) {
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Handle numeric fields
    if (type === 'number') {
      onChange({ target: { name, value: value ? parseFloat(value) : null } });
    } else {
      onChange({ target: { name, value: value || null } });
    }
  };

  // Calculate deal analysis if we have pricing context
  const dealAnalysis = React.useMemo(() => {
    if (!formData.price_paid || !pricingContext?.avg_price) return null;

    const userPrice = parseFloat(formData.price_paid);
    const avgPrice = parseFloat(pricingContext.avg_price);
    const msrp = pricingContext.avg_msrp ? parseFloat(pricingContext.avg_msrp) : null;

    const vsAvgPct = ((userPrice / avgPrice) - 1) * 100;
    const vsMsrpPct = msrp ? ((userPrice / msrp) - 1) * 100 : null;

    return {
      vsAvgPct,
      vsMsrpPct,
      avgPrice,
      msrp,
    };
  }, [formData.price_paid, pricingContext]);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h4 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>💰</span>
          Purchase Details
        </h4>
      </div>

      <div className={styles.sectionContent}>
        {/* Price and Date row */}
        <div className={styles.priceRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Price Paid
              <span className={styles.labelHint}>Leave blank for gifts</span>
            </label>
            <div className={styles.priceInputWrapper}>
              <span className={styles.currencySymbol}>$</span>
              <input
                type="number"
                name="price_paid"
                value={formData.price_paid || ''}
                onChange={handleChange}
                disabled={disabled}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`${styles.input} ${styles.priceInput}`}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Purchase Date
              <span className={styles.labelHint}>When you acquired it</span>
            </label>
            <input
              type="date"
              name="purchase_date"
              value={formData.purchase_date || ''}
              onChange={handleChange}
              disabled={disabled}
              className={styles.input}
            />
          </div>
        </div>

        {/* Deal analysis indicator */}
        {dealAnalysis && (
          <DealIndicator analysis={dealAnalysis} />
        )}

        {/* Pricing context hint */}
        {pricingContext && !formData.price_paid && (
          <div className={styles.pricingHint}>
            <span className={styles.hintIcon}>💡</span>
            <span className={styles.hintText}>
              Community average: <strong>${pricingContext.avg_price}</strong>
              {pricingContext.avg_msrp && (
                <> · MSRP: <strong>${pricingContext.avg_msrp}</strong></>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * DealIndicator - Shows real-time deal analysis as user types price
 */
function DealIndicator({ analysis }) {
  const { vsAvgPct, vsMsrpPct, avgPrice, msrp } = analysis;

  // Determine deal quality
  let dealType = 'neutral';
  let message = '';
  let icon = '💰';

  if (vsAvgPct <= -20) {
    dealType = 'great';
    message = `Great deal! ${Math.abs(vsAvgPct).toFixed(0)}% below average ($${avgPrice})`;
    icon = '🎉';
  } else if (vsAvgPct <= -10) {
    dealType = 'good';
    message = `Good price! ${Math.abs(vsAvgPct).toFixed(0)}% below average ($${avgPrice})`;
    icon = '✓';
  } else if (vsAvgPct >= 30) {
    dealType = 'premium';
    message = `${vsAvgPct.toFixed(0)}% above average ($${avgPrice}) - secondary market?`;
    icon = '📈';
  } else if (vsAvgPct >= 10) {
    dealType = 'above';
    message = `${vsAvgPct.toFixed(0)}% above average ($${avgPrice})`;
    icon = '↑';
  } else {
    dealType = 'fair';
    message = `Fair price (within 10% of $${avgPrice} average)`;
    icon = '✓';
  }

  return (
    <div className={`${styles.dealIndicator} ${styles[dealType]}`}>
      <span className={styles.dealIcon}>{icon}</span>
      <span className={styles.dealMessage}>{message}</span>
      {vsMsrpPct !== null && (
        <span className={styles.msrpComparison}>
          {vsMsrpPct < 0 ? (
            <span className={styles.belowMsrp}>
              {Math.abs(vsMsrpPct).toFixed(0)}% below MSRP
            </span>
          ) : vsMsrpPct > 0 ? (
            <span className={styles.aboveMsrp}>
              {vsMsrpPct.toFixed(0)}% above MSRP
            </span>
          ) : (
            <span className={styles.atMsrp}>At MSRP</span>
          )}
        </span>
      )}
    </div>
  );
}

/**
 * PurchaseInfoDisplay - Read-only display of purchase info with deal badge
 */
export function PurchaseInfoDisplay({ inventory, pricingContext }) {
  const { price_paid, purchase_date, msrp } = inventory;

  // Calculate deal analysis
  const dealAnalysis = React.useMemo(() => {
    if (!price_paid || !pricingContext?.avg_price) return null;

    const userPrice = parseFloat(price_paid);
    const avgPrice = parseFloat(pricingContext.avg_price);

    return {
      vsAvgPct: ((userPrice / avgPrice) - 1) * 100,
      avgPrice,
    };
  }, [price_paid, pricingContext]);

  if (!price_paid && !purchase_date) return null;

  return (
    <div className={styles.infoDisplay}>
      <div className={styles.infoRow}>
        {price_paid && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Paid</span>
            <span className={styles.infoValue}>${parseFloat(price_paid).toFixed(2)}</span>
          </div>
        )}

        {purchase_date && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Purchased</span>
            <span className={styles.infoValue}>
              {new Date(purchase_date).toLocaleDateString()}
            </span>
          </div>
        )}

        {dealAnalysis && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>vs Average</span>
            <span className={`${styles.infoValue} ${dealAnalysis.vsAvgPct < 0 ? styles.positive : styles.negative}`}>
              {dealAnalysis.vsAvgPct < 0 ? '↓' : '↑'} 
              {Math.abs(dealAnalysis.vsAvgPct).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PurchaseInfoSection;
