import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  onReset?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, onReset }) => {
  return (
    <div className="ios-card text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/80 border border-slate-200/70 mb-4">
        <AlertCircle className="text-slate-400" size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6 max-w-sm mx-auto">{description}</p>
      {onReset && (
        <button onClick={onReset} className="btn-primary">
          Clear Filters
        </button>
      )}
    </div>
  );
};
