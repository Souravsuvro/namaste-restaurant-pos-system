import type { TableStatus as TStatus } from '@/types/table';

interface TableStatusProps {
  status: TStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<TStatus, { color: string; bg: string; label: string }> = {
  available: { color: 'bg-emerald-400', bg: 'bg-emerald-400/20', label: 'Available' },
  occupied: { color: 'bg-saffron', bg: 'bg-saffron/20', label: 'Occupied' },
  reserved: { color: 'bg-indigo', bg: 'bg-indigo/20', label: 'Reserved' },
  needs_cleaning: { color: 'bg-tandoori', bg: 'bg-tandoori/20', label: 'Needs Cleaning' },
};

export function TableStatusIndicator({ status, showLabel = false, size = 'md' }: TableStatusProps) {
  const config = statusConfig[status];
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <div className="flex items-center gap-1.5">
      <span className={`${dotSize} rounded-full ${config.color} animate-pulse`} />
      {showLabel && (
        <span className="text-xs font-medium text-cream/70">{config.label}</span>
      )}
    </div>
  );
}

export function TableStatusLegend() {
  return (
    <div className="flex items-center gap-4">
      {(Object.entries(statusConfig) as [TStatus, typeof statusConfig[TStatus]][]).map(
        ([status, config]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
            <span className="text-xs text-cream/60">{config.label}</span>
          </div>
        )
      )}
    </div>
  );
}
