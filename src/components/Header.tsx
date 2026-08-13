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
      <div className="py-6">
        <div className="container-padded max-w-7xl mx-auto">
          <div className="ios-surface rounded-[26px] px-6 py-5 flex items-center gap-4 animate-float-in">
            <div className="p-2.5 bg-blue-100/80 rounded-xl border border-blue-200/60">
              <Icon className="text-blue-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
              {subtitle && <p className="text-slate-600 text-sm mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Legacy style header with stats
  return (
    <div className="py-8 md:py-10">
      <div className="container-padded max-w-7xl mx-auto">
        <div className="ios-surface-strong rounded-[30px] px-6 py-7 text-slate-900">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/75 rounded-xl border border-white/70">
            <AlertCircle size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Hostel Issues</h1>
              <p className="text-slate-600 text-sm mt-1">Public transparency dashboard</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="rounded-2xl px-4 py-4 bg-white/75 border border-white/80">
              <div className="text-slate-500 text-xs md:text-sm font-semibold mb-2">Total Issues</div>
              <div className="text-3xl md:text-4xl font-extrabold">{totalIssues}</div>
            </div>
            <div className="rounded-2xl px-4 py-4 bg-white/75 border border-white/80">
              <div className="text-slate-500 text-xs md:text-sm font-semibold mb-2">Pending</div>
              <div className="text-3xl md:text-4xl font-extrabold">{pendingCount}</div>
            </div>
            <div className="rounded-2xl px-4 py-4 bg-white/75 border border-white/80">
              <div className="text-slate-500 text-xs md:text-sm font-semibold mb-2">In Progress</div>
              <div className="text-3xl md:text-4xl font-extrabold">{inProgressCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
