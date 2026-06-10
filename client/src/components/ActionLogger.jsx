import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScore } from '../context/ScoreContext';
import { ACTION_OPTIONS } from '../utils/emissionFactors';

const categoryLabels = {
  transport: { label: 'Transport', icon: 'TR' },
  meal: { label: 'Meals', icon: 'ME' },
  home: { label: 'Home', icon: 'HO' },
  shopping: { label: 'Shopping', icon: 'SH' }
};

export default function ActionLogger() {
  const [activeCategory, setActiveCategory] = useState('transport');
  const [km, setKm] = useState(10);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const { logAction } = useScore();

  const handleLog = async (action) => {
    setSubmitting(true);
    setSuccess(null);

    try {
      const result = await logAction({
        category: activeCategory,
        action: action.id,
        km: action.needsKm ? km : undefined,
        notes,
      });
      setSuccess({
        action: action.label,
        delta: result.action.co2Delta,
      });
      setNotes('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to log action:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="surface p-5">
      <div className="mb-4">
        <p className="section-title">Log Today</p>
        <p className="text-sm text-mist-500">Capture the choices that shift your score.</p>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
              success.delta < 0
                ? 'border-leaf-500/30 bg-leaf-500/10 text-leaf-400'
                : 'border-sun-400/30 bg-sun-400/10 text-sun-400'
            }`}
          >
            <span>
              {success.action}: <strong>{success.delta > 0 ? '+' : ''}{success.delta} kg CO2</strong>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="segmented mb-4 grid grid-cols-4">
        {Object.entries(categoryLabels).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-2 py-2 text-xs font-bold transition-all ${
              activeCategory === key
                ? 'bg-leaf-500/14 text-leaf-400'
                : 'text-mist-500 hover:text-white'
            }`}
          >
            <span className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded border border-white/10 text-[10px]">
              {cat.icon}
            </span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {ACTION_OPTIONS[activeCategory]?.map((action) => (
          <motion.button
            key={action.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleLog(action)}
            disabled={submitting}
            className="group flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#07110f]/50 p-3 text-left transition-all hover:border-leaf-400/30 hover:bg-white/[0.03] disabled:opacity-50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-xs font-black text-mist-500">
                {action.label.slice(0, 2).toUpperCase()}
              </span>
              <span className="truncate text-sm text-gray-300 transition-colors group-hover:text-white">{action.label}</span>
            </div>
            {action.delta !== undefined && (
              <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-mono ${
                action.delta < 0
                  ? 'bg-leaf-500/10 text-leaf-400'
                  : 'bg-rose-400/10 text-rose-400'
              }`}>
                {action.delta > 0 ? '+' : ''}{action.delta} kg
              </span>
            )}
            {action.needsKm && (
              <span className="shrink-0 text-xs text-mist-500">km based</span>
            )}
          </motion.button>
        ))}
      </div>

      {activeCategory === 'transport' && (
        <div className="mt-3">
          <label className="mb-1 block text-xs text-mist-500">Distance (km)</label>
          <input
            type="number"
            value={km}
            onChange={(e) => setKm(Number(e.target.value))}
            className="input-field py-2 text-sm"
            placeholder="km"
            min={0}
          />
        </div>
      )}

      <div className="mt-3">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field py-2 text-sm"
          placeholder="Add a note (optional)"
        />
      </div>
    </div>
  );
}
