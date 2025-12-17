import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

/**
 * Hook to fetch pricing data for a bottle
 * @param {string} bottleId - UUID of the bottle
 * @param {object} options - Optional configuration
 * @param {string} options.state - Filter by state
 * @param {number} options.months - Time range in months (default 12)
 * @param {number} options.minSamples - Minimum samples required (default 3)
 */
export function usePricing(bottleId, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { state, months = 12, minSamples = 3 } = options;

  const fetchPricing = useCallback(async () => {
    if (!bottleId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      if (months) params.append('months', months);
      if (minSamples) params.append('min_samples', minSamples);

      const response = await api.get(`/v1/pricing/bottles/${bottleId}?${params}`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch pricing data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [bottleId, state, months, minSamples]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  return { data, loading, error, refetch: fetchPricing };
}

/**
 * Hook to fetch regional pricing breakdown
 * @param {string} bottleId - UUID of the bottle
 */
export function useRegionalPricing(bottleId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bottleId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/v1/pricing/bottles/${bottleId}?months=12`);
        setData(response.data?.regional_breakdown || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch regional pricing');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bottleId]);

  return { data, loading, error };
}

/**
 * Hook to fetch price trends for a bottle
 * @param {string} bottleId - UUID of the bottle
 */
export function usePriceTrends(bottleId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bottleId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/v1/pricing/bottles/${bottleId}?months=24`);
        setData(response.data?.price_trend || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch price trends');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bottleId]);

  return { data, loading, error };
}

/**
 * Hook to fetch deals (bottles below average)
 * @param {object} options - Filter options
 */
export function useDeals(options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { state, minDiscountPercent = 10, limit = 20 } = options;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (state) params.append('state', state);
        params.append('min_discount_percent', minDiscountPercent);
        params.append('limit', limit);

        const response = await api.get(`/v1/pricing/deals?${params}`);
        setData(response.data?.deals || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch deals');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [state, minDiscountPercent, limit]);

  return { data, loading, error };
}

export default usePricing;
