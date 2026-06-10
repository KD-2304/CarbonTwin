import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CarbonCity from '../components/city/CarbonCity';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { communityAPI } from '../api/axios';

const cityStates = [
  { range: '< 2,000 kg', label: 'Pristine', desc: 'Blue skies, dense canopy, clean buildings', tone: 'leaf' },
  { range: '2,000-3,000 kg', label: 'Moderate', desc: 'Light haze, fewer trees, warm tint', tone: 'aqua' },
  { range: '3,000-4,000 kg', label: 'Polluted', desc: 'Gray skyline, smog layer, sparse trees', tone: 'sun' },
  { range: '> 4,000 kg', label: 'Critical', desc: 'Heavy smog, dark buildings, red sky', tone: 'rose' },
];

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
  const cityHealth = stats?.cityHealth || 50;
  const healthColor = cityHealth > 70 ? 'bg-leaf-500' : cityHealth > 40 ? 'bg-sun-400' : 'bg-rose-400';

  const isActiveState = (label) => (
    communityScore < 2000 && label === 'Pristine'
  ) || (
    communityScore >= 2000 && communityScore < 3000 && label === 'Moderate'
  ) || (
    communityScore >= 3000 && communityScore < 4000 && label === 'Polluted'
  ) || (
    communityScore >= 4000 && label === 'Critical'
  );

  return (
    <div className="page-container">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <div>
          <p className="eyebrow">Community</p>
          <h1 className="page-title">Carbon City</h1>
          <p className="page-subtitle">A shared 3D city shaped by the community average footprint.</p>
        </div>
        <div className="hidden sm:block surface-soft px-4 py-3 text-right">
          <p className="meta-label">Data</p>
          <p className="text-sm font-semibold text-white">{loading ? 'Loading' : 'Live community stats'}</p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55 }}
          className="surface overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
            <div>
              <p className="section-title">Live City Simulation</p>
              <p className="text-sm text-mist-500">Buildings, air quality, and canopy react to community emissions.</p>
            </div>
            <span className="rounded-md border border-leaf-400/20 bg-leaf-400/8 px-2.5 py-1 text-xs font-bold text-leaf-400">
              {cityHealth}/100 health
            </span>
          </div>
          <div className="relative h-[58vh] min-h-[430px]">
            <CarbonCity communityScore={communityScore} />
            <div className="absolute inset-x-4 bottom-4 surface-soft p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">City Health</span>
                <span className={cityHealth > 70 ? 'text-leaf-400' : cityHealth > 40 ? 'text-sun-400' : 'text-rose-400'}>
                  <AnimatedNumber value={cityHealth} />/100
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#07110f]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cityHealth}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className={`h-full rounded-full ${healthColor}`}
                />
              </div>
            </div>
          </div>
        </motion.section>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="surface stat-card">
              <p className="meta-label">Community average</p>
              <p className="mt-3 text-2xl font-black text-white">
                <AnimatedNumber value={communityScore} /> <span className="text-sm font-medium text-mist-500">kg/yr</span>
              </p>
            </div>
            <div className="surface stat-card">
              <p className="meta-label">Total users</p>
              <p className="mt-3 text-2xl font-black text-aqua-400">
                <AnimatedNumber value={stats?.totalUsers || 0} />
              </p>
            </div>
            <div className="surface stat-card">
              <p className="meta-label">Saved this week</p>
              <p className="mt-3 text-2xl font-black text-leaf-400">
                <AnimatedNumber value={stats?.weeklyCO2Saved || 0} decimals={1} /> <span className="text-sm font-medium text-mist-500">kg</span>
              </p>
            </div>
          </div>

          <section className="surface p-5">
            <p className="section-title mb-4">City State Legend</p>
            <div className="space-y-3">
              {cityStates.map((state) => (
                <div
                  key={state.label}
                  className={`rounded-lg border p-3 ${
                    isActiveState(state.label)
                      ? 'border-leaf-400/35 bg-leaf-400/8'
                      : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{state.label}</p>
                    <span className="text-xs text-mist-500">{state.range}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-mist-500">{state.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
