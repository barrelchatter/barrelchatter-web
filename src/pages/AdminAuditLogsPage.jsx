import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import styles from '../styles/AdminAuditLogsPage.module.scss';

/**
 * Admin Audit Logs
 *
 * Expects API endpoint:
 *   GET /v1/admin/audit-logs
 * Query params (optional):
 *   q, action, entity_type, entity_id, actor_user_id, status_code, from, to, limit, offset
 *
 * Response (recommended):
 *   { items: [...], total: number, limit: number, offset: number }
 *
 * This UI is tolerant: if the API returns an array directly, it will still render.
 */

function fmtDate(value) {
  if (!value) return '';
  try {
    const d = new Date(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}

function safeJson(val) {
  if (!val) return '';
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

const DEFAULT_LIMIT = 25;

export default function AdminAuditLogsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [statusCode, setStatusCode] = useState('');

  // ISO date-time strings (YYYY-MM-DDTHH:mm)
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);

  const [selected, setSelected] = useState(null);

  const canPrev = offset > 0;
  const canNext = total === null ? items.length === limit : offset + limit < total;

  const queryParams = useMemo(() => {
    const params = {};
    if (q.trim()) params.q = q.trim();
    if (action) params.action = action;
    if (entityType) params.entity_type = entityType;
    if (statusCode) params.status_code = statusCode;
    if (from) params.from = new Date(from).toISOString();
    if (to) params.to = new Date(to).toISOString();
    params.limit = limit;
    params.offset = offset;
    return params;
  }, [q, action, entityType, statusCode, from, to, limit, offset]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/v1/admin/audit-logs', { params: queryParams });

      // Tolerate several shapes
      const data = res.data;

      if (Array.isArray(data)) {
        setItems(data);
        setTotal(null);
      } else {
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(typeof data.total === 'number' ? data.total : null);
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load audit logs');
      setItems([]);
      setTotal(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  function onSubmitFilters(e) {
    e.preventDefault();
    // Reset pagination on filter apply
    setOffset(0);
    // load will re-run automatically due to queryParams change
  }

  function clearFilters() {
    setQ('');
    setAction('');
    setEntityType('');
    setStatusCode('');
    setFrom('');
    setTo('');
    setOffset(0);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Audit Logs</h1>
          <p className={styles.subtitle}>
            Who did what, where, and how badly it went. (Mostly “where”.)
          </p>
        </div>

        <button className={styles.refreshBtn} onClick={load} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <form className={styles.filters} onSubmit={onSubmitFilters}>
        <div className={styles.filterRow}>
          <label className={styles.label}>
            Search
            <input
              className={styles.input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="email, path, entity id, label…"
            />
          </label>

          <label className={styles.label}>
            Action
            <input
              className={styles.input}
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. USER_LOCKED"
            />
          </label>

          <label className={styles.label}>
            Entity Type
            <input
              className={styles.input}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="e.g. user, invite, bottle"
            />
          </label>

          <label className={styles.label}>
            Status
            <input
              className={styles.input}
              value={statusCode}
              onChange={(e) => setStatusCode(e.target.value)}
              placeholder="e.g. 200"
            />
          </label>
        </div>

        <div className={styles.filterRow}>
          <label className={styles.label}>
            From
            <input
              className={styles.input}
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>

          <label className={styles.label}>
            To
            <input
              className={styles.input}
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>

          <label className={styles.label}>
            Page size
            <select
              className={styles.select}
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setOffset(0);
              }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.filterActions}>
            <button className={styles.primaryBtn} type="submit" disabled={loading}>
              Apply
            </button>
            <button className={styles.secondaryBtn} type="button" onClick={clearFilters} disabled={loading}>
              Clear
            </button>
          </div>
        </div>
      </form>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Path</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  No logs match your filters. Either you’re doing great… or you’re not logging enough yet.
                </td>
              </tr>
            ) : null}

            {items.map((row) => (
              <tr key={row.id}>
                <td className={styles.mono}>{fmtDate(row.created_at || row.createdAt)}</td>
                <td>
                  <div className={styles.actorCell}>
                    <div className={styles.actorEmail}>{row.actor_email || row.actorEmail || '—'}</div>
                    <div className={styles.actorMeta}>
                      <span className={styles.badge}>{row.actor_role || row.actorRole || '—'}</span>
                    </div>
                  </div>
                </td>
                <td className={styles.mono}>{row.action}</td>
                <td className={styles.mono}>
                  {row.entity_type || row.entityType ? (
                    <span>
                      {row.entity_type || row.entityType}:{row.entity_id || row.entityId || '—'}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className={styles.mono}>{row.path || row.request_path || '—'}</td>
                <td className={styles.mono}>{row.status_code ?? row.statusCode ?? '—'}</td>
                <td className={styles.actions}>
                  <button className={styles.linkBtn} type="button" onClick={() => setSelected(row)}>
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <div className={styles.pageInfo}>
          {total !== null ? (
            <span>
              Showing <b>{Math.min(offset + 1, total)}</b>–<b>{Math.min(offset + items.length, total)}</b> of <b>{total}</b>
            </span>
          ) : (
            <span>
              Showing <b>{offset + 1}</b>–<b>{offset + items.length}</b>
            </span>
          )}
        </div>

        <div className={styles.pageButtons}>
          <button
            className={styles.secondaryBtn}
            type="button"
            disabled={loading || !canPrev}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Prev
          </button>
          <button
            className={styles.secondaryBtn}
            type="button"
            disabled={loading || !canNext}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </button>
        </div>
      </div>

      {selected ? (
        <div className={styles.modalOverlay} onMouseDown={() => setSelected(null)}>
          <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>Audit Log Details</div>
                <div className={styles.modalSub}>
                  {fmtDate(selected.created_at || selected.createdAt)} • {selected.action}
                </div>
              </div>
              <button className={styles.closeBtn} type="button" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div>
                  <div className={styles.detailLabel}>Actor</div>
                  <div className={styles.detailValue}>
                    {(selected.actor_email || selected.actorEmail || '—')}{' '}
                    <span className={styles.badge}>{selected.actor_role || selected.actorRole || '—'}</span>
                  </div>
                </div>
                <div>
                  <div className={styles.detailLabel}>Entity</div>
                  <div className={styles.detailValue}>
                    {(selected.entity_type || selected.entityType || '—')} / {(selected.entity_id || selected.entityId || '—')}
                  </div>
                </div>
                <div>
                  <div className={styles.detailLabel}>Method</div>
                  <div className={styles.detailValue}>{selected.method || selected.request_method || '—'}</div>
                </div>
                <div>
                  <div className={styles.detailLabel}>Path</div>
                  <div className={styles.detailValue}>{selected.path || selected.request_path || '—'}</div>
                </div>
                <div>
                  <div className={styles.detailLabel}>Status</div>
                  <div className={styles.detailValue}>{selected.status_code ?? selected.statusCode ?? '—'}</div>
                </div>
                <div>
                  <div className={styles.detailLabel}>IP</div>
                  <div className={styles.detailValue}>{selected.ip || selected.request_ip || '—'}</div>
                </div>
                <div>
                  <div className={styles.detailLabel}>User Agent</div>
                  <div className={styles.detailValue}>{selected.user_agent || selected.userAgent || '—'}</div>
                </div>
              </div>

              <div className={styles.jsonBlock}>
                <div className={styles.detailLabel}>Metadata</div>
                <pre className={styles.pre}>{safeJson(selected.metadata)}</pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
