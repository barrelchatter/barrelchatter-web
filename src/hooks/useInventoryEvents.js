import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * useInventoryEvents - Fetch and manage inventory lifecycle events
 * 
 * @param {string} inventoryId - The inventory item ID
 * @returns {object} { events, loading, error, addEvent, refresh }
 */
function useInventoryEvents(inventoryId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    if (!inventoryId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/v1/inventory/${inventoryId}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events || data || []);
    } catch (err) {
      console.error('Error fetching inventory events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [inventoryId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = useCallback(async (eventData) => {
    if (!inventoryId) return;

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/v1/inventory/${inventoryId}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to add event');
    }

    const newEvent = await response.json();
    setEvents((prev) => [newEvent, ...prev]);
    return newEvent;
  }, [inventoryId]);

  return {
    events,
    loading,
    error,
    addEvent,
    refresh: fetchEvents,
  };
}

export default useInventoryEvents;
