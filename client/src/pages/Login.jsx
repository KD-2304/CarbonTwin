import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (!user.onboardingComplete) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-950 px-4 py-8 text-sand-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="blob-shape w-[500px] h-[500px] bg-sage-500/8 top-[-150px] left-[-100px]" />
      <div className="blob-shape w-[400px] h-[400px] bg-teal-500/6 bottom-[-100px] right-[-100px]" style={{ animationDelay: '-5s' }} />

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl grid-cols-1 overflow-hidden rounded-2xl border border-sand-100/6 bg-base-900/70 shadow-2xl backdrop-blur-sm lg:grid-cols-[1fr_480px]">
        {/* Left Panel — Topographic illustration */}
        <section className="hidden bg-topo-pattern relative p-10 lg:flex lg:flex-col lg:justify-between overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sage-600/10 to-transparent" />

          <Link to="/" className="flex items-center gap-3 relative z-10">
            <img src="/logo.svg" alt="Carbon Twin City Logo" className="h-10 w-10" />
            <div>
              <p className="font-extrabold text-sand-100 text-[15px]">Carbon Twin City</p>
              <p className="text-[11px] text-sand-500">Personal climate cockpit</p>
            </div>
          </Link>

          <div className="max-w-lg relative z-10">
            <p className="eyebrow">Welcome back</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight">
              Return to your <span className="text-gradient-eco">carbon workspace</span>.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-sand-400">
              Review your footprint, log daily choices, and keep your twin moving in the right direction.
            </p>
          </div>

          <p className="text-[11px] text-sand-500 relative z-10 font-mono">Demo: demo@carbontwin.city / password123</p>
        </section>

        {/* Right Panel — Form */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center p-6 sm:p-10 border-l border-sand-100/5"
        >
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <img src="/logo.svg" alt="Carbon Twin City Logo" className="mb-4 h-10 w-10" />
              <h1 className="text-xl font-extrabold text-sand-100">Carbon Twin City</h1>
            </div>

            <p className="eyebrow">Sign in</p>
            <h2 className="mt-2 text-2xl font-extrabold text-sand-100 tracking-tight">Access your dashboard</h2>
            <p className="mt-2 text-sm text-sand-500">Track your impact and continue your weekly progress.</p>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-5 rounded-xl border border-coral-400/25 bg-coral-400/8 p-3 text-sm text-coral-400"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold text-sand-300 uppercase tracking-wider">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold text-sand-300 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-500 hover:text-sand-300 transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 gap-2">
                {loading ? 'Signing in...' : <>Sign In <ArrowRight size={15} /></>}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-sand-500">
              Do not have an account?{' '}
              <Link to="/register" className="font-semibold text-sage-400 hover:text-sage-300 transition-colors">
                Create one
              </Link>
            </p>
            <p className="mt-3 text-center text-[11px] text-sand-600 lg:hidden font-mono">
              Demo: demo@carbontwin.city / password123
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
