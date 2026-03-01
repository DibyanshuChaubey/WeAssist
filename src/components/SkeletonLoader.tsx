// Loading skeleton for cards
export const IssueCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
      {/* Title */}
      <div className="h-5 bg-gray-200 rounded mb-3 w-3/4" />

      {/* Description */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-200 rounded-full w-20" />
        <div className="h-6 bg-gray-200 rounded-full w-16" />
        <div className="h-6 bg-gray-200 rounded-full w-24" />
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-100 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
};

// Loading skeleton for event cards
export const EventCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
      {/* Title */}
      <div className="h-5 bg-gray-200 rounded mb-3 w-3/4" />

      {/* Description */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-200 rounded-full w-20" />
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-100 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/5" />
      </div>
    </div>
  );
};

// Loading skeleton grid
export const SkeletonGrid: React.FC<{ count?: number; type?: 'issue' | 'event' }> = ({ count = 6, type = 'issue' }) => {
  const Skeleton = type === 'issue' ? IssueCardSkeleton : EventCardSkeleton;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
};
