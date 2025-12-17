import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import styles from '../styles/AdminBulkImportPage.module.scss';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function AdminBulkImportPage() {
  // Active session state
  const [activeSession, setActiveSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Manual input mode
  const [manualUid, setManualUid] = useState('');
  const [lastResult, setLastResult] = useState(null);

  // Recent log entries for current session
  const [recentLog, setRecentLog] = useState([]);

  // Start session form
  const [showStartForm, setShowStartForm] = useState(false);
  const [packs, setPacks] = useState([]);
  const [selectedPackId, setSelectedPackId] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [startSubmitting, setStartSubmitting] = useState(false);
  const [startError, setStartError] = useState('');

  // Session history
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Processing state
  const [processing, setProcessing] = useState(false);

  const inputRef = useRef(null);

  async function checkActiveSession() {
    setSessionLoading(true);
    try {
      const res = await api.get('/v1/admin/tags/bulk-import/active');
      setActiveSession(res.data?.session || null);
    } catch (err) {
      console.error('Failed to check active session:', err);
    } finally {
      setSessionLoading(false);
    }
  }

  async function loadPacks() {
    try {
      const res = await api.get('/v1/admin/tag-packs?status=active&limit=100');
      setPacks(res.data?.packs || []);
    } catch (err) {
      console.error('Failed to load packs:', err);
    }
  }

  async function loadSessions() {
    setSessionsLoading(true);
    try {
      const res = await api.get('/v1/admin/tags/bulk-import/sessions?limit=10');
      setSessions(res.data?.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  }

  useEffect(() => {
    checkActiveSession();
    loadPacks();
    loadSessions();
  }, []);

  // Focus input when active session exists
  useEffect(() => {
    if (activeSession && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeSession]);

  async function handleStartSession(e) {
    e.preventDefault();
    setStartSubmitting(true);
    setStartError('');

    try {
      const res = await api.post('/v1/admin/tags/bulk-import/start', {
        pack_id: selectedPackId || undefined,
        notes: sessionNotes.trim() || undefined,
      });

      setActiveSession(res.data?.session || null);
      setShowStartForm(false);
      setSelectedPackId('');
      setSessionNotes('');
      setRecentLog([]);
    } catch (err) {
      console.error(err);
      setStartError(err?.response?.data?.error || 'Failed to start session');
    } finally {
      setStartSubmitting(false);
    }
  }

  async function handleAddTag(uid) {
    if (!activeSession || !uid.trim()) return;

    setProcessing(true);
    setLastResult(null);

    try {
      const res = await api.post('/v1/admin/tags/bulk-import/add', {
        session_id: activeSession.id,
        nfc_uid: uid.trim(),
      });

      const result = {
        success: res.data.success,
        error: res.data.error,
        nfc_uid: uid.trim(),
        sequence_number: res.data.sequence_number,
      };

      setLastResult(result);
      setRecentLog(prev => [result, ...prev.slice(0, 19)]);

      // Update session stats
      setActiveSession(prev => ({
        ...prev,
        tags_added: res.data.session_stats.tags_added,
        tags_failed: res.data.session_stats.tags_failed,
      }));

      setManualUid('');
    } catch (err) {
      console.error(err);
      setLastResult({
        success: false,
        error: err?.response?.data?.error || 'Failed to add tag',
        nfc_uid: uid.trim(),
      });
    } finally {
      setProcessing(false);
      // Re-focus input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }

  function handleInputKeyDown(e) {
    if (e.key === 'Enter' && manualUid.trim()) {
      e.preventDefault();
      handleAddTag(manualUid);
    }
  }

  async function handleEndSession() {
    if (!activeSession) return;

    const confirmed = window.confirm(
      `End this bulk import session?\n\nTags added: ${activeSession.tags_added}\nTags failed: ${activeSession.tags_failed}`
    );

    if (!confirmed) return;

    try {
      const res = await api.post('/v1/admin/tags/bulk-import/end', {
        session_id: activeSession.id,
      });

      alert(`Session completed!\n\nTags added: ${res.data.tags_added}\nTags failed: ${res.data.tags_failed}\nDuration: ${formatDuration(res.data.duration_seconds)}`);

      setActiveSession(null);
      setRecentLog([]);
      setLastResult(null);
      loadSessions();
    } catch (err) {
      console.error(err);
      alert('Failed to end session: ' + (err?.response?.data?.error || 'Unknown error'));
    }
  }

  async function handleAbandonSession() {
    if (!activeSession) return;

    const confirmed = window.confirm('Abandon this session? Tags already added will remain in the system.');

    if (!confirmed) return;

    try {
      await api.post('/v1/admin/tags/bulk-import/abandon', {
        session_id: activeSession.id,
      });

      setActiveSession(null);
      setRecentLog([]);
      setLastResult(null);
      loadSessions();
    } catch (err) {
      console.error(err);
      alert('Failed to abandon session');
    }
  }

  if (sessionLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.message}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <Link to="/app/admin/tag-packs" className={styles.backLink}>← Back to Tag Packs</Link>
          <h1>Bulk Import Tags</h1>
          <p className={styles.subtitle}>
            Rapidly register NFC tags by scanning them one by one.
          </p>
        </div>
      </div>

      {/* Active Session UI */}
      {activeSession ? (
        <div className={styles.activeSession}>
          <div className={styles.sessionHeader}>
            <div className={styles.sessionInfo}>
              <span className={styles.sessionBadge}>Session Active</span>
              {activeSession.pack_code && (
                <span className={styles.sessionPack}>Pack: {activeSession.pack_code}</span>
              )}
            </div>
            <div className={styles.sessionStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{activeSession.tags_added}</span>
                <span className={styles.statLabel}>Added</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValueError}>{activeSession.tags_failed}</span>
                <span className={styles.statLabel}>Failed</span>
              </div>
            </div>
          </div>

          <div className={styles.scanArea}>
            {/* Last result feedback */}
            {lastResult && (
              <div className={`${styles.lastResult} ${lastResult.success ? styles.success : styles.failure}`}>
                {lastResult.success ? (
                  <>
                    <span className={styles.resultIcon}>✓</span>
                    <span>Tag #{lastResult.sequence_number} added: {lastResult.nfc_uid}</span>
                  </>
                ) : (
                  <>
                    <span className={styles.resultIcon}>✗</span>
                    <span>{lastResult.error}: {lastResult.nfc_uid}</span>
                  </>
                )}
              </div>
            )}

            <div className={styles.inputArea}>
              <label className={styles.inputLabel}>
                Ready to scan tag #{(activeSession.tags_added + activeSession.tags_failed + 1)}
              </label>
              <input
                ref={inputRef}
                type="text"
                className={styles.uidInput}
                value={manualUid}
                onChange={(e) => setManualUid(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Scan NFC tag or type UID..."
                disabled={processing}
                autoFocus
              />
              <button
                type="button"
                className={styles.addButton}
                onClick={() => handleAddTag(manualUid)}
                disabled={processing || !manualUid.trim()}
              >
                {processing ? 'Adding...' : 'Add Tag'}
              </button>
            </div>

            <p className={styles.scanHint}>
              Scan an NFC tag with a USB reader, or manually type the UID and press Enter.
            </p>
          </div>

          {/* Recent log */}
          {recentLog.length > 0 && (
            <div className={styles.recentLog}>
              <h3>Recent ({recentLog.length})</h3>
              <div className={styles.logList}>
                {recentLog.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`${styles.logEntry} ${entry.success ? styles.logSuccess : styles.logFailure}`}
                  >
                    <span className={styles.logIcon}>{entry.success ? '✓' : '✗'}</span>
                    <span className={styles.logUid}>{entry.nfc_uid}</span>
                    {!entry.success && <span className={styles.logError}>{entry.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.sessionActions}>
            <button
              type="button"
              className={styles.abandonButton}
              onClick={handleAbandonSession}
            >
              Abandon Session
            </button>
            <button
              type="button"
              className={styles.endButton}
              onClick={handleEndSession}
            >
              End Session
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Start Session UI */}
          {!showStartForm ? (
            <div className={styles.startSection}>
              <button
                type="button"
                className={styles.startButton}
                onClick={() => setShowStartForm(true)}
              >
                Start Bulk Import Session
              </button>
              <p className={styles.startHint}>
                Start a session to rapidly register NFC tags by scanning them.
              </p>
            </div>
          ) : (
            <div className={styles.startForm}>
              <h2>Start Bulk Import Session</h2>
              {startError && <div className={styles.error}>{startError}</div>}

              <form onSubmit={handleStartSession}>
                <label className={styles.formLabel}>
                  Link to Pack (optional)
                  <select
                    className={styles.formSelect}
                    value={selectedPackId}
                    onChange={(e) => setSelectedPackId(e.target.value)}
                    disabled={startSubmitting}
                  >
                    <option value="">No pack - standalone tags</option>
                    {packs.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.pack_code} - {pack.name} ({pack.actual_tag_count || 0}/{pack.tag_count} tags)
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.formLabel}>
                  Notes (optional)
                  <textarea
                    className={styles.formTextarea}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="e.g., Roll #3 from vendor XYZ"
                    rows={2}
                    disabled={startSubmitting}
                  />
                </label>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowStartForm(false)}
                    disabled={startSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={startSubmitting}
                  >
                    {startSubmitting ? 'Starting...' : 'Start Session'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Session History */}
          <div className={styles.historySection}>
            <h2>Recent Sessions</h2>
            {sessionsLoading ? (
              <div className={styles.message}>Loading...</div>
            ) : sessions.length === 0 ? (
              <div className={styles.emptyHistory}>No bulk import sessions yet.</div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Started</th>
                      <th>Pack</th>
                      <th>Status</th>
                      <th>Tags Added</th>
                      <th>Failed</th>
                      <th>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id}>
                        <td>{formatDate(session.started_at)}</td>
                        <td>{session.pack_code || '—'}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[`status_${session.status}`]}`}>
                            {session.status}
                          </span>
                        </td>
                        <td>{session.tags_added}</td>
                        <td>{session.tags_failed}</td>
                        <td>{session.started_by_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminBulkImportPage;
