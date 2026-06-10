import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useScore } from '../context/ScoreContext';
import CarbonTwin from '../components/twin/CarbonTwin';
import ScoreBreakdown from '../components/charts/ScoreBreakdown';
import ScoreHistory from '../components/charts/ScoreHistory';
import ActionLogger from '../components/ActionLogger';
import AiCoach from '../components/AiCoach';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { getScoreColor, getScoreLabel } from '../utils/scoreCalculator';
import { BENCHMARKS } from '../utils/emissionFactors';

export default function Dashboard() {
  const { user } = useAuth();
  const { scoreData, scoreAnimating, fetchScore, fetchHistory, fetchSummary, summary } = useScore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([fetchScore(), fetchHistory(30), fetchSummary()])
      .then(() => setLoaded(true));
  }, []);

  const score = user?.currentScore || scoreData?.currentScore || 0;
  const breakdown = user?.scoreBreakdown || scoreData?.scoreBreakdown || {};
  const streak = user?.streak || 0;
  const snapshots = scoreData?.dailySnapshots || user?.dailySnapshots || [];
  const streakStatus = user?.streakStatus;
  const weeklyDelta = summary?.totalDelta || 0;

  const fadeIn = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45 }
  };

  return (
    <div className="page-container">
      <motion.header {...fadeIn} className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="page-title">
            Welcome back, <span className="text-leaf-400">{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="page-subtitle">Your footprint, daily actions, trend line, and AI guidance in one focused workspace.</p>
        </div>
        <div className="hidden md:block surface-soft px-4 py-3 text-right">
          <p className="meta-label">Status</p>
          <p className="text-sm font-semibold text-white">{loaded ? 'Synced just now' : 'Syncing data'}</p>
        </div>
      </motion.header>

      {streakStatus?.streakAtRisk && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="surface-soft mb-5 flex items-start gap-3 border-sun-400/30 bg-sun-400/8 p-4"
        >
          <span className="mt-1 h-2 w-2 rounded-full bg-sun-400" />
          <div>
            <p className="text-sm font-bold text-sun-400">Streak at risk</p>
            <p className="text-sm text-[#a9bbb5]">
              It has been {streakStatus.hoursSinceLastLog}hrs since your last log. Add an action to keep your {streak}-day streak.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <motion.section {...fadeIn} transition={{ delay: 0.05 }} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="surface stat-card md:col-span-2">
              <p className="meta-label">Annual footprint</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="metric-value" style={{ color: getScoreColor(score) }}>
                  <AnimatedNumber value={score} />
                </span>
                <span className="pb-1 text-sm text-mist-500">kg CO2/yr</span>
              </div>
              <p className="mt-2 text-sm font-semibold" style={{ color: getScoreColor(score) }}>
                {getScoreLabel(score)}
              </p>
            </div>

            <div className="surface stat-card">
              <p className="meta-label">Streak</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="metric-value text-sun-400">
                  <AnimatedNumber value={streak} />
                </span>
                <span className="pb-1 text-sm text-mist-500">days</span>
              </div>
              <p className="mt-2 text-sm text-mist-500">Consistency score</p>
            </div>

            <div className="surface stat-card">
              <p className="meta-label">This week</p>
              <div className="mt-3 flex items-end gap-2">
                <span className={`metric-value ${weeklyDelta <= 0 ? 'text-leaf-400' : 'text-rose-400'}`}>
                  <AnimatedNumber value={Math.abs(weeklyDelta)} decimals={1} />
                </span>
                <span className="pb-1 text-sm text-mist-500">kg {weeklyDelta <= 0 ? 'saved' : 'added'}</span>
              </div>
              <p className="mt-2 text-sm text-mist-500">{summary?.totalActions || 0} actions logged</p>
            </div>
          </motion.section>

          <motion.section {...fadeIn} transition={{ delay: 0.1 }} className="surface overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
              <div>
                <p className="section-title">Carbon Twin</p>
                <p className="text-sm text-mist-500">Interactive reflection of your current footprint.</p>
              </div>
              <span className="rounded-md border border-aqua-400/20 bg-aqua-400/8 px-2.5 py-1 text-xs font-bold text-aqua-400">3D Live</span>
            </div>
            <div className="h-[360px] md:h-[430px]">
              <CarbonTwin score={score} animating={scoreAnimating} />
            </div>
          </motion.section>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.section {...fadeIn} transition={{ delay: 0.15 }} className="surface p-5">
              <p className="section-title mb-4">Benchmark Position</p>
              <div className="space-y-4">
                {Object.entries(BENCHMARKS).slice(0, 3).map(([key, bench]) => {
                  const pct = Math.min(100, (score / bench.value) * 100);
                  const isBelow = score < bench.value;
                  return (
                    <div key={key}>
                      <div className="mb-2 flex justify-between gap-3 text-xs">
                        <span className="text-mist-500">{bench.label}: {bench.value.toLocaleString()} kg</span>
                        <span className={isBelow ? 'text-leaf-400' : 'text-sun-400'}>
                          {isBelow ? `${Math.round(bench.value - score)} below` : `${Math.round(score - bench.value)} above`}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#07110f]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.4 }}
                          className={`h-full rounded-full ${isBelow ? 'bg-leaf-500' : 'bg-sun-400'}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>

            <motion.section {...fadeIn} transition={{ delay: 0.2 }} className="surface p-5">
              <p className="section-title mb-4">Score Breakdown</p>
              <ScoreBreakdown breakdown={breakdown} />
            </motion.section>
          </div>

          <motion.section {...fadeIn} transition={{ delay: 0.25 }} className="surface p-5">
            <p className="section-title mb-4">30-Day Trend</p>
            <ScoreHistory snapshots={snapshots} />
          </motion.section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
            <ActionLogger />
          </motion.div>
          <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
            <AiCoach userData={user} />
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
