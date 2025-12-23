import React, { useEffect, useState } from 'react';
import api from '../api/client';
import styles from '../styles/NewBottleSubmissionModal.module.scss';

/**
 * Props:
 * - isOpen: boolean
 * - initialName: string | undefined (pre-fill bottle name from search term)
 * - onClose: () => void
 * - onCreated?: ({ bottle, inventory }) => void
 */
function NewBottleSubmissionModal({ isOpen, initialName, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    brand: '',
    distillery: '',
    type: '',
    proof: '',
    age_statement: '',
    release_name: '',
    is_single_barrel: false,
    is_limited_release: false,
    limited_bottle_count: '',
    finish_description: '',
    mash_bill: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState(null); // 'bottle' | 'inventory'
  const [error, setError] = useState('');

  // Pre-fill name from search term when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setForm((prev) => ({
      ...prev,
      name: initialName && !prev.name ? initialName : prev.name,
    }));
    setError('');
    setSubmitMode(null);
    setSubmitting(false);
  }, [isOpen, initialName]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function resetAndClose() {
    setForm({
      name: '',
      brand: '',
      distillery: '',
      type: '',
      proof: '',
      age_statement: '',
      release_name: '',
      is_single_barrel: false,
      is_limited_release: false,
      limited_bottle_count: '',
      finish_description: '',
      mash_bill: '',
      description: '',
    });
    setError('');
    setSubmitting(false);
    setSubmitMode(null);
    onClose?.();
  }

  async function handleSubmit(mode) {
    // mode: 'bottle' or 'inventory'
    if (submitting) return;
    setSubmitMode(mode);
    setSubmitting(true);
    setError('');

    try {
      if (!form.name.trim()) {
        setError('Name is required.');
        setSubmitting(false);
        return;
      }
      if (!form.brand.trim()) {
        setError('Brand is required.');
        setSubmitting(false);
        return;
      }
      if (!form.type.trim()) {
        setError('Type is required (e.g., bourbon, rye).');
        setSubmitting(false);
        return;
      }
      if (!form.distillery.trim()) {
        setError('Distillery is required.');
        setSubmitting(false);
        return;
      }

      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        distillery: form.distillery.trim(),
        type: form.type.trim(),
        proof: form.proof ? Number(form.proof) : undefined,
        age_statement: form.age_statement.trim() || undefined,
        description: form.description.trim() || undefined,
        release_name: form.release_name.trim() || undefined,
        is_single_barrel: !!form.is_single_barrel,
        is_limited_release: !!form.is_limited_release,
        limited_bottle_count: form.limited_bottle_count
          ? Number(form.limited_bottle_count)
          : undefined,
        finish_description: form.finish_description.trim() || undefined,
        mash_bill: form.mash_bill.trim() || undefined,
      };

      // 1) Create pending bottle
      const bottleRes = await api.post('/v1/bottles', payload);
      const bottle = bottleRes.data?.bottle;

      if (!bottle) {
        throw new Error('Bottle creation did not return a bottle.');
      }

      let inventoryItem = null;

      // 2) Optionally create inventory entry
      if (mode === 'inventory') {
        try {
          const invRes = await api.post('/v1/inventory', {
            bottle_id: bottle.id,
            status: 'sealed',
          });
          // depending on your API shape, adjust this line if needed
          inventoryItem =
            invRes.data?.inventory ||
            invRes.data?.item ||
            invRes.data?.record ||
            null;
        } catch (err) {
          console.error('Error creating inventory entry:', err);
          // not fatal—bottle exists. Show an error but keep going.
          setError(
            err?.response?.data?.error ||
              'Bottle was created, but adding to inventory failed.'
          );
        }
      }

      // Call callback so caller can refresh UI or select this bottle
      onCreated?.({ bottle, inventory: inventoryItem });

      // Close modal if inventory creation didn't fail catastrophically
      if (!error) {
        resetAndClose();
      }
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        err.message ||
        'Failed to submit new bottle.';
      setError(msg);
    } finally {
      setSubmitting(false);
      setSubmitMode(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Submit a New Bottle</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={resetAndClose}
          >
            ✕
          </button>
        </div>
        <p className={styles.subtitle}>
          Can&apos;t find your bottle in the catalog? Submit it for review.
          You&apos;ll still be able to use it in your own collection
          immediately while our moderators review it.
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.form}>
          <div className={styles.row}>
            <label className={styles.label}>
              Name *
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={styles.input}
                placeholder="E.g., Eagle Rare 10 Year Bourbon"
              />
            </label>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>
              Brand *
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                className={styles.input}
                placeholder="Brand"
              />
            </label>
            <label className={styles.label}>
              Distillery *
              <input
                type="text"
                name="distillery"
                value={form.distillery}
                onChange={handleChange}
                className={styles.input}
                placeholder="Distillery"
              />
            </label>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>
              Type *
              <input
                type="text"
                name="type"
                value={form.type}
                onChange={handleChange}
                className={styles.input}
                placeholder="Bourbon, Rye, etc."
              />
            </label>
            <label className={styles.label}>
              Proof
              <input
                type="number"
                name="proof"
                value={form.proof}
                onChange={handleChange}
                className={styles.input}
                placeholder="90"
              />
            </label>
            <label className={styles.label}>
              Age Statement
              <input
                type="text"
                name="age_statement"
                value={form.age_statement}
                onChange={handleChange}
                className={styles.input}
                placeholder="10 years"
              />
            </label>
          </div>

          <div className={styles.sectionTitle}>Release details</div>
          <div className={styles.row}>
            <label className={styles.label}>
              Release Name
              <input
                type="text"
                name="release_name"
                value={form.release_name}
                onChange={handleChange}
                className={styles.input}
                placeholder="Spring 2023 Single Barrel #12"
              />
            </label>
          </div>
          <div className={styles.row}>
            <div className={styles.checkboxRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_single_barrel"
                  checked={form.is_single_barrel}
                  onChange={handleChange}
                />
                Single barrel
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_limited_release"
                  checked={form.is_limited_release}
                  onChange={handleChange}
                />
                Limited release
              </label>
              <label className={styles.label}>
                Total bottles
                <input
                  type="number"
                  name="limited_bottle_count"
                  value={form.limited_bottle_count}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., 125"
                />
              </label>
            </div>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              Finish
              <input
                type="text"
                name="finish_description"
                value={form.finish_description}
                onChange={handleChange}
                className={styles.input}
                placeholder="Apple brandy barrel finish"
              />
            </label>
            <label className={styles.label}>
              Mash Bill
              <input
                type="text"
                name="mash_bill"
                value={form.mash_bill}
                onChange={handleChange}
                className={styles.input}
                placeholder="75/13/12"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className={`${styles.input} ${styles.textarea}`}
                rows={3}
                placeholder="Optional product description, label notes, etc."
              />
            </label>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={resetAndClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <div className={styles.primaryActions}>
            <button
              type="button"
              className={styles.primaryButtonOutline}
              disabled={submitting}
              onClick={() => handleSubmit('bottle')}
            >
              {submitting && submitMode === 'bottle'
                ? 'Submitting...'
                : 'Submit bottle only'}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={submitting}
              onClick={() => handleSubmit('inventory')}
            >
              {submitting && submitMode === 'inventory'
                ? 'Submitting...'
                : 'Submit & add to collection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewBottleSubmissionModal;
