import { Priority } from '../types/index';
import { AlertCircle } from 'lucide-react';

interface PriorityChipProps {
  priority?: Priority | string;
}

const priorityConfig: Record<Priority, { badge: string; label: string; icon: boolean }> = {
  high: {
    badge: 'bg-rose-50/90 text-rose-700 ring-1 ring-inset ring-rose-200/80',
    label: 'High',
    icon: true,
  },
  medium: {
    badge: 'bg-amber-50/90 text-amber-700 ring-1 ring-inset ring-amber-200/80',
    label: 'Medium',
    icon: false,
  },
  low: {
    badge: 'bg-slate-50/90 text-slate-700 ring-1 ring-inset ring-slate-200/80',
    label: 'Low',
    icon: false,
  },
};

export const PriorityChip: React.FC<PriorityChipProps> = ({ priority }) => {
  const normalizedPriority = priority?.toLowerCase() as Priority;
  const config = priorityConfig[normalizedPriority] || priorityConfig.low;

  return (
    <span className={`glass-pill text-xs sm:text-sm ${config.badge}`}>
      {config.icon && <AlertCircle size={14} className="shrink-0" />}
      {config.label}
    </span>
  );
};
