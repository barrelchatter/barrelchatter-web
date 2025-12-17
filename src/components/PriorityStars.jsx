import React from 'react';
import { WISHLIST_PRIORITIES, getPriorityInfo } from '../constants/bottleOptions';
import styles from '../styles/PriorityStars.module.scss';

/**
 * PriorityStars - Display and edit wishlist priority (1-5)
 * 
 * Props:
 *   value: number (1-5, where 1 is highest priority)
 *   onChange: (value: number) => void
 *   editable: boolean
 *   size: 'small' | 'medium' | 'large'
 *   showLabel: boolean
 */
function PriorityStars({
  value = 3,
  onChange,
  editable = false,
  size = 'medium',
  showLabel = false,
}) {
  const priorityInfo = getPriorityInfo(value);
  const maxStars = 5;

  function handleClick(starValue) {
    if (editable && onChange) {
      // Clicking converts visual stars to priority
      // 5 stars = priority 1 (must have)
      // 1 star = priority 5 (nice to have)
      const newPriority = maxStars - starValue + 1;
      onChange(newPriority);
    }
  }

  // Convert priority to visual stars (inverse)
  // Priority 1 = 5 stars, Priority 5 = 1 star
  const filledStars = maxStars - value + 1;

  return (
    <div className={`${styles.container} ${styles[`size_${size}`]}`}>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((starNum) => (
          <button
            key={starNum}
            type="button"
            className={`${styles.star} ${starNum <= filledStars ? styles.filled : styles.empty}`}
            onClick={() => handleClick(starNum)}
            disabled={!editable}
            aria-label={`Set priority to ${maxStars - starNum + 1}`}
            style={{ color: starNum <= filledStars ? priorityInfo.color : undefined }}
          >
            ★
          </button>
        ))}
      </div>
      {showLabel && (
        <span 
          className={styles.label}
          style={{ color: priorityInfo.color }}
        >
          {priorityInfo.label}
        </span>
      )}
    </div>
  );
}

/**
 * PrioritySelect - Dropdown selector for priority
 */
export function PrioritySelect({ value, onChange, disabled = false }) {
  return (
    <select
      className={styles.select}
      value={value || 3}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
    >
      {WISHLIST_PRIORITIES.map((p) => (
        <option key={p.value} value={p.value}>
          {'★'.repeat(p.stars)}{'☆'.repeat(5 - p.stars)} {p.label}
        </option>
      ))}
    </select>
  );
}

/**
 * PriorityBadge - Compact badge display
 */
export function PriorityBadge({ priority }) {
  const info = getPriorityInfo(priority);
  const stars = 6 - priority; // Convert to visual stars

  return (
    <span 
      className={styles.badge}
      style={{ 
        backgroundColor: `${info.color}20`,
        color: info.color,
        borderColor: `${info.color}40`,
      }}
    >
      {'★'.repeat(stars)} {info.label}
    </span>
  );
}

export default PriorityStars;
