import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SalesChart } from '@/components/reports/SalesChart';
import { PopularItems } from '@/components/reports/PopularItems';
import { DailySummary } from '@/components/reports/DailySummary';
import { reportsApi } from '@/api/reports-api';

const COLORS = ['#E8731A', '#1B3A6B', '#D4A843', '#C23B22', '#10b981', '#8b5cf6'];

export function Reports() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: () => reportsApi.getSummary(),
  });

  const { data: dailySales } = useQuery({
    queryKey: ['reports', 'daily-sales'],
    queryFn: () => reportsApi.getDailySales(),
  });

  const { data: popularItems } = useQuery({
    queryKey: ['reports', 'popular-items'],
    queryFn: () => reportsApi.getPopularItems(10),
  });

  const { data: categoryRevenue } = useQuery({
    queryKey: ['reports', 'category-revenue'],
    queryFn: () => reportsApi.getCategoryRevenue(),
  });

  const { data: peakHours } = useQuery({
    queryKey: ['reports', 'peak-hours'],
    queryFn: () => reportsApi.getPeakHours(),
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-[#1e3a5f]">
        <h1 className="text-xl font-bold text-cream">Reports & Analytics</h1>
        <p className="text-sm text-cream/40 mt-0.5">Business insights and performance metrics</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <DailySummary stats={summary} isLoading={summaryLoading} />

        {/* Sales chart */}
        {dailySales && dailySales.length > 0 && <SalesChart data={dailySales} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular items */}
          {popularItems && popularItems.length > 0 && <PopularItems data={popularItems} />}

          {/* Category revenue donut */}
          {categoryRevenue && categoryRevenue.length > 0 && (
            <div className="bg-[#162a4a] border border-[#1e3a5f] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-cream mb-4">Revenue by Category</h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryRevenue}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="revenue"
                      nameKey="category_name"
                    >
                      {categoryRevenue.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {categoryRevenue.map((cat, i) => (
                  <div key={cat.category_id} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-xs text-cream/60">{cat.category_name}</span>
                    <span className="text-xs text-cream/40">({cat.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Peak hours */}
        {peakHours && peakHours.length > 0 && (
          <div className="bg-[#162a4a] border border-[#1e3a5f] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-cream mb-4">Peak Hours</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis
                    dataKey="hour"
                    stroke="#FDF6EC50"
                    tick={{ fontSize: 11, fill: '#FDF6EC80' }}
                    tickFormatter={(h: number) => `${h}:00`}
                  />
                  <YAxis
                    stroke="#FDF6EC50"
                    tick={{ fontSize: 11, fill: '#FDF6EC80' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#162a4a',
                      border: '1px solid #2a4a72',
                      borderRadius: '8px',
                      color: '#FDF6EC',
                      fontSize: '12px',
                    }}
                    labelFormatter={(h: number) => `${h}:00 - ${h + 1}:00`}
                    formatter={(value: number, name: string) => [
                      name === 'orders' ? `${value} orders` : `\u20AC${value.toFixed(2)}`,
                      name === 'orders' ? 'Orders' : 'Revenue',
                    ]}
                  />
                  <Bar dataKey="orders" fill="#1B3A6B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" fill="#E8731A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Empty state when no data */}
        {!dailySales?.length && !popularItems?.length && !categoryRevenue?.length && !summaryLoading && (
          <div className="text-center py-16 text-cream/30">
            <p className="text-lg font-medium">No data available yet</p>
            <p className="text-sm mt-1">Start taking orders to see reports and analytics</p>
          </div>
        )}
      </div>
    </div>
  );
}
