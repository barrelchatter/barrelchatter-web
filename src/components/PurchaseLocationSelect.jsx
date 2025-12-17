import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client';
import styles from '../styles/PurchaseLocationSelect.module.scss';

/**
 * PurchaseLocationSelect
 * 
 * A searchable dropdown for selecting purchase locations from the global catalog.
 * Includes option to submit new locations for moderation.
 * 
 * Props:
 *   value            - Current selected location ID (or null)
 *   onChange         - Callback when selection changes: (locationId, location) => void
 *   inventoryId      - Optional inventory ID for tracking pending requests
 *   allowCreate      - Show "Submit new..." option (default: true)
 *   showLegacy       - Show legacy text inputs as fallback (default: true)
 *   legacyStore      - Current legacy purchase_store value
 *   legacyCity       - Current legacy purchase_city value
 *   legacyState      - Current legacy purchase_state value
 *   onLegacyChange   - Callback for legacy input changes: ({ store, city, state }) => void
 *   disabled         - Disable the select
 *   className        - Additional CSS class
 */

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

function PurchaseLocationSelect({
  value,
  onChange,
  inventoryId,
  allowCreate = true,
  showLegacy = true,
  legacyStore = '',
  legacyCity = '',
  legacyState = '',
  onLegacyChange,
  disabled = false,
  className = '',
}) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Pending location request (submitted but not yet approved)
  const [pendingRequest, setPendingRequest] = useState(null);

  // Create new location form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'liquor_store',
    city: '',
    state: '',
    address_line1: '',
    postal_code: '',
    website: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Legacy mode
  const [useLegacy, setUseLegacy] = useState(false);

  const containerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load selected location details if value is set
  useEffect(() => {
    if (value && !selectedLocation) {
      api.get(`/v1/purchase-locations/${value}`)
        .then((res) => {
          setSelectedLocation(res.data?.location || null);
        })
        .catch(() => {
          setSelectedLocation(null);
        });
    } else if (!value) {
      setSelectedLocation(null);
    }
  }, [value]);

  // Load pending request for this inventory item
  useEffect(() => {
    if (inventoryId && !value) {
      api.get(`/v1/purchase-locations/requests/inventory/${inventoryId}`)
        .then((res) => {
          setPendingRequest(res.data?.request || null);
        })
        .catch(() => {
          setPendingRequest(null);
        });
    } else {
      setPendingRequest(null);
    }
  }, [inventoryId, value]);

  // Search locations
  const searchLocations = useCallback(async (query) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (query) params.set('q', query);

      const res = await api.get(`/v1/purchase-locations?${params}`);
      setLocations(res.data?.locations || []);
    } catch (err) {
      console.error('Failed to search purchase locations:', err);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (showDropdown) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        searchLocations(searchTerm);
      }, 300);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, showDropdown, searchLocations]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(location) {
    setSelectedLocation(location);
    onChange?.(location.id, location);
    setShowDropdown(false);
    setSearchTerm('');
    setUseLegacy(false);
  }

  function handleClear() {
    setSelectedLocation(null);
    onChange?.(null, null);
    setSearchTerm('');
  }

  function handleUseLegacy() {
    setUseLegacy(true);
    setSelectedLocation(null);
    onChange?.(null, null);
    setShowDropdown(false);
  }

  function handleLegacyInputChange(field, val) {
    onLegacyChange?.({
      store: field === 'store' ? val : legacyStore,
      city: field === 'city' ? val : legacyCity,
      state: field === 'state' ? val : legacyState,
    });
  }

  function handleCreateFormChange(e) {
    const { name, value: val } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: val }));
    setCreateError('');
  }

  async function handleCreateSubmit(e) {
    if (e) e.preventDefault();

    if (!createForm.name.trim()) {
      setCreateError('Store name is required');
      return;
    }
    if (!createForm.city.trim()) {
      setCreateError('City is required');
      return;
    }
    if (!createForm.state) {
      setCreateError('State is required');
      return;
    }

    setCreateSubmitting(true);
    setCreateError('');
    setCreateSuccess('');

    try {
      const payload = {
        name: createForm.name.trim(),
        type: createForm.type,
        city: createForm.city.trim(),
        state: createForm.state,
        address_line1: createForm.address_line1.trim() || undefined,
        postal_code: createForm.postal_code.trim() || undefined,
        website: createForm.website.trim() || undefined,
      };

      const res = await api.post('/v1/purchase-locations', payload);
      const newLocation = res.data?.location;

      // If we have an inventory ID and the location is pending, create a request
      if (inventoryId && newLocation && newLocation.status === 'pending') {
        try {
          const reqRes = await api.post(`/v1/purchase-locations/${newLocation.id}/request`, {
            inventory_id: inventoryId,
          });
          setPendingRequest({
            ...reqRes.data?.request,
            location_name: newLocation.name,
            location_city: newLocation.city,
            location_state: newLocation.state,
            location_status: newLocation.status,
          });
        } catch (reqErr) {
          console.error('Failed to create location request:', reqErr);
        }
      }

      setCreateSuccess('Location submitted for review!');
      
      // Reset form
      setCreateForm({
        name: '',
        type: 'liquor_store',
        city: '',
        state: '',
        address_line1: '',
        postal_code: '',
        website: '',
      });

      // If it was auto-approved (admin), select it
      if (newLocation?.status === 'approved') {
        handleSelect(newLocation);
        setShowCreate(false);
      } else {
        // Close the create form after a moment
        setTimeout(() => {
          setShowCreate(false);
          setCreateSuccess('');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to create purchase location:', err);
      const msg = err?.response?.data?.error || 'Failed to submit location';
      setCreateError(msg);
    } finally {
      setCreateSubmitting(false);
    }
  }

  function formatLocationDisplay(loc) {
    if (!loc) return '';
    const parts = [loc.name];
    if (loc.city && loc.state) {
      parts.push(`${loc.city}, ${loc.state}`);
    }
    return parts.join(' — ');
  }

  function getTypeLabel(typeValue) {
    const found = LOCATION_TYPES.find((t) => t.value === typeValue);
    return found?.label || typeValue;
  }

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      {/* Pending location request display */}
      {pendingRequest && !selectedLocation && !showDropdown && !useLegacy && !showCreate && (
        <div className={styles.pendingDisplay}>
          <div className={styles.pendingInfo}>
            <span className={styles.pendingBadge}>Pending Approval</span>
            <span className={styles.pendingName}>{pendingRequest.location_name}</span>
            <span className={styles.pendingMeta}>
              {pendingRequest.location_city}, {pendingRequest.location_state}
            </span>
          </div>
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              setPendingRequest(null);
              // Could also cancel the request via API
            }}
            disabled={disabled}
            title="Clear and choose different location"
          >
            ×
          </button>
        </div>
      )}

      {/* Selected location display */}
      {selectedLocation && !showDropdown && (
        <div className={styles.selectedDisplay}>
          <div className={styles.selectedInfo}>
            <span className={styles.selectedName}>{selectedLocation.name}</span>
            <span className={styles.selectedMeta}>
              {selectedLocation.city}, {selectedLocation.state}
              {selectedLocation.location_type && (
                <> · {getTypeLabel(selectedLocation.location_type)}</>
              )}
            </span>
          </div>
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            disabled={disabled}
          >
            ×
          </button>
        </div>
      )}

      {/* Search input */}
      {!selectedLocation && !pendingRequest && !useLegacy && !showCreate && (
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search stores, bars, distilleries..."
            disabled={disabled}
          />
          {loading && <span className={styles.loadingIndicator}>...</span>}
        </div>
      )}

      {/* Dropdown results */}
      {showDropdown && !useLegacy && !showCreate && (
        <div className={styles.dropdown}>
          {locations.length > 0 ? (
            <ul className={styles.resultsList}>
              {locations.map((loc) => (
                <li key={loc.id}>
                  <button
                    type="button"
                    className={styles.resultItem}
                    onClick={() => handleSelect(loc)}
                  >
                    <span className={styles.resultName}>{loc.name}</span>
                    <span className={styles.resultMeta}>
                      {loc.city}, {loc.state}
                      {loc.location_type && ` · ${getTypeLabel(loc.location_type)}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.noResults}>
              {loading ? 'Searching...' : 'No locations found'}
            </div>
          )}

          <div className={styles.dropdownFooter}>
            {allowCreate && (
              <button
                type="button"
                className={styles.footerAction}
                onClick={() => {
                  setShowCreate(true);
                  setShowDropdown(false);
                  // Pre-fill name from search
                  if (searchTerm) {
                    setCreateForm((prev) => ({ ...prev, name: searchTerm }));
                  }
                }}
              >
                + Submit new location
              </button>
            )}
            {showLegacy && (
              <button
                type="button"
                className={styles.footerActionMuted}
                onClick={handleUseLegacy}
              >
                Enter manually instead
              </button>
            )}
          </div>
        </div>
      )}

      {/* Legacy manual entry */}
      {useLegacy && !showCreate && (
        <div className={styles.legacyContainer}>
          <div className={styles.legacyRow}>
            <input
              type="text"
              className={styles.legacyInput}
              value={legacyStore}
              onChange={(e) => handleLegacyInputChange('store', e.target.value)}
              placeholder="Store name"
              disabled={disabled}
            />
          </div>
          <div className={styles.legacyRow}>
            <input
              type="text"
              className={styles.legacyCityInput}
              value={legacyCity}
              onChange={(e) => handleLegacyInputChange('city', e.target.value)}
              placeholder="City"
              disabled={disabled}
            />
            <select
              className={styles.legacyStateSelect}
              value={legacyState}
              onChange={(e) => handleLegacyInputChange('state', e.target.value)}
              disabled={disabled}
            >
              <option value="">State</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={styles.legacyBackLink}
            onClick={() => setUseLegacy(false)}
          >
            ← Search catalog instead
          </button>
        </div>
      )}

      {/* Create new location form */}
      {showCreate && (
        <div className={styles.createForm}>
          <div className={styles.createHeader}>
            <h4>Submit New Location</h4>
            <button
              type="button"
              className={styles.createCloseButton}
              onClick={() => {
                setShowCreate(false);
                setCreateError('');
                setCreateSuccess('');
              }}
            >
              ×
            </button>
          </div>

          {createError && <div className={styles.createError}>{createError}</div>}
          {createSuccess && <div className={styles.createSuccess}>{createSuccess}</div>}

          <div className={styles.createFormFields}>
            <div className={styles.createRow}>
              <label className={styles.createLabel}>
                Store/Venue Name *
                <input
                  type="text"
                  name="name"
                  className={styles.createInput}
                  value={createForm.name}
                  onChange={handleCreateFormChange}
                  placeholder="e.g., Total Wine & More"
                  disabled={createSubmitting}
                />
              </label>
            </div>

            <div className={styles.createRow}>
              <label className={styles.createLabel}>
                Type *
                <select
                  name="type"
                  className={styles.createSelect}
                  value={createForm.type}
                  onChange={handleCreateFormChange}
                  disabled={createSubmitting}
                >
                  {LOCATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.createRowDouble}>
              <label className={styles.createLabel}>
                City *
                <input
                  type="text"
                  name="city"
                  className={styles.createInput}
                  value={createForm.city}
                  onChange={handleCreateFormChange}
                  placeholder="City"
                  disabled={createSubmitting}
                />
              </label>
              <label className={styles.createLabel}>
                State *
                <select
                  name="state"
                  className={styles.createSelect}
                  value={createForm.state}
                  onChange={handleCreateFormChange}
                  disabled={createSubmitting}
                >
                  <option value="">Select...</option>
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.createRow}>
              <label className={styles.createLabel}>
                Street Address
                <input
                  type="text"
                  name="address_line1"
                  className={styles.createInput}
                  value={createForm.address_line1}
                  onChange={handleCreateFormChange}
                  placeholder="123 Main St (optional)"
                  disabled={createSubmitting}
                />
              </label>
            </div>

            <div className={styles.createRowDouble}>
              <label className={styles.createLabel}>
                ZIP Code
                <input
                  type="text"
                  name="postal_code"
                  className={styles.createInput}
                  value={createForm.postal_code}
                  onChange={handleCreateFormChange}
                  placeholder="12345"
                  disabled={createSubmitting}
                />
              </label>
              <label className={styles.createLabel}>
                Website
                <input
                  type="text"
                  name="website"
                  className={styles.createInput}
                  value={createForm.website}
                  onChange={handleCreateFormChange}
                  placeholder="https://..."
                  disabled={createSubmitting}
                />
              </label>
            </div>

            <div className={styles.createActions}>
              <button
                type="button"
                className={styles.createCancelButton}
                onClick={() => {
                  setShowCreate(false);
                  setCreateError('');
                  setCreateSuccess('');
                }}
                disabled={createSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.createSubmitButton}
                onClick={handleCreateSubmit}
                disabled={createSubmitting}
              >
                {createSubmitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>

            <p className={styles.createNote}>
              New locations are reviewed before appearing in the catalog.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseLocationSelect;
