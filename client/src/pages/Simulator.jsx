import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import CarbonTwin from '../components/twin/CarbonTwin';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { calculateBaselineScore, getScoreColor, getEquivalencies, formatNumber } from '../utils/scoreCalculator';

const sliderConfig = [
  { id: 'goVegetarian', label: 'Go Vegetarian', description: 'Switch from your current diet to vegetarian', field: 'diet', newValue: 'vegetarian' },
  { id: 'goVegan', label: 'Go Vegan', description: 'Switch from your current diet to fully plant-based', field: 'diet', newValue: 'vegan' },
  { id: 'cycleInsteadOfDrive', label: 'Cycle 3 days/week', description: 'Replace car trips with cycling 3 days per week', field: 'transport', custom: true },
  { id: 'cutLongHaulFlight', label: 'Cut 1 long-haul flight', description: 'Eliminate one long-haul round trip per year', field: 'flights', custom: true },
  { id: 'switchToRenewable', label: 'Switch to renewable energy', description: 'Power your home with solar, wind, or hydro', field: 'energy', newValue: 'renewable' },
  { id: 'reduceShoppingToMinimal', label: 'Minimize shopping', description: 'Buy only essentials, choose second-hand', field: 'shopping', newValue: 'minimal' },
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
  const activeCount = Object.values(activeToggles).filter(Boolean).length;

  const toggle = (id) => {
    setActiveToggles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="page-container">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <div>
          <p className="eyebrow">Scenario Lab</p>
          <h1 className="page-title">What-If Simulator</h1>
          <p className="page-subtitle">Toggle lifestyle changes and see the projected annual score update instantly.</p>
        </div>
        <div className="surface-soft px-4 py-3 text-right">
          <p className="meta-label">Active scenarios</p>
          <p className="text-sm font-semibold text-white">{activeCount} selected</p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="space-y-5">
          <div className="surface overflow-hidden">
            <div className="border-b border-white/8 px-5 py-4">
              <p className="section-title">Lifestyle Switches</p>
              <p className="text-sm text-mist-500">Choose the changes you want to simulate. Nothing is saved here.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
              {sliderConfig.map((item, index) => {
                const isActive = activeToggles[item.id];
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => toggle(item.id)}
                    className={`flex min-h-[124px] items-start justify-between gap-4 rounded-lg border p-4 text-left transition-all ${
                      isActive
                        ? 'border-leaf-400/40 bg-leaf-400/8'
                        : 'border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{item.label}</p>
                      <p className="mt-2 text-sm leading-relaxed text-mist-500">{item.description}</p>
                    </div>
                    <span className={`mt-1 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${
                      isActive ? 'bg-leaf-500' : 'bg-ink-700'
                    }`}>
                      <motion.span
                        animate={{ x: isActive ? 20 : 0 }}
                        className="h-5 w-5 rounded-full bg-white shadow"
                      />
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="surface p-5">
              <p className="section-title mb-4">Impact Equivalencies</p>
              {savings > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ['Trees planted', formatNumber(equivalencies.treesPlanted)],
                    ['Km not driven', formatNumber(equivalencies.kmNotDriven)],
                    ['Phone charges', formatNumber(equivalencies.smartphonesCharged)],
                    ['8-min showers', formatNumber(equivalencies.showers)],
                  ].map(([label, value]) => (
                    <div key={label} className="surface-soft p-4">
                      <p className="text-2xl font-black text-leaf-400">{value}</p>
                      <p className="mt-1 text-sm text-mist-500">{label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-mist-500">Select at least one lower-impact scenario to see equivalencies.</p>
              )}
            </section>

            <section className="surface overflow-hidden">
              <div className="border-b border-white/8 px-5 py-4">
                <p className="section-title">Twin Preview</p>
              </div>
              <div className="h-[340px]">
                <CarbonTwin score={simulatedResult.total} animating={false} />
              </div>
            </section>
          </div>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <section className="surface p-5">
            <p className="section-title mb-5">Score Projection</p>
            <div className="space-y-5">
              <div>
                <p className="meta-label">Current score</p>
                <p className="mt-2 text-3xl font-black" style={{ color: getScoreColor(currentResult.total) }}>
                  <AnimatedNumber value={currentResult.total} /> <span className="text-sm font-medium text-mist-500">kg/yr</span>
                </p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <p className="meta-label">Simulated score</p>
                <p className="mt-2 text-4xl font-black" style={{ color: getScoreColor(simulatedResult.total) }}>
                  <AnimatedNumber value={simulatedResult.total} /> <span className="text-sm font-medium text-mist-500">kg/yr</span>
                </p>
              </div>
              <div className={`rounded-lg border p-4 ${
                savings > 0 ? 'border-leaf-500/30 bg-leaf-500/10' : 'border-white/10 bg-white/[0.025]'
              }`}>
                <p className={savings > 0 ? 'text-leaf-400' : 'text-mist-500'}>
                  {savings > 0 ? (
                    <><span className="text-xl font-black">-<AnimatedNumber value={savings} /> kg CO2/yr</span> saved</>
                  ) : (
                    'No annual savings yet.'
                  )}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
