import React, { useState } from 'react';
import { EVENT_TYPES, getEventIcon } from '../constants/bottleOptions';
import styles from '../styles/EventTimeline.module.scss';

/**
 * EventTimeline - Display and add inventory lifecycle events
 * 
 * Props:
 *   events: Array of event objects
 *   onAddEvent: (event) => Promise<void>
 *   loading: boolean
 */
function EventTimeline({ events = [], onAddEvent, loading = false }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_type: 'opened',
    event_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newEvent.event_type) return;

    setSubmitting(true);
    try {
      await onAddEvent({
        event_type: newEvent.event_type,
        event_date: newEvent.event_date || new Date().toISOString(),
        notes: newEvent.notes.trim() || null,
      });
      setNewEvent({
        event_type: 'opened',
        event_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to add event:', err);
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  function getEventLabel(type) {
    const event = EVENT_TYPES.find((e) => e.value === type);
    return event ? event.label : type;
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.event_date || b.created_at) - new Date(a.event_date || a.created_at)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Bottle Timeline</h3>
        {onAddEvent && (
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Event'}
          </button>
        )}
      </div>

      {showAddForm && (
        <form className={styles.addForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              Event Type
              <select
                className={styles.formSelect}
                value={newEvent.event_type}
                onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.formLabel}>
              Date
              <input
                type="date"
                className={styles.formInput}
                value={newEvent.event_date}
                onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
              />
            </label>
          </div>

          <label className={styles.formLabel}>
            Notes (optional)
            <textarea
              className={styles.formTextarea}
              value={newEvent.notes}
              onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
              placeholder="Add details about this event..."
              rows={2}
            />
          </label>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setShowAddForm(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Event'}
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className={styles.loading}>Loading timeline...</div>
      )}

      {!loading && sortedEvents.length === 0 && (
        <div className={styles.empty}>
          <p>No events recorded yet.</p>
          <p className={styles.emptyHint}>
            Track important moments like opening, sharing, or finishing this bottle.
          </p>
        </div>
      )}

      {!loading && sortedEvents.length > 0 && (
        <div className={styles.timeline}>
          {sortedEvents.map((event, index) => (
            <div key={event.id || index} className={styles.event}>
              <div className={styles.eventIcon}>
                {getEventIcon(event.event_type)}
              </div>
              <div className={styles.eventLine} />
              <div className={styles.eventContent}>
                <div className={styles.eventHeader}>
                  <span className={styles.eventType}>
                    {getEventLabel(event.event_type)}
                  </span>
                  <span className={styles.eventDate}>
                    {formatDate(event.event_date || event.created_at)}
                    {formatTime(event.event_date || event.created_at) && (
                      <span className={styles.eventTime}>
                        {' '}at {formatTime(event.event_date || event.created_at)}
                      </span>
                    )}
                  </span>
                </div>
                {event.notes && (
                  <p className={styles.eventNotes}>{event.notes}</p>
                )}
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className={styles.eventMeta}>
                    {event.metadata.participants && (
                      <span>With: {event.metadata.participants.join(', ')}</span>
                    )}
                    {event.metadata.occasion && (
                      <span>Occasion: {event.metadata.occasion}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventTimeline;
