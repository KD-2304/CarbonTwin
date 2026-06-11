import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Trophy, FlaskConical, FileBarChart } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/city', label: 'City', icon: Building2 },
  { path: '/leaderboard', label: 'Rank', icon: Trophy },
  { path: '/simulator', label: 'Sim', icon: FlaskConical },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-sand-100/5 bg-base-950/90 px-3 pb-2 pt-1.5 backdrop-blur-2xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-all ${
                  isActive
                    ? 'text-sage-400'
                    : 'text-sand-500 hover:text-sand-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="bottomNavDot"
                      className="absolute -top-1 h-1 w-5 rounded-full bg-sage-400"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
