import React, { useMemo } from 'react';
import styles from '../styles/BarrelTrackingSection.module.scss';

/**
 * BarrelTrackingSection - Form section for barrel provenance tracking
 * 
 * Use this in Add/Edit Bottle forms when is_single_barrel or is_limited_release is true
 * 
 * @param {object} formData - Current form data
 * @param {function} onChange - Handler for form field changes
 * @param {boolean} expanded - Whether section is initially expanded
 * @param {boolean} disabled - Disable all fields
 */
function BarrelTrackingSection({ 
  formData, 
  onChange, 
  expanded = false,
  disabled = false 
}) {
  // Calculate barrel age from dates
  const calculatedAge = useMemo(() => {
    if (!formData.barrel_date || !formData.bottle_date) return null;
    
    const barrelDate = new Date(formData.barrel_date);
    const bottleDate = new Date(formData.bottle_date);
    
    if (bottleDate < barrelDate) return null; // Invalid: bottle before barrel
    
    const diffMs = bottleDate - barrelDate;
    const years = diffMs / (365.25 * 24 * 60 * 60 * 1000);
    
    return years.toFixed(1);
  }, [formData.barrel_date, formData.bottle_date]);

  // Check for date validation error
  const dateError = useMemo(() => {
    if (!formData.barrel_date || !formData.bottle_date) return null;
    
    const barrelDate = new Date(formData.barrel_date);
    const bottleDate = new Date(formData.bottle_date);
    
    if (bottleDate < barrelDate) {
      return 'Bottle date cannot be before barrel date';
    }
    return null;
  }, [formData.barrel_date, formData.bottle_date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ target: { name, value: value || null } });
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h4 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🛢️</span>
          Barrel Information
        </h4>
        <span className={styles.sectionHint}>
          For single barrel and limited releases
        </span>
      </div>

      <div className={styles.sectionContent}>
        {/* Date row */}
        <div className={styles.dateRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Barrel Date
              <span className={styles.labelHint}>When juice entered barrel</span>
            </label>
            <input
              type="date"
              name="barrel_date"
              value={formData.barrel_date || ''}
              onChange={handleChange}
              disabled={disabled}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Bottle Date
              <span className={styles.labelHint}>When bottled for sale</span>
            </label>
            <input
              type="date"
              name="bottle_date"
              value={formData.bottle_date || ''}
              onChange={handleChange}
              disabled={disabled}
              className={styles.input}
            />
          </div>
        </div>

        {/* Calculated age display */}
        {calculatedAge && !dateError && (
          <div className={styles.calculatedAge}>
            <span className={styles.ageIcon}>📅</span>
            <span className={styles.ageText}>
              Calculated barrel age: <strong>{calculatedAge} years</strong>
            </span>
          </div>
        )}

        {/* Date validation error */}
        {dateError && (
          <div className={styles.dateError}>
            ⚠️ {dateError}
          </div>
        )}

        {/* Barrel details row */}
        <div className={styles.detailsRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Barrel Number
              <span className={styles.labelHint}>From the label</span>
            </label>
            <input
              type="text"
              name="barrel_number"
              value={formData.barrel_number || ''}
              onChange={handleChange}
              disabled={disabled}
              placeholder="e.g., Barrel #4521"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Rickhouse Location
              <span className={styles.labelHint}>Where it aged</span>
            </label>
            <input
              type="text"
              name="rickhouse_location"
              value={formData.rickhouse_location || ''}
              onChange={handleChange}
              disabled={disabled}
              placeholder="e.g., Warehouse H, Floor 3"
              className={styles.input}
            />
          </div>
        </div>

        {/* MSRP field */}
        <div className={styles.msrpRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              MSRP
              <span className={styles.labelHint}>Manufacturer suggested retail price</span>
            </label>
            <div className={styles.priceInputWrapper}>
              <span className={styles.currencySymbol}>$</span>
              <input
                type="number"
                name="msrp"
                value={formData.msrp || ''}
                onChange={handleChange}
                disabled={disabled}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`${styles.input} ${styles.priceInput}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * BarrelInfoDisplay - Read-only display of barrel information
 * 
 * Use on bottle detail pages
 */
export function BarrelInfoDisplay({ bottle }) {
  const {
    barrel_date,
    bottle_date,
    barrel_number,
    rickhouse_location,
    msrp,
  } = bottle;

  // Calculate age
  const calculatedAge = useMemo(() => {
    if (!barrel_date || !bottle_date) return null;
    const diffMs = new Date(bottle_date) - new Date(barrel_date);
    return (diffMs / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1);
  }, [barrel_date, bottle_date]);

  // Check if any barrel info exists
  const hasBarrelInfo = barrel_date || bottle_date || barrel_number || rickhouse_location;

  if (!hasBarrelInfo) return null;

  return (
    <div className={styles.infoDisplay}>
      <h4 className={styles.infoTitle}>
        <span className={styles.sectionIcon}>🛢️</span>
        Barrel Information
      </h4>

      <div className={styles.infoGrid}>
        {barrel_date && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Barrel Date</span>
            <span className={styles.infoValue}>
              {new Date(barrel_date).toLocaleDateString()}
            </span>
          </div>
        )}

        {bottle_date && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Bottle Date</span>
            <span className={styles.infoValue}>
              {new Date(bottle_date).toLocaleDateString()}
            </span>
          </div>
        )}

        {calculatedAge && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Barrel Age</span>
            <span className={styles.infoValue}>{calculatedAge} years</span>
          </div>
        )}

        {barrel_number && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Barrel #</span>
            <span className={styles.infoValue}>{barrel_number}</span>
          </div>
        )}

        {rickhouse_location && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Rickhouse</span>
            <span className={styles.infoValue}>{rickhouse_location}</span>
          </div>
        )}

        {msrp && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>MSRP</span>
            <span className={styles.infoValue}>${parseFloat(msrp).toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default BarrelTrackingSection;
