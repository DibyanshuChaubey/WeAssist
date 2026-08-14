// Loading skeleton for cards
export const IssueCardSkeleton: React.FC = () => {
  return (
    <div className="ios-card animate-pulse bg-white/70">
      <div className="h-5 bg-slate-200/90 rounded-xl mb-3 w-3/4" />

      <div className="space-y-2 mb-4">
        <div className="h-4 bg-slate-200/90 rounded-lg w-full" />
        <div className="h-4 bg-slate-200/90 rounded-lg w-5/6" />
      </div>

      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-slate-200/90 rounded-full w-20" />
        <div className="h-6 bg-slate-200/90 rounded-full w-16" />
        <div className="h-6 bg-slate-200/90 rounded-full w-24" />
      </div>

      <div className="pt-4 border-t border-slate-200/70 space-y-2">
        <div className="h-4 bg-slate-200/90 rounded-lg w-1/2" />
        <div className="h-4 bg-slate-200/90 rounded-lg w-2/3" />
      </div>
    </div>
  );
};

// Loading skeleton for event cards
export const EventCardSkeleton: React.FC = () => {
  return (
    <div className="ios-card animate-pulse bg-white/70">
      <div className="h-5 bg-slate-200/90 rounded-xl mb-3 w-3/4" />

      <div className="space-y-2 mb-4">
        <div className="h-4 bg-slate-200/90 rounded-lg w-full" />
        <div className="h-4 bg-slate-200/90 rounded-lg w-5/6" />
      </div>

      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-slate-200/90 rounded-full w-20" />
        <div className="h-6 bg-slate-200/90 rounded-full w-20" />
      </div>

      <div className="pt-4 border-t border-slate-200/70 space-y-2">
        <div className="h-4 bg-slate-200/90 rounded-lg w-2/3" />
        <div className="h-4 bg-slate-200/90 rounded-lg w-1/2" />
        <div className="h-4 bg-slate-200/90 rounded-lg w-2/5" />
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
