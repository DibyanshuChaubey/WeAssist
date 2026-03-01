import { Priority } from '../types/index';
import { AlertCircle } from 'lucide-react';

interface PriorityChipProps {
  priority?: Priority | string;
}

const priorityConfig: Record<Priority, { bg: string; text: string; icon: boolean; label: string }> = {
  high: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: true,
    label: 'High',
  },
  medium: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    icon: false,
    label: 'Medium',
  },
  low: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    icon: false,
    label: 'Low',
  },
};

export const PriorityChip: React.FC<PriorityChipProps> = ({ priority }) => {
  // Handle undefined or invalid priority values
  const normalizedPriority = priority?.toLowerCase() as Priority;
  const config = priorityConfig[normalizedPriority] || priorityConfig.low;

  return (
    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold ${config.bg} ${config.text}`}>
      {config.icon && <AlertCircle size={16} />}
      {config.label}
    </div>
  );
};
