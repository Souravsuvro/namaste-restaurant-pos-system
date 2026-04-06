import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PopularItem } from '@/api/reports-api';

interface PopularItemsProps {
  data: PopularItem[];
}

export function PopularItems({ data }: PopularItemsProps) {
  const sortedData = [...data].sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  return (
    <div className="bg-[#162a4a] border border-[#1e3a5f] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-cream mb-4">Top 10 Popular Items</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="vertical" margin={{ left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" horizontal={false} />
            <XAxis
              type="number"
              stroke="#FDF6EC50"
              tick={{ fontSize: 11, fill: '#FDF6EC80' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#FDF6EC50"
              tick={{ fontSize: 11, fill: '#FDF6EC80' }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#162a4a',
                border: '1px solid #2a4a72',
                borderRadius: '8px',
                color: '#FDF6EC',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => [
                name === 'quantity' ? `${value} sold` : `\u20AC${value.toFixed(2)}`,
                name === 'quantity' ? 'Quantity' : 'Revenue',
              ]}
            />
            <Bar dataKey="quantity" fill="#E8731A" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
