import { createContext, useContext, useState, useCallback } from 'react';
import { userAPI, actionsAPI } from '../api/axios';
import { useAuth } from './AuthContext';

const ScoreContext = createContext(null);

export function ScoreProvider({ children }) {
  const { refreshUser } = useAuth();
  const [scoreData, setScoreData] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [scoreAnimating, setScoreAnimating] = useState(false);
  const [lastDelta, setLastDelta] = useState(0);

  const fetchScore = useCallback(async () => {
    try {
      const { data } = await userAPI.getScore();
      setScoreData(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch score:', error);
    }
  }, []);

  const fetchHistory = useCallback(async (days = 7) => {
    try {
      const { data } = await actionsAPI.getHistory(days);
      setActionHistory(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await actionsAPI.getSummary();
      setSummary(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, []);

  const logAction = useCallback(async (actionData) => {
    try {
      const { data } = await actionsAPI.log(actionData);
      setLastDelta(data.action.co2Delta);
      setScoreAnimating(true);
      setTimeout(() => setScoreAnimating(false), 1500);

      // Refresh score and history
      await Promise.all([fetchScore(), fetchHistory(), fetchSummary(), refreshUser()]);
      return data;
    } catch (error) {
      console.error('Failed to log action:', error);
      throw error;
    }
  }, [fetchScore, fetchHistory, fetchSummary, refreshUser]);

  return (
    <ScoreContext.Provider value={{
      scoreData,
      actionHistory,
      summary,
      scoreAnimating,
      lastDelta,
      fetchScore,
      fetchHistory,
      fetchSummary,
      logAction,
    }}>
      {children}
    </ScoreContext.Provider>
  );
}

export const useScore = () => {
  const context = useContext(ScoreContext);
  if (!context) throw new Error('useScore must be used within ScoreProvider');
  return context;
};
