import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-[#07110f] px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl grid-cols-1 overflow-hidden rounded-lg border border-white/10 bg-[#10201d]/70 shadow-2xl lg:grid-cols-[1fr_460px]">
        <section className="hidden bg-grid-overlay p-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="Carbon Twin City Logo" className="h-11 w-11" />
            <div>
              <p className="font-black">Carbon Twin City</p>
              <p className="text-xs text-mist-500">Personal climate cockpit</p>
            </div>
          </Link>
          <div className="max-w-xl">
            <p className="eyebrow">Welcome back</p>
            <h1 className="mt-3 text-5xl font-black leading-tight">Return to your carbon workspace.</h1>
            <p className="mt-5 text-lg leading-relaxed text-mist-500">
              Review your footprint, log daily choices, and keep your twin moving in the right direction.
            </p>
          </div>
          <p className="text-xs text-mist-500">Demo: demo@carbontwin.city / password123</p>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center justify-center p-6 sm:p-10"
        >
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <img src="/logo.svg" alt="Carbon Twin City Logo" className="mb-4 h-12 w-12" />
              <h1 className="text-2xl font-black">Carbon Twin City</h1>
            </div>
            <p className="eyebrow">Sign in</p>
            <h2 className="mt-2 text-3xl font-black text-white">Access your dashboard</h2>
            <p className="mt-2 text-sm text-mist-500">Track your impact and continue your weekly progress.</p>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-5 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-400"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter password"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-mist-500">
              Do not have an account?{' '}
              <Link to="/register" className="font-semibold text-leaf-400 hover:text-leaf-300">
                Create one
              </Link>
            </p>
            <p className="mt-4 text-center text-xs text-mist-500 lg:hidden">
              Demo: demo@carbontwin.city / password123
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
