import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CarbonCity from '../components/city/CarbonCity';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { communityAPI } from '../api/axios';

export default function City() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await communityAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch community stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const communityScore = stats?.communityAverage || 3500;

  const healthColor = (stats?.cityHealth || 50) > 70 ? 'bg-green-500' :
    (stats?.cityHealth || 50) > 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="page-container pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          🏙️ <span>Carbon City</span>
        </h1>
        <p className="text-gray-400 mt-1">The shared city shaped by everyone's carbon footprint</p>
      </motion.div>

      {/* City canvas */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="glass-card overflow-hidden relative"
        style={{ height: '55vh', minHeight: '400px' }}
      >
        <CarbonCity communityScore={communityScore} />

        {/* Stats overlay */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-3 pointer-events-none">
          <div className="glass-card px-4 py-3 pointer-events-auto">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Community Average</p>
            <p className="text-xl font-bold text-white">
              <AnimatedNumber value={communityScore} /> <span className="text-sm text-gray-500">kg/yr</span>
            </p>
          </div>

          <div className="glass-card px-4 py-3 pointer-events-auto">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Users</p>
            <p className="text-xl font-bold text-cyan-400">
              <AnimatedNumber value={stats?.totalUsers || 0} />
            </p>
          </div>

          <div className="glass-card px-4 py-3 pointer-events-auto">
            <p className="text-xs text-gray-400 uppercase tracking-wider">CO₂ Saved This Week</p>
            <p className="text-xl font-bold text-green-400">
              <AnimatedNumber value={stats?.weeklyCO2Saved || 0} decimals={1} /> <span className="text-sm text-gray-500">kg</span>
            </p>
          </div>
        </div>

        {/* City Health meter */}
        <div className="absolute bottom-4 left-4 right-4 glass-card p-3 pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">City Health</span>
            <span className="text-sm font-bold" style={{
              color: (stats?.cityHealth || 50) > 70 ? '#10b981' :
                     (stats?.cityHealth || 50) > 40 ? '#f59e0b' : '#ef4444'
            }}>
              <AnimatedNumber value={stats?.cityHealth || 50} />/100
            </span>
          </div>
          <div className="h-3 rounded-full bg-[#1f2937] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats?.cityHealth || 50}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${healthColor}`}
            />
          </div>
        </div>
      </motion.div>

      {/* City state description */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-5 glass-card p-5"
      >
        <h3 className="text-sm font-medium text-gray-300 mb-3">City State Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { range: '< 2,000 kg', label: 'Pristine', desc: 'Blue skies, green canopy, glass buildings', icon: '🌿', color: 'green' },
            { range: '2,000-3,000 kg', label: 'Moderate', desc: 'Slight haze, fewer trees, yellow tint', icon: '🌤️', color: 'yellow' },
            { range: '3,000-4,000 kg', label: 'Polluted', desc: 'Gray buildings, smog layer, sparse trees', icon: '🌫️', color: 'amber' },
            { range: '> 4,000 kg', label: 'Critical', desc: 'Heavy smog, dark buildings, red sky', icon: '🏭', color: 'red' },
          ].map(state => (
            <div key={state.label} className={`p-3 rounded-xl border ${
              communityScore < 2000 && state.label === 'Pristine' ? 'border-green-500/30 bg-green-500/5' :
              communityScore >= 2000 && communityScore < 3000 && state.label === 'Moderate' ? 'border-yellow-500/30 bg-yellow-500/5' :
              communityScore >= 3000 && communityScore < 4000 && state.label === 'Polluted' ? 'border-amber-500/30 bg-amber-500/5' :
              communityScore >= 4000 && state.label === 'Critical' ? 'border-red-500/30 bg-red-500/5' :
              'border-[#1f2937]'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span>{state.icon}</span>
                <span className="text-white text-sm font-medium">{state.label}</span>
              </div>
              <p className="text-xs text-gray-500">{state.range}</p>
              <p className="text-xs text-gray-400 mt-1">{state.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
