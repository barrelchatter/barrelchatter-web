import React, { useState } from 'react';
import FlavorTagInput from './FlavorTagInput';
import styles from '../styles/StructuredTastingForm.module.scss';

/**
 * StructuredTastingForm - Detailed tasting notes with nose/palate/finish
 * 
 * Props:
 *   values: { nose_notes, palate_notes, finish_notes, flavor_tags, notes }
 *   onChange: (field, value) => void
 *   simpleMode: boolean - Start in simple (single notes) mode
 */
function StructuredTastingForm({
  values = {},
  onChange,
  simpleMode: initialSimpleMode = true,
}) {
  const [isSimpleMode, setIsSimpleMode] = useState(initialSimpleMode);

  const {
    nose_notes = '',
    palate_notes = '',
    finish_notes = '',
    flavor_tags = [],
    notes = '',
  } = values;

  // Check if any structured notes exist
  const hasStructuredNotes = nose_notes || palate_notes || finish_notes;

  // Auto-switch to structured mode if structured notes exist
  const effectiveSimpleMode = isSimpleMode && !hasStructuredNotes;

  function handleModeToggle() {
    setIsSimpleMode(!isSimpleMode);
  }

  if (effectiveSimpleMode) {
    return (
      <div className={styles.container}>
        <div className={styles.modeToggle}>
          <span className={styles.modeLabel}>Tasting Notes</span>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={handleModeToggle}
          >
            Switch to Detailed Notes →
          </button>
        </div>

        <textarea
          className={styles.simpleTextarea}
          value={notes}
          onChange={(e) => onChange('notes', e.target.value)}
          placeholder="Describe your tasting experience..."
          rows={4}
        />

        <div className={styles.flavorSection}>
          <label className={styles.fieldLabel}>Flavor Tags</label>
          <FlavorTagInput
            value={flavor_tags}
            onChange={(tags) => onChange('flavor_tags', tags)}
            placeholder="Add flavors you detected..."
          />
        </div>
      </div>
    );
  }

  // Structured mode
  return (
    <div className={styles.container}>
      <div className={styles.modeToggle}>
        <span className={styles.modeLabel}>Detailed Tasting Notes</span>
        <button
          type="button"
          className={styles.toggleButton}
          onClick={handleModeToggle}
        >
          ← Switch to Simple Notes
        </button>
      </div>

      <div className={styles.structuredFields}>
        {/* Nose */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldIcon}>👃</span>
            Nose
          </label>
          <textarea
            className={styles.fieldTextarea}
            value={nose_notes}
            onChange={(e) => onChange('nose_notes', e.target.value)}
            placeholder="Aromas on the nose... (vanilla, caramel, oak...)"
            rows={3}
          />
        </div>

        {/* Palate */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldIcon}>👅</span>
            Palate
          </label>
          <textarea
            className={styles.fieldTextarea}
            value={palate_notes}
            onChange={(e) => onChange('palate_notes', e.target.value)}
            placeholder="Flavors on the palate... (rich, oily, spicy...)"
            rows={3}
          />
        </div>

        {/* Finish */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldIcon}>✨</span>
            Finish
          </label>
          <textarea
            className={styles.fieldTextarea}
            value={finish_notes}
            onChange={(e) => onChange('finish_notes', e.target.value)}
            placeholder="The finish... (long, warm, lingering spice...)"
            rows={3}
          />
        </div>

        {/* Additional Notes */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldIcon}>📝</span>
            Additional Notes
          </label>
          <textarea
            className={styles.fieldTextarea}
            value={notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="Any other thoughts, context, or observations..."
            rows={2}
          />
        </div>
      </div>

      {/* Flavor Tags */}
      <div className={styles.flavorSection}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldIcon}>🏷️</span>
          Flavor Tags
        </label>
        <FlavorTagInput
          value={flavor_tags}
          onChange={(tags) => onChange('flavor_tags', tags)}
          placeholder="Add flavors you detected..."
          showCategories={true}
        />
      </div>
    </div>
  );
}

/**
 * StructuredNotesDisplay - Read-only display of structured notes
 */
export function StructuredNotesDisplay({ notes }) {
  const { nose_notes, palate_notes, finish_notes, notes: generalNotes, flavor_tags } = notes || {};

  const hasStructured = nose_notes || palate_notes || finish_notes;

  if (!hasStructured && !generalNotes && (!flavor_tags || flavor_tags.length === 0)) {
    return <p className={styles.emptyNotes}>No tasting notes recorded.</p>;
  }

  return (
    <div className={styles.displayContainer}>
      {hasStructured ? (
        <>
          {nose_notes && (
            <div className={styles.displaySection}>
              <h4 className={styles.displayLabel}>👃 Nose</h4>
              <p className={styles.displayText}>{nose_notes}</p>
            </div>
          )}
          {palate_notes && (
            <div className={styles.displaySection}>
              <h4 className={styles.displayLabel}>👅 Palate</h4>
              <p className={styles.displayText}>{palate_notes}</p>
            </div>
          )}
          {finish_notes && (
            <div className={styles.displaySection}>
              <h4 className={styles.displayLabel}>✨ Finish</h4>
              <p className={styles.displayText}>{finish_notes}</p>
            </div>
          )}
          {generalNotes && (
            <div className={styles.displaySection}>
              <h4 className={styles.displayLabel}>📝 Notes</h4>
              <p className={styles.displayText}>{generalNotes}</p>
            </div>
          )}
        </>
      ) : (
        generalNotes && <p className={styles.displayText}>{generalNotes}</p>
      )}

      {flavor_tags && flavor_tags.length > 0 && (
        <div className={styles.displayTags}>
          {flavor_tags.map((tag) => (
            <span key={tag} className={styles.displayTag}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default StructuredTastingForm;
