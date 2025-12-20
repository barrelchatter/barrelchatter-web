import PropTypes from 'prop-types';
import { ExternalLink, MapPin } from 'react-feather';
import styles from '../styles/MapLinks.module.scss';

/**
 * MapLinks Component
 *
 * Displays links to open a location in Google Maps and Apple Maps.
 * Prefers Google Place ID for more accurate Google Maps links.
 */
export default function MapLinks({
  latitude,
  longitude,
  googlePlaceId,
  name,
  compact = false,
  className = '',
}) {
  // Generate Google Maps URL
  const getGoogleMapsUrl = () => {
    if (googlePlaceId) {
      return `https://www.google.com/maps/place/?q=place_id:${googlePlaceId}`;
    }
    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${latitude},${longitude}`;
    }
    if (name) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
    }
    return null;
  };

  // Generate Apple Maps URL
  const getAppleMapsUrl = () => {
    if (!latitude || !longitude) {
      return null;
    }
    let url = `https://maps.apple.com/?ll=${latitude},${longitude}`;
    if (name) {
      url += `&q=${encodeURIComponent(name)}`;
    }
    return url;
  };

  const googleMapsUrl = getGoogleMapsUrl();
  const appleMapsUrl = getAppleMapsUrl();

  // If no links can be generated, return null
  if (!googleMapsUrl && !appleMapsUrl) {
    return null;
  }

  if (compact) {
    return (
      <div className={`${styles.compactContainer} ${className}`}>
        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.iconButton}
            title="Open in Google Maps"
          >
            <GoogleMapsIcon />
          </a>
        )}
        {appleMapsUrl && (
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.iconButton}
            title="Open in Apple Maps"
          >
            <AppleMapsIcon />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {googleMapsUrl && (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.button} ${styles.googleButton}`}
        >
          <GoogleMapsIcon />
          <span>Google Maps</span>
          <ExternalLink size={14} />
        </a>
      )}
      {appleMapsUrl && (
        <a
          href={appleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.button} ${styles.appleButton}`}
        >
          <AppleMapsIcon />
          <span>Apple Maps</span>
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}

// Google Maps icon SVG
function GoogleMapsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={styles.mapIcon}
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

// Apple Maps icon SVG
function AppleMapsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={styles.mapIcon}
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

MapLinks.propTypes = {
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  googlePlaceId: PropTypes.string,
  name: PropTypes.string,
  compact: PropTypes.bool,
  className: PropTypes.string,
};
