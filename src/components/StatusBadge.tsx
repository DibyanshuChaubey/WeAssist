import { Status } from '../types/index';

interface StatusBadgeProps {
  status?: Status | string;
}

const statusConfig: Record<Status, { badge: string; text: string; label: string }> = {
  reported: {
    badge: 'bg-rose-50/90 text-rose-700 ring-1 ring-inset ring-rose-200/80',
    text: 'text-rose-700',
    label: 'Reported',
  },
  in_progress: {
    badge: 'bg-blue-50/90 text-blue-700 ring-1 ring-inset ring-blue-200/80',
    text: 'text-blue-700',
    label: 'In Progress',
  },
  resolved_by_admin: {
    badge: 'bg-amber-50/90 text-amber-700 ring-1 ring-inset ring-amber-200/80',
    text: 'text-amber-700',
    label: 'Resolved by Admin',
  },
  closed: {
    badge: 'bg-emerald-50/90 text-emerald-700 ring-1 ring-inset ring-emerald-200/80',
    text: 'text-emerald-700',
    label: 'Closed',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalizedStatus = (
    status?.toLowerCase()?.replace(/[- ]/g, '_') || 'reported'
  ) as Status;
  const config = statusConfig[normalizedStatus] || statusConfig.reported;

  return (
    <span className={`glass-pill text-xs sm:text-sm ${config.badge}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {config.label}
    </span>
  );
};

