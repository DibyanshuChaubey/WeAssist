import { Status } from '../types/index';

interface StatusBadgeProps {
  status?: Status | string;
}

const statusConfig: Record<Status, { bg: string; text: string; label: string }> = {
  reported: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    label: 'Reported',
  },
  in_progress: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    label: 'In Progress',
  },
  resolved_by_admin: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: 'Resolved by Admin',
  },
  closed: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: 'Closed',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  // Handle undefined or invalid status values
  const normalizedStatus = (
    status?.toLowerCase()?.replace(/[- ]/g, '_') || 'reported'
  ) as Status;
  const config = statusConfig[normalizedStatus] || statusConfig.reported;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

