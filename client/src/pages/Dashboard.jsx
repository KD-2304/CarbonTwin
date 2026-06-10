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

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="page-container pb-24 md:pb-8">
      {/* Header */}
      <motion.div {...fadeIn} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Welcome back, <span className="text-green-400">{user?.name?.split(' ')[0] || 'User'}</span>
        </h1>
        <p className="text-gray-400 mt-1">Here's your carbon footprint overview</p>
      </motion.div>

      {/* Streak warning */}
      {streakStatus?.streakAtRisk && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3"
        >
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-amber-400 text-sm font-medium">Streak at risk!</p>
            <p className="text-gray-400 text-xs">
              It's been {streakStatus.hoursSinceLastLog}hrs since your last log. Log an action to keep your {streak}-day streak!
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — Twin + Score */}
        <div className="lg:col-span-2 space-y-5">
          {/* Score cards row */}
          <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Current score */}
            <div className="glass-card p-4 col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Annual Footprint</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold" style={{ color: getScoreColor(score) }}>
                  <AnimatedNumber value={score} />
                </span>
                <span className="text-gray-500 text-sm">kg CO₂/yr</span>
              </div>
              <p className="text-xs mt-1" style={{ color: getScoreColor(score) }}>
                {getScoreLabel(score)}
              </p>
            </div>

            {/* Streak */}
            <div className="glass-card p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Streak</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-amber-400">
                  <AnimatedNumber value={streak} />
                </span>
                <span className="text-gray-500 text-xs">days</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">🔥 Keep it up!</p>
            </div>

            {/* Weekly impact */}
            <div className="glass-card p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">This Week</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${(summary?.totalDelta || 0) <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <AnimatedNumber value={Math.abs(summary?.totalDelta || 0)} decimals={1} />
                </span>
                <span className="text-gray-500 text-xs">kg {(summary?.totalDelta || 0) <= 0 ? 'saved' : 'added'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{summary?.totalActions || 0} actions logged</p>
            </div>
          </motion.div>

          {/* Carbon Twin */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                🧬 <span>Your Carbon Twin</span>
              </h2>
              <span className="text-xs text-gray-500 px-2 py-1 rounded-lg bg-[#1f2937]">3D Interactive</span>
            </div>
            <div className="h-[350px] rounded-xl overflow-hidden">
              <CarbonTwin score={score} animating={scoreAnimating} />
            </div>
          </motion.div>

          {/* Comparison with benchmarks */}
          <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="glass-card p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4">How you compare</h3>
            <div className="space-y-3">
              {Object.entries(BENCHMARKS).slice(0, 3).map(([key, bench]) => {
                const pct = Math.min(100, (score / bench.value) * 100);
                const isBelow = score < bench.value;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{bench.label}: {bench.value.toLocaleString()} kg</span>
                      <span className={isBelow ? 'text-green-400' : 'text-amber-400'}>
                        {isBelow ? `${Math.round(bench.value - score)} below ✓` : `${Math.round(score - bench.value)} above`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#1f2937] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full rounded-full ${isBelow ? 'bg-green-500' : 'bg-amber-500'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="glass-card p-5">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Score Breakdown</h3>
              <ScoreBreakdown breakdown={breakdown} />
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.5 }} className="glass-card p-5">
              <h3 className="text-sm font-medium text-gray-300 mb-3">30-Day Trend</h3>
              <ScoreHistory snapshots={snapshots} />
            </motion.div>
          </div>
        </div>

        {/* Right column — Action Logger + AI Coach */}
        <div className="space-y-5">
          <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
            <ActionLogger />
          </motion.div>

          <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
            <AiCoach userData={user} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
