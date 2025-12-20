import PropTypes from 'prop-types';
import styles from '../styles/MapEmbed.module.scss';

/**
 * MapEmbed Component
 *
 * Displays a Google Maps embed iframe for a given location.
 * Uses the Maps Embed API with coordinates.
 */
export default function MapEmbed({
  latitude,
  longitude,
  zoom = 15,
  height = 300,
  title = 'Location Map',
  mapType = 'roadmap',
  className = '',
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY;

  // If no coordinates or API key, show placeholder
  if (!latitude || !longitude) {
    return (
      <div className={`${styles.placeholder} ${className}`} style={{ height }}>
        <div className={styles.placeholderContent}>
          <svg
            className={styles.placeholderIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className={styles.placeholderText}>
            {!apiKey ? 'Map API key not configured' : 'No location coordinates'}
          </span>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className={`${styles.placeholder} ${className}`} style={{ height }}>
        <div className={styles.placeholderContent}>
          <svg
            className={styles.placeholderIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className={styles.placeholderText}>Map embed unavailable</span>
        </div>
      </div>
    );
  }

  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=${zoom}&maptype=${mapType}`;

  return (
    <div className={`${styles.container} ${className}`} style={{ height }}>
      <iframe
        className={styles.iframe}
        src={embedUrl}
        title={title}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}

MapEmbed.propTypes = {
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  zoom: PropTypes.number,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.string,
  mapType: PropTypes.oneOf(['roadmap', 'satellite', 'terrain', 'hybrid']),
  className: PropTypes.string,
};
