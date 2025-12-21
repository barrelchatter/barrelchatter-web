import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/AppLayout.module.scss';

function AppLayout() {
  const { user, logout } = useAuth();
  const isModeratorOrAdmin =
    user?.role === 'moderator' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navClass = ({ isActive }) =>
    isActive ? styles.navItemActive : styles.navItem;

  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>BarrelChatter</div>
        <nav className={styles.nav}>
          {/* Home */}
          <NavLink to="/app/home" className={navClass}>
            Home
          </NavLink>

          <div className={styles.navSeparator} />

          {/* Core user flow */}
          <NavLink to="/app/bottles" className={navClass}>
            Catalog
          </NavLink>
          <NavLink to="/app/inventory" className={navClass}>
            My Collection
          </NavLink>
          <NavLink to="/app/tastings" className={navClass}>
            Tastings
          </NavLink>
          <NavLink to="/app/wishlists" className={navClass}>
            Wishlist
          </NavLink>
          <NavLink to="/app/locations" className={navClass}>
            Locations
          </NavLink>
          <NavLink to="/app/groups" className={navClass}>
            Groups
          </NavLink>
          <NavLink to="/app/tags" className={navClass}>
            Tags
          </NavLink>

          <div className={styles.navSeparator} />
          <div className={styles.navSectionLabel}>Settings</div>

          <NavLink to="/app/storage-locations" className={navClass}>
            Storage Locations
          </NavLink>
          <NavLink to="/app/menus" className={navClass}>
            Menus
          </NavLink>

          {(isModeratorOrAdmin || isAdmin) && (
            <>
              <div className={styles.navSeparator} />
              <div className={styles.navSectionLabel}>Admin</div>

              {isModeratorOrAdmin && (
                <NavLink
                  to="/app/admin/bottles-submissions"
                  className={navClass}
                >
                  Bottle Submissions
                </NavLink>
              )}

              {isAdmin && (
                <NavLink to="/app/admin/tags" className={navClass}>
                  Admin Tags
                </NavLink>
              )}

              {isAdmin && (
                <NavLink to="/app/admin/users" className={navClass}>
                  Admin Users
                </NavLink>
              )}

              {isAdmin && (
                <NavLink to="/app/admin/audit-logs" className={navClass}>
                  Audit Logs
                </NavLink>
              )}

              {isModeratorOrAdmin && (
                <NavLink to="/app/admin/purchase-locations" className={navClass}>
                  Location Submissions
                </NavLink>
              )}

              {isAdmin && (
                <NavLink to="/app/admin/tag-packs" className={navClass}>
                  Tag Packs
                </NavLink>
              )}

              {isAdmin && (
                <NavLink to="/app/admin/subscriptions" className={navClass}>
                  Subscriptions
                </NavLink>
              )}
            </>
          )}
        </nav>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft} />
          <div className={styles.topbarRight}>
            {user && (
              <NavLink to="/app/profile" className={styles.userLink}>
                <span className={styles.userAvatar}>
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </span>
                <span className={styles.userInfo}>
                  {user.name}
                </span>
              </NavLink>
            )}
            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
