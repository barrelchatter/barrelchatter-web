import React, { useState, useRef, useEffect } from 'react';
import { COMMON_FLAVORS, FLAVOR_CATEGORIES } from '../constants/bottleOptions';
import styles from '../styles/FlavorTagInput.module.scss';

/**
 * FlavorTagInput - Multi-select tag input for bourbon flavor descriptors
 * 
 * Props:
 *   value: string[] - Currently selected flavor tags
 *   onChange: (tags: string[]) => void - Callback when tags change
 *   suggestions: string[] - Custom suggestions (defaults to COMMON_FLAVORS)
 *   placeholder: string - Input placeholder text
 *   maxTags: number - Maximum allowed tags (default: 20)
 *   showCategories: boolean - Show categorized dropdown (default: true)
 */
function FlavorTagInput({
  value = [],
  onChange,
  suggestions = COMMON_FLAVORS,
  placeholder = 'Add flavor tags...',
  maxTags = 20,
  showCategories = true,
}) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Filter suggestions based on input and already selected tags
  const filteredSuggestions = suggestions.filter(
    (s) =>
      !value.includes(s) &&
      s.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Group suggestions by category if enabled
  const groupedSuggestions = showCategories
    ? Object.entries(FLAVOR_CATEGORIES).reduce((acc, [category, flavors]) => {
        const filtered = flavors.filter(
          (f) =>
            !value.includes(f) &&
            f.toLowerCase().includes(inputValue.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {})
    : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(e) {
    setInputValue(e.target.value);
    setShowDropdown(true);
    setHighlightedIndex(-1);
  }

  function handleInputFocus() {
    setShowDropdown(true);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        addTag(filteredSuggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue.trim().toLowerCase());
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  function addTag(tag) {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !value.includes(normalizedTag) && value.length < maxTags) {
      onChange([...value, normalizedTag]);
    }
    setInputValue('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  function removeTag(tag) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleSuggestionClick(suggestion) {
    addTag(suggestion);
  }

  const atMaxTags = value.length >= maxTags;

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <div className={styles.tagsContainer}>
          {value.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
              <button
                type="button"
                className={styles.tagRemove}
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          {!atMaxTags && (
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              placeholder={value.length === 0 ? placeholder : ''}
              aria-label="Add flavor tag"
            />
          )}
        </div>
      </div>

      {showDropdown && filteredSuggestions.length > 0 && !atMaxTags && (
        <div className={styles.dropdown}>
          {showCategories && groupedSuggestions ? (
            Object.entries(groupedSuggestions).map(([category, flavors]) => (
              <div key={category} className={styles.categoryGroup}>
                <div className={styles.categoryLabel}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </div>
                {flavors.map((suggestion, idx) => {
                  const flatIndex = filteredSuggestions.indexOf(suggestion);
                  return (
                    <button
                      key={suggestion}
                      type="button"
                      className={`${styles.suggestion} ${
                        flatIndex === highlightedIndex ? styles.highlighted : ''
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            filteredSuggestions.slice(0, 15).map((suggestion, idx) => (
              <button
                key={suggestion}
                type="button"
                className={`${styles.suggestion} ${
                  idx === highlightedIndex ? styles.highlighted : ''
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))
          )}
        </div>
      )}

      {atMaxTags && (
        <div className={styles.maxMessage}>
          Maximum {maxTags} tags reached
        </div>
      )}

      {value.length > 0 && (
        <div className={styles.tagCount}>
          {value.length} / {maxTags} tags
        </div>
      )}
    </div>
  );
}

export default FlavorTagInput;
