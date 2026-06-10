import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import CarbonTwin from '../components/twin/CarbonTwin';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { calculateBaselineScore, getScoreColor, getEquivalencies, formatNumber } from '../utils/scoreCalculator';

const sliderConfig = [
  {
    id: 'goVegetarian',
    label: 'Go Vegetarian',
    description: 'Switch from your current diet to vegetarian',
    icon: '🥬',
    field: 'diet',
    newValue: 'vegetarian'
  },
  {
    id: 'goVegan',
    label: 'Go Vegan',
    description: 'Switch from your current diet to fully plant-based',
    icon: '🌱',
    field: 'diet',
    newValue: 'vegan'
  },
  {
    id: 'cycleInsteadOfDrive',
    label: 'Cycle 3 days/week',
    description: 'Replace car trips with cycling 3 days per week',
    icon: '🚴',
    field: 'transport',
    custom: true
  },
  {
    id: 'cutLongHaulFlight',
    label: 'Cut 1 long-haul flight',
    description: 'Eliminate one long-haul round trip per year',
    icon: '✈️',
    field: 'flights',
    custom: true
  },
  {
    id: 'switchToRenewable',
    label: 'Switch to renewable energy',
    description: 'Power your home with solar, wind, or hydro',
    icon: '☀️',
    field: 'energy',
    newValue: 'renewable'
  },
  {
    id: 'reduceShoppingToMinimal',
    label: 'Minimize shopping',
    description: 'Buy only essentials, choose second-hand',
    icon: '♻️',
    field: 'shopping',
    newValue: 'minimal'
  },
];

export default function Simulator() {
  const { user } = useAuth();
  const [activeToggles, setActiveToggles] = useState({});

  const quizAnswers = user?.quizAnswers || {
    transport: { mode: 'car_petrol', weeklyKm: 80 },
    diet: 'omnivore',
    energy: { source: 'mixed', monthlyKwh: 250 },
    shopping: 'average',
    flights: { shortHaul: 2, longHaul: 1 }
  };

  const currentResult = useMemo(() => calculateBaselineScore(quizAnswers), [quizAnswers]);

  const simulatedResult = useMemo(() => {
    const modified = JSON.parse(JSON.stringify(quizAnswers));

    if (activeToggles.goVegetarian) modified.diet = 'vegetarian';
    if (activeToggles.goVegan) modified.diet = 'vegan';
    if (activeToggles.cycleInsteadOfDrive) {
      modified.transport = { mode: 'bike', weeklyKm: modified.transport.weeklyKm * 4 / 7 };
    }
    if (activeToggles.cutLongHaulFlight) {
      modified.flights = { ...modified.flights, longHaul: Math.max(0, modified.flights.longHaul - 1) };
    }
    if (activeToggles.switchToRenewable) {
      modified.energy = { ...modified.energy, source: 'renewable' };
    }
    if (activeToggles.reduceShoppingToMinimal) {
      modified.shopping = 'minimal';
    }

    return calculateBaselineScore(modified);
  }, [quizAnswers, activeToggles]);

  const savings = currentResult.total - simulatedResult.total;
  const equivalencies = getEquivalencies(savings);

  const toggle = (id) => {
    setActiveToggles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="page-container pb-24 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          🔮 <span>What-If Simulator</span>
        </h1>
        <p className="text-gray-400 mt-1">See how lifestyle changes would impact your footprint</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sliders */}
        <div className="lg:col-span-2 space-y-3">
          {sliderConfig.map((item, index) => {
            const isActive = activeToggles[item.id];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => toggle(item.id)}
                  className={`w-full glass-card p-4 flex items-center gap-4 transition-all ${
                    isActive ? 'border-green-500/40 bg-green-500/5' : ''
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium text-sm">{item.label}</p>
                    <p className="text-gray-500 text-xs">{item.description}</p>
                  </div>
                  <div className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${
                    isActive ? 'bg-green-500' : 'bg-[#374151]'
                  }`}>
                    <motion.div
                      animate={{ x: isActive ? 20 : 0 }}
                      className="w-5 h-5 rounded-full bg-white shadow"
                    />
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Results panel */}
        <div className="space-y-5">
          {/* Score comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <div className="text-center mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Current Score</p>
              <p className="text-2xl font-bold" style={{ color: getScoreColor(currentResult.total) }}>
                <AnimatedNumber value={currentResult.total} /> <span className="text-sm text-gray-500">kg/yr</span>
              </p>
            </div>

            <div className="text-center mb-4">
              <p className="text-3xl">↓</p>
            </div>

            <div className="text-center mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Simulated Score</p>
              <p className="text-3xl font-bold" style={{ color: getScoreColor(simulatedResult.total) }}>
                <AnimatedNumber value={simulatedResult.total} /> <span className="text-sm text-gray-500">kg/yr</span>
              </p>
            </div>

            {savings > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center"
              >
                <p className="text-green-400 font-bold text-lg">
                  −<AnimatedNumber value={savings} /> kg CO₂/yr saved!
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Equivalencies */}
          {savings > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-5"
            >
              <h3 className="text-sm font-medium text-gray-300 mb-3">That's equivalent to...</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🌳</span>
                  <p className="text-gray-300 text-sm">
                    <span className="text-green-400 font-bold">{formatNumber(equivalencies.treesPlanted)}</span> trees planted
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🚗</span>
                  <p className="text-gray-300 text-sm">
                    <span className="text-green-400 font-bold">{formatNumber(equivalencies.kmNotDriven)}</span> km not driven
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">📱</span>
                  <p className="text-gray-300 text-sm">
                    <span className="text-green-400 font-bold">{formatNumber(equivalencies.smartphonesCharged)}</span> smartphones charged
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🚿</span>
                  <p className="text-gray-300 text-sm">
                    <span className="text-green-400 font-bold">{formatNumber(equivalencies.showers)}</span> 8-min showers
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Mini twin preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-3"
          >
            <p className="text-xs text-gray-400 mb-2 text-center">Twin Preview</p>
            <div className="h-[200px] rounded-xl overflow-hidden">
              <CarbonTwin score={simulatedResult.total} animating={false} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
