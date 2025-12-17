import React, { useState, useEffect } from 'react';
import api from '../api/client';
import styles from '../styles/BadgesPage.module.scss';

function BadgesPage() {
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [availableBadges, setAvailableBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('earned');

  useEffect(() => {
    async function fetchBadges() {
      setLoading(true);
      setError(null);
      try {
        // Fetch user's earned badges
        const earnedRes = await api.get('/v1/users/me/badges');
        setEarnedBadges(earnedRes.data?.badges || earnedRes.data?.earned_badges || []);

        // Fetch all available badges
        const availableRes = await api.get('/v1/badges');
        setAvailableBadges(availableRes.data?.badges || []);
      } catch (err) {
        console.error('Error fetching badges:', err);
        setError(err?.response?.data?.error || 'Failed to load badges');
      } finally {
        setLoading(false);
      }
    }

    fetchBadges();
  }, []);

  // Get unearned badges
  const earnedIds = new Set(earnedBadges.map((b) => b.badge_id || b.id));
  const unearnedBadges = availableBadges.filter((b) => !earnedIds.has(b.id));

  function getBadgeIcon(badge) {
    // Return emoji based on badge code/type
    const icons = {
      early_adopter: '🌟',
      first_pour: '🥃',
      ten_tastings: '📝',
      fifty_tastings: '📚',
      hundred_tastings: '🏆',
      single_barrel_fanatic: '🛢️',
      kentucky_explorer: '🗺️',
      proof_seeker: '🔥',
      collector: '📦',
      reviewer: '✍️',
      social_butterfly: '🦋',
      bottle_hunter: '🔍',
      event_host: '🎉',
      verified_spotter: '✓',
    };
    return icons[badge.code] || badge.icon_url || '🏅';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  }

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Loading badges...</div></div>;
  }

  if (error) {
    return <div className={styles.container}><div className={styles.error}>{error}</div></div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Badges & Achievements</h1>
        <p className={styles.subtitle}>
          {earnedBadges.length} of {availableBadges.length} badges earned
        </p>
      </header>

      {/* Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${(earnedBadges.length / Math.max(availableBadges.length, 1)) * 100}%` }}
          />
        </div>
        <span className={styles.progressText}>
          {Math.round((earnedBadges.length / Math.max(availableBadges.length, 1)) * 100)}% Complete
        </span>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'earned' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('earned')}
        >
          Earned ({earnedBadges.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'available' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available ({unearnedBadges.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Badges
        </button>
      </div>

      {/* Badge Grid */}
      <div className={styles.badgeGrid}>
        {activeTab === 'earned' && (
          earnedBadges.length === 0 ? (
            <div className={styles.emptyState}>
              <p>You haven't earned any badges yet.</p>
              <p className={styles.emptyHint}>Start logging tastings and building your collection!</p>
            </div>
          ) : (
            earnedBadges.map((earned) => {
              const badge = earned.badge || availableBadges.find((b) => b.id === earned.badge_id) || earned;
              return (
                <BadgeCard
                  key={earned.id || earned.badge_id}
                  badge={badge}
                  earned={true}
                  earnedAt={earned.earned_at}
                  icon={getBadgeIcon(badge)}
                />
              );
            })
          )
        )}

        {activeTab === 'available' && (
          unearnedBadges.length === 0 ? (
            <div className={styles.emptyState}>
              <p>🎉 You've earned all available badges!</p>
            </div>
          ) : (
            unearnedBadges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                earned={false}
                icon={getBadgeIcon(badge)}
              />
            ))
          )
        )}

        {activeTab === 'all' && (
          availableBadges.map((badge) => {
            const earned = earnedBadges.find((e) => (e.badge_id || e.id) === badge.id);
            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                earned={!!earned}
                earnedAt={earned?.earned_at}
                icon={getBadgeIcon(badge)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function BadgeCard({ badge, earned, earnedAt, icon }) {
  return (
    <div className={`${styles.badgeCard} ${earned ? styles.badgeEarned : styles.badgeLocked}`}>
      <div className={styles.badgeIcon}>
        {earned ? icon : '🔒'}
      </div>
      <div className={styles.badgeInfo}>
        <h3 className={styles.badgeName}>{badge.name}</h3>
        <p className={styles.badgeDescription}>{badge.description}</p>
        {earned && earnedAt && (
          <span className={styles.earnedDate}>
            Earned {new Date(earnedAt).toLocaleDateString()}
          </span>
        )}
        {!earned && badge.criteria && (
          <span className={styles.criteriaHint}>
            {typeof badge.criteria === 'string' ? badge.criteria : badge.criteria.hint || 'Keep exploring!'}
          </span>
        )}
      </div>
    </div>
  );
}

export default BadgesPage;
