import React, { useState } from 'react';
import { X, MapPin } from 'react-feather';
import api from '../api/client';
import styles from '../styles/NewLocationModal.module.scss';

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

/**
 * NewLocationModal
 *
 * Modal form for submitting a new purchase location to the catalog.
 *
 * Props:
 *   onClose   - Callback when modal is closed
 *   onSuccess - Callback when location is created: (location) => void
 */
function NewLocationModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    type: 'liquor_store',
    city: '',
    state: '',
    address_line1: '',
    postal_code: '',
    website: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!form.name.trim()) {
      setError('Store/venue name is required');
      return;
    }
    if (!form.city.trim()) {
      setError('City is required');
      return;
    }
    if (!form.state) {
      setError('State is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        location_type: form.type,
        city: form.city.trim(),
        state: form.state,
        address_line1: form.address_line1.trim() || undefined,
        postal_code: form.postal_code.trim() || undefined,
        website: form.website.trim() || undefined,
        phone: form.phone.trim() || undefined,
      };

      const res = await api.post('/v1/purchase-locations', payload);
      const newLocation = res.data?.location;

      onSuccess?.(newLocation);
    } catch (err) {
      console.error('Failed to create purchase location:', err);
      const msg = err?.response?.data?.error || 'Failed to submit location';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

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
            <MapPin size={20} />
            <h2>Submit New Location</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button">
            <X size={20} />
          </button>
        </header>

        <form className={styles.content} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>
              Store/Venue Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              className={styles.input}
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Total Wine & More"
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Type <span className={styles.required}>*</span>
            </label>
            <select
              name="type"
              className={styles.select}
              value={form.type}
              onChange={handleChange}
              disabled={submitting}
            >
              {LOCATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>
                City <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="city"
                className={styles.input}
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                disabled={submitting}
              />
            </div>
            <div className={styles.fieldSmall}>
              <label className={styles.label}>
                State <span className={styles.required}>*</span>
              </label>
              <select
                name="state"
                className={styles.select}
                value={form.state}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="">Select...</option>
                {US_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Street Address</label>
            <input
              type="text"
              name="address_line1"
              className={styles.input}
              value={form.address_line1}
              onChange={handleChange}
              placeholder="123 Main St (optional)"
              disabled={submitting}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.fieldSmall}>
              <label className={styles.label}>ZIP Code</label>
              <input
                type="text"
                name="postal_code"
                className={styles.input}
                value={form.postal_code}
                onChange={handleChange}
                placeholder="12345"
                disabled={submitting}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Phone</label>
              <input
                type="text"
                name="phone"
                className={styles.input}
                value={form.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                disabled={submitting}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Website</label>
            <input
              type="url"
              name="website"
              className={styles.input}
              value={form.website}
              onChange={handleChange}
              placeholder="https://..."
              disabled={submitting}
            />
          </div>

          <p className={styles.note}>
            New locations are reviewed by moderators before appearing in the catalog.
            You'll receive a notification when your submission is approved.
          </p>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewLocationModal;
