import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  onReset?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, onReset }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        <AlertCircle className="text-gray-400" size={32} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{description}</p>
      {onReset && (
        <button onClick={onReset} className="btn-primary">
          Clear Filters
        </button>
      )}
    </div>
  );
};
