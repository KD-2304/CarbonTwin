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
    <div className="page-container">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <div>
          <p className="eyebrow">Community Rank</p>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-subtitle">Compare reducers and streak leaders across the Carbon Twin community.</p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
          {data && (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface p-5">
              <p className="meta-label">Your rank</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-leaf-500 to-aqua-400 text-xl font-black text-white">
                  #{data.userRank}
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{user?.name || 'You'}</p>
                  <p className="text-sm text-mist-500">Out of {data.totalUsers} users</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="surface-soft p-3">
                  <p className="meta-label">Footprint</p>
                  <p className="mt-2 text-lg font-black" style={{ color: getScoreColor(user?.currentScore || 0) }}>
                    <AnimatedNumber value={user?.currentScore || 0} />
                  </p>
                  <p className="text-xs text-mist-500">kg/yr</p>
                </div>
                <div className="surface-soft p-3">
                  <p className="meta-label">Streak</p>
                  <p className="mt-2 text-lg font-black text-sun-400">{user?.streak || 0}</p>
                  <p className="text-xs text-mist-500">days</p>
                </div>
              </div>
            </motion.section>
          )}

          <section className="surface p-5">
            <p className="section-title mb-4">View</p>
            <div className="segmented grid grid-cols-2">
              <button
                onClick={() => setActiveTab('reducers')}
                className={`px-4 py-2 text-sm font-bold ${activeTab === 'reducers' ? 'bg-leaf-500/14 text-leaf-400' : 'text-mist-500 hover:text-white'}`}
              >
                Reducers
              </button>
              <button
                onClick={() => setActiveTab('streaks')}
                className={`px-4 py-2 text-sm font-bold ${activeTab === 'streaks' ? 'bg-sun-400/14 text-sun-400' : 'text-mist-500 hover:text-white'}`}
              >
                Streaks
              </button>
            </div>
          </section>
        </aside>

        <section className="surface overflow-hidden">
          <div className="border-b border-white/8 px-5 py-4">
            <p className="section-title">{activeTab === 'reducers' ? 'Top Reducers' : 'Top Streaks'}</p>
            <p className="text-sm text-mist-500">Ranked by {activeTab === 'reducers' ? 'weekly CO2 reduction' : 'daily logging streak'}.</p>
          </div>

          {loading && (
            <div className="space-y-3 p-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="surface-soft animate-pulse p-4">
                  <div className="mb-2 h-4 w-1/3 rounded bg-white/10" />
                  <div className="h-3 w-1/4 rounded bg-white/10" />
                </div>
              ))}
            </div>
          )}

          {!loading && activeList && (
            <div className="divide-y divide-white/8">
              {activeList.map((entry, index) => {
                const isCurrentUser = entry.id === user?.id;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 ${
                      isCurrentUser ? 'bg-leaf-500/7' : ''
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-black ${
                      index < 3 ? 'bg-sun-400/12 text-sun-400' : 'bg-white/[0.04] text-mist-500'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-bold ${isCurrentUser ? 'text-leaf-400' : 'text-white'}`}>
                        {entry.name} {isCurrentUser && '(You)'}
                      </p>
                      <p className="text-xs text-mist-500">{entry.currentScore.toLocaleString()} kg CO2/yr</p>
                    </div>
                    <div className="text-right">
                      {activeTab === 'reducers' ? (
                        <p className={`text-sm font-mono font-bold ${entry.weeklyDelta <= 0 ? 'text-leaf-400' : 'text-rose-400'}`}>
                          {entry.weeklyDelta <= 0 ? '-' : '+'}{Math.abs(entry.weeklyDelta).toFixed(1)} kg
                        </p>
                      ) : (
                        <p className="text-sm font-mono font-bold text-sun-400">{entry.streak} days</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!loading && (!activeList || activeList.length === 0) && (
            <div className="p-12 text-center text-mist-500">
              <p>No leaderboard data yet. Start logging actions to appear here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
