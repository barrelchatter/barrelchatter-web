import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ExternalLink, Plus, Search, Navigation } from 'react-feather';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import NewLocationModal from '../components/NewLocationModal';
import styles from '../styles/PurchaseLocationsPage.module.scss';

const LOCATION_TYPES = [
  { value: 'liquor_store', label: 'Liquor Store' },
  { value: 'grocery_store', label: 'Grocery Store' },
  { value: 'bar', label: 'Bar' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'distillery', label: 'Distillery' },
  { value: 'online', label: 'Online Retailer' },
  { value: 'other', label: 'Other' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
];

function getTypeLabel(typeValue) {
  const found = LOCATION_TYPES.find((t) => t.value === typeValue);
  return found?.label || typeValue || '—';
}

function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function PurchaseLocationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState('browse');

  // Browse tab state
  const [locations, setLocations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  // My Submissions tab state
  const [submissions, setSubmissions] = useState([]);
  const [submissionsTotal, setSubmissionsTotal] = useState(0);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Nearby tab state
  const [nearbyLocations, setNearbyLocations] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(25);
  const [geoPermission, setGeoPermission] = useState('prompt'); // prompt, granted, denied

  // New location modal
  const [showNewModal, setShowNewModal] = useState(false);

  // Load browse locations
  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ limit: '50', offset: '0' });
      if (search) params.set('q', search);
      if (typeFilter) params.set('type', typeFilter);
      if (stateFilter) params.set('state', stateFilter);

      const res = await api.get(`/v1/purchase-locations?${params}`);
      setLocations(res.data?.locations || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Error loading locations:', err);
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, stateFilter]);

  // Load user's submissions
  const loadSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    setSubmissionsError('');

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/v1/purchase-locations/my-submissions?${params}`);
      setSubmissions(res.data?.locations || []);
      setSubmissionsTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Error loading submissions:', err);
      setSubmissionsError('Failed to load your submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  }, [statusFilter]);

  // Load nearby locations
  const loadNearbyLocations = useCallback(async () => {
    if (!userLocation) return;

    setNearbyLoading(true);
    setNearbyError('');

    try {
      const params = new URLSearchParams({
        lat: userLocation.lat.toString(),
        lng: userLocation.lng.toString(),
        radius: radius.toString(),
      });

      const res = await api.get(`/v1/purchase-locations/nearby?${params}`);
      setNearbyLocations(res.data?.locations || []);
    } catch (err) {
      console.error('Error loading nearby locations:', err);
      setNearbyError('Failed to load nearby locations');
    } finally {
      setNearbyLoading(false);
    }
  }, [userLocation, radius]);

  // Request geolocation
  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setNearbyError('Geolocation is not supported by your browser');
      return;
    }

    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoPermission('granted');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGeoPermission('denied');
        setNearbyError('Unable to get your location. Please enable location services.');
        setNearbyLoading(false);
      }
    );
  };

  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'browse') {
      loadLocations();
    } else if (activeTab === 'submissions') {
      loadSubmissions();
    } else if (activeTab === 'nearby' && userLocation) {
      loadNearbyLocations();
    }
  }, [activeTab, loadLocations, loadSubmissions, loadNearbyLocations, userLocation]);

  // Debounced search
  useEffect(() => {
    if (activeTab !== 'browse') return;
    const timeout = setTimeout(() => {
      loadLocations();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Reload nearby when radius changes
  useEffect(() => {
    if (activeTab === 'nearby' && userLocation) {
      loadNearbyLocations();
    }
  }, [radius]);

  // Handle new location success
  const handleLocationCreated = (location) => {
    showToast('Location submitted for review!', 'success');
    setShowNewModal(false);
    if (activeTab === 'submissions') {
      loadSubmissions();
    }
  };

  // Render location card
  const renderLocationCard = (location, showDistance = false) => (
    <div key={location.id} className={styles.locationCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.locationName}>
          <Link to={`/app/locations/${location.id}`}>{location.name}</Link>
        </h3>
        <span className={styles.typeBadge}>{getTypeLabel(location.location_type)}</span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.locationAddress}>
          <MapPin size={14} />
          <span>
            {location.address_line1 && `${location.address_line1}, `}
            {location.city}, {location.state}
            {location.postal_code && ` ${location.postal_code}`}
          </span>
        </div>

        {showDistance && location.distance_miles != null && (
          <div className={styles.distance}>
            <Navigation size={14} />
            <span>{location.distance_miles.toFixed(1)} miles away</span>
          </div>
        )}

        {location.website && (
          <a
            href={location.website}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.websiteLink}
          >
            <ExternalLink size={14} />
            <span>Website</span>
          </a>
        )}

        {location.purchase_count > 0 && (
          <div className={styles.purchaseCount}>
            {location.purchase_count} purchase{location.purchase_count !== 1 ? 's' : ''} recorded
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <button
          className={styles.claimButton}
          disabled
          title="Coming soon for venue owners"
        >
          Claim this venue
        </button>
      </div>
    </div>
  );

  // Render submission card with status
  const renderSubmissionCard = (location) => (
    <div key={location.id} className={styles.submissionCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.locationName}>{location.name}</h3>
        <span className={`${styles.statusBadge} ${styles[`status${location.status}`]}`}>
          {location.status}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.locationAddress}>
          <MapPin size={14} />
          <span>{location.city}, {location.state}</span>
        </div>

        <div className={styles.typeBadge}>{getTypeLabel(location.location_type)}</div>

        <div className={styles.submittedDate}>
          Submitted: {formatDate(location.submitted_at)}
        </div>

        {location.status === 'rejected' && location.review_notes && (
          <div className={styles.rejectionReason}>
            <strong>Reason:</strong> {location.review_notes}
          </div>
        )}
      </div>

      {location.status === 'approved' && (
        <div className={styles.cardFooter}>
          <Link to={`/app/locations/${location.id}`} className={styles.viewLink}>
            View in catalog
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Purchase Locations</h1>
          <p className={styles.subtitle}>
            Find stores, bars, and distilleries where you can buy bourbon
          </p>
        </div>
        <button className={styles.addButton} onClick={() => setShowNewModal(true)}>
          <Plus size={18} />
          Submit Location
        </button>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={activeTab === 'browse' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('browse')}
        >
          Browse Catalog
        </button>
        <button
          className={activeTab === 'submissions' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('submissions')}
        >
          My Submissions
          {submissionsTotal > 0 && (
            <span className={styles.tabBadge}>{submissionsTotal}</span>
          )}
        </button>
        <button
          className={activeTab === 'nearby' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('nearby')}
        >
          Nearby
        </button>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <div className={styles.tabContent}>
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className={styles.filterSelect}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {LOCATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="">All States</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <span className={styles.countLabel}>
              {total} location{total !== 1 ? 's' : ''}
            </span>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {loading ? (
            <div className={styles.loading}>Loading locations...</div>
          ) : locations.length === 0 ? (
            <div className={styles.emptyState}>
              <MapPin size={48} />
              <h3>No locations found</h3>
              <p>Try adjusting your search or filters</p>
              <button
                className={styles.submitButton}
                onClick={() => setShowNewModal(true)}
              >
                Submit a new location
              </button>
            </div>
          ) : (
            <div className={styles.locationGrid}>
              {locations.map((loc) => renderLocationCard(loc))}
            </div>
          )}
        </div>
      )}

      {/* My Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className={styles.tabContent}>
          <div className={styles.filters}>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <span className={styles.countLabel}>
              {submissionsTotal} submission{submissionsTotal !== 1 ? 's' : ''}
            </span>
          </div>

          {submissionsError && <div className={styles.error}>{submissionsError}</div>}

          {submissionsLoading ? (
            <div className={styles.loading}>Loading your submissions...</div>
          ) : submissions.length === 0 ? (
            <div className={styles.emptyState}>
              <MapPin size={48} />
              <h3>No submissions yet</h3>
              <p>Submit a location to help grow our catalog</p>
              <button
                className={styles.submitButton}
                onClick={() => setShowNewModal(true)}
              >
                Submit a location
              </button>
            </div>
          ) : (
            <div className={styles.locationGrid}>
              {submissions.map((loc) => renderSubmissionCard(loc))}
            </div>
          )}
        </div>
      )}

      {/* Nearby Tab */}
      {activeTab === 'nearby' && (
        <div className={styles.tabContent}>
          {geoPermission === 'prompt' && !userLocation && (
            <div className={styles.geoPrompt}>
              <Navigation size={48} />
              <h3>Find locations near you</h3>
              <p>Allow location access to see nearby stores, bars, and distilleries</p>
              <button className={styles.geoButton} onClick={requestGeolocation}>
                <Navigation size={18} />
                Enable Location
              </button>
            </div>
          )}

          {geoPermission === 'denied' && (
            <div className={styles.geoError}>
              <h3>Location access denied</h3>
              <p>Please enable location services in your browser settings to use this feature.</p>
            </div>
          )}

          {userLocation && (
            <>
              <div className={styles.filters}>
                <div className={styles.radiusControl}>
                  <label>Radius:</label>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className={styles.filterSelect}
                  >
                    <option value="5">5 miles</option>
                    <option value="10">10 miles</option>
                    <option value="25">25 miles</option>
                    <option value="50">50 miles</option>
                    <option value="100">100 miles</option>
                  </select>
                </div>

                <span className={styles.countLabel}>
                  {nearbyLocations.length} location{nearbyLocations.length !== 1 ? 's' : ''} found
                </span>
              </div>

              {nearbyError && <div className={styles.error}>{nearbyError}</div>}

              {nearbyLoading ? (
                <div className={styles.loading}>Finding nearby locations...</div>
              ) : nearbyLocations.length === 0 ? (
                <div className={styles.emptyState}>
                  <MapPin size={48} />
                  <h3>No locations nearby</h3>
                  <p>Try increasing the search radius or submit a new location</p>
                  <button
                    className={styles.submitButton}
                    onClick={() => setShowNewModal(true)}
                  >
                    Submit a location
                  </button>
                </div>
              ) : (
                <div className={styles.locationGrid}>
                  {nearbyLocations.map((loc) => renderLocationCard(loc, true))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* New Location Modal */}
      {showNewModal && (
        <NewLocationModal
          onClose={() => setShowNewModal(false)}
          onSuccess={handleLocationCreated}
        />
      )}
    </div>
  );
}

export default PurchaseLocationsPage;
