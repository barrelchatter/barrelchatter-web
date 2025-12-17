import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * useInventoryCondition - Fetch and manage inventory condition history
 * 
 * @param {string} inventoryId - The inventory item ID
 * @returns {object} { conditionLog, loading, error, updateCondition, refresh }
 */
function useInventoryCondition(inventoryId) {
  const [conditionLog, setConditionLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConditionLog = useCallback(async () => {
    if (!inventoryId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/v1/inventory/${inventoryId}/condition-log`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // 404 is okay - just means no condition history yet
        if (response.status === 404) {
          setConditionLog([]);
          return;
        }
        throw new Error('Failed to fetch condition log');
      }

      const data = await response.json();
      setConditionLog(data.log || data || []);
    } catch (err) {
      console.error('Error fetching condition log:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [inventoryId]);

  useEffect(() => {
    fetchConditionLog();
  }, [fetchConditionLog]);

  /**
   * Update condition and log the change
   */
  const updateCondition = useCallback(async (conditionData) => {
    if (!inventoryId) return;

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/v1/inventory/${inventoryId}/condition`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conditionData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to update condition');
    }

    const result = await response.json();
    
    // Refresh log to get the new entry
    await fetchConditionLog();
    
    return result;
  }, [inventoryId, fetchConditionLog]);

  return {
    conditionLog,
    loading,
    error,
    updateCondition,
    refresh: fetchConditionLog,
  };
}

export default useInventoryCondition;
