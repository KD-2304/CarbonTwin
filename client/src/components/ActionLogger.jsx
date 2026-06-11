import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScore } from '../context/ScoreContext';
import { ACTION_OPTIONS } from '../utils/emissionFactors';
import { Car, UtensilsCrossed, Home, ShoppingBag } from 'lucide-react';

const categoryLabels = {
  transport: { label: 'Transport', icon: Car },
  meal: { label: 'Meals', icon: UtensilsCrossed },
  home: { label: 'Home', icon: Home },
  shopping: { label: 'Shopping', icon: ShoppingBag }
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
        <p className="text-sm text-sand-500">Capture the choices that shift your score.</p>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-sm ${
              success.delta < 0
                ? 'border-sage-400/20 bg-sage-400/8 text-sage-400'
                : 'border-amber-400/20 bg-amber-400/8 text-amber-400'
            }`}
          >
            <span>
              {success.action}: <strong>{success.delta > 0 ? '+' : ''}{success.delta} kg CO2</strong>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="segmented mb-4 grid grid-cols-4">
        {Object.entries(categoryLabels).map(([key, cat]) => {
          const Icon = cat.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 text-[10px] font-bold transition-all rounded-lg ${
                activeCategory === key
                  ? 'bg-sage-400/12 text-sage-400'
                  : 'text-sand-500 hover:text-sand-200'
              }`}
            >
              <Icon size={14} />
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {ACTION_OPTIONS[activeCategory]?.map((action) => (
          <motion.button
            key={action.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleLog(action)}
            disabled={submitting}
            className="group flex w-full items-center justify-between gap-3 rounded-xl border border-sand-100/6 bg-base-950/40 p-3 text-left transition-all hover:border-sage-400/20 hover:bg-sand-100/[0.03] disabled:opacity-50"
          >
            <span className="truncate text-sm text-sand-300 transition-colors group-hover:text-sand-100">{action.label}</span>
            {action.delta !== undefined && (
              <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-mono font-bold ${
                action.delta < 0
                  ? 'bg-sage-400/8 text-sage-400'
                  : 'bg-coral-400/8 text-coral-400'
              }`}>
                {action.delta > 0 ? '+' : ''}{action.delta} kg
              </span>
            )}
            {action.needsKm && (
              <span className="shrink-0 text-[10px] text-sand-500 font-medium">km based</span>
            )}
          </motion.button>
        ))}
      </div>

      {activeCategory === 'transport' && (
        <div className="mt-3">
          <label className="mb-1 block text-xs text-sand-500 font-medium">Distance (km)</label>
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
