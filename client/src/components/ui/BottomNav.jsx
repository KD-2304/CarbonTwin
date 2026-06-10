import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: '🌿' },
  { path: '/city', label: 'City', icon: '🏙️' },
  { path: '/leaderboard', label: 'Rank', icon: '🏆' },
  { path: '/simulator', label: 'What-If', icon: '🔮' },
  { path: '/reports', label: 'Reports', icon: '📊' },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d1321]/95 backdrop-blur-lg border-t border-[#1f2937]">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                isActive
                  ? 'text-green-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
