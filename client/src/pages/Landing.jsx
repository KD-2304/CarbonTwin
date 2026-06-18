import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import InteractiveEcoGlobe from "../components/landing/InteractiveEcoGlobe";
import { ArrowRight, Sparkles, Leaf, Building2, FlaskConical, Bot, ChevronRight } from "lucide-react";

export default function Landing() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [carbonVal, setCarbonVal] = useState(3800);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getCarbonProfile = (val) => {
    if (val < 2500) {
      return {
        title: "Pristine Eco-Guardian",
        color: "text-sage-400",
        borderColor: "border-sage-400/25",
        bg: "bg-sage-400/5",
        desc: "Exceptional carbon hygiene. Plant-based eating, cycling or walking, and relying on renewable power sources.",
        badge: "🌿 Low Impact",
      };
    } else if (val < 4500) {
      return {
        title: "Moderate Footprint",
        color: "text-amber-400",
        borderColor: "border-amber-400/25",
        bg: "bg-amber-400/5",
        desc: "Standard consumer profile. Mixed travel (some public transit, some driving), balanced diet, and average utility usage.",
        badge: "🌤️ Average Impact",
      };
    } else {
      return {
        title: "Industrial Heavy-Impact",
        color: "text-coral-400",
        borderColor: "border-coral-400/25",
        bg: "bg-coral-400/5",
        desc: "High emission habits. Frequent flights, regular gasoline car travel, heavy energy footprint, and high consumer spending.",
        badge: "🏭 High Impact",
      };
    }
  };

  const profile = getCarbonProfile(carbonVal);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const features = [
    {
      icon: Leaf,
      title: "3D Carbon Twin",
      desc: "Your avatar morphs based on your food, transport, and energy habits. Watch it glow clean or turn smoggy grey.",
      badge: "3D Avatar",
      accent: "sage",
    },
    {
      icon: Building2,
      title: "Carbon Twin City",
      desc: "A collective 3D simulation powered by community-wide averages. Plant trees or emit factory smog together.",
      badge: "Multiplayer",
      accent: "teal",
    },
    {
      icon: FlaskConical,
      title: "What-If Simulator",
      desc: "Toggle actions like going vegetarian or biking to immediately see their lifetime offsets and avatar previews.",
      badge: "Simulation",
      accent: "amber",
    },
    {
      icon: Bot,
      title: "AI Eco-Coach",
      desc: "Integrates with Gemini AI to review your weekly reports and give customized recommendations on reducing emissions.",
      badge: "AI Guided",
      accent: "violet",
    },
  ];

  const accentColors = {
    sage: { border: 'border-sage-400/20', text: 'text-sage-400', bg: 'bg-sage-400/8', glow: 'shadow-sage-400/5' },
    teal: { border: 'border-teal-400/20', text: 'text-teal-400', bg: 'bg-teal-400/8', glow: 'shadow-teal-400/5' },
    amber: { border: 'border-amber-400/20', text: 'text-amber-400', bg: 'bg-amber-400/8', glow: 'shadow-amber-400/5' },
    violet: { border: 'border-violet-400/20', text: 'text-violet-400', bg: 'bg-violet-400/8', glow: 'shadow-violet-400/5' },
  };

  return (
    <div className="min-h-screen bg-base-950 text-sand-100 relative overflow-hidden">
      {/* Organic background blobs */}
      <div className="blob-shape w-[700px] h-[700px] bg-sage-500/15 top-[-300px] left-[-200px]" />
      <div className="blob-shape w-[500px] h-[500px] bg-teal-500/10 bottom-[-200px] right-[-150px]" style={{ animationDelay: '-4s' }} />
      <div className="blob-shape w-[300px] h-[300px] bg-amber-500/8 top-[40%] right-[10%]" style={{ animationDelay: '-8s' }} />

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-base-950/70 border-b border-sand-100/5 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.svg"
              alt="Carbon Twin City Logo"
              className="w-9 h-9 group-hover:scale-105 transition-transform"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="font-extrabold text-[15px] tracking-tight text-sand-100">
              Carbon Twin City
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="btn-premium-secondary py-2 px-4 text-xs"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-xs text-sand-400 hover:text-sand-100 transition-colors font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-sand-300 hover:text-sand-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-premium-cta py-2 px-4 text-xs font-bold"
                >
                  <Sparkles size={13} />
                  Claim Twin
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center"
        >
          {/* Hero Content */}
          <div className="lg:col-span-6 space-y-7">
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sage-400/8 border border-sage-400/15 text-[11px] font-semibold text-sage-400"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sage-400 animate-pulse" />
              Next-Gen Carbon Twin Analytics
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-[3.5rem] font-extrabold tracking-tight leading-[1.08]"
            >
              Visualize Your Footprint. <br />
              <span className="text-gradient-eco">Shape Your World.</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-sand-400 text-lg leading-relaxed max-w-lg"
            >
              Create a personalized 3D avatar &ndash; your Carbon Twin &ndash;
              that mutates based on your daily choices. Join a shared community
              city and witness collective impact in real-time.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-3 pt-1"
            >
              <Link
                to={user ? "/dashboard" : "/register"}
                className="btn-premium-cta flex items-center gap-2"
              >
                Get Started <ArrowRight size={15} />
              </Link>
              <a
                href="#interactive-simulator"
                className="btn-premium-secondary flex items-center gap-2"
              >
                <FlaskConical size={14} /> Try the Demo
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={itemVariants}
              className="flex gap-8 pt-8"
            >
              {[
                { value: "60fps", label: "3D Graphics", color: "text-sand-100" },
                { value: "100%", label: "Interactive", color: "text-teal-400" },
                { value: "Gemini", label: "AI Guided", color: "text-sage-400" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className={`text-2xl font-extrabold ${stat.color} tracking-tight`}>{stat.value}</p>
                  <p className="text-[10px] text-sand-500 uppercase tracking-wider mt-1 font-semibold">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Simulator Card */}
          <div id="interactive-simulator" className="lg:col-span-6 scroll-mt-24">
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-lg glass-card-premium p-6 md:p-8 relative overflow-hidden">
                {/* Subtle accent glow at top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[2px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-mono text-teal-400 bg-teal-400/8 px-2 py-0.5 rounded-md border border-teal-400/15 font-bold">
                    LIVE
                  </span>
                  <h3 className="text-sm font-semibold text-sand-300">
                    Globe State Simulator
                  </h3>
                </div>

                {/* 3D Canvas */}
                <div className="h-[280px] md:h-[320px] w-full rounded-2xl bg-base-950/80 border border-sand-100/5 overflow-hidden relative">
                  <InteractiveEcoGlobe value={carbonVal} />
                </div>

                {/* Slider controls */}
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-sand-400">Simulate Footprint:</span>
                    <span
                      className={`font-mono font-bold text-lg ${profile.color}`}
                    >
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
                    className="w-full"
                    aria-label="Simulate annual carbon footprint"
                    aria-valuetext={`${carbonVal.toLocaleString()} kilograms CO₂ per year`}
                  />

                  {/* State Card */}
                  <motion.div
                    key={profile.title}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${profile.borderColor} ${profile.bg} transition-all duration-300`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <h4 className={`font-bold text-sm ${profile.color}`}>
                        {profile.title}
                      </h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sand-100/5 text-sand-300">
                        {profile.badge}
                      </span>
                    </div>
                    <p className="text-xs text-sand-400 leading-relaxed">
                      {profile.desc}
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Features Section — Alternating Editorial Layout */}
        <section className="py-24 mt-16">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <p className="eyebrow">App Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              How Carbon Twin City Works
            </h2>
            <p className="text-sand-400 text-base leading-relaxed">
              Our suite of 3D and AI tools creates a unified loop that tracks
              your real habits and projects their future consequences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((card, i) => {
              const Icon = card.icon;
              const colors = accentColors[card.accent];
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.08 }}
                  className={`group glass-card-premium p-7 flex flex-col justify-between hover:border-sand-100/12 transition-all duration-300 hover:shadow-2xl ${colors.glow}`}
                >
                  <div>
                    <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${colors.bg} border ${colors.border} mb-5`}>
                      <Icon size={20} className={colors.text} strokeWidth={1.8} />
                    </div>
                    <h3 className="text-lg font-bold text-sand-100 mb-2 group-hover:text-gradient-eco transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-sand-400 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-sand-100/5 flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>
                      {card.badge}
                    </span>
                    <ChevronRight size={14} className="text-sand-600 group-hover:text-sand-400 transition-colors" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative w-full rounded-3xl p-10 md:p-20 text-center overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-base-850 to-base-950 border border-sage-400/10 rounded-3xl" />
            <div className="absolute inset-0 bg-topo-pattern opacity-30" />
            <div className="blob-shape w-[400px] h-[400px] bg-sage-500/10 top-[-100px] left-[-100px]" />
            <div className="blob-shape w-[300px] h-[300px] bg-teal-500/8 bottom-[-80px] right-[-80px]" style={{ animationDelay: '-6s' }} />

            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Ready to Claim Your <span className="text-gradient-eco">Carbon Twin</span>?
              </h2>
              <p className="text-sand-400 text-lg max-w-xl mx-auto">
                Calculate your initial carbon budget in 2 minutes, customize your
                avatar, and start driving real-world changes.
              </p>
              <div className="pt-2">
                <Link
                  to={user ? "/dashboard" : "/register"}
                  className="btn-premium-cta inline-flex items-center gap-3 text-base px-8 py-3"
                >
                  Initialize Carbon Twin <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-sand-100/5 py-8 mt-16 text-center text-xs text-sand-500">
        <p>
          &copy; {new Date().getFullYear()} Carbon Twin City. All rights
          reserved.
        </p>
        <p className="mt-1 text-sand-600">
          Built using Three.js, React Three Fiber &amp; Gemini AI.
        </p>
      </footer>
    </div>
  );
}
