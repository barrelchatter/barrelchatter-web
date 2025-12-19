import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/client';
import styles from '../styles/AdminTagPackDetailPage.module.scss';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount) {
  if (amount == null) return '—';
  return `$${Number(amount).toFixed(2)}`;
}

function AdminTagPackDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pack, setPack] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // QR modal
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState(null);

  // Add tags modal
  const [showAddTags, setShowAddTags] = useState(false);
  const [addTagsInput, setAddTagsInput] = useState('');
  const [addTagsSubmitting, setAddTagsSubmitting] = useState(false);
  const [addTagsError, setAddTagsError] = useState('');
  const [addTagsResult, setAddTagsResult] = useState(null);

  // Void modal
  const [showVoid, setShowVoid] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const [voidError, setVoidError] = useState('');

  // Assign modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignEmail, setAssignEmail] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');

  async function loadPack() {
    setLoading(true);
    setError('');

    try {
      const res = await api.get(`/v1/admin/tag-packs/${id}`);
      setPack(res.data?.pack || null);
      setTags(res.data?.tags || []);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 404) {
        setError('Tag pack not found');
      } else {
        setError(err?.response?.data?.error || 'Failed to load pack');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPack();
  }, [id]);

  async function handleShowQR() {
    try {
      const res = await api.get(`/v1/admin/tag-packs/${id}/qr-data`);
      setQrData(res.data);
      setShowQR(true);
    } catch (err) {
      console.error(err);
      alert('Failed to get QR data');
    }
  }

  async function handleAddTagsSubmit(e) {
    e.preventDefault();
    setAddTagsSubmitting(true);
    setAddTagsError('');
    setAddTagsResult(null);

    try {
      // Parse UIDs (one per line or comma-separated)
      const uids = addTagsInput
        .split(/[\n,]/)
        .map(uid => uid.trim())
        .filter(uid => uid.length > 0);

      if (uids.length === 0) {
        setAddTagsError('Please enter at least one NFC UID');
        setAddTagsSubmitting(false);
        return;
      }

      const res = await api.post(`/v1/admin/tag-packs/${id}/add-tags`, {
        nfc_uids: uids,
      });

      setAddTagsResult(res.data.summary);
      setAddTagsInput('');
      await loadPack();
    } catch (err) {
      console.error(err);
      setAddTagsError(err?.response?.data?.error || 'Failed to add tags');
    } finally {
      setAddTagsSubmitting(false);
    }
  }

  async function handleRemoveTag(tagId) {
    if (!confirm('Remove this tag from the pack?')) {
      return;
    }

    try {
      await api.post(`/v1/admin/tag-packs/${id}/remove-tags`, {
        tag_ids: [tagId],
      });
      await loadPack();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Failed to remove tag');
    }
  }

  async function handleVoidSubmit(e) {
    e.preventDefault();
    setVoidSubmitting(true);
    setVoidError('');

    try {
      await api.post(`/v1/admin/tag-packs/${id}/void`, {
        reason: voidReason.trim(),
      });

      setShowVoid(false);
      setVoidReason('');
      await loadPack();
    } catch (err) {
      console.error(err);
      setVoidError(err?.response?.data?.error || 'Failed to void pack');
    } finally {
      setVoidSubmitting(false);
    }
  }

  async function handleAssignSubmit(e) {
    e.preventDefault();
    setAssignSubmitting(true);
    setAssignError('');

    try {
      const res = await api.post(`/v1/admin/tag-packs/${id}/assign-to-user`, {
        user_email: assignEmail.trim(),
      });

      alert(`Pack assigned! ${res.data.tags_claimed} tags claimed by ${res.data.user.email}`);
      setShowAssign(false);
      setAssignEmail('');
      await loadPack();
    } catch (err) {
      console.error(err);
      setAssignError(err?.response?.data?.error || 'Failed to assign pack');
    } finally {
      setAssignSubmitting(false);
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'active':
        return styles.statusActive;
      case 'claimed':
        return styles.statusClaimed;
      case 'void':
        return styles.statusVoid;
      case 'unassigned':
        return styles.statusUnassigned;
      default:
        return styles.statusDefault;
    }
  }

  if (loading) {
    return <div className={styles.page}><div className={styles.message}>Loading...</div></div>;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error}</div>
        <Link to="/app/admin/tag-packs" className={styles.backLink}>← Back to Tag Packs</Link>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>Pack not found</div>
        <Link to="/app/admin/tag-packs" className={styles.backLink}>← Back to Tag Packs</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <Link to="/app/admin/tag-packs" className={styles.backLink}>← Back to Tag Packs</Link>
          <h1>{pack.pack_code}</h1>
          <p className={styles.packName}>{pack.name}</p>
        </div>
        <div className={styles.headerActions}>
          {pack.status === 'active' && (
            <>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setShowAddTags(true)}
              >
                Add Tags
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setShowAssign(true)}
              >
                Assign to User
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => setShowVoid(true)}
              >
                Void Pack
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleShowQR}
              >
                View QR Code
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pack Details */}
      <div className={styles.detailsGrid}>
        <div className={styles.detailCard}>
          <h3>Pack Info</h3>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Status</span>
            <span className={`${styles.statusBadge} ${getStatusBadgeClass(pack.status)}`}>
              {pack.status}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Expected Tags</span>
            <span>{pack.tag_count}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Actual Tags</span>
            <span>{tags.length}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Retail Price</span>
            <span>{formatCurrency(pack.retail_price)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Created</span>
            <span>{formatDate(pack.created_at)}</span>
          </div>
          {pack.created_by_name && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Created By</span>
              <span>{pack.created_by_name}</span>
            </div>
          )}
        </div>

        {pack.status === 'claimed' && (
          <div className={styles.detailCard}>
            <h3>Claimed By</h3>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>User</span>
              <span>{pack.claimed_by_name}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Email</span>
              <span>{pack.claimed_by_email}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Claimed At</span>
              <span>{formatDate(pack.claimed_at)}</span>
            </div>
          </div>
        )}

        {pack.status === 'void' && (
          <div className={styles.detailCard}>
            <h3>Void Details</h3>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Reason</span>
              <span>{pack.void_reason}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Voided At</span>
              <span>{formatDate(pack.voided_at)}</span>
            </div>
          </div>
        )}

        {pack.description && (
          <div className={styles.detailCard}>
            <h3>Description</h3>
            <p>{pack.description}</p>
          </div>
        )}

        {pack.notes && (
          <div className={styles.detailCard}>
            <h3>Notes</h3>
            <p>{pack.notes}</p>
          </div>
        )}
      </div>

      {/* Tags Table */}
      <div className={styles.tagsSection}>
        <h2>Tags in Pack ({tags.length})</h2>

        {tags.length === 0 ? (
          <div className={styles.emptyTags}>
            <p>No tags added to this pack yet.</p>
            {pack.status === 'active' && (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setShowAddTags(true)}
              >
                Add Tags
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>NFC UID</th>
                  <th>Status</th>
                  <th>Label</th>
                  <th>Registered To</th>
                  <th>Linked Bottle</th>
                  {pack.status === 'active' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id}>
                    <td className={styles.uidCell}>{tag.nfc_uid}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(tag.status)}`}>
                        {tag.status}
                      </span>
                    </td>
                    <td>{tag.label || '—'}</td>
                    <td>
                      {tag.registered_to_name ? (
                        <div>
                          <div>{tag.registered_to_name}</div>
                          <div className={styles.emailSmall}>{tag.registered_to_email}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td>{tag.bottle_name || '—'}</td>
                    {pack.status === 'active' && (
                      <td>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => handleRemoveTag(tag.id)}
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && qrData && (
        <div className={styles.modalOverlay} onClick={() => setShowQR(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Pack QR Code</h2>
              <button type="button" className={styles.modalClose} onClick={() => setShowQR(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.qrInfo}>
                <div className={styles.qrPackCode}>{qrData.pack_code}</div>
                <div className={styles.qrPackName}>{qrData.name}</div>
                <div className={styles.qrTagCount}>{qrData.tag_count} tags</div>
              </div>

              <div className={styles.qrCodeContainer}>
                <QRCodeSVG
                  value={qrData.claim_url}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              <p className={styles.qrHint}>
                Scan this QR code to claim all tags in this pack.
              </p>

              <div className={styles.qrUrls}>
                <div className={styles.urlRow}>
                  <label>Claim URL (Universal Link):</label>
                  <input
                    type="text"
                    readOnly
                    value={qrData.claim_url}
                    onClick={(e) => e.target.select()}
                  />
                </div>
                <div className={styles.urlRow}>
                  <label>App Deep Link:</label>
                  <input
                    type="text"
                    readOnly
                    value={qrData.app_deep_link}
                    onClick={(e) => e.target.select()}
                  />
                </div>
                <div className={styles.urlRow}>
                  <label>Barcode Data:</label>
                  <input
                    type="text"
                    readOnly
                    value={qrData.barcode_data}
                    onClick={(e) => e.target.select()}
                  />
                </div>
              </div>

              <div className={styles.qrActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    navigator.clipboard.writeText(qrData.claim_url);
                    alert('URL copied to clipboard!');
                  }}
                >
                  Copy URL
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    // Download QR as SVG
                    const svg = document.querySelector(`.${styles.qrCodeContainer} svg`);
                    if (svg) {
                      const svgData = new XMLSerializer().serializeToString(svg);
                      const blob = new Blob([svgData], { type: 'image/svg+xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${qrData.pack_code}-qr.svg`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                >
                  Download QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tags Modal */}
      {showAddTags && (
        <div className={styles.modalOverlay} onClick={() => setShowAddTags(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add Tags to Pack</h2>
              <button type="button" className={styles.modalClose} onClick={() => setShowAddTags(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {addTagsError && <div className={styles.modalError}>{addTagsError}</div>}

              {addTagsResult && (
                <div className={styles.modalSuccess}>
                  Added {addTagsResult.added} tags.
                  {addTagsResult.skipped > 0 && ` Skipped ${addTagsResult.skipped} (not found or already in pack).`}
                </div>
              )}

              <form onSubmit={handleAddTagsSubmit}>
                <label className={styles.modalLabel}>
                  NFC UIDs (one per line or comma-separated)
                  <textarea
                    className={styles.modalTextarea}
                    value={addTagsInput}
                    onChange={(e) => setAddTagsInput(e.target.value)}
                    placeholder="04:A1:B2:C3:D4:E5:F6&#10;04:A2:B3:C4:D5:E6:F7&#10;..."
                    rows={8}
                    disabled={addTagsSubmitting}
                  />
                </label>

                <p className={styles.modalHint}>
                  Tags must already exist in the system. Use Bulk Import to register new tags first.
                </p>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalCancelButton}
                    onClick={() => setShowAddTags(false)}
                    disabled={addTagsSubmitting}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className={styles.modalSubmitButton}
                    disabled={addTagsSubmitting}
                  >
                    {addTagsSubmitting ? 'Adding...' : 'Add Tags'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {showVoid && (
        <div className={styles.modalOverlay} onClick={() => setShowVoid(false)}>
          <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Void Pack</h2>
              <button type="button" className={styles.modalClose} onClick={() => setShowVoid(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.voidWarning}>
                Are you sure you want to void pack <strong>{pack.pack_code}</strong>?
                This action cannot be undone.
              </div>

              {voidError && <div className={styles.modalError}>{voidError}</div>}

              <form onSubmit={handleVoidSubmit}>
                <label className={styles.modalLabel}>
                  Reason *
                  <textarea
                    className={styles.modalTextarea}
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Why is this pack being voided?"
                    rows={3}
                    disabled={voidSubmitting}
                    required
                  />
                </label>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalCancelButton}
                    onClick={() => setShowVoid(false)}
                    disabled={voidSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.dangerConfirmButton}
                    disabled={voidSubmitting}
                  >
                    {voidSubmitting ? 'Voiding...' : 'Void Pack'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <div className={styles.modalOverlay} onClick={() => setShowAssign(false)}>
          <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Assign Pack to User</h2>
              <button type="button" className={styles.modalClose} onClick={() => setShowAssign(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.assignPackInfo}>
                <strong>{pack.pack_code}</strong>
                <span>{pack.name}</span>
                <span>{tags.length} tags</span>
              </div>

              {assignError && <div className={styles.modalError}>{assignError}</div>}

              <form onSubmit={handleAssignSubmit}>
                <label className={styles.modalLabel}>
                  User Email *
                  <input
                    type="email"
                    className={styles.modalInput}
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={assignSubmitting}
                    required
                  />
                </label>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalCancelButton}
                    onClick={() => setShowAssign(false)}
                    disabled={assignSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.modalSubmitButton}
                    disabled={assignSubmitting}
                  >
                    {assignSubmitting ? 'Assigning...' : 'Assign Pack'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTagPackDetailPage;
