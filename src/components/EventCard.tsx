import { HostelEvent } from '../types/index';
import { EventTypeBadge } from './EventTypeBadge';
import { RegistrationBadge } from './RegistrationBadge';
import { Calendar, MapPin, Users } from 'lucide-react';

interface EventCardProps {
  event: HostelEvent;
  onClick?: (event: HostelEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer h-full flex flex-col"
      onClick={() => onClick?.(event)}
    >
      {event.imageUrl && (
        <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-40 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex-1">
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{event.description}</p>
      </div>

      {/* Type Badges */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <EventTypeBadge eventType={event.eventType} sportsType={event.sportsType} />
        <RegistrationBadge status={event.registrationStatus} />
      </div>

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {event.tags.slice(0, 2).map((tag: string) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
              {tag}
            </span>
          ))}
          {event.tags.length > 2 && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
              +{event.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-100 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={14} className="flex-shrink-0" />
          <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          {event.startTime && <span className="text-gray-400 ml-1">{event.startTime}</span>}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={14} className="flex-shrink-0" />
          <span className="line-clamp-1">{event.venue}</span>
        </div>

        {/* Registration Info */}
        {event.totalSlots && event.registrationStatus !== 'closed' && (
          <div className="flex items-center gap-2 text-sm text-gray-600 pt-1">
            <Users size={14} className="flex-shrink-0" />
            <span>
              {event.registeredCount ?? 0} / {event.totalSlots}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
