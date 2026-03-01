import { LucideIcon } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  totalIssues?: number;
  pendingCount?: number;
  inProgressCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Hostel Issues',
  subtitle = 'Public transparency dashboard',
  icon: Icon = AlertCircle,
  totalIssues,
  pendingCount,
  inProgressCount,
}) => {
  // New style header with title/subtitle
  if (title && !totalIssues) {
    return (
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="container-padded max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="text-blue-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Legacy style header with stats
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-10 md:py-14">
      <div className="container-padded max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white bg-opacity-20 rounded-lg">
            <AlertCircle size={28} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Hostel Issues</h1>
            <p className="text-blue-100 text-sm mt-1">Public transparency dashboard</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
            <div className="text-blue-100 text-xs md:text-sm font-medium mb-2">Total Issues</div>
            <div className="text-3xl md:text-4xl font-bold">{totalIssues}</div>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
            <div className="text-blue-100 text-xs md:text-sm font-medium mb-2">Pending</div>
            <div className="text-3xl md:text-4xl font-bold">{pendingCount}</div>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
            <div className="text-blue-100 text-xs md:text-sm font-medium mb-2">In Progress</div>
            <div className="text-3xl md:text-4xl font-bold">{inProgressCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
