import { useState, useCallback, useMemo, useEffect } from 'react';
import { userAPI, actionsAPI, quizAPI } from '../api/axios';
import { useAuth } from './useAuth';
import { ScoreContext } from './scoreContextObject';
import { ACTION_OPTIONS as STATIC_ACTION_OPTIONS } from '../utils/emissionFactors';

export function ScoreProvider({ children }) {
  const { refreshUser } = useAuth();
  const [scoreData, setScoreData] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [scoreAnimating, setScoreAnimating] = useState(false);
  const [lastDelta, setLastDelta] = useState(0);
  const [emissionFactors, setEmissionFactors] = useState(null);

  const fetchEmissionFactors = useCallback(async () => {
    try {
      const { data } = await quizAPI.getEmissionFactors();
      setEmissionFactors(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch emission factors:', err);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(fetchEmissionFactors);
  }, [fetchEmissionFactors]);

  const actionOptions = useMemo(() => {
    const staticOptions = JSON.parse(JSON.stringify(STATIC_ACTION_OPTIONS));
    if (!emissionFactors || !emissionFactors.actions) {
      return staticOptions;
    }
    Object.keys(staticOptions).forEach(category => {
      staticOptions[category] = staticOptions[category].map(option => {
        const backendDelta = emissionFactors.actions[category]?.[option.id];
        if (backendDelta !== undefined && backendDelta !== null) {
          return { ...option, delta: backendDelta };
        }
        return option;
      });
    });
    return staticOptions;
  }, [emissionFactors]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data } = await userAPI.getDashboardSummary();
      setScoreData(data.profile);
      setActionHistory(data.history);
      setSummary(data.summary);
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  }, []);

  const fetchScore = useCallback(async () => {
    const data = await fetchDashboardData();
    return data?.profile;
  }, [fetchDashboardData]);

  const fetchHistory = useCallback(async () => {
    const data = await fetchDashboardData();
    return data?.history;
  }, [fetchDashboardData]);

  const fetchSummary = useCallback(async () => {
    const data = await fetchDashboardData();
    return data?.summary;
  }, [fetchDashboardData]);

  const logAction = useCallback(async (actionData) => {
    try {
      const { data } = await actionsAPI.log(actionData);
      setLastDelta(data.action.co2Delta);
      setScoreAnimating(true);
      setTimeout(() => setScoreAnimating(false), 1500);

      // Use enriched response to update state directly — no extra API calls needed
      if (data.updatedProfile) {
        setScoreData(data.updatedProfile);
      }
      if (data.summary) {
        setSummary(data.summary);
      }
      // Sync AuthContext user state
      await refreshUser();
      return data;
    } catch (error) {
      console.error('Failed to log action:', error);
      throw error;
    }
  }, [refreshUser]);

  return (
    <ScoreContext.Provider value={{
      scoreData,
      actionHistory,
      summary,
      scoreAnimating,
      lastDelta,
      actionOptions,
      fetchScore,
      fetchHistory,
      fetchSummary,
      fetchDashboardData,
      logAction,
    }}>
      {children}
    </ScoreContext.Provider>
  );
}
