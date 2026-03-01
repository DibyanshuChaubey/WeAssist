import { EventType, SportsType } from '../types/index';
import { Music, Trophy } from 'lucide-react';

interface EventTypeBadgeProps {
  eventType: EventType;
  sportsType?: SportsType;
}

const eventTypeConfig: Record<EventType, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  cultural: {
    icon: <Music size={16} />,
    label: 'Cultural',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
  sports: {
    icon: <Trophy size={16} />,
    label: 'Sports',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
};

const sportsTypeConfig: Record<SportsType, string> = {
  cricket: 'Cricket',
  badminton: 'Badminton',
  volleyball: 'Volleyball',
  football: 'Football',
  'table-tennis': 'Table Tennis',
  basketball: 'Basketball',
  other: 'Sports',
};

export const EventTypeBadge: React.FC<EventTypeBadgeProps> = ({ eventType, sportsType }) => {
  const config = eventTypeConfig[eventType];

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
      {config.icon}
      {eventType === 'sports' && sportsType ? sportsTypeConfig[sportsType] : config.label}
    </div>
  );
};
