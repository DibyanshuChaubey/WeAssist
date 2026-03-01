import { Category } from '../types/index';
import {
  Droplet,
  Wifi,
  Zap,
  Sofa,
  Wrench,
  Lock,
  Tag,
} from 'lucide-react';

interface CategoryTagProps {
  category?: Category | string;
  variant?: 'outlined' | 'filled';
  size?: 'sm' | 'md';
}

const categoryConfig: Record<Category, { icon: React.ReactNode; label: string; colorBg: string; colorBorder: string; colorText: string }> = {
  plumbing: {
    icon: <Droplet size={14} />,
    label: 'Plumbing',
    colorBg: 'bg-cyan-50',
    colorBorder: 'border-cyan-200',
    colorText: 'text-cyan-700',
  },
  wifi: {
    icon: <Wifi size={14} />,
    label: 'WiFi',
    colorBg: 'bg-blue-50',
    colorBorder: 'border-blue-200',
    colorText: 'text-blue-700',
  },
  electrical: {
    icon: <Zap size={14} />,
    label: 'Electrical',
    colorBg: 'bg-amber-50',
    colorBorder: 'border-amber-200',
    colorText: 'text-amber-700',
  },
  cleanliness: {
    icon: <Sofa size={14} />,
    label: 'Cleanliness',
    colorBg: 'bg-purple-50',
    colorBorder: 'border-purple-200',
    colorText: 'text-purple-700',
  },
  maintenance: {
    icon: <Wrench size={14} />,
    label: 'Maintenance',
    colorBg: 'bg-slate-50',
    colorBorder: 'border-slate-200',
    colorText: 'text-slate-700',
  },
  security: {
    icon: <Lock size={14} />,
    label: 'Security',
    colorBg: 'bg-red-50',
    colorBorder: 'border-red-200',
    colorText: 'text-red-700',
  },
  other: {
    icon: <Tag size={14} />,
    label: 'Other',
    colorBg: 'bg-gray-50',
    colorBorder: 'border-gray-200',
    colorText: 'text-gray-700',
  },
};

export const CategoryTag: React.FC<CategoryTagProps> = ({ category, variant = 'outlined' }) => {
  // Handle undefined or invalid category values
  const normalizedCategory = (category?.toLowerCase() || 'other') as Category;
  const config = categoryConfig[normalizedCategory] || categoryConfig.other;

  if (variant === 'filled') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${config.colorBg} ${config.colorText}`}>
        {config.icon}
        {config.label}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border ${config.colorBorder} ${config.colorText}`}>
      {config.icon}
      {config.label}
    </div>
  );
};

