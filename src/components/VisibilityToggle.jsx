import React from 'react';
import { VISIBILITY_OPTIONS } from '../constants/bottleOptions';
import styles from '../styles/VisibilityToggle.module.scss';

/**
 * VisibilityToggle - Select private/friends/public visibility
 * 
 * Props:
 *   value: string ('private' | 'friends' | 'public')
 *   onChange: (value: string) => void
 *   disabled: boolean
 *   showDescriptions: boolean
 *   variant: 'buttons' | 'select' | 'pills'
 */
function VisibilityToggle({
  value = 'private',
  onChange,
  disabled = false,
  showDescriptions = false,
  variant = 'buttons',
}) {
  if (variant === 'select') {
    return (
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {VISIBILITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.icon} {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (variant === 'pills') {
    return (
      <div className={styles.pillsContainer}>
        {VISIBILITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`${styles.pill} ${value === opt.value ? styles.pillActive : ''}`}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
          >
            <span className={styles.pillIcon}>{opt.icon}</span>
            <span className={styles.pillLabel}>{opt.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Default: buttons variant
  return (
    <div className={styles.container}>
      <div className={styles.buttonGroup}>
        {VISIBILITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`${styles.button} ${value === opt.value ? styles.active : ''}`}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            title={opt.description}
          >
            <span className={styles.buttonIcon}>{opt.icon}</span>
            <span className={styles.buttonLabel}>{opt.label}</span>
          </button>
        ))}
      </div>
      {showDescriptions && (
        <div className={styles.description}>
          {VISIBILITY_OPTIONS.find((o) => o.value === value)?.description}
        </div>
      )}
    </div>
  );
}

/**
 * VisibilityBadge - Display-only badge
 */
export function VisibilityBadge({ visibility }) {
  const option = VISIBILITY_OPTIONS.find((o) => o.value === visibility) || VISIBILITY_OPTIONS[0];

  return (
    <span className={`${styles.badge} ${styles[`badge_${visibility}`]}`}>
      {option.icon} {option.label}
    </span>
  );
}

export default VisibilityToggle;
