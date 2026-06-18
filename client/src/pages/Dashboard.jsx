import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { useScore } from "../context/useScore";
import { userAPI } from "../api/axios";
import CarbonTwin from "../components/twin/CarbonTwin";
import ScoreBreakdown from "../components/charts/ScoreBreakdown";
import ScoreHistory from "../components/charts/ScoreHistory";
import ActionLogger from "../components/ActionLogger";
import AiCoach from "../components/AiCoach";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import { getScoreColor, getScoreLabel } from "../utils/scoreCalculator";
import { BENCHMARKS } from "../utils/emissionFactors";
import { Flame, TrendingDown, TrendingUp, Zap, AlertTriangle, Target } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const {
    scoreData,
    scoreAnimating,
    fetchDashboardData,
    summary,
  } = useScore();
  const [loaded, setLoaded] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [settingGoal, setSettingGoal] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);

  useEffect(() => {
    fetchDashboardData().then(() =>
      setLoaded(true)
    );
  }, [fetchDashboardData]);

  const score = user?.currentScore || scoreData?.currentScore || 0;
  const breakdown = user?.scoreBreakdown || scoreData?.scoreBreakdown || {};
  const streak = user?.streak || 0;
  const snapshots = scoreData?.dailySnapshots || user?.dailySnapshots || [];
  const streakStatus = user?.streakStatus;
  const weeklyDelta = summary?.totalDelta || 0;
  const baseline = user?.baselineScore || scoreData?.baselineScore || 0;
  const targetGoal = user?.targetGoal || scoreData?.targetGoal;

  const handleSetGoal = async () => {
    const goal = Number(goalInput);
    if (!goal || goal < 0 || goal > 50000) return;
    setSettingGoal(true);
    try {
      await userAPI.setGoal(goal);
      await fetchDashboardData();
      setShowGoalForm(false);
      setGoalInput('');
    } catch (err) {
      console.error('Failed to set goal:', err);
    } finally {
      setSettingGoal(false);
    }
  };

  const fadeIn = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <div className="page-container">
      <motion.header {...fadeIn} className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="page-title">
            Welcome back,{" "}
            <span className="text-gradient-eco">
              {user?.name?.split(" ")[0] || "User"}
            </span>
          </h1>
          <p className="page-subtitle">
            Your footprint, daily actions, trend line, and AI guidance in one
            focused workspace.
          </p>
        </div>
        <div className="hidden md:block surface-soft px-4 py-3 text-right rounded-xl">
          <p className="meta-label">Status</p>
          <p className="text-sm font-semibold text-sand-100 mt-1">
            {loaded ? "Synced just now" : "Syncing data"}
          </p>
        </div>
      </motion.header>

      {streakStatus?.streakAtRisk && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="surface-soft mb-5 flex items-start gap-3 border-amber-400/20 bg-amber-400/5 p-4 rounded-xl"
        >
          <AlertTriangle size={16} className="mt-0.5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-400">Streak at risk</p>
            <p className="text-sm text-sand-400">
              It has been {streakStatus.hoursSinceLastLog}hrs since your last
              log. Add an action to keep your {streak}-day streak.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          {/* Stat Cards Row */}
          <motion.section
            {...fadeIn}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-1 gap-3 md:grid-cols-4"
          >
            {/* Primary stat — Annual footprint */}
            <div className="surface surface-accent-sage stat-card md:col-span-2">
              <p className="meta-label">Annual footprint</p>
              <div className="mt-3 flex items-end gap-2">
                <span
                  className="metric-value"
                  style={{ color: getScoreColor(score) }}
                >
                  <AnimatedNumber value={score} />
                </span>
                <span className="pb-1 text-sm text-sand-500">kg CO2/yr</span>
              </div>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: getScoreColor(score) }}
              >
                {getScoreLabel(score)}
              </p>
            </div>

            {/* Streak */}
            <div className="surface surface-accent-amber stat-card">
              <div className="flex items-center gap-1.5 mb-1">
                <Flame size={13} className="text-amber-400" />
                <p className="meta-label">Streak</p>
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="metric-value text-amber-400">
                  <AnimatedNumber value={streak} />
                </span>
                <span className="pb-1 text-sm text-sand-500">days</span>
              </div>
              <p className="mt-2 text-xs text-sand-500">Consistency score</p>
            </div>

            {/* Weekly delta */}
            <div className="surface surface-accent-teal stat-card">
              <div className="flex items-center gap-1.5 mb-1">
                {weeklyDelta <= 0 ? (
                  <TrendingDown size={13} className="text-sage-400" />
                ) : (
                  <TrendingUp size={13} className="text-coral-400" />
                )}
                <p className="meta-label">This week</p>
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span
                  className={`metric-value ${weeklyDelta <= 0 ? "text-sage-400" : "text-coral-400"}`}
                >
                  <AnimatedNumber value={Math.abs(weeklyDelta)} decimals={1} />
                </span>
                <span className="pb-1 text-sm text-sand-500">
                  kg {weeklyDelta <= 0 ? "saved" : "added"}
                </span>
              </div>
              <p className="mt-2 text-xs text-sand-500">
                {summary?.totalActions || 0} actions logged
              </p>
            </div>
          </motion.section>

          {/* Goal Progress Card */}
          <motion.section
            {...fadeIn}
            transition={{ delay: 0.08 }}
            className="surface surface-accent-teal p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-teal-400" />
                <p className="section-title">My Goal</p>
              </div>
              {targetGoal && !showGoalForm && (
                <button
                  onClick={() => { setShowGoalForm(true); setGoalInput(String(targetGoal)); }}
                  className="text-[10px] font-bold text-sand-500 hover:text-sand-300 transition-colors uppercase tracking-wider"
                >
                  Edit
                </button>
              )}
            </div>

            {targetGoal && !showGoalForm ? (
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-sand-500">Current: {score.toLocaleString()} kg</span>
                  <span className="text-teal-400 font-bold">Target: {targetGoal.toLocaleString()} kg</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-base-950">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(0, Math.min(100, ((baseline - score) / Math.max(1, baseline - targetGoal)) * 100))}%` }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sage-400"
                  />
                </div>
                <p className="mt-2 text-xs text-sand-500">
                  {score <= targetGoal
                    ? '🎉 Goal achieved! Consider setting a more ambitious target.'
                    : `${(score - targetGoal).toLocaleString()} kg to go — keep logging daily actions!`
                  }
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="e.g. 3000"
                  className="input-field py-2 text-sm flex-1"
                  aria-label="Set your annual CO₂ target goal in kilograms"
                  min={0}
                  max={50000}
                />
                <button
                  onClick={handleSetGoal}
                  disabled={settingGoal || !goalInput}
                  className="btn-primary py-2 px-4 text-xs"
                >
                  {settingGoal ? 'Saving…' : 'Set Goal'}
                </button>
                {showGoalForm && (
                  <button
                    onClick={() => setShowGoalForm(false)}
                    className="text-xs text-sand-500 hover:text-sand-300 px-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </motion.section>

          {/* Carbon Twin — Full-width canvas */}
          <motion.section
            {...fadeIn}
            transition={{ delay: 0.1 }}
            className="surface overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-100/5 px-5 py-4">
              <div>
                <p className="section-title">Carbon Twin</p>
                <p className="text-sm text-sand-500">
                  Interactive reflection of your current footprint. <span className="text-[11px] text-teal-400 font-medium block md:inline md:ml-2">💡 Drag to orbit • Scroll to zoom • Right-click + drag to pan</span>
                </p>
              </div>
              <span className="rounded-lg border border-teal-400/15 bg-teal-400/6 px-2.5 py-1 text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={10} /> 3D Live
              </span>
            </div>
            <div className="h-[380px] md:h-[460px]" role="img" aria-label={`3D Carbon Twin avatar visualizing your annual footprint of ${score} kg CO₂. ${score < 4000 ? 'Below world average — avatar appears green and healthy.' : 'Above world average — avatar shows elevated emissions.'}`}>
              <CarbonTwin score={score} animating={scoreAnimating} streak={streak} />
            </div>
          </motion.section>

          {/* Benchmark + Breakdown */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.section
              {...fadeIn}
              transition={{ delay: 0.15 }}
              className="surface p-5"
            >
              <p className="section-title mb-4">Benchmark Position</p>
              <div className="space-y-4">
                {Object.entries(BENCHMARKS)
                  .slice(0, 3)
                  .map(([key, bench]) => {
                    const pct = Math.min(100, (score / bench.value) * 100);
                    const isBelow = score < bench.value;
                    return (
                      <div key={key}>
                        <div className="mb-2 flex justify-between gap-3 text-xs">
                          <span className="text-sand-500">
                            {bench.label}: {bench.value.toLocaleString()} kg
                          </span>
                          <span
                            className={
                              isBelow ? "text-sage-400" : "text-amber-400"
                            }
                          >
                            {isBelow
                              ? `${Math.round(bench.value - score)} below`
                              : `${Math.round(score - bench.value)} above`}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-base-950">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className={`h-full rounded-full ${isBelow ? "bg-gradient-to-r from-sage-500 to-sage-400" : "bg-gradient-to-r from-amber-500 to-amber-400"}`}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.section>

            <motion.section
              {...fadeIn}
              transition={{ delay: 0.2 }}
              className="surface p-5"
            >
              <p className="section-title mb-4">Score Breakdown</p>
              <ScoreBreakdown breakdown={breakdown} />
            </motion.section>
          </div>

          {/* 30-day Trend */}
          <motion.section
            {...fadeIn}
            transition={{ delay: 0.25 }}
            className="surface p-5"
          >
            <p className="section-title mb-4">30-Day Trend</p>
            <ScoreHistory snapshots={snapshots} />
          </motion.section>
        </div>

        {/* Sidebar panels */}
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
