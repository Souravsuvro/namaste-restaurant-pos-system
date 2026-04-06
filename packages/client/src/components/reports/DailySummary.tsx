import { DollarSign, ShoppingCart, TrendingUp, RotateCcw } from 'lucide-react';
import type { SummaryStats } from '@/api/reports-api';

interface DailySummaryProps {
  stats: SummaryStats | undefined;
  isLoading: boolean;
}

const cards = [
  {
    key: 'total_revenue' as const,
    label: 'Total Revenue',
    icon: DollarSign,
    color: 'text-saffron',
    bgColor: 'bg-saffron/10',
    format: (v: number) => `\u20AC${v.toFixed(2)}`,
  },
  {
    key: 'orders_today' as const,
    label: 'Orders Today',
    icon: ShoppingCart,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    format: (v: number) => String(v),
  },
  {
    key: 'avg_order_value' as const,
    label: 'Avg Order Value',
    icon: TrendingUp,
    color: 'text-gold',
    bgColor: 'bg-gold/10',
    format: (v: number) => `\u20AC${v.toFixed(2)}`,
  },
  {
    key: 'table_turnover' as const,
    label: 'Table Turnover',
    icon: RotateCcw,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    format: (v: number) => `${v.toFixed(1)}x`,
  },
];

export function DailySummary({ stats, isLoading }: DailySummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats?.[card.key] ?? 0;

        return (
          <div
            key={card.key}
            className="bg-[#162a4a] border border-[#1e3a5f] rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <Icon size={20} className={card.color} />
              </div>
              <span className="text-xs text-cream/50 font-medium">{card.label}</span>
            </div>
            {isLoading ? (
              <div className="h-8 bg-[#0f1f3d] rounded animate-pulse" />
            ) : (
              <p className={`text-2xl font-bold ${card.color}`}>{card.format(value)}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
