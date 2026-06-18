import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import CarbonTwin from '../components/twin/CarbonTwin';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { getScoreColor, formatNumber } from '../utils/scoreCalculator';
import { TreePine, Car, Smartphone, Droplets, TrendingDown, Zap } from 'lucide-react';
import { simulatorAPI } from '../api/axios';

const sliderConfig = [
  { id: 'goVegetarian', label: 'Go Vegetarian', description: 'Switch from your current diet to vegetarian', field: 'diet', newValue: 'vegetarian' },
  { id: 'goVegan', label: 'Go Vegan', description: 'Switch from your current diet to fully plant-based', field: 'diet', newValue: 'vegan' },
  { id: 'cycleInsteadOfDrive', label: 'Cycle 3 days/week', description: 'Replace car trips with cycling 3 days per week', field: 'transport', custom: true },
  { id: 'cutLongHaulFlight', label: 'Cut 1 long-haul flight', description: 'Eliminate one long-haul round trip per year', field: 'flights', custom: true },
  { id: 'switchToRenewable', label: 'Switch to renewable energy', description: 'Power your home with solar, wind, or hydro', field: 'energy', newValue: 'renewable' },
  { id: 'reduceShoppingToMinimal', label: 'Minimize shopping', description: 'Buy only essentials, choose second-hand', field: 'shopping', newValue: 'minimal' },
];

const equivIcons = {
  'Trees planted': TreePine,
  'Km not driven': Car,
  'Phone charges': Smartphone,
  '8-min showers': Droplets,
};

export default function Simulator() {
  const { user } = useAuth();
  const [activeToggles, setActiveToggles] = useState({});

  const [simulatedData, setSimulatedData] = useState(null);

  const quizAnswers = useMemo(() => user?.quizAnswers || {
    transport: { mode: 'car_petrol', weeklyKm: 80 },
    diet: 'omnivore',
    energy: { source: 'mixed', monthlyKwh: 250 },
    shopping: 'average',
    flights: { shortHaul: 2, longHaul: 1 }
  }, [user]);

  const currentResult = useMemo(() => {
    const total = user?.currentScore || 3000;
    return { total };
  }, [user]);

  useEffect(() => {
    let active = true;
    const fetchSimulation = async () => {
      try {
        const { data } = await simulatorAPI.calculate({
          currentAnswers: quizAnswers,
          modifications: activeToggles
        });
        if (active) {
          setSimulatedData(data);
        }
      } catch (err) {
        console.error('Simulator calculation failed:', err);
      }
    };

    fetchSimulation();

    return () => {
      active = false;
    };
  }, [quizAnswers, activeToggles]);

  const currentTotal = simulatedData?.currentScore || currentResult.total;
  const simulatedTotal = simulatedData?.simulatedScore || currentTotal;
  const savings = simulatedData?.savings || 0;
  const equivalencies = simulatedData?.equivalencies || { treesPlanted: 0, kmNotDriven: 0, smartphonesCharged: 0, showers: 0 };
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
        <div className="surface-soft px-4 py-3 text-right rounded-xl">
          <p className="meta-label">Active scenarios</p>
          <p className="text-sm font-semibold text-sand-100 mt-1">{activeCount} selected</p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="space-y-5">
          <div className="surface overflow-hidden">
            <div className="border-b border-sand-100/5 px-5 py-4">
              <p className="section-title">Lifestyle Switches</p>
              <p className="text-sm text-sand-500">Choose the changes you want to simulate. Nothing is saved here.</p>
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
                    role="switch"
                    aria-checked={isActive ? "true" : "false"}
                    aria-label={item.label}
                    aria-describedby={`desc-${item.id}`}
                    className={`flex min-h-[120px] items-start justify-between gap-4 rounded-xl border p-4 text-left transition-all ${
                      isActive
                        ? 'border-sage-400/30 bg-sage-400/8 shadow-lg shadow-sage-400/5'
                        : 'border-sand-100/6 bg-sand-100/[0.02] hover:border-sand-100/12 hover:bg-sand-100/[0.04]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-sand-100">{item.label}</p>
                      <p id={`desc-${item.id}`} className="mt-2 text-sm leading-relaxed text-sand-500">{item.description}</p>
                    </div>
                    <span className={`mt-1 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${
                      isActive ? 'bg-sage-400' : 'bg-base-700'
                    }`}>
                      <motion.span
                        animate={{ x: isActive ? 20 : 0 }}
                        className="h-5 w-5 rounded-full bg-white shadow-md"
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
                  ].map(([label, value]) => {
                    const Icon = equivIcons[label];
                    return (
                      <div key={label} className="surface-soft p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={14} className="text-sage-400" />
                          <p className="text-xs text-sand-500 font-medium">{label}</p>
                        </div>
                        <p className="text-2xl font-extrabold text-sage-400">{value}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-sand-500">Select at least one lower-impact scenario to see equivalencies.</p>
              )}
            </section>

            <section className="surface overflow-hidden">
              <div className="border-b border-sand-100/5 px-5 py-4 flex items-center justify-between">
                <p className="section-title">Twin Preview</p>
                <Zap size={12} className="text-teal-400" />
              </div>
              <div className="h-[340px]">
                <CarbonTwin score={simulatedTotal} animating={false} />
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
                <p className="mt-2 text-3xl font-extrabold" style={{ color: getScoreColor(currentTotal) }}>
                  <AnimatedNumber value={currentTotal} /> <span className="text-sm font-medium text-sand-500">kg/yr</span>
                </p>
              </div>
              <div className="h-px bg-sand-100/5" />
              <div>
                <p className="meta-label">Simulated score</p>
                <p className="mt-2 text-4xl font-extrabold" style={{ color: getScoreColor(simulatedTotal) }}>
                  <AnimatedNumber value={simulatedTotal} /> <span className="text-sm font-medium text-sand-500">kg/yr</span>
                </p>
              </div>
              <div className={`rounded-xl border p-4 ${
                savings > 0 ? 'border-sage-400/20 bg-sage-400/6' : 'border-sand-100/6 bg-sand-100/[0.02]'
              }`}>
                <p className={savings > 0 ? 'text-sage-400 flex items-center gap-2' : 'text-sand-500'}>
                  {savings > 0 ? (
                    <><TrendingDown size={16} /> <span className="text-xl font-extrabold">-<AnimatedNumber value={savings} /> kg CO2/yr</span> saved</>
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
