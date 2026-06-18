import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#7cb77f', '#4db8a4', '#e5a548', '#9b8ce6', '#e06c5d'];
const LABELS = {
  transport: 'Transport',
  diet: 'Diet',
  energy: 'Energy',
  shopping: 'Shopping',
  flights: 'Flights'
};

function BreakdownTooltip({ active, payload, total }) {
  if (active && payload?.length) {
    const item = payload[0];
    const pct = ((item.value / total) * 100).toFixed(1);
    return (
      <div className="glass-card px-3 py-2 text-sm">
        <p className="text-sand-100 font-semibold">{item.name}</p>
        <p className="text-sand-400">{item.value.toLocaleString()} kg CO2/yr ({pct}%)</p>
      </div>
    );
  }
  return null;
}

export default function ScoreBreakdown({ breakdown = {} }) {
  const data = Object.entries(breakdown)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: LABELS[key] || key,
      value: Math.round(value),
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-sand-500 text-sm">
        No breakdown data available
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

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
        <Tooltip content={<BreakdownTooltip total={total} />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px', color: '#918a7e' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
