import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Globe, Bell, Check, X } from 'react-feather';
import { groupsAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import GroupEditModal from '../components/GroupEditModal';
import styles from '../styles/GroupsPage.module.scss';

function GroupsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState('my-groups');

  // Data state
  const [myGroups, setMyGroups] = useState([]);
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'my-groups') {
        const res = await groupsAPI.list();
        setMyGroups(res.data.groups || []);
      } else if (activeTab === 'discover') {
        const res = await groupsAPI.discover({ search: searchQuery || undefined });
        setDiscoverGroups(res.data.groups || []);
      } else if (activeTab === 'invites') {
        const res = await groupsAPI.invites();
        setInvites(res.data.invites || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Search in discover tab
  const handleSearch = async () => {
    if (activeTab === 'discover') {
      setLoading(true);
      try {
        const res = await groupsAPI.discover({ search: searchQuery || undefined });
        setDiscoverGroups(res.data.groups || []);
      } catch (err) {
        showToast('Search failed', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle accepting an invite
  const handleAcceptInvite = async (invite) => {
    const key = `accept-${invite.id}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));

    try {
      await groupsAPI.join(invite.group_id);
      setInvites(prev => prev.filter(i => i.id !== invite.id));
      showToast(`Joined ${invite.group_name}!`, 'success');
      // Refresh my groups
      const res = await groupsAPI.list();
      setMyGroups(res.data.groups || []);
    } catch (err) {
      showToast('Failed to join group', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Handle declining an invite
  const handleDeclineInvite = async (invite) => {
    const key = `decline-${invite.id}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));

    try {
      await groupsAPI.decline(invite.group_id);
      setInvites(prev => prev.filter(i => i.id !== invite.id));
      showToast('Invite declined', 'success');
    } catch (err) {
      showToast('Failed to decline invite', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Handle group creation
  const handleCreateGroup = () => {
    setEditingGroup(null);
    setShowModal(true);
  };

  // Handle group saved
  const handleGroupSaved = async (group) => {
    setShowModal(false);
    showToast(editingGroup ? 'Group updated' : 'Group created!', 'success');
    // Refresh my groups
    const res = await groupsAPI.list();
    setMyGroups(res.data.groups || []);
  };

  // Navigate to group detail
  const handleViewGroup = (groupId) => {
    navigate(`/app/groups/${groupId}`);
  };

  // Render tab content
  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={fetchData} className={styles.retryButton}>
            Retry
          </button>
        </div>
      );
    }

    if (activeTab === 'my-groups') {
      return renderMyGroups();
    } else if (activeTab === 'discover') {
      return renderDiscoverGroups();
    } else if (activeTab === 'invites') {
      return renderInvites();
    }
  };

  const renderMyGroups = () => {
    if (myGroups.length === 0) {
      return (
        <div className={styles.emptyState}>
          <Users size={48} className={styles.emptyIcon} />
          <h3>No Groups Yet</h3>
          <p>Create a group to share bottles and tasting notes with friends.</p>
          <button onClick={handleCreateGroup} className={styles.primaryButton}>
            <Plus size={18} />
            Create Group
          </button>
        </div>
      );
    }

    return (
      <div className={styles.grid}>
        {myGroups.map(group => (
          <div
            key={group.id}
            className={styles.card}
            onClick={() => handleViewGroup(group.id)}
          >
            {group.cover_image_url ? (
              <div
                className={styles.cardCover}
                style={{ backgroundImage: `url(${group.cover_image_url})` }}
              />
            ) : (
              <div className={styles.cardCoverPlaceholder}>
                <Users size={32} />
              </div>
            )}
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{group.name}</h3>
              {group.description && (
                <p className={styles.cardDescription}>{group.description}</p>
              )}
              <div className={styles.cardMeta}>
                <span className={styles.memberCount}>
                  <Users size={14} />
                  {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                </span>
                <span className={styles.role}>
                  {group.role === 'owner' ? 'Owner' : 'Member'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDiscoverGroups = () => {
    return (
      <>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchButton}>
            <Search size={18} />
          </button>
        </div>

        {discoverGroups.length === 0 ? (
          <div className={styles.emptyState}>
            <Globe size={48} className={styles.emptyIcon} />
            <h3>No Discoverable Groups</h3>
            <p>There are no public groups to discover at this time.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {discoverGroups.map(group => (
              <div
                key={group.id}
                className={styles.card}
                onClick={() => handleViewGroup(group.id)}
              >
                {group.cover_image_url ? (
                  <div
                    className={styles.cardCover}
                    style={{ backgroundImage: `url(${group.cover_image_url})` }}
                  />
                ) : (
                  <div className={styles.cardCoverPlaceholder}>
                    <Users size={32} />
                  </div>
                )}
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{group.name}</h3>
                  {group.description && (
                    <p className={styles.cardDescription}>{group.description}</p>
                  )}
                  <div className={styles.cardMeta}>
                    <span className={styles.memberCount}>
                      <Users size={14} />
                      {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                    </span>
                    {group.is_member && (
                      <span className={styles.memberBadge}>Joined</span>
                    )}
                    {group.has_invite && (
                      <span className={styles.inviteBadge}>Invited</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderInvites = () => {
    if (invites.length === 0) {
      return (
        <div className={styles.emptyState}>
          <Bell size={48} className={styles.emptyIcon} />
          <h3>No Pending Invites</h3>
          <p>You don't have any pending group invitations.</p>
        </div>
      );
    }

    return (
      <div className={styles.invitesList}>
        {invites.map(invite => (
          <div key={invite.id} className={styles.inviteCard}>
            <div className={styles.inviteInfo}>
              <h3 className={styles.inviteGroupName}>{invite.group_name}</h3>
              {invite.group_description && (
                <p className={styles.inviteDescription}>{invite.group_description}</p>
              )}
              <p className={styles.invitedBy}>
                Invited by <strong>{invite.invited_by_name}</strong>
              </p>
              {invite.message && (
                <p className={styles.inviteMessage}>"{invite.message}"</p>
              )}
              <div className={styles.inviteMeta}>
                <Users size={14} />
                {invite.group_member_count} members
              </div>
            </div>
            <div className={styles.inviteActions}>
              <button
                onClick={() => handleAcceptInvite(invite)}
                disabled={actionLoading[`accept-${invite.id}`] || actionLoading[`decline-${invite.id}`]}
                className={styles.acceptButton}
              >
                {actionLoading[`accept-${invite.id}`] ? (
                  <span className={styles.spinnerSmall} />
                ) : (
                  <Check size={16} />
                )}
                Accept
              </button>
              <button
                onClick={() => handleDeclineInvite(invite)}
                disabled={actionLoading[`accept-${invite.id}`] || actionLoading[`decline-${invite.id}`]}
                className={styles.declineButton}
              >
                {actionLoading[`decline-${invite.id}`] ? (
                  <span className={styles.spinnerSmall} />
                ) : (
                  <X size={16} />
                )}
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>
            <Users size={24} />
            Groups
          </h1>
          <button onClick={handleCreateGroup} className={styles.createButton}>
            <Plus size={18} />
            Create Group
          </button>
        </div>

        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'my-groups' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('my-groups')}
          >
            My Groups
            {myGroups.length > 0 && (
              <span className={styles.tabCount}>{myGroups.length}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'discover' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <Globe size={16} />
            Discover
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'invites' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('invites')}
          >
            <Bell size={16} />
            Invites
            {invites.length > 0 && (
              <span className={styles.tabBadge}>{invites.length}</span>
            )}
          </button>
        </nav>
      </header>

      <main className={styles.content}>
        {renderContent()}
      </main>

      {showModal && (
        <GroupEditModal
          group={editingGroup}
          onClose={() => setShowModal(false)}
          onSave={handleGroupSaved}
        />
      )}
    </div>
  );
}

export default GroupsPage;
