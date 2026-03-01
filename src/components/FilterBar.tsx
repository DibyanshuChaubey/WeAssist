import { Status, Priority, Category } from '../types/index';
import { Search, X } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: Status | 'all';
  onStatusChange: (status: Status | 'all') => void;
  selectedPriority: Priority | 'all';
  onPriorityChange: (priority: Priority | 'all') => void;
  selectedCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
  onReset: () => void;
}

const statuses: Array<Status | 'all'> = ['all', 'reported', 'in_progress', 'resolved_by_admin', 'closed'];
const priorities: Array<Priority | 'all'> = ['all', 'high', 'medium', 'low'];
const categories: Array<Category | 'all'> = ['all', 'plumbing', 'wifi', 'electrical', 'cleanliness', 'maintenance', 'security', 'other'];

const getStatusLabel = (status: Status | 'all') => {
  const labels: Record<Status | 'all', string> = {
    all: 'All Status',
    reported: 'Reported',
    in_progress: 'In Progress',
    resolved_by_admin: 'Resolved by Admin',
    closed: 'Closed',
  };
  return labels[status];
};

const getPriorityLabel = (priority: Priority | 'all') => {
  const labels: Record<Priority | 'all', string> = {
    all: 'All Priority',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return labels[priority];
};

const getCategoryLabel = (category: Category | 'all') => {
  const labels: Record<Category | 'all', string> = {
    all: 'All Categories',
    plumbing: 'Plumbing',
    wifi: 'WiFi',
    electrical: 'Electrical',
    cleanliness: 'Cleanliness',
    maintenance: 'Maintenance',
    security: 'Security',
    other: 'Other',
  };
  return labels[category];
};

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  selectedCategory,
  onCategoryChange,
  onReset,
}) => {
  const isFiltered = searchQuery || selectedStatus !== 'all' || selectedPriority !== 'all' || selectedCategory !== 'all';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by title, description, or reporter name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as Status | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value as Priority | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {getPriorityLabel(priority)}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value as Category | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {getCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            disabled={!isFiltered}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X size={16} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
