import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { communityAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getScoreColor } from '../utils/scoreCalculator';
import AnimatedNumber from '../components/ui/AnimatedNumber';

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reducers');
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await communityAPI.getLeaderboard();
      setData(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeList = activeTab === 'reducers' ? data?.topReducers : data?.topStreaks;

  return (
    <div className="page-container pb-24 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          🏆 <span>Leaderboard</span>
        </h1>
        <p className="text-gray-400 mt-1">See who's making the biggest impact</p>
      </motion.div>

      {/* User rank card */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 mb-5 flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
            #{data.userRank}
          </div>
          <div>
            <p className="text-white font-semibold">Your Rank</p>
            <p className="text-gray-400 text-sm">Out of {data.totalUsers} users</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-bold" style={{ color: getScoreColor(user?.currentScore || 0) }}>
              <AnimatedNumber value={user?.currentScore || 0} /> <span className="text-sm text-gray-500">kg/yr</span>
            </p>
            <p className="text-xs text-gray-500">🔥 {user?.streak || 0} day streak</p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setActiveTab('reducers')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'reducers'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-[#1f2937]/50 text-gray-400 border border-transparent hover:text-white'
          }`}
        >
          🌱 Top Reducers
        </button>
        <button
          onClick={() => setActiveTab('streaks')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'streaks'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-[#1f2937]/50 text-gray-400 border border-transparent hover:text-white'
          }`}
        >
          🔥 Top Streaks
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1f2937]" />
                <div className="flex-1">
                  <div className="h-4 bg-[#1f2937] rounded w-1/3 mb-2" />
                  <div className="h-3 bg-[#1f2937] rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard list */}
      {!loading && activeList && (
        <div className="space-y-2">
          {activeList.map((entry, index) => {
            const isCurrentUser = entry.id === user?.id;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-card p-4 flex items-center gap-4 ${
                  isCurrentUser ? 'border-green-500/30 bg-green-500/5' : ''
                }`}
              >
                {/* Rank */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index < 3 ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400' : 'bg-[#1f2937] text-gray-400'
                }`}>
                  {medal || `#${index + 1}`}
                </div>

                {/* Avatar dot + name */}
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getScoreColor(entry.currentScore) }}
                  />
                  <div>
                    <p className={`font-medium text-sm ${isCurrentUser ? 'text-green-400' : 'text-white'}`}>
                      {entry.name} {isCurrentUser && '(You)'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.currentScore.toLocaleString()} kg CO₂/yr
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  {activeTab === 'reducers' ? (
                    <p className={`text-sm font-mono font-medium ${entry.weeklyDelta <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.weeklyDelta <= 0 ? '↓' : '↑'} {Math.abs(entry.weeklyDelta).toFixed(1)} kg
                    </p>
                  ) : (
                    <p className="text-sm font-mono font-medium text-amber-400">
                      🔥 {entry.streak} days
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && (!activeList || activeList.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">🏆</p>
          <p>No leaderboard data yet. Start logging actions!</p>
        </div>
      )}
    </div>
  );
}
