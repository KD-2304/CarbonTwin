import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CarbonCity from '../components/city/CarbonCity';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { communityAPI } from '../api/axios';
import { Users, Zap, TreePine, Activity } from 'lucide-react';

const cityStates = [
  { range: '< 2,000 kg', label: 'Pristine', desc: 'Blue skies, dense canopy, clean buildings', accent: 'sage' },
  { range: '2,000-3,000 kg', label: 'Moderate', desc: 'Light haze, fewer trees, warm tint', accent: 'teal' },
  { range: '3,000-4,000 kg', label: 'Polluted', desc: 'Gray skyline, smog layer, sparse trees', accent: 'amber' },
  { range: '> 4,000 kg', label: 'Critical', desc: 'Heavy smog, dark buildings, red sky', accent: 'coral' },
];

const accentMap = {
  sage: { bg: 'bg-sage-400/8', border: 'border-sage-400/25', text: 'text-sage-400' },
  teal: { bg: 'bg-teal-400/8', border: 'border-teal-400/25', text: 'text-teal-400' },
  amber: { bg: 'bg-amber-400/8', border: 'border-amber-400/25', text: 'text-amber-400' },
  coral: { bg: 'bg-coral-400/8', border: 'border-coral-400/25', text: 'text-coral-400' },
};

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
  const healthColor = cityHealth > 70 ? 'bg-sage-400' : cityHealth > 40 ? 'bg-amber-400' : 'bg-coral-400';

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
        <div className="hidden sm:block surface-soft px-4 py-3 text-right rounded-xl">
          <p className="meta-label">Data</p>
          <p className="text-sm font-semibold text-sand-100 mt-1">{loading ? 'Loading' : 'Live community stats'}</p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55 }}
          className="surface overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-100/5 px-5 py-4">
            <div>
              <p className="section-title">Live City Simulation</p>
              <p className="text-sm text-sand-500">Buildings, air quality, and canopy react to community emissions.</p>
            </div>
            <span className="rounded-lg border border-sage-400/15 bg-sage-400/6 px-2.5 py-1 text-[10px] font-bold text-sage-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={10} /> {cityHealth}/100 health
            </span>
          </div>
          <div className="relative h-[58vh] min-h-[430px]">
            {/* Screen Reader Accessible Fallback Description */}
            <div className="sr-only" aria-live="polite">
              Interactive 3D simulation of Carbon City. The city is currently in a "{cityStates.find(s => isActiveState(s.label))?.label || 'Moderate'}" state. Current average community emission is {communityScore} kg CO₂ per year, and city health is {cityHealth} out of 100.
            </div>
            <CarbonCity communityScore={communityScore} />
            <div className="absolute inset-x-4 bottom-4 surface-soft p-4 rounded-xl backdrop-blur-lg">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-sand-100">City Health</span>
                <span className={cityHealth > 70 ? 'text-sage-400' : cityHealth > 40 ? 'text-amber-400' : 'text-coral-400'}>
                  <AnimatedNumber value={cityHealth} />/100
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-base-950">
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
            <div className="surface surface-accent-sage stat-card">
              <div className="flex items-center gap-1.5"><Users size={12} className="text-sage-400" /><p className="meta-label">Community average</p></div>
              <p className="mt-3 text-2xl font-extrabold text-sand-100">
                <AnimatedNumber value={communityScore} /> <span className="text-sm font-medium text-sand-500">kg/yr</span>
              </p>
            </div>
            <div className="surface surface-accent-teal stat-card">
              <div className="flex items-center gap-1.5"><Users size={12} className="text-teal-400" /><p className="meta-label">Total users</p></div>
              <p className="mt-3 text-2xl font-extrabold text-teal-400">
                <AnimatedNumber value={stats?.totalUsers || 0} />
              </p>
            </div>
            <div className="surface surface-accent-amber stat-card">
              <div className="flex items-center gap-1.5"><TreePine size={12} className="text-sage-400" /><p className="meta-label">Saved this week</p></div>
              <p className="mt-3 text-2xl font-extrabold text-sage-400">
                <AnimatedNumber value={stats?.weeklyCO2Saved || 0} decimals={1} /> <span className="text-sm font-medium text-sand-500">kg</span>
              </p>
            </div>
          </div>

          <section className="surface p-5">
            <p className="section-title mb-4">City State Legend</p>
            <div className="space-y-2.5">
              {cityStates.map((state) => {
                const active = isActiveState(state.label);
                const colors = accentMap[state.accent];
                return (
                  <div
                    key={state.label}
                    className={`rounded-xl border p-3.5 transition-all ${
                      active
                        ? `${colors.border} ${colors.bg}`
                        : 'border-sand-100/5 bg-sand-100/[0.01]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-sm font-semibold ${active ? colors.text : 'text-sand-200'}`}>{state.label}</p>
                      <span className="text-[10px] text-sand-500 font-mono">{state.range}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-sand-500">{state.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
