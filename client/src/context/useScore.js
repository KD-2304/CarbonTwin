import { useContext } from 'react';
import { ScoreContext } from './scoreContextObject';

export const useScore = () => {
  const context = useContext(ScoreContext);
  if (!context) throw new Error('useScore must be used within ScoreProvider');
  return context;
};
