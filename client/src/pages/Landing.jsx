import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import InteractiveEcoGlobe from '../components/landing/InteractiveEcoGlobe';

export default function Landing() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [carbonVal, setCarbonVal] = useState(3800);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Label configuration based on carbon value
  const getCarbonProfile = (val) => {
    if (val < 2500) {
      return {
        title: 'Pristine Eco-Guardian',
        color: 'text-green-400',
        borderColor: 'border-green-500/30',
        bg: 'bg-green-500/5',
        desc: 'Exceptional carbon hygiene. Plant-based eating, cycling or walking, and relying on renewable power sources.',
        badge: '🌿 Low Impact'
      };
    } else if (val < 4500) {
      return {
        title: 'Moderate Footprint',
        color: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        bg: 'bg-amber-500/5',
        desc: 'Standard consumer profile. Mixed travel (some public transit, some driving), balanced diet, and average utility usage.',
        badge: '🌤️ Average Impact'
      };
    } else {
      return {
        title: 'Industrial Heavy-Impact',
        color: 'text-red-400',
        borderColor: 'border-red-500/30',
        bg: 'bg-red-500/5',
        desc: 'High emission habits. Frequent flights, regular gasoline car travel, heavy energy footprint, and high consumer spending.',
        badge: '🏭 High Impact'
      };
    }
  };

  const profile = getCarbonProfile(carbonVal);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white relative overflow-hidden bg-grid-overlay">
      {/* Background glow orbs */}
      <div className="bg-glow-orb w-[600px] h-[600px] bg-emerald-500 top-[-200px] left-[-200px] opacity-[0.08]" />
      <div className="bg-glow-orb w-[600px] h-[600px] bg-cyan-500 bottom-[-200px] right-[-200px] opacity-[0.08]" />

      {/* Header Navigation */}
      <header className="border-b border-white/5 relative z-10 backdrop-blur-md bg-[#0a0f1e]/60 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-500/20 group-hover:scale-105 transition-transform">
              🌍
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">Carbon Twin City</span>
              <span className="block text-[10px] text-cyan-400 tracking-wider font-mono">ECO-SIMULATOR</span>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="btn-premium-secondary py-2 px-5 text-sm">
                  Go to Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="btn-premium-cta py-2 px-5 text-sm font-bold">
                  Claim Twin
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
        >
          {/* Hero Content */}
          <div className="lg:col-span-6 space-y-6">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-green-300">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Next-Gen Carbon Twin Analytics
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Visualize Your Footprint. <br />
              <span className="text-gradient-eco">Shape Your World.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-gray-400 text-lg leading-relaxed max-w-xl">
              Create a personalized 3D avatar &ndash; your Carbon Twin &ndash; that mutates based on your daily choices. Join a shared community city and witness your collective impact shape its environment in real-time.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 pt-2">
              <Link to={user ? "/dashboard" : "/register"} className="btn-premium-cta flex items-center gap-2">
                <span>🚀</span> Get Started Now
              </Link>
              <a href="#interactive-simulator" className="btn-premium-secondary flex items-center gap-2">
                <span>🔮</span> Try the Demo
              </a>
            </motion.div>

            {/* Quick stats / trust */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
              <div>
                <p className="text-3xl font-extrabold text-white">60 FPS</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">3D Graphics</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-cyan-400">100%</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Interactive</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-green-400">Gemini</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">AI Guided</p>
              </div>
            </motion.div>
          </div>

          {/* 3D Interactive Globe Widget */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-6 flex flex-col items-center justify-center"
            id="interactive-simulator"
          >
            <div className="w-full max-w-lg glass-card-premium p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-4 left-6 flex items-center gap-2">
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">LIVE ENGINE</span>
                <h3 className="text-sm font-semibold text-white/80">Globe State Simulator</h3>
              </div>

              {/* 3D Canvas Box */}
              <div className="h-[280px] md:h-[320px] w-full rounded-2xl bg-[#090b11]/80 border border-white/5 overflow-hidden my-4 relative">
                <InteractiveEcoGlobe value={carbonVal} />
              </div>

              {/* Slider controls */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Simulate Footprint:</span>
                  <span className={`font-mono font-bold text-lg ${profile.color}`}>
                    {carbonVal.toLocaleString()} kg CO₂/yr
                  </span>
                </div>

                <input
                  type="range"
                  min="1500"
                  max="7500"
                  step="50"
                  value={carbonVal}
                  onChange={(e) => setCarbonVal(Number(e.target.value))}
                  className="w-full h-2 rounded-lg bg-gray-800 accent-emerald-500 cursor-pointer"
                />

                {/* Simulated State Card */}
                <motion.div
                  key={profile.title}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border ${profile.borderColor} ${profile.bg} transition-all duration-300`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={`font-bold text-sm ${profile.color}`}>{profile.title}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/80">
                      {profile.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{profile.desc}</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid Section */}
        <section className="py-24 border-t border-white/5 mt-16">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">App Capabilities</h2>
            <p className="text-3xl md:text-4xl font-extrabold">How Carbon Twin City Works</p>
            <p className="text-gray-400">Our suite of 3D and AI tools creates a gorgeous, unified loop that tracks your real habits and projects their future consequences.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '🧬',
                title: '3D Carbon Twin',
                desc: 'Your avatar morphs based on your food, transport, and energy habits. Watch it turn clean/glowing or grey/smoggy.',
                badge: '3D Avatar'
              },
              {
                icon: '🏙️',
                title: 'Carbon Twin City',
                desc: 'A collective 3D simulation powered by community-wide averages. Plant trees or emit factory smog together.',
                badge: 'Multiplayer'
              },
              {
                icon: '🔮',
                title: 'What-If Simulator',
                desc: 'Toggle actions like going vegetarian or biking to immediately see their lifetime offsets and avatar previews.',
                badge: 'Simulation'
              },
              {
                icon: '🤖',
                title: 'AI Eco-Coach',
                desc: 'Integrates with Gemini AI to review your weekly reports and give customized recommendations on reducing emissions.',
                badge: 'AI Guided'
              }
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card-premium p-6 flex flex-col justify-between"
              >
                <div>
                  <span className="text-4xl block mb-4">{card.icon}</span>
                  <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">{card.badge}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer CTA Section */}
        <section className="mt-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full bg-gradient-to-br from-[#0c1f24] to-[#080d1a] border border-cyan-500/20 rounded-3xl p-8 md:p-16 text-center space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-grid-overlay opacity-[0.2]" />
            <h2 className="text-3xl md:text-5xl font-extrabold relative z-10">
              Ready to Claim Your Carbon Twin?
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto relative z-10">
              Calculate your initial carbon budget in 2 minutes, customize your avatar, and start driving real-world changes.
            </p>
            <div className="pt-4 relative z-10">
              <Link to={user ? "/dashboard" : "/register"} className="btn-premium-cta inline-flex items-center gap-3">
                <span>🌍</span> Initialize Carbon Twin
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-12 bg-black/20 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Carbon Twin City. All rights reserved.</p>
        <p className="mt-1 text-gray-600">Built using Three.js, React Three Fiber &amp; Gemini AI.</p>
      </footer>
    </div>
  );
}
