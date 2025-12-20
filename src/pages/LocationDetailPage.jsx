import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ExternalLink, Phone, ArrowLeft, Package } from 'react-feather';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/LocationDetailPage.module.scss';

const LOCATION_TYPES = [
  { value: 'liquor_store', label: 'Liquor Store' },
  { value: 'grocery_store', label: 'Grocery Store' },
  { value: 'bar', label: 'Bar' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'distillery', label: 'Distillery' },
  { value: 'online', label: 'Online Retailer' },
  { value: 'other', label: 'Other' },
];

function getTypeLabel(typeValue) {
  const found = LOCATION_TYPES.find((t) => t.value === typeValue);
  return found?.label || typeValue || 'Unknown';
}

function formatAddress(location) {
  const parts = [];
  if (location.address_line1) parts.push(location.address_line1);
  if (location.address_line2) parts.push(location.address_line2);

  const cityStateZip = [];
  if (location.city) cityStateZip.push(location.city);
  if (location.state) cityStateZip.push(location.state);
  if (location.postal_code) cityStateZip.push(location.postal_code);

  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(', '));
  }

  return parts;
}

function LocationDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // User's purchases from this location
  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const loadLocation = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get(`/v1/purchase-locations/${id}`);
      setLocation(res.data?.location || null);
    } catch (err) {
      console.error('Error loading location:', err);
      setError('Failed to load location details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadUserPurchases = useCallback(async () => {
    if (!user) return;

    setPurchasesLoading(true);
    try {
      // Get inventory items purchased from this location
      const res = await api.get(`/v1/inventory?purchase_location_id=${id}&limit=10`);
      setPurchases(res.data?.inventory || []);
    } catch (err) {
      console.error('Error loading purchases:', err);
      // Silently fail - purchases are optional
    } finally {
      setPurchasesLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadLocation();
    loadUserPurchases();
  }, [loadLocation, loadUserPurchases]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading location...</div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          {error || 'Location not found'}
          <Link to="/app/locations" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Locations
          </Link>
        </div>
      </div>
    );
  }

  const addressLines = formatAddress(location);
  const hasCoordinates = location.latitude && location.longitude;
  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [location.name, location.city, location.state].filter(Boolean).join(', ')
      )}`;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/app/locations" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Locations
        </Link>
      </div>

      <div className={styles.content}>
        <div className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div className={styles.titleRow}>
              <h1 className={styles.locationName}>{location.name}</h1>
              <span className={styles.typeBadge}>
                {getTypeLabel(location.location_type)}
              </span>
            </div>
          </div>

          <div className={styles.cardBody}>
            {/* Address */}
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Address</h3>
              <div className={styles.addressBlock}>
                <MapPin size={18} className={styles.icon} />
                <div className={styles.addressLines}>
                  {addressLines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapsLink}
              >
                <MapPin size={14} />
                View on Google Maps
              </a>
            </div>

            {/* Contact Info */}
            {(location.phone || location.website) && (
              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Contact</h3>
                <div className={styles.contactList}>
                  {location.phone && (
                    <a href={`tel:${location.phone}`} className={styles.contactItem}>
                      <Phone size={16} />
                      {location.phone}
                    </a>
                  )}
                  {location.website && (
                    <a
                      href={location.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contactItem}
                    >
                      <ExternalLink size={16} />
                      Website
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Community Stats */}
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Community</h3>
              <div className={styles.statRow}>
                <Package size={16} />
                <span>
                  {location.purchase_count || 0} purchase
                  {(location.purchase_count || 0) !== 1 ? 's' : ''} recorded by collectors
                </span>
              </div>
            </div>

            {/* Claim Venue Button (disabled for future) */}
            <div className={styles.claimSection}>
              <button
                className={styles.claimButton}
                disabled
                title="Coming soon for venue owners"
              >
                Claim this venue
              </button>
              <p className={styles.claimNote}>
                Are you the owner or manager of this venue? Soon you'll be able to claim
                it and manage your presence on BarrelChatter.
              </p>
            </div>
          </div>
        </div>

        {/* User's Purchases from this Location */}
        {user && (
          <div className={styles.sideCard}>
            <h2 className={styles.sideCardTitle}>Your Purchases Here</h2>

            {purchasesLoading ? (
              <div className={styles.sideCardLoading}>Loading...</div>
            ) : purchases.length === 0 ? (
              <div className={styles.emptyPurchases}>
                <Package size={32} />
                <p>No purchases recorded from this location yet.</p>
              </div>
            ) : (
              <div className={styles.purchaseList}>
                {purchases.map((item) => (
                  <Link
                    key={item.id}
                    to={`/app/inventory/${item.id}`}
                    className={styles.purchaseItem}
                  >
                    <div className={styles.purchaseName}>
                      {item.bottle_name || item.bottle?.name || 'Unknown Bottle'}
                    </div>
                    <div className={styles.purchaseMeta}>
                      {item.purchase_price && `$${item.purchase_price}`}
                      {item.purchase_date && (
                        <span className={styles.purchaseDate}>
                          {new Date(item.purchase_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Google Maps Embed (if coordinates available) */}
      {hasCoordinates && (
        <div className={styles.mapSection}>
          <h2 className={styles.mapTitle}>Location</h2>
          <div className={styles.mapContainer}>
            <iframe
              title="Location Map"
              width="100%"
              height="300"
              style={{ border: 0, borderRadius: '8px' }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${location.latitude},${location.longitude}&zoom=15`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationDetailPage;
