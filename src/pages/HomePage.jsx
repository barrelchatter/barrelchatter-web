import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { API_BASE_URL } from '../api/client';
import styles from '../styles/HomePage.module.scss';

const apiBase = (API_BASE_URL || '').replace(/\/$/, '');

function resolveImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${apiBase}${path}`;
}

function formatRating(rating) {
  if (rating == null) return '—';
  return Number(rating).toFixed(1);
}

function HomePage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalBottles: 0,
    totalTastings: 0,
    totalInventory: 0,
    recentPours: 0,
  });

  const [topRated, setTopRated] = useState([]);
  const [recentTastings, setRecentTastings] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        // Fetch data in parallel
        const [bottlesRes, inventoryRes, tastingsRes] = await Promise.all([
          api.get('/v1/bottles?limit=50&offset=0'),
          api.get('/v1/inventory?limit=100&offset=0'),
          api.get('/v1/tastings?limit=50&offset=0'),
        ]);

        if (!isMounted) return;

        const bottles = bottlesRes.data?.bottles || [];
        const inventory = inventoryRes.data?.inventory || [];
        const tastings = tastingsRes.data?.tastings || [];

        // Calculate stats
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentPours = tastings.filter((t) => {
          if (!t.created_at) return false;
          return new Date(t.created_at) >= thirtyDaysAgo;
        }).length;

        setStats({
          totalBottles: bottlesRes.data?.total || bottles.length,
          totalInventory: inventoryRes.data?.total || inventory.length,
          totalTastings: tastingsRes.data?.total || tastings.length,
          recentPours,
        });

        // Top rated bottles (from user's tastings with ratings)
        const bottleRatings = {};
        tastings.forEach((t) => {
          if (t.rating != null && t.bottle?.id) {
            if (!bottleRatings[t.bottle.id]) {
              bottleRatings[t.bottle.id] = {
                bottle: t.bottle,
                ratings: [],
              };
            }
            bottleRatings[t.bottle.id].ratings.push(Number(t.rating));
          }
        });

        const rated = Object.values(bottleRatings)
          .map((entry) => ({
            ...entry.bottle,
            avgRating:
              entry.ratings.reduce((a, b) => a + b, 0) / entry.ratings.length,
            tastingCount: entry.ratings.length,
          }))
          .sort((a, b) => b.avgRating - a.avgRating)
          .slice(0, 6);

        setTopRated(rated);

        // Recent tastings (last 5)
        setRecentTastings(tastings.slice(0, 5));

        // Recent activity - combine inventory additions and tastings
        const activities = [];

        inventory.slice(0, 10).forEach((inv) => {
          activities.push({
            type: 'inventory',
            id: `inv-${inv.id}`,
            date: inv.created_at,
            bottle: inv.bottle,
            location: inv.location_label,
          });
        });

        tastings.slice(0, 10).forEach((t) => {
          activities.push({
            type: 'tasting',
            id: `tast-${t.id}`,
            date: t.created_at,
            bottle: t.bottle,
            rating: t.rating,
            notes: t.notes,
          });
        });

        activities.sort((a, b) => {
          const da = a.date ? new Date(a.date) : new Date(0);
          const db = b.date ? new Date(b.date) : new Date(0);
          return db - da;
        });

        setRecentActivity(activities.slice(0, 8));
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(
            err?.response?.data?.error ||
              'Failed to load dashboard data.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className={styles.page}>
      {/* Hero greeting */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.greeting}>
            {getGreeting()}, {user?.name?.split(' ')[0] || 'collector'}
          </h1>
          <p className={styles.tagline}>What are we tasting today?</p>
        </div>
      </div>

      {/* Search bar */}
      <div className={styles.searchRow}>
        <Link to="/app/bottles" className={styles.searchBar}>
          <span className={styles.searchIcon}>🔍</span>
          <span className={styles.searchPlaceholder}>
            Search bottles, distilleries, tastings...
          </span>
        </Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading && (
        <div className={styles.loadingMessage}>Loading your dashboard...</div>
      )}

      {!loading && !error && (
        <>
          {/* Quick stats */}
          <div className={styles.statsGrid}>
            <Link to="/app/inventory" className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalInventory}</div>
              <div className={styles.statLabel}>Bottles in Collection</div>
            </Link>
            <Link to="/app/tastings" className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalTastings}</div>
              <div className={styles.statLabel}>Total Tastings</div>
            </Link>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.recentPours}</div>
              <div className={styles.statLabel}>Pours (30 days)</div>
            </div>
            <Link to="/app/bottles" className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalBottles}</div>
              <div className={styles.statLabel}>Bottles in Catalog</div>
            </Link>
          </div>

          {/* Top Rated section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🏆</span>
                Your Top Rated
              </h2>
              <Link to="/app/tastings" className={styles.seeAllLink}>
                See All
              </Link>
            </div>

            {topRated.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No rated tastings yet. Start rating your pours!</p>
                <Link to="/app/tastings" className={styles.ctaButton}>
                  Log a Tasting
                </Link>
              </div>
            ) : (
              <div className={styles.topRatedGrid}>
                {topRated.map((bottle) => (
                  <Link
                    key={bottle.id}
                    to={`/app/bottles/${bottle.id}`}
                    className={styles.topRatedCard}
                  >
                    <div className={styles.topRatedImageWrap}>
                      {bottle.primary_photo_url ? (
                        <img
                          src={resolveImageUrl(bottle.primary_photo_url)}
                          alt={bottle.name}
                          className={styles.topRatedImage}
                        />
                      ) : (
                        <div className={styles.topRatedPlaceholder}>
                          <span>{(bottle.name || 'B').charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.topRatedInfo}>
                      <div className={styles.topRatedName}>{bottle.name}</div>
                      <div className={styles.topRatedBrand}>
                        {bottle.brand || bottle.distillery || '—'}
                      </div>
                      <div className={styles.topRatedRating}>
                        <span className={styles.starIcon}>★</span>
                        {formatRating(bottle.avgRating)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>📋</span>
                Recent Activity
              </h2>
            </div>

            {recentActivity.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No activity yet. Add some bottles to your collection!</p>
                <Link to="/app/bottles" className={styles.ctaButton}>
                  Browse Bottles
                </Link>
              </div>
            ) : (
              <div className={styles.activityList}>
                {recentActivity.map((activity) => (
                  <div key={activity.id} className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      {activity.type === 'tasting' ? '🥃' : '📦'}
                    </div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityTitle}>
                        {activity.type === 'tasting' ? (
                          <>
                            Tasted{' '}
                            <Link
                              to={`/app/bottles/${activity.bottle?.id}`}
                              className={styles.activityLink}
                            >
                              {activity.bottle?.name || 'Unknown bottle'}
                            </Link>
                            {activity.rating != null && (
                              <span className={styles.activityRating}>
                                {' '}
                                — {activity.rating}/10
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            Added{' '}
                            <Link
                              to={`/app/bottles/${activity.bottle?.id}`}
                              className={styles.activityLink}
                            >
                              {activity.bottle?.name || 'Unknown bottle'}
                            </Link>
                            {activity.location && (
                              <span className={styles.activityLocation}>
                                {' '}
                                to {activity.location}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {activity.notes && (
                        <div className={styles.activityNotes}>
                          "{activity.notes}"
                        </div>
                      )}
                    </div>
                    <div className={styles.activityTime}>
                      {formatTimeAgo(activity.date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>⚡</span>
                Quick Actions
              </h2>
            </div>

            <div className={styles.quickActionsGrid}>
              <Link to="/app/tastings" className={styles.quickAction}>
                <span className={styles.quickActionIcon}>🥃</span>
                <span className={styles.quickActionLabel}>Log Tasting</span>
              </Link>
              <Link to="/app/bottles" className={styles.quickAction}>
                <span className={styles.quickActionIcon}>🍾</span>
                <span className={styles.quickActionLabel}>Add Bottle</span>
              </Link>
              <Link to="/app/inventory" className={styles.quickAction}>
                <span className={styles.quickActionIcon}>📦</span>
                <span className={styles.quickActionLabel}>View Collection</span>
              </Link>
              <Link to="/app/wishlists" className={styles.quickAction}>
                <span className={styles.quickActionIcon}>⭐</span>
                <span className={styles.quickActionLabel}>Wishlist</span>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default HomePage;