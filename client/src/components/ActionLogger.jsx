import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScore } from '../context/ScoreContext';
import { ACTION_OPTIONS } from '../utils/emissionFactors';

const categoryLabels = {
  transport: { label: 'Transport', icon: '🚗', color: 'green' },
  meal: { label: 'Meals', icon: '🍽️', color: 'cyan' },
  home: { label: 'Home', icon: '🏠', color: 'amber' },
  shopping: { label: 'Shopping', icon: '🛍️', color: 'purple' }
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
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        📝 <span>Log Today's Actions</span>
      </h3>

      {/* Success notification */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
              success.delta < 0
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
            }`}
          >
            <span>{success.delta < 0 ? '🌱' : '📊'}</span>
            <span>
              {success.action}: <strong>{success.delta > 0 ? '+' : ''}{success.delta} kg CO₂</strong>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category tabs */}
      <div className="flex gap-1 mb-4 bg-[#0a0f1e] rounded-xl p-1">
        {Object.entries(categoryLabels).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
              activeCategory === key
                ? 'bg-green-500/20 text-green-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="text-base block">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        {ACTION_OPTIONS[activeCategory]?.map(action => (
          <motion.button
            key={action.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleLog(action)}
            disabled={submitting}
            className="w-full p-3 rounded-xl bg-[#0a0f1e]/60 border border-[#1f2937] hover:border-green-500/30 transition-all flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{action.icon}</span>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{action.label}</span>
            </div>
            {action.delta !== undefined && (
              <span className={`text-xs font-mono px-2 py-1 rounded-lg ${
                action.delta < 0
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {action.delta > 0 ? '+' : ''}{action.delta} kg
              </span>
            )}
            {action.needsKm && (
              <span className="text-xs text-gray-500">km based</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* KM input for transport */}
      {activeCategory === 'transport' && (
        <div className="mt-3">
          <label className="text-xs text-gray-400 mb-1 block">Distance (km)</label>
          <input
            type="number"
            value={km}
            onChange={(e) => setKm(Number(e.target.value))}
            className="input-field text-sm py-2"
            placeholder="km"
            min={0}
          />
        </div>
      )}

      {/* Notes */}
      <div className="mt-3">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field text-sm py-2"
          placeholder="Add a note (optional)"
        />
      </div>
    </div>
  );
}
