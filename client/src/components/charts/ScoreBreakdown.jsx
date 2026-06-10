import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444'];
const LABELS = {
  transport: 'Transport',
  diet: 'Diet',
  energy: 'Energy',
  shopping: 'Shopping',
  flights: 'Flights'
};

export default function ScoreBreakdown({ breakdown = {} }) {
  const data = Object.entries(breakdown)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: LABELS[key] || key,
      value: Math.round(value),
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-gray-500 text-sm">
        No breakdown data available
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const item = payload[0];
      const pct = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="glass-card px-3 py-2 text-sm">
          <p className="text-white font-medium">{item.name}</p>
          <p className="text-gray-400">{item.value.toLocaleString()} kg CO₂/yr ({pct}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
