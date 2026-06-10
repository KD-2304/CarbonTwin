import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'D' },
  { path: '/city', label: 'City View', icon: 'C' },
  { path: '/leaderboard', label: 'Leaderboard', icon: 'L' },
  { path: '/simulator', label: 'Simulator', icon: 'S' },
  { path: '/reports', label: 'Reports', icon: 'R' },
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
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 110, damping: 22 }}
      className="hidden md:flex h-screen w-[280px] shrink-0 flex-col sticky top-0 border-r border-white/8 bg-[#07110f]/92 backdrop-blur-xl"
    >
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Carbon Twin Logo" className="h-11 w-11" />
          <div className="min-w-0">
            <p className="text-white font-black leading-tight">Carbon Twin</p>
            <p className="text-xs text-mist-500">Personal climate cockpit</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        <p className="meta-label px-3 pb-3">Workspace</p>
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-leaf-500/12 text-leaf-400 ring-1 ring-leaf-400/20'
                    : 'text-[#95aaa2] hover:bg-white/[0.04] hover:text-white'
                }`
              }
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-xs font-black">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-4">
        <div className="surface-soft p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-leaf-500 to-aqua-400 font-black text-white">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name || 'User'}</p>
              <p className="truncate text-xs text-mist-500">{user?.email || ''}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary mt-3 w-full text-sm">
            Sign Out
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
