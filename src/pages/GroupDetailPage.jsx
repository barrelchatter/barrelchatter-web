import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, ArrowLeft, Settings, Trash2, LogOut, UserPlus, Activity,
  Wine, Clock, User, UserMinus
} from 'react-feather';
import { groupsAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import GroupEditModal from '../components/GroupEditModal';
import GroupInviteModal from '../components/GroupInviteModal';
import styles from '../styles/GroupDetailPage.module.scss';

function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState('activity');

  // Data state
  const [group, setGroup] = useState(null);
  const [activity, setActivity] = useState([]);
  const [bottles, setBottles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState({});

  // Fetch group details
  useEffect(() => {
    fetchGroup();
  }, [id]);

  // Fetch tab data
  useEffect(() => {
    if (group?.is_member) {
      if (activeTab === 'activity') {
        fetchActivity();
      } else if (activeTab === 'bottles') {
        fetchBottles();
      }
    }
  }, [activeTab, group?.is_member]);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await groupsAPI.get(id);
      setGroup(res.data.group);
    } catch (err) {
      console.error('Error fetching group:', err);
      if (err.response?.status === 404) {
        setError('Group not found');
      } else if (err.response?.status === 403) {
        setError('You do not have access to this group');
      } else {
        setError('Failed to load group. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await groupsAPI.activity(id);
      setActivity(res.data.activity || []);
    } catch (err) {
      console.error('Error fetching activity:', err);
    }
  };

  const fetchBottles = async () => {
    try {
      const res = await groupsAPI.bottles(id);
      setBottles(res.data.bottles || []);
    } catch (err) {
      console.error('Error fetching bottles:', err);
    }
  };

  // Actions
  const handleJoin = async () => {
    setActionLoading(prev => ({ ...prev, join: true }));
    try {
      await groupsAPI.join(id);
      showToast('Joined group!', 'success');
      fetchGroup();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to join', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, join: false }));
    }
  };

  const handleLeave = async () => {
    const confirmed = window.confirm('Are you sure you want to leave this group?');
    if (!confirmed) return;

    setActionLoading(prev => ({ ...prev, leave: true }));
    try {
      await groupsAPI.leave(id);
      showToast('Left group', 'success');
      navigate('/app/groups');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to leave', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, leave: false }));
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this group? This action cannot be undone.');
    if (!confirmed) return;

    setActionLoading(prev => ({ ...prev, delete: true }));
    try {
      await groupsAPI.delete(id);
      showToast('Group deleted', 'success');
      navigate('/app/groups');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    const confirmed = window.confirm(`Remove ${memberName} from this group?`);
    if (!confirmed) return;

    setActionLoading(prev => ({ ...prev, [`remove-${memberId}`]: true }));
    try {
      await groupsAPI.removeMember(id, memberId);
      showToast('Member removed', 'success');
      fetchGroup();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to remove member', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`remove-${memberId}`]: false }));
    }
  };

  const handleGroupSaved = async () => {
    setShowEditModal(false);
    showToast('Group updated', 'success');
    fetchGroup();
  };

  const handleInviteSent = async () => {
    setShowInviteModal(false);
    showToast('Invite sent!', 'success');
  };

  // Format activity item
  const formatActivity = (item) => {
    const actorName = item.user_name || 'Someone';
    const metadata = item.metadata || {};

    switch (item.activity_type) {
      case 'member_joined':
        return `${actorName} joined the group`;
      case 'member_left':
        return `${actorName} left the group`;
      case 'member_removed':
        return `${metadata.user_name || 'A member'} was removed from the group`;
      case 'bottle_shared':
        return `${actorName} shared ${metadata.bottle_name || 'a bottle'}`;
      case 'tasting_shared':
        return `${actorName} shared a tasting`;
      case 'group_updated':
        return `${actorName} updated the group`;
      case 'invite_sent':
        return `${actorName} invited ${metadata.invited_user_name || 'someone'}`;
      default:
        return `${actorName} performed an action`;
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Check if current user is owner
  const isOwner = group?.user_role === 'owner';
  const isMember = group?.is_member;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading group...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => navigate('/app/groups')} className={styles.backButton}>
            <ArrowLeft size={18} />
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button onClick={() => navigate('/app/groups')} className={styles.backLink}>
          <ArrowLeft size={18} />
          Back to Groups
        </button>

        <div className={styles.headerContent}>
          {group.cover_image_url ? (
            <div
              className={styles.coverImage}
              style={{ backgroundImage: `url(${group.cover_image_url})` }}
            />
          ) : (
            <div className={styles.coverPlaceholder}>
              <Users size={48} />
            </div>
          )}

          <div className={styles.headerInfo}>
            <h1 className={styles.title}>{group.name}</h1>
            {group.description && (
              <p className={styles.description}>{group.description}</p>
            )}
            <div className={styles.meta}>
              <span className={styles.memberCount}>
                <Users size={16} />
                {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
              </span>
              {group.is_discoverable && (
                <span className={styles.publicBadge}>Public</span>
              )}
            </div>
          </div>

          <div className={styles.headerActions}>
            {isMember ? (
              <>
                <button onClick={() => setShowInviteModal(true)} className={styles.actionButton}>
                  <UserPlus size={18} />
                  Invite
                </button>
                {isOwner && (
                  <button onClick={() => setShowEditModal(true)} className={styles.actionButton}>
                    <Settings size={18} />
                    Settings
                  </button>
                )}
                {isOwner ? (
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading.delete}
                    className={styles.dangerButton}
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                ) : (
                  <button
                    onClick={handleLeave}
                    disabled={actionLoading.leave}
                    className={styles.dangerButton}
                  >
                    <LogOut size={18} />
                    Leave
                  </button>
                )}
              </>
            ) : group.has_pending_invite ? (
              <button
                onClick={handleJoin}
                disabled={actionLoading.join}
                className={styles.primaryButton}
              >
                Accept Invite
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Tabs - only show for members */}
      {isMember && (
        <>
          <nav className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'activity' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <Activity size={16} />
              Activity
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'members' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('members')}
            >
              <Users size={16} />
              Members
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'bottles' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('bottles')}
            >
              <Wine size={16} />
              Bottles
            </button>
          </nav>

          <main className={styles.content}>
            {activeTab === 'activity' && (
              <div className={styles.activityFeed}>
                {activity.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Activity size={48} className={styles.emptyIcon} />
                    <h3>No Activity Yet</h3>
                    <p>Activity will appear here as members interact.</p>
                  </div>
                ) : (
                  activity.map(item => (
                    <div key={item.id} className={styles.activityItem}>
                      <div className={styles.activityAvatar}>
                        {item.user_avatar_url ? (
                          <img src={item.user_avatar_url} alt="" />
                        ) : (
                          <User size={16} />
                        )}
                      </div>
                      <div className={styles.activityContent}>
                        <p className={styles.activityText}>{formatActivity(item)}</p>
                        <span className={styles.activityTime}>
                          <Clock size={12} />
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className={styles.membersList}>
                {group.members?.map(member => (
                  <div key={member.id} className={styles.memberCard}>
                    <div className={styles.memberAvatar}>
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" />
                      ) : (
                        <span>{(member.name || 'U').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className={styles.memberInfo}>
                      <span className={styles.memberName}>{member.name}</span>
                      <span className={styles.memberRole}>
                        {member.role === 'owner' ? 'Owner' : 'Member'}
                      </span>
                    </div>
                    {isOwner && member.id !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        disabled={actionLoading[`remove-${member.id}`]}
                        className={styles.removeMemberButton}
                        title="Remove member"
                      >
                        <UserMinus size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'bottles' && (
              <div className={styles.bottlesGrid}>
                {bottles.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Wine size={48} className={styles.emptyIcon} />
                    <h3>No Shared Bottles</h3>
                    <p>Members can share bottles from their collection.</p>
                  </div>
                ) : (
                  bottles.map(bottle => (
                    <div key={bottle.share_id} className={styles.bottleCard}>
                      <div className={styles.bottleInfo}>
                        <h4 className={styles.bottleName}>{bottle.bottle_name}</h4>
                        <p className={styles.bottleMeta}>
                          {bottle.brand} {bottle.distillery && `| ${bottle.distillery}`}
                        </p>
                        {bottle.proof && (
                          <span className={styles.bottleProof}>{bottle.proof}%</span>
                        )}
                      </div>
                      <div className={styles.sharedBy}>
                        <span>Shared by</span>
                        <strong>{bottle.shared_by_name}</strong>
                      </div>
                      {bottle.share_notes && (
                        <p className={styles.shareNotes}>"{bottle.share_notes}"</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </main>
        </>
      )}

      {/* Non-member view */}
      {!isMember && (
        <div className={styles.nonMemberContent}>
          <div className={styles.nonMemberMessage}>
            <Users size={48} />
            <h3>Join this group</h3>
            <p>You need an invite to join this group.</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditModal && (
        <GroupEditModal
          group={group}
          onClose={() => setShowEditModal(false)}
          onSave={handleGroupSaved}
        />
      )}

      {showInviteModal && (
        <GroupInviteModal
          groupId={id}
          onClose={() => setShowInviteModal(false)}
          onInviteSent={handleInviteSent}
        />
      )}
    </div>
  );
}

export default GroupDetailPage;
