import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function ScoreHistory({ snapshots = [] }) {
  const data = snapshots.map(s => ({
    date: new Date(s.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    score: Math.round(s.score),
  }));

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sand-500 text-sm">
        Not enough data yet — keep logging!
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card px-3 py-2 text-sm">
          <p className="text-sand-500">{label}</p>
          <p className="text-sand-100 font-semibold">{payload[0].value.toLocaleString()} kg CO₂/yr</p>
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
            <stop offset="5%" stopColor="#7cb77f" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#7cb77f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fill: '#6e685e', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#22262f' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#6e685e', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={45}
          tickFormatter={v => `${(v / 1000).toFixed(1)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#7cb77f"
          strokeWidth={2}
          fill="url(#scoreGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#7cb77f', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
