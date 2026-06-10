import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function ScoreHistory({ snapshots = [] }) {
  const data = snapshots.map(s => ({
    date: new Date(s.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    score: Math.round(s.score),
  }));

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">
        Not enough data yet — keep logging!
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card px-3 py-2 text-sm">
          <p className="text-gray-400">{label}</p>
          <p className="text-white font-medium">{payload[0].value.toLocaleString()} kg CO₂/yr</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#1f2937' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={45}
          tickFormatter={v => `${(v / 1000).toFixed(1)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#scoreGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
