import React from 'react';
import {
  FILL_LEVELS,
  SEAL_CONDITIONS,
  LABEL_CONDITIONS,
  BOX_CONDITIONS,
  getFillLevelPercent,
} from '../constants/bottleOptions';
import styles from '../styles/ConditionSection.module.scss';

/**
 * ConditionSection - Display and edit bottle condition
 * 
 * Props:
 *   fillLevel: string
 *   sealCondition: string
 *   labelCondition: string
 *   boxIncluded: boolean
 *   boxCondition: string
 *   editMode: boolean
 *   onChange: (field, value) => void
 */
function ConditionSection({
  fillLevel,
  sealCondition,
  labelCondition,
  boxIncluded,
  boxCondition,
  editMode = false,
  onChange,
}) {
  const fillPercent = getFillLevelPercent(fillLevel);

  if (!editMode) {
    // Display mode
    return (
      <div className={styles.container}>
        <h3 className={styles.sectionTitle}>Bottle Condition</h3>
        
        <div className={styles.conditionGrid}>
          {/* Fill Level with visual indicator */}
          <div className={styles.conditionItem}>
            <span className={styles.conditionLabel}>Fill Level</span>
            <div className={styles.fillDisplay}>
              <div className={styles.fillBar}>
                <div 
                  className={styles.fillLevel} 
                  style={{ height: `${fillPercent}%` }}
                />
              </div>
              <span className={styles.fillText}>
                {fillLevel || 'Full'}
              </span>
            </div>
          </div>

          {/* Seal Condition */}
          <div className={styles.conditionItem}>
            <span className={styles.conditionLabel}>Seal</span>
            <span className={`${styles.conditionBadge} ${styles[`seal_${sealCondition || 'intact'}`]}`}>
              {sealCondition ? sealCondition.charAt(0).toUpperCase() + sealCondition.slice(1) : 'Intact'}
            </span>
          </div>

          {/* Label Condition */}
          <div className={styles.conditionItem}>
            <span className={styles.conditionLabel}>Label</span>
            <span className={`${styles.conditionBadge} ${styles[`condition_${labelCondition || 'good'}`]}`}>
              {labelCondition ? labelCondition.charAt(0).toUpperCase() + labelCondition.slice(1) : '—'}
            </span>
          </div>

          {/* Box */}
          <div className={styles.conditionItem}>
            <span className={styles.conditionLabel}>Box/Tube</span>
            {boxIncluded ? (
              <span className={`${styles.conditionBadge} ${styles[`condition_${boxCondition || 'good'}`]}`}>
                {boxCondition ? boxCondition.charAt(0).toUpperCase() + boxCondition.slice(1) : 'Included'}
              </span>
            ) : (
              <span className={styles.conditionBadge}>Not included</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>Bottle Condition</h3>
      
      <div className={styles.editGrid}>
        {/* Fill Level */}
        <div className={styles.editField}>
          <label className={styles.editLabel}>Fill Level</label>
          <div className={styles.fillEditRow}>
            <div className={styles.fillBar}>
              <div 
                className={styles.fillLevel} 
                style={{ height: `${fillPercent}%` }}
              />
            </div>
            <select
              className={styles.editSelect}
              value={fillLevel || 'full'}
              onChange={(e) => onChange('fill_level', e.target.value)}
            >
              {FILL_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Seal Condition */}
        <div className={styles.editField}>
          <label className={styles.editLabel}>Seal Condition</label>
          <select
            className={styles.editSelect}
            value={sealCondition || ''}
            onChange={(e) => onChange('seal_condition', e.target.value || null)}
          >
            <option value="">Not specified</option>
            {SEAL_CONDITIONS.map((cond) => (
              <option key={cond.value} value={cond.value}>
                {cond.label}
              </option>
            ))}
          </select>
        </div>

        {/* Label Condition */}
        <div className={styles.editField}>
          <label className={styles.editLabel}>Label Condition</label>
          <select
            className={styles.editSelect}
            value={labelCondition || ''}
            onChange={(e) => onChange('label_condition', e.target.value || null)}
          >
            <option value="">Not specified</option>
            {LABEL_CONDITIONS.map((cond) => (
              <option key={cond.value} value={cond.value}>
                {cond.label}
              </option>
            ))}
          </select>
        </div>

        {/* Box Included */}
        <div className={styles.editField}>
          <label className={styles.editLabel}>Original Box/Tube</label>
          <div className={styles.checkboxRow}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={boxIncluded || false}
                onChange={(e) => onChange('box_included', e.target.checked)}
              />
              <span>Included</span>
            </label>
          </div>
        </div>

        {/* Box Condition (only if included) */}
        {boxIncluded && (
          <div className={styles.editField}>
            <label className={styles.editLabel}>Box Condition</label>
            <select
              className={styles.editSelect}
              value={boxCondition || ''}
              onChange={(e) => onChange('box_condition', e.target.value || null)}
            >
              <option value="">Not specified</option>
              {BOX_CONDITIONS.map((cond) => (
                <option key={cond.value} value={cond.value}>
                  {cond.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * FillLevelIndicator - Standalone fill level display
 */
export function FillLevelIndicator({ level, size = 'medium' }) {
  const percent = getFillLevelPercent(level);
  
  return (
    <div className={`${styles.fillIndicator} ${styles[`size_${size}`]}`}>
      <div className={styles.fillBarSmall}>
        <div 
          className={styles.fillLevelSmall} 
          style={{ height: `${percent}%` }}
        />
      </div>
      <span className={styles.fillLabelSmall}>{level || 'Full'}</span>
    </div>
  );
}

/**
 * ConditionBadge - Small badge for condition display
 */
export function ConditionBadge({ type, value }) {
  if (!value) return <span className={styles.conditionBadgeInline}>—</span>;
  
  const classKey = type === 'seal' ? `seal_${value}` : `condition_${value}`;
  
  return (
    <span className={`${styles.conditionBadgeInline} ${styles[classKey]}`}>
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </span>
  );
}

export default ConditionSection;
