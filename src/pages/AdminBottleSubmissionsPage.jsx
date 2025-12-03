import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import styles from '../styles/AdminBottleSubmissionsPage.module.scss';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All (pending + rejected)' },
];

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function AdminBottleSubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/v1/admin/bottles/submissions', {
          params: {
            status: statusFilter,
            limit: 100,
            offset: 0,
          },
        });
        setSubmissions(res.data?.submissions || []);
        setTotal(res.data?.total ?? 0);
      } catch (err) {
        console.error(err);
        const msg =
          err?.response?.data?.error ||
          'Failed to load bottle submissions.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter, refreshKey]);

  function triggerRefresh() {
    setRefreshKey((k) => k + 1);
  }

  async function handleApprove(id) {
    setActionError('');
    if (!window.confirm('Approve this bottle as an official catalog entry?')) {
      return;
    }
    try {
      await api.post(`/v1/admin/bottles/submissions/${id}/approve`);
      triggerRefresh();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        'Failed to approve bottle submission.';
      setActionError(msg);
    }
  }

  async function handleReject(id) {
    setActionError('');
    const reason =
      window.prompt('Reason for rejection? (optional)') || '';
    try {
      await api.post(`/v1/admin/bottles/submissions/${id}/reject`, {
        reason,
      });
      triggerRefresh();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        'Failed to reject bottle submission.';
      setActionError(msg);
    }
  }

  async function handleMerge(id) {
    setActionError('');
    const targetId = window.prompt(
      'Enter the target (existing approved) bottle ID to merge into:'
    );
    if (!targetId) return;
    const reason =
      window.prompt('Reason for merge? (optional)') ||
      `Merged into bottle ${targetId}`;
    try {
      await api.post(`/v1/admin/bottles/submissions/${id}/merge`, {
        target_bottle_id: targetId,
        reason,
      });
      triggerRefresh();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        'Failed to merge bottle submission.';
      setActionError(msg);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1>Bottle Submissions</h1>
          <p className={styles.subtitle}>
            Review and moderate user-submitted bottles for the catalog.
          </p>
        </div>
        <div className={styles.headerRight}>
          <label className={styles.filterLabel}>
            Status
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <span className={styles.count}>
            {total} submission{total === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {actionError && (
        <div className={styles.error}>{actionError}</div>
      )}
      {loading && (
        <div className={styles.message}>Loading submissions...</div>
      )}

      {!loading && !error && submissions.length === 0 && (
        <div className={styles.message}>
          No submissions for this filter.
        </div>
      )}

      {!loading && !error && submissions.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Bottle</th>
                <th>Brand</th>
                <th>Type</th>
                <th>Status</th>
                <th>Submitted By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((b) => (
                <tr key={b.id}>
                  <td>{formatDate(b.created_at)}</td>
                  <td>
                    <Link
                      to={`/app/bottles/${b.id}`}
                      className={styles.nameLink}
                    >
                      {b.name || '(no name)'}
                    </Link>
                  </td>
                  <td>{b.brand || '—'}</td>
                  <td>{b.type || '—'}</td>
                  <td>
                    <span
                      className={
                        b.status === 'pending'
                          ? styles.statusPending
                          : styles.statusRejected
                      }
                    >
                      {b.status}
                    </span>
                  </td>
                  <td>{b.created_by_email || '—'}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.smallButton}
                        onClick={() => handleApprove(b.id)}
                        disabled={b.status === 'approved'}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={styles.smallButton}
                        onClick={() => handleReject(b.id)}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className={styles.smallButton}
                        onClick={() => handleMerge(b.id)}
                      >
                        Merge…
                      </button>
                    </div>
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

export default AdminBottleSubmissionsPage;
