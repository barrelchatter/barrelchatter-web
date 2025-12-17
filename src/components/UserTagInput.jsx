import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import styles from '../styles/UserTagInput.module.scss';

/**
 * UserTagInput - Search and tag users (friends) in tastings
 * 
 * Props:
 *   selectedUsers: array of user objects [{id, name, avatar_url}, ...]
 *   onChange: (users) => void
 *   placeholder: string
 *   maxUsers: number (default 10)
 */
function UserTagInput({
  selectedUsers = [],
  onChange,
  placeholder = 'Tag friends...',
  maxUsers = 10,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        // Search friends first, then fallback to all users
        const res = await api.get(`/v1/users/search?q=${encodeURIComponent(query)}&limit=10`);
        const users = res.data?.users || [];
        // Filter out already selected users
        const selectedIds = new Set(selectedUsers.map((u) => u.id));
        const filtered = users.filter((u) => !selectedIds.has(u.id));
        setResults(filtered);
      } catch (err) {
        console.error('User search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query, selectedUsers]);

  function handleSelect(user) {
    if (selectedUsers.length >= maxUsers) return;
    
    const newSelected = [...selectedUsers, user];
    onChange(newSelected);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  }

  function handleRemove(userId) {
    const newSelected = selectedUsers.filter((u) => u.id !== userId);
    onChange(newSelected);
  }

  function handleKeyDown(e) {
    if (e.key === 'Backspace' && query === '' && selectedUsers.length > 0) {
      // Remove last user when backspace on empty input
      handleRemove(selectedUsers[selectedUsers.length - 1].id);
    }
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrapper}>
        {/* Selected Users */}
        {selectedUsers.map((user) => (
          <span key={user.id} className={styles.tag}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className={styles.tagAvatar} />
            ) : (
              <span className={styles.tagAvatarPlaceholder}>
                {user.name?.charAt(0) || '?'}
              </span>
            )}
            <span className={styles.tagName}>{user.name}</span>
            <button
              type="button"
              className={styles.tagRemove}
              onClick={() => handleRemove(user.id)}
            >
              ×
            </button>
          </span>
        ))}

        {/* Input */}
        {selectedUsers.length < maxUsers && (
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedUsers.length === 0 ? placeholder : ''}
          />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (query.length >= 2 || loading) && (
        <div className={styles.dropdown}>
          {loading ? (
            <div className={styles.dropdownLoading}>Searching...</div>
          ) : results.length === 0 ? (
            <div className={styles.dropdownEmpty}>
              {query.length >= 2 ? 'No users found' : 'Type to search...'}
            </div>
          ) : (
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                className={styles.dropdownItem}
                onClick={() => handleSelect(user)}
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className={styles.itemAvatar} />
                ) : (
                  <span className={styles.itemAvatarPlaceholder}>
                    {user.name?.charAt(0) || '?'}
                  </span>
                )}
                <span className={styles.itemName}>{user.name}</span>
                {user.location_city && user.location_state && (
                  <span className={styles.itemLocation}>
                    {user.location_city}, {user.location_state}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default UserTagInput;
