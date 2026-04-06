import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailySales } from '@/api/reports-api';

interface SalesChartProps {
  data: DailySales[];
}

export function SalesChart({ data }: SalesChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    }),
  }));

  return (
    <div className="bg-[#162a4a] border border-[#1e3a5f] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-cream mb-4">Daily Revenue</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis
              dataKey="date"
              stroke="#FDF6EC50"
              tick={{ fontSize: 11, fill: '#FDF6EC80' }}
            />
            <YAxis
              stroke="#FDF6EC50"
              tick={{ fontSize: 11, fill: '#FDF6EC80' }}
              tickFormatter={(v: number) => `\u20AC${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#162a4a',
                border: '1px solid #2a4a72',
                borderRadius: '8px',
                color: '#FDF6EC',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`\u20AC${value.toFixed(2)}`, 'Revenue']}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#E8731A"
              strokeWidth={2}
              dot={{ fill: '#E8731A', r: 4 }}
              activeDot={{ r: 6, fill: '#E8731A' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
