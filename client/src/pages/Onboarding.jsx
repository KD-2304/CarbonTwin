import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { quizAPI } from '../api/axios';
import { useAuth } from '../context/useAuth';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const steps = [
  { id: 'transport', title: 'Transportation', icon: '🚗', description: 'How do you usually get around?' },
  { id: 'diet', title: 'Diet', icon: '🥗', description: 'What does your typical diet look like?' },
  { id: 'energy', title: 'Home Energy', icon: '⚡', description: 'How is your home powered?' },
  { id: 'shopping', title: 'Shopping', icon: '🛍️', description: 'How often do you buy new things?' },
  { id: 'flights', title: 'Air Travel', icon: '✈️', description: 'How often do you fly?' },
];

const transportModes = [
  { value: 'car_petrol', label: 'Car (Petrol)', icon: '⛽' },
  { value: 'car_diesel', label: 'Car (Diesel)', icon: '🛢️' },
  { value: 'car_electric', label: 'Electric Car', icon: '🔌' },
  { value: 'bike', label: 'Bicycle', icon: '🚴' },
  { value: 'public_transit', label: 'Public Transit', icon: '🚌' },
  { value: 'walk', label: 'Walking', icon: '🚶' },
];

const dietOptions = [
  { value: 'vegan', label: 'Vegan', icon: '🌱', desc: '~1,500 kg CO₂/yr' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥬', desc: '~1,700 kg CO₂/yr' },
  { value: 'pescatarian', label: 'Pescatarian', icon: '🐟', desc: '~1,900 kg CO₂/yr' },
  { value: 'omnivore', label: 'Omnivore', icon: '🍽️', desc: '~2,500 kg CO₂/yr' },
  { value: 'heavy_meat', label: 'Heavy Meat', icon: '🥩', desc: '~3,300 kg CO₂/yr' },
];

const energySources = [
  { value: 'renewable', label: 'Renewable', icon: '☀️', desc: 'Solar, wind, hydro' },
  { value: 'mixed', label: 'Mixed Grid', icon: '🔋', desc: 'Standard utility mix' },
  { value: 'coal', label: 'Coal Heavy', icon: '🏭', desc: 'Coal-dominant grid' },
];

const shoppingLevels = [
  { value: 'minimal', label: 'Minimal', icon: '🧘', desc: 'Buy only essentials' },
  { value: 'average', label: 'Average', icon: '🛒', desc: 'Regular consumer' },
  { value: 'frequent', label: 'Frequent', icon: '🛍️', desc: 'Love shopping!' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    transport: { mode: 'car_petrol', weeklyKm: 50 },
    diet: 'omnivore',
    energy: { source: 'mixed', monthlyKwh: 250 },
    shopping: 'average',
    flights: { shortHaul: 1, longHaul: 0 }
  });
  const [submitting, setSubmitting] = useState(false);
  const [previewScore, setPreviewScore] = useState(null);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const updateAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data } = await quizAPI.submit(answers);
      setPreviewScore({
        total: data.baselineScore,
        breakdown: data.scoreBreakdown
      });
      await refreshUser();

      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      console.error('Quiz submission error:', err);
      setSubmitting(false);
    }
  };

  // Score preview after submission
  if (previewScore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-950 px-4 relative overflow-hidden">
        <div className="blob-shape w-[400px] h-[400px] bg-sage-500/10 top-[20%] left-[10%]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 120, delay: 0.3 }}
            className="w-40 h-40 mx-auto mb-8 rounded-full bg-gradient-to-br from-sage-400/15 to-teal-400/15 border-2 border-sage-400/25 flex items-center justify-center"
          >
            <div>
              <p className="text-4xl font-extrabold text-sand-100">{previewScore.total.toLocaleString()}</p>
              <p className="text-sage-400 text-sm mt-1 font-semibold">kg CO₂/year</p>
            </div>
          </motion.div>
          <h2 className="text-2xl font-extrabold text-sand-100 mb-2 tracking-tight">Your Carbon Baseline</h2>
          <p className="text-sand-400 mb-4">
            {previewScore.total < 2000 ? "Amazing! You're below the Paris target! 🌟" :
             previewScore.total < 4000 ? "Good start! Let's bring it down together. 💪" :
             "Let's work on reducing your footprint. Every action counts! 🌱"}
          </p>
          <p className="text-sand-600 text-sm">Redirecting to your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  const optionButtonClass = (isActive) =>
    `w-full p-4 rounded-xl flex items-center gap-4 transition-all border ${
      isActive
        ? 'bg-sage-400/10 border-sage-400/30 shadow-lg shadow-sage-400/5'
        : 'bg-base-800/40 border-sand-100/6 hover:border-sand-100/12 hover:bg-base-800/70'
    }`;

  const gridOptionClass = (isActive) =>
    `p-4 rounded-xl text-left transition-all border ${
      isActive
        ? 'bg-sage-400/10 border-sage-400/30 shadow-lg shadow-sage-400/5'
        : 'bg-base-800/40 border-sand-100/6 hover:border-sand-100/12 hover:bg-base-800/70'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-950 px-4 relative overflow-hidden">
      <div className="blob-shape w-[400px] h-[400px] bg-sage-500/8 top-[-100px] right-[-100px]" />
      <div className="blob-shape w-[300px] h-[300px] bg-teal-500/6 bottom-[-80px] left-[-80px]" style={{ animationDelay: '-5s' }} />

      <div className="w-full max-w-xl relative z-10">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <motion.div
                  animate={{
                    backgroundColor: i <= step ? 'rgba(124,183,127,0.15)' : 'rgba(34,38,47,0.7)',
                    borderColor: i <= step ? 'rgba(124,183,127,0.35)' : 'rgba(240,236,228,0.06)',
                    scale: i === step ? 1.1 : 1
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all"
                >
                  {i < step ? <Check size={16} className="text-sage-400" /> : s.icon}
                </motion.div>
                {i < steps.length - 1 && (
                  <div className={`hidden sm:block w-12 h-0.5 mx-1 rounded-full transition-colors ${i < step ? 'bg-sage-400/40' : 'bg-base-700'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Continuous progress bar */}
          <div className="h-1 w-full rounded-full bg-base-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sage-400 to-teal-400"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-sand-500 text-xs text-center mt-2 font-medium">Step {step + 1} of {steps.length}</p>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="glass-card-premium p-8"
          >
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">{currentStep.icon}</span>
              <h2 className="text-2xl font-extrabold text-sand-100 tracking-tight">{currentStep.title}</h2>
              <p className="text-sand-400 mt-1">{currentStep.description}</p>
            </div>

            {/* Transport step */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Transport Mode selection">
                  {transportModes.map(mode => (
                    <button
                      key={mode.value}
                      role="radio"
                      aria-checked={answers.transport.mode === mode.value}
                      onClick={() => updateAnswer('transport', { ...answers.transport, mode: mode.value })}
                      className={gridOptionClass(answers.transport.mode === mode.value)}
                    >
                      <span className="text-xl">{mode.icon}</span>
                      <p className="text-sm font-medium mt-1 text-sand-200">{mode.label}</p>
                    </button>
                  ))}
                </div>
                <div>
                  <label htmlFor="transport-distance" className="block text-sm text-sand-300 mb-2 font-medium">Weekly distance (km)</label>
                  <input
                    id="transport-distance"
                    type="range"
                    min="0"
                    max="500"
                    value={answers.transport.weeklyKm}
                    onChange={(e) => updateAnswer('transport', { ...answers.transport, weeklyKm: Number(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-sand-500 mt-1">
                    <span>0 km</span>
                    <span className="text-sage-400 font-bold">{answers.transport.weeklyKm} km/week</span>
                    <span>500 km</span>
                  </div>
                </div>
              </div>
            )}

            {/* Diet step */}
            {step === 1 && (
              <div className="space-y-2" role="radiogroup" aria-label="Diet selection">
                {dietOptions.map(option => (
                  <button
                    key={option.value}
                    role="radio"
                    aria-checked={answers.diet === option.value}
                    onClick={() => updateAnswer('diet', option.value)}
                    className={optionButtonClass(answers.diet === option.value)}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <div className="text-left">
                      <p className="text-sand-100 font-semibold text-sm">{option.label}</p>
                      <p className="text-sand-500 text-xs">{option.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Energy step */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2" role="radiogroup" aria-label="Energy Source selection">
                  {energySources.map(src => (
                    <button
                      key={src.value}
                      role="radio"
                      aria-checked={answers.energy.source === src.value}
                      onClick={() => updateAnswer('energy', { ...answers.energy, source: src.value })}
                      className={optionButtonClass(answers.energy.source === src.value)}
                    >
                      <span className="text-2xl">{src.icon}</span>
                      <div className="text-left">
                        <p className="text-sand-100 font-semibold text-sm">{src.label}</p>
                        <p className="text-sand-500 text-xs">{src.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div>
                  <label htmlFor="energy-usage" className="block text-sm text-sand-300 mb-2 font-medium">Monthly electricity usage (kWh)</label>
                  <input
                    id="energy-usage"
                    type="range"
                    min="50"
                    max="1000"
                    step="10"
                    value={answers.energy.monthlyKwh}
                    onChange={(e) => updateAnswer('energy', { ...answers.energy, monthlyKwh: Number(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-sand-500 mt-1">
                    <span>50 kWh</span>
                    <span className="text-sage-400 font-bold">{answers.energy.monthlyKwh} kWh/mo</span>
                    <span>1000 kWh</span>
                  </div>
                </div>
              </div>
            )}

            {/* Shopping step */}
            {step === 3 && (
              <div className="space-y-2" role="radiogroup" aria-label="Shopping Level selection">
                {shoppingLevels.map(level => (
                  <button
                    key={level.value}
                    role="radio"
                    aria-checked={answers.shopping === level.value}
                    onClick={() => updateAnswer('shopping', level.value)}
                    className={optionButtonClass(answers.shopping === level.value)}
                  >
                    <span className="text-2xl">{level.icon}</span>
                    <div className="text-left">
                      <p className="text-sand-100 font-semibold text-sm">{level.label}</p>
                      <p className="text-sand-500 text-xs">{level.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Flights step */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-sand-300 mb-3 font-medium">
                    Short-haul flights per year ({'<'}3hrs)
                    <span className="text-sand-500 text-xs ml-2 font-normal">~255 kg CO₂ each</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateAnswer('flights', { ...answers.flights, shortHaul: Math.max(0, answers.flights.shortHaul - 1) })}
                      aria-label="Decrease short-haul flights"
                      className="w-11 h-11 rounded-xl bg-base-800 border border-sand-100/8 text-sand-100 font-bold hover:bg-base-700 transition-colors text-lg"
                    >−</button>
                    <span className="text-2xl font-extrabold text-sand-100 w-12 text-center">{answers.flights.shortHaul}</span>
                    <button
                      onClick={() => updateAnswer('flights', { ...answers.flights, shortHaul: answers.flights.shortHaul + 1 })}
                      aria-label="Increase short-haul flights"
                      className="w-11 h-11 rounded-xl bg-base-800 border border-sand-100/8 text-sand-100 font-bold hover:bg-base-700 transition-colors text-lg"
                    >+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-sand-300 mb-3 font-medium">
                    Long-haul flights per year ({'>'}6hrs)
                    <span className="text-sand-500 text-xs ml-2 font-normal">~1,620 kg CO₂ each</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateAnswer('flights', { ...answers.flights, longHaul: Math.max(0, answers.flights.longHaul - 1) })}
                      aria-label="Decrease long-haul flights"
                      className="w-11 h-11 rounded-xl bg-base-800 border border-sand-100/8 text-sand-100 font-bold hover:bg-base-700 transition-colors text-lg"
                    >−</button>
                    <span className="text-2xl font-extrabold text-sand-100 w-12 text-center">{answers.flights.longHaul}</span>
                    <button
                      onClick={() => updateAnswer('flights', { ...answers.flights, longHaul: answers.flights.longHaul + 1 })}
                      aria-label="Increase long-haul flights"
                      className="w-11 h-11 rounded-xl bg-base-800 border border-sand-100/8 text-sand-100 font-bold hover:bg-base-700 transition-colors text-lg"
                    >+</button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-sand-100/5">
              <button
                onClick={prevStep}
                disabled={step === 0}
                className="btn-secondary disabled:opacity-20 gap-1.5"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={nextStep}
                disabled={submitting}
                className="btn-primary disabled:opacity-50 gap-1.5"
              >
                {submitting ? 'Calculating...' : step === steps.length - 1 ? 'Calculate Score' : 'Next'} <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
