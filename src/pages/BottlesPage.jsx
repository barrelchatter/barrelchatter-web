import React, { useEffect, useState } from 'react';
import api from '../api/client';
import styles from '../styles/BottlesPage.module.scss';

const INITIAL_FORM = {
  name: '',
  brand: '',
  distillery: '',
  type: '',
  proof: '',
  age_statement: '',
};

function BottlesPage() {
  const [bottles, setBottles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  async function loadBottles({ showSpinner = true } = {}) {
    if (showSpinner) {
      setLoading(true);
    } else {
      setLoadingList(true);
    }
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('limit', 100);
      params.set('offset', 0);
      if (search.trim()) params.set('q', search.trim());
      if (typeFilter.trim()) params.set('type', typeFilter.trim());

      const response = await api.get(`/v1/bottles?${params.toString()}`);
      const data = response.data;

      setBottles(data.bottles || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to load bottles. Is the API running?';
      setError(message);
    } finally {
      setLoading(false);
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadBottles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadBottles({ showSpinner: false });
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (!form.name.trim()) {
        setFormError('Name is required.');
        setFormSubmitting(false);
        return;
      }

      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim() || undefined,
        distillery: form.distillery.trim() || undefined,
        type: form.type.trim() || undefined,
        proof: form.proof ? Number(form.proof) : undefined,
        age_statement: form.age_statement.trim() || undefined,
      };

      const response = await api.post('/v1/bottles', payload);
      const created = response.data?.bottle;

      // Optimistically add to list
      setBottles((prev) => {
        if (!created) return prev;
        const next = [created, ...prev];
        // naive de-dupe by id
        const seen = new Set();
        return next.filter((b) => {
          if (seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });
      });
      setTotal((prev) => prev + 1);

      setForm(INITIAL_FORM);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to create bottle.';
      setFormError(message);
    } finally {
      setFormSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Bottles</h1>
          <p className={styles.subtitle}>
            Canonical bottle catalog &mdash; shared across inventory, tastings, and wishlists.
          </p>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : 'Add Bottle'}
        </button>
      </div>

      <div className={styles.toolbar}>
        <form className={styles.searchRow} onSubmit={handleSearchSubmit}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by name, brand, or distillery..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            className={styles.typeInput}
            type="text"
            placeholder="Type (e.g. Bourbon, Rye)"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
          <button
            type="submit"
            className={styles.searchButton}
            disabled={loadingList}
          >
            {loadingList ? 'Searching...' : 'Search'}
          </button>
        </form>
        <div className={styles.count}>
          {total} bottle{total === 1 ? '' : 's'}
        </div>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Add Bottle</h2>
          {formError && <div className={styles.formError}>{formError}</div>}
          <form className={styles.form} onSubmit={handleFormSubmit}>
            <div className={styles.formRow}>
              <label className={styles.label}>
                Name *
                <input
                  className={styles.input}
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Eagle Rare 10 Year"
                  required
                />
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>
                Brand
                <input
                  className={styles.input}
                  type="text"
                  name="brand"
                  value={form.brand}
                  onChange={handleFormChange}
                  placeholder="Buffalo Trace"
                />
              </label>
              <label className={styles.label}>
                Distillery
                <input
                  className={styles.input}
                  type="text"
                  name="distillery"
                  value={form.distillery}
                  onChange={handleFormChange}
                  placeholder="Buffalo Trace Distillery"
                />
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>
                Type
                <input
                  className={styles.input}
                  type="text"
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  placeholder="Bourbon, Rye, etc."
                />
              </label>
              <label className={styles.label}>
                Proof
                <input
                  className={styles.input}
                  type="number"
                  step="0.1"
                  name="proof"
                  value={form.proof}
                  onChange={handleFormChange}
                  placeholder="e.g. 90"
                />
              </label>
              <label className={styles.label}>
                Age Statement
                <input
                  className={styles.input}
                  type="text"
                  name="age_statement"
                  value={form.age_statement}
                  onChange={handleFormChange}
                  placeholder="e.g. 10 years"
                />
              </label>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Saving...' : 'Save Bottle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className={styles.message}>Loading bottles...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && bottles.length === 0 && (
        <div className={styles.message}>No bottles found.</div>
      )}

      {!loading && !error && bottles.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Brand</th>
                <th>Distillery</th>
                <th>Type</th>
                <th>Proof</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {bottles.map((bottle) => (
                <tr key={bottle.id}>
                  <td>{bottle.name}</td>
                  <td>{bottle.brand || '—'}</td>
                  <td>{bottle.distillery || '—'}</td>
                  <td>{bottle.type || '—'}</td>
                  <td>{bottle.proof != null ? bottle.proof : '—'}</td>
                  <td>{bottle.age_statement || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BottlesPage;
