import { RegistrationStatus } from '../types/index';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface RegistrationBadgeProps {
  status: RegistrationStatus;
}

const statusConfig: Record<RegistrationStatus, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  open: {
    icon: <CheckCircle size={14} />,
    label: 'Open',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  closed: {
    icon: <XCircle size={14} />,
    label: 'Closed',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  upcoming: {
    icon: <Clock size={14} />,
    label: 'Upcoming',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
};

export const RegistrationBadge: React.FC<RegistrationBadgeProps> = ({ status }) => {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};
