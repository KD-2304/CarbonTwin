import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: 'D' },
  { path: '/city', label: 'City', icon: 'C' },
  { path: '/leaderboard', label: 'Rank', icon: 'L' },
  { path: '/simulator', label: 'Sim', icon: 'S' },
  { path: '/reports', label: 'Reports', icon: 'R' },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07110f]/95 px-2 pb-2 pt-2 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-all ${
                isActive
                  ? 'bg-leaf-500/12 text-leaf-400'
                  : 'text-mist-500 hover:bg-white/[0.04] hover:text-white'
              }`
            }
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 text-[10px] font-black">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
