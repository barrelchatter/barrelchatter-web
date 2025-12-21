import React, { useState } from 'react';
import { X, UserPlus, Search, User } from 'react-feather';
import { groupsAPI, usersAPI } from '../api/client';
import styles from '../styles/GroupInviteModal.module.scss';

/**
 * GroupInviteModal
 *
 * Modal for inviting users to a group.
 *
 * Props:
 *   groupId     - Group ID to invite to
 *   onClose     - Callback when modal is closed
 *   onInviteSent - Callback when invite is sent
 */
function GroupInviteModal({ groupId, onClose, onInviteSent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Search for users
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError('');

    try {
      const res = await usersAPI.search(searchQuery.trim());
      setSearchResults(res.data.users || []);
      if (res.data.users?.length === 0) {
        setError('No users found');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Select a user
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedUser(null);
  };

  // Send invite
  const handleSendInvite = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    setError('');

    try {
      await groupsAPI.invite(groupId, selectedUser.id, message.trim() || null);
      onInviteSent?.();
    } catch (err) {
      console.error('Invite failed:', err);
      const msg = err?.response?.data?.error || 'Failed to send invite';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <UserPlus size={20} />
            <h2>Invite to Group</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button">
            <X size={20} />
          </button>
        </header>

        <div className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Selected User */}
          {selectedUser ? (
            <div className={styles.selectedUser}>
              <div className={styles.selectedUserInfo}>
                <div className={styles.userAvatar}>
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div>
                  <span className={styles.userName}>{selectedUser.name}</span>
                  <span className={styles.userEmail}>{selectedUser.email}</span>
                </div>
              </div>
              <button onClick={handleClearSelection} className={styles.clearButton}>
                <X size={16} />
              </button>
            </div>
          ) : (
            /* Search */
            <div className={styles.searchSection}>
              <label className={styles.label}>Search for a user</label>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className={styles.searchInput}
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className={styles.searchButton}
                >
                  {searching ? (
                    <span className={styles.spinnerSmall} />
                  ) : (
                    <Search size={18} />
                  )}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className={styles.searchResults}>
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      className={styles.searchResult}
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className={styles.userAvatar}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" />
                        ) : (
                          <User size={18} />
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userEmail}>{user.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {selectedUser && (
            <div className={styles.field}>
              <label className={styles.label}>Message (optional)</label>
              <textarea
                placeholder="Add a personal message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={styles.textarea}
                rows={3}
              />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleSendInvite}
            disabled={!selectedUser || submitting}
            className={styles.submitButton}
          >
            {submitting ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupInviteModal;
