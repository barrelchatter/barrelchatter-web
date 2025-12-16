import React, { useEffect, useState } from 'react';
import api from '../api/client';
import styles from '../styles/TagsPage.module.scss';

function TagsPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState('');

  // "Scan" / lookup state
  const [scanUid, setScanUid] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const [claimLabel, setClaimLabel] = useState('');
  const [assignInventoryId, setAssignInventoryId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  async function loadTags() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/v1/tags');
      setTags(res.data.tags || []);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to load tags.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function loadInventory() {
    setInventoryLoading(true);
    setInventoryError('');
    try {
      const res = await api.get('/v1/inventory?limit=100&offset=0');
      setInventoryOptions(res.data.inventory || []);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to load inventory.';
      setInventoryError(message);
    } finally {
      setInventoryLoading(false);
    }
  }

  useEffect(() => {
    loadTags();
    loadInventory();
  }, []);

  async function handleLookup(e) {
    e?.preventDefault?.();
    setLookupResult(null);
    setLookupError('');

    const uid = scanUid.trim();
    if (!uid) {
      setLookupError('Enter an NFC UID to look up.');
      return;
    }

    setLookupLoading(true);
    try {
      const res = await api.post('/v1/tags/lookup', { nfc_uid: uid });
      setLookupResult(res.data);
      // pre-fill claimLabel if tag already has one
      setClaimLabel(res.data.tag?.label || '');
      setAssignInventoryId(
        res.data.inventory?.id || ''
      );
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 404) {
        setLookupError('Tag not found. It may not be registered yet.');
      } else {
        const message =
          err?.response?.data?.error || 'Failed to look up tag.';
        setLookupError(message);
      }
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleClaim() {
    if (!lookupResult?.tag?.nfc_uid) return;
    setClaimLoading(true);
    try {
      await api.post('/v1/tags/claim', {
        nfc_uid: lookupResult.tag.nfc_uid,
        label: claimLabel.trim() || undefined,
      });
      await loadTags();
      await handleLookup(); // refresh lookup state
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to claim tag.';
      setLookupError(message);
    } finally {
      setClaimLoading(false);
    }
  }

  async function handleAssign() {
    if (!lookupResult?.tag?.nfc_uid) return;
    if (!assignInventoryId) {
      setLookupError('Select an inventory item before assigning.');
      return;
    }
    setAssignLoading(true);
    try {
      await api.post('/v1/tags/assign', {
        nfc_uid: lookupResult.tag.nfc_uid,
        inventory_id: assignInventoryId,
      });
      await loadTags();
      await handleLookup(); // refresh lookup state
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error || 'Failed to assign tag.';
      setLookupError(message);
    } finally {
      setAssignLoading(false);
    }
  }

  function renderLookupState() {
    if (!lookupResult) return null;

    const { state, tag, inventory, bottle } = lookupResult;

    let stateLabel = '';
    let stateDescription = '';

    switch (state) {
      case 'unassigned':
        stateLabel = 'Unassigned';
        stateDescription =
          'This tag is registered but not yet claimed by any user.';
        break;
      case 'mine_unlinked':
        stateLabel = 'Claimed (Unlinked)';
        stateDescription =
          'This tag belongs to you, but is not linked to any bottle.';
        break;
      case 'mine_linked':
        stateLabel = 'Claimed & Linked';
        stateDescription =
          'This tag belongs to you and is linked to a bottle in your inventory.';
        break;
      case 'owned_by_other':
        stateLabel = 'Owned by Another User';
        stateDescription =
          'This tag is claimed by a different user. You cannot reassign it.';
        break;
      default:
        stateLabel = state || 'Unknown';
        stateDescription = '';
        break;
    }

    const isMine =
      state === 'mine_unlinked' || state === 'mine_linked';

    return (
      <div className={styles.lookupResult}>
        <div className={styles.lookupHeader}>
          <div>
            <div className={styles.lookupUid}>{tag?.nfc_uid}</div>
            <div className={styles.lookupState}>
              {stateLabel} {stateDescription && `— ${stateDescription}`}
            </div>
          </div>
          {tag?.label && (
            <div className={styles.lookupTagLabel}>
              Label: <strong>{tag.label}</strong>
            </div>
          )}
        </div>

        {(state === 'unassigned' || isMine) && (
          <div className={styles.lookupActions}>
            <div className={styles.lookupColumn}>
              <h3 className={styles.lookupTitle}>
                {isMine ? 'Update Tag Label' : 'Claim Tag'}
              </h3>
              <div className={styles.lookupField}>
                <label className={styles.label}>
                  Tag label
                  <input
                    className={styles.input}
                    type="text"
                    value={claimLabel}
                    onChange={(e) => setClaimLabel(e.target.value)}
                    placeholder="e.g. Home - Cabinet A"
                  />
                </label>
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleClaim}
                disabled={claimLoading}
              >
                {claimLoading
                  ? 'Saving...'
                  : isMine
                  ? 'Save Label'
                  : 'Claim Tag'}
              </button>
            </div>

            {isMine && (
              <div className={styles.lookupColumn}>
                <h3 className={styles.lookupTitle}>
                  {inventory
                    ? 'Change Linked Bottle'
                    : 'Assign to a Bottle'}
                </h3>
                <div className={styles.lookupField}>
                  <label className={styles.label}>
                    Inventory item
                    <select
                      className={styles.input}
                      value={assignInventoryId}
                      onChange={(e) =>
                        setAssignInventoryId(e.target.value)
                      }
                      disabled={
                        inventoryLoading || !!inventoryError
                      }
                    >
                      <option value="">
                        {inventoryOptions.length === 0
                          ? 'No inventory available'
                          : 'Select bottle'}
                      </option>
                      {inventoryOptions.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.bottle?.name || 'Unknown'} —{' '}
                          {inv.location_label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleAssign}
                  disabled={assignLoading}
                >
                  {assignLoading ? 'Assigning...' : 'Assign Tag'}
                </button>
              </div>
            )}
          </div>
        )}

        {state === 'mine_linked' && inventory && bottle && (
          <div className={styles.lookupLinkedInfo}>
            <div>
              <div className={styles.lookupLinkedLabel}>
                Currently linked to:
              </div>
              <div className={styles.lookupLinkedBottle}>
                {bottle.name}{' '}
                {bottle.brand ? `— ${bottle.brand}` : ''}
              </div>
              <div className={styles.lookupLinkedLocation}>
                Location: {inventory.location_label}
              </div>
            </div>
          </div>
        )}

        {state === 'owned_by_other' && (
          <div className={styles.lookupWarning}>
            This tag is owned by another user and cannot be claimed or
            reassigned here.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Tags</h1>
          <p className={styles.subtitle}>
            Manage NFC tags attached to bottles in your inventory.
          </p>
        </div>
      </div>

      <div className={styles.scanCard}>
        <h2 className={styles.scanTitle}>Simulate Scan</h2>
        <p className={styles.scanHint}>
          Enter an NFC UID to look up its current status and assign it to a
          bottle.
        </p>
        <form
          className={styles.scanForm}
          onSubmit={handleLookup}
        >
          <input
            className={styles.scanInput}
            type="text"
            placeholder="Enter NFC UID (e.g. TEST-TAG-001)"
            value={scanUid}
            onChange={(e) => setScanUid(e.target.value)}
          />
          <button
            type="submit"
            className={styles.scanButton}
            disabled={lookupLoading}
          >
            {lookupLoading ? 'Looking up...' : 'Look Up'}
          </button>
        </form>
        {lookupError && (
          <div className={styles.error}>{lookupError}</div>
        )}
        {renderLookupState()}
      </div>

      {inventoryError && (
        <div className={styles.smallNote}>
          Inventory warning: {inventoryError}
        </div>
      )}

      <div className={styles.listHeader}>
        <h2 className={styles.listTitle}>My Tags</h2>
      </div>

      {loading && <div className={styles.message}>Loading tags...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && tags.length === 0 && (
        <div className={styles.message}>
          No tags yet. Claim a tag after scanning to see it here.
        </div>
      )}

      {!loading && !error && tags.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>NFC UID</th>
                <th>Label</th>
                <th>Status</th>
                <th>Bottle</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((entry) => (
                <tr key={entry.tag.id}>
                  <td>{entry.tag.nfc_uid}</td>
                  <td>{entry.tag.label || '—'}</td>
                  <td>{entry.tag.status}</td>
                  <td>{entry.bottle?.name || '—'}</td>
                  <td>
                    {entry.inventory?.location_label || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TagsPage;
