import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { quizAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { calculateBaselineScore } from '../utils/scoreCalculator';
import { EMISSION_FACTORS } from '../utils/emissionFactors';

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
      const result = calculateBaselineScore(answers);
      setPreviewScore(result);

      await quizAPI.submit(answers);
      await refreshUser();

      // Show score briefly then navigate
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      console.error('Quiz submission error:', err);
      setSubmitting(false);
    }
  };

  // Score preview after submission
  if (previewScore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, delay: 0.3 }}
            className="w-40 h-40 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-green-500/30 flex items-center justify-center"
          >
            <div>
              <p className="text-4xl font-bold text-white">{previewScore.total.toLocaleString()}</p>
              <p className="text-green-400 text-sm mt-1">kg CO₂/year</p>
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Your Carbon Baseline</h2>
          <p className="text-gray-400 mb-4">
            {previewScore.total < 2000 ? "Amazing! You're below the Paris target! 🌟" :
             previewScore.total < 4000 ? "Good start! Let's bring it down together. 💪" :
             "Let's work on reducing your footprint. Every action counts! 🌱"}
          </p>
          <p className="text-gray-500 text-sm">Redirecting to your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] px-4">
      <div className="w-full max-w-xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <motion.div
                  animate={{
                    backgroundColor: i <= step ? '#10b981' : '#1f2937',
                    scale: i === step ? 1.1 : 1
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                >
                  {i < step ? '✓' : s.icon}
                </motion.div>
                {i < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 mx-1 ${i < step ? 'bg-green-500' : 'bg-[#1f2937]'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm text-center">Step {step + 1} of {steps.length}</p>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-8"
          >
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">{currentStep.icon}</span>
              <h2 className="text-2xl font-bold text-white">{currentStep.title}</h2>
              <p className="text-gray-400 mt-1">{currentStep.description}</p>
            </div>

            {/* Transport step */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {transportModes.map(mode => (
                    <button
                      key={mode.value}
                      onClick={() => updateAnswer('transport', { ...answers.transport, mode: mode.value })}
                      className={`p-3 rounded-xl text-left transition-all ${
                        answers.transport.mode === mode.value
                          ? 'bg-green-500/15 border-2 border-green-500/50 text-white'
                          : 'bg-[#1f2937]/50 border-2 border-transparent text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-xl">{mode.icon}</span>
                      <p className="text-sm font-medium mt-1">{mode.label}</p>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Weekly distance (km)</label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={answers.transport.weeklyKm}
                    onChange={(e) => updateAnswer('transport', { ...answers.transport, weeklyKm: Number(e.target.value) })}
                    className="w-full accent-green-500"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>0 km</span>
                    <span className="text-green-400 font-medium">{answers.transport.weeklyKm} km/week</span>
                    <span>500 km</span>
                  </div>
                </div>
              </div>
            )}

            {/* Diet step */}
            {step === 1 && (
              <div className="space-y-2">
                {dietOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateAnswer('diet', option.value)}
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                      answers.diet === option.value
                        ? 'bg-green-500/15 border-2 border-green-500/50'
                        : 'bg-[#1f2937]/50 border-2 border-transparent hover:border-gray-600'
                    }`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <div className="text-left">
                      <p className="text-white font-medium">{option.label}</p>
                      <p className="text-gray-500 text-xs">{option.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Energy step */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {energySources.map(src => (
                    <button
                      key={src.value}
                      onClick={() => updateAnswer('energy', { ...answers.energy, source: src.value })}
                      className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                        answers.energy.source === src.value
                          ? 'bg-green-500/15 border-2 border-green-500/50'
                          : 'bg-[#1f2937]/50 border-2 border-transparent hover:border-gray-600'
                      }`}
                    >
                      <span className="text-2xl">{src.icon}</span>
                      <div className="text-left">
                        <p className="text-white font-medium">{src.label}</p>
                        <p className="text-gray-500 text-xs">{src.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Monthly electricity usage (kWh)</label>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="10"
                    value={answers.energy.monthlyKwh}
                    onChange={(e) => updateAnswer('energy', { ...answers.energy, monthlyKwh: Number(e.target.value) })}
                    className="w-full accent-green-500"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>50 kWh</span>
                    <span className="text-green-400 font-medium">{answers.energy.monthlyKwh} kWh/mo</span>
                    <span>1000 kWh</span>
                  </div>
                </div>
              </div>
            )}

            {/* Shopping step */}
            {step === 3 && (
              <div className="space-y-2">
                {shoppingLevels.map(level => (
                  <button
                    key={level.value}
                    onClick={() => updateAnswer('shopping', level.value)}
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                      answers.shopping === level.value
                        ? 'bg-green-500/15 border-2 border-green-500/50'
                        : 'bg-[#1f2937]/50 border-2 border-transparent hover:border-gray-600'
                    }`}
                  >
                    <span className="text-2xl">{level.icon}</span>
                    <div className="text-left">
                      <p className="text-white font-medium">{level.label}</p>
                      <p className="text-gray-500 text-xs">{level.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Flights step */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Short-haul flights per year ({'<'}3hrs)
                    <span className="text-gray-500 text-xs ml-2">~255 kg CO₂ each</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateAnswer('flights', { ...answers.flights, shortHaul: Math.max(0, answers.flights.shortHaul - 1) })}
                      className="w-10 h-10 rounded-lg bg-[#1f2937] text-white font-bold hover:bg-[#374151] transition-colors"
                    >−</button>
                    <span className="text-2xl font-bold text-white w-12 text-center">{answers.flights.shortHaul}</span>
                    <button
                      onClick={() => updateAnswer('flights', { ...answers.flights, shortHaul: answers.flights.shortHaul + 1 })}
                      className="w-10 h-10 rounded-lg bg-[#1f2937] text-white font-bold hover:bg-[#374151] transition-colors"
                    >+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Long-haul flights per year ({'>'}6hrs)
                    <span className="text-gray-500 text-xs ml-2">~1,620 kg CO₂ each</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateAnswer('flights', { ...answers.flights, longHaul: Math.max(0, answers.flights.longHaul - 1) })}
                      className="w-10 h-10 rounded-lg bg-[#1f2937] text-white font-bold hover:bg-[#374151] transition-colors"
                    >−</button>
                    <span className="text-2xl font-bold text-white w-12 text-center">{answers.flights.longHaul}</span>
                    <button
                      onClick={() => updateAnswer('flights', { ...answers.flights, longHaul: answers.flights.longHaul + 1 })}
                      className="w-10 h-10 rounded-lg bg-[#1f2937] text-white font-bold hover:bg-[#374151] transition-colors"
                    >+</button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                disabled={step === 0}
                className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                disabled={submitting}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? 'Calculating...' : step === steps.length - 1 ? 'Calculate My Score →' : 'Next →'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
