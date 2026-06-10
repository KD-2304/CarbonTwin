import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', city: '', country: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07110f] px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl grid-cols-1 overflow-hidden rounded-lg border border-white/10 bg-[#10201d]/70 shadow-2xl lg:grid-cols-[1fr_500px]">
        <section className="hidden bg-grid-overlay p-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="Carbon Twin City Logo" className="h-11 w-11" />
            <div>
              <p className="font-black">Carbon Twin City</p>
              <p className="text-xs text-mist-500">Personal climate cockpit</p>
            </div>
          </Link>
          <div className="max-w-xl">
            <p className="eyebrow">Create profile</p>
            <h1 className="mt-3 text-5xl font-black leading-tight">Build a twin from your real habits.</h1>
            <p className="mt-5 text-lg leading-relaxed text-mist-500">
              Start with a short baseline quiz, then use the dashboard to track and improve your footprint over time.
            </p>
          </div>
          <p className="text-xs text-mist-500">Your city and country help personalize the community view.</p>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center justify-center p-6 sm:p-10"
        >
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <img src="/logo.svg" alt="Carbon Twin City Logo" className="mb-4 h-12 w-12" />
              <h1 className="text-2xl font-black">Carbon Twin City</h1>
            </div>
            <p className="eyebrow">Register</p>
            <h2 className="mt-2 text-3xl font-black text-white">Create your account</h2>
            <p className="mt-2 text-sm text-mist-500">Set up your profile before calculating your baseline.</p>

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
                <label className="mb-1.5 block text-sm font-semibold text-gray-300">Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="Your full name" required />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-300">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="you@example.com" required />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-300">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="At least 6 characters" minLength={6} required />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-300">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field" placeholder="Your city" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-300">Country</label>
                  <input type="text" name="country" value={formData.country} onChange={handleChange} className="input-field" placeholder="Your country" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-mist-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-leaf-400 hover:text-leaf-300">
                Sign in
              </Link>
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
