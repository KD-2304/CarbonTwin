import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '🌿' },
  { path: '/city', label: 'Carbon City', icon: '🏙️' },
  { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { path: '/simulator', label: 'What-If', icon: '🔮' },
  { path: '/reports', label: 'Reports', icon: '📊' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="hidden md:flex flex-col w-[260px] h-screen bg-[#0d1321] border-r border-[#1f2937] shrink-0 sticky top-0"
    >
      {/* Logo */}
      <div className="p-6 border-b border-[#1f2937]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-500/20">
            C
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Carbon Twin</h1>
            <p className="text-gray-500 text-xs">City Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#1f2937]/50'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-[#1f2937]">
        <div className="glass-card p-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full btn-secondary text-sm py-2 flex items-center justify-center gap-2"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </motion.aside>
  );
}
