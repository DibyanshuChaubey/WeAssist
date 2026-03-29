import { HostelEvent } from '../types/index';
import { EventTypeBadge } from './EventTypeBadge';
import { RegistrationBadge } from './RegistrationBadge';
import { Calendar, MapPin, Users } from 'lucide-react';
import { buildKeywordImageUrl, buildSeedFallbackUrl } from '../utils/imageFallback';

interface EventCardProps {
  event: HostelEvent;
  onClick?: (event: HostelEvent) => void;
}

function getEventTypeKeywords(event: HostelEvent): string[] {
  if (event.eventType === 'sports') {
    return ['sports', event.sportsType || 'match', 'athlete', 'stadium'];
  }

  if (event.eventType === 'cultural') {
    return ['cultural', 'festival', 'music', 'performance'];
  }

  return ['college event'];
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const fallbackImageUrl = buildKeywordImageUrl({
    keywords: [event.title, ...getEventTypeKeywords(event)],
    defaultKeywords: ['college event'],
    width: 800,
    height: 450,
  });
  const seededFallbackUrl = buildSeedFallbackUrl('weassist-event', 800, 450);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200/50 overflow-hidden hover:shadow-xl hover:border-blue-300/50 hover:translate-y-[-8px] transition-all duration-300 cursor-pointer h-full flex flex-col group shadow-md"
      onClick={() => onClick?.(event)}
    >
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img
          src={event.imageUrl || fallbackImageUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = seededFallbackUrl;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      {/* Header */}
      <div className="flex-1 p-5 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{event.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{event.description}</p>

        {/* Type Badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <EventTypeBadge eventType={event.eventType} sportsType={event.sportsType} />
          <RegistrationBadge status={event.registrationStatus} />
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {event.tags.slice(0, 2).map((tag: string) => (
              <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold">
                {tag}
              </span>
            ))}
            {event.tags.length > 2 && (
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold">
                +{event.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 px-5 pb-5 border-t border-gray-100 space-y-2.5">
        <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
          <Calendar size={16} className="flex-shrink-0 text-blue-600" />
          <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          {event.startTime && <span className="text-gray-500 ml-1 text-xs">{event.startTime}</span>}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
          <MapPin size={16} className="flex-shrink-0 text-purple-600" />
          <span className="line-clamp-1">{event.venue}</span>
        </div>

        {/* Registration Info */}
        {event.totalSlots && event.registrationStatus !== 'closed' && (
          <div className="flex items-center gap-3 text-sm text-gray-700 font-medium pt-1">
            <Users size={16} className="flex-shrink-0 text-green-600" />
            <span className="text-sm">
              <span className="font-bold">{event.registeredCount ?? 0}</span> / {event.totalSlots}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
