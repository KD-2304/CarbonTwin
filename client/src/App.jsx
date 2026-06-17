import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ScoreProvider } from './context/ScoreContext';
import { registerNavigate } from './api/axios';
import ProtectedRoute from './components/ui/ProtectedRoute';
import Sidebar from './components/ui/Sidebar';
import BottomNav from './components/ui/BottomNav';

// Eagerly loaded lightweight pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy-loaded heavy pages (3D/chart bundles deferred until needed)
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const City = lazy(() => import('./pages/City'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Simulator = lazy(() => import('./pages/Simulator'));
const Reports = lazy(() => import('./pages/Reports'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-sage-400/20 border-t-sage-400 rounded-full animate-spin" />
        <p className="text-sand-500 text-sm font-medium">Loading…</p>
      </div>
    </div>
  );
}

function AppLayout({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  // Don't show nav on auth/onboarding/landing pages
  const isLandingPage = location.pathname === '/';
  if (!user || !user.onboardingComplete || isLandingPage) {
    return <main id="main-content" className="w-full min-h-screen bg-base-950 overflow-x-hidden relative">{children}</main>;
  }

  return (
    <ScoreProvider>
      <div className="app-shell flex relative">
        <Sidebar />
        <main id="main-content" className="app-main overflow-x-hidden relative">
          {children}
        </main>
        <BottomNav />
      </div>
    </ScoreProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    registerNavigate(navigate);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sage-400/20 border-t-sage-400 rounded-full animate-spin" />
          <p className="text-sand-500 text-sm font-medium">Loading Carbon Twin City...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public routes */}
            <Route path='/' element={<Landing />}/>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

            {/* Onboarding */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                {user && !user.onboardingComplete ? <Navigate to="/onboarding" /> : <Dashboard />}
              </ProtectedRoute>
            } />
            <Route path="/city" element={
              <ProtectedRoute><City /></ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute><Leaderboard /></ProtectedRoute>
            } />
            <Route path="/simulator" element={
              <ProtectedRoute><Simulator /></ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute><Reports /></ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
