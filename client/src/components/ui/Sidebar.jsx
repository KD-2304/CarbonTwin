import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/useAuth';
import { LayoutDashboard, Building2, Trophy, FlaskConical, FileBarChart, LogOut } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/city', label: 'City View', icon: Building2 },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/simulator', label: 'Simulator', icon: FlaskConical },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
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
      className="hidden md:flex h-screen w-[272px] shrink-0 flex-col sticky top-0 border-r border-sand-100/5 bg-base-900/95 backdrop-blur-xl"
    >
      {/* Logo */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src="/logo.svg" alt="Carbon Twin Logo" className="h-10 w-10" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-sage-400 ring-2 ring-base-900" />
          </div>
          <div className="min-w-0">
            <p className="text-sand-100 font-extrabold text-[15px] leading-tight tracking-tight">Carbon Twin</p>
            <p className="text-[11px] text-sand-500 font-medium">Climate cockpit</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-sand-100/5" />

      {/* Navigation */}
      <nav role="navigation" aria-label="Main Navigation" className="flex-1 px-3 py-4">
        <p className="meta-label px-3 pb-3">Workspace</p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                aria-label={`Navigate to ${item.label}`}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-sage-400/10 text-sage-400 shadow-[inset_3px_0_0_0_#7cb77f]'
                      : 'text-sand-400 hover:bg-sand-100/[0.03] hover:text-sand-200'
                  }`
                }
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand-100/[0.04] transition-colors group-hover:bg-sand-100/[0.07]">
                  <Icon size={16} strokeWidth={2} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User section */}
      <div className="p-4">
        <div className="surface-soft p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sage-400 to-teal-400 font-bold text-white text-sm ring-2 ring-sage-400/20">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sand-100">{user?.name || 'User'}</p>
              <p className="truncate text-xs text-sand-500">{user?.email || ''}</p>
            </div>
          </div>
          <button onClick={handleLogout} aria-label="Sign Out of Carbon Twin" className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-sand-100/8 bg-sand-100/[0.03] py-2 text-xs font-semibold text-sand-400 hover:bg-sand-100/[0.06] hover:text-sand-200 transition-all">
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </div>

    </motion.aside>
  );
}
