import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  startTime: string;
  className?: string;
}

export function Timer({ startTime, className = '' }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();

    const update = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  let colorClass = 'text-emerald-400';
  if (minutes >= 20) {
    colorClass = 'text-tandoori';
  } else if (minutes >= 10) {
    colorClass = 'text-gold';
  }

  return (
    <div className={`flex items-center gap-1.5 ${colorClass} ${className}`}>
      <Clock size={14} />
      <span className="text-sm font-mono font-bold tabular-nums">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
