import { HostelIssue } from '../types/index';
import { StatusBadge } from './StatusBadge';
import { PriorityChip } from './PriorityChip';
import { CategoryTag } from './CategoryTag';
import { MessageCircle, Calendar, User, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface IssueCardProps {
  issue: HostelIssue;
  onClick?: (issue: HostelIssue) => void;
  onConfirmResolution?: (issueId: string) => void;
  onMarkResolved?: (issueId: string, note?: string) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onClick, onConfirmResolution, onMarkResolved }) => {
  const { currentUser } = useAuth();
  const isReporter = currentUser?.id === issue.reporterId;
  const isAdmin = currentUser?.role === 'admin';
  
  // Use AI-suggested priority for display on student views, admin-set (final) on admin views
  const displayPriority = isAdmin ? (issue.priorityFinal || issue.priorityAiSuggested || 'low') : (issue.priorityAiSuggested || issue.priorityFinal || 'low');
  const isUrgent = displayPriority === 'high' && issue.status === 'reported';
  const showConfirmButton =
    isReporter && issue.status === 'resolved_by_admin' && !issue.confirmedByReporterDate;

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-300 cursor-pointer h-full flex flex-col hover:shadow-xl hover:translate-y-[-8px] group shadow-md ${
        isUrgent ? 'border-red-300 bg-red-50/50 hover:border-red-400' : 'border-gray-200/50 hover:border-blue-300/50'
      }`}
      onClick={() => onClick?.(issue)}
    >
      {/* Urgent Badge */}
      {isUrgent && (
        <div className="px-5 pt-4 pb-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-200 text-red-700 animate-pulse">
            <AlertCircle size={14} />
            🚨 Urgent
          </div>
        </div>
      )}

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{issue.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">{issue.description}</p>
        </div>

        {issue.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-200/50 aspect-video bg-gray-200">
            <img
              src={issue.imageUrl}
              alt={issue.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        )}

        {/* Category and Location */}
        <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
          <CategoryTag category={issue.category} variant="filled" />
          <div className="inline-flex items-center gap-1.5 text-xs text-gray-700 bg-gray-100/80 px-3 py-1.5 rounded-lg font-semibold">
            <MapPin size={14} />
            <span className="line-clamp-2 sm:line-clamp-1">
              {issue.location.hostel} • Fl{issue.location.floor} Rm{issue.location.room}
            </span>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <StatusBadge status={issue.status} />
          <PriorityChip priority={displayPriority} />
          {isAdmin && issue.priorityAiSuggested && (
            <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-semibold" title={`AI Suggested: ${issue.priorityAiSuggested}`}>
              🤖 AI
            </span>
          )}
          {isReporter && <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full font-semibold">📝 Your Report</span>}
        </div>

        {/* Tags */}
        {issue.tags && issue.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {issue.tags.slice(0, 2).map((tag: string) => (
              <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold">
                {tag}
              </span>
            ))}
            {issue.tags.length > 2 && (
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold">
                +{issue.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Admin Notes (visible to everyone) */}
        {issue.adminNotes && issue.adminNotes.length > 0 && (
          <div className="mb-4 p-4 bg-amber-50/80 border border-amber-200/50 rounded-lg text-xs">
            <div className="font-bold text-amber-900 mb-2 flex items-center gap-1.5">
              📝 Latest Update
            </div>
            <p className="text-amber-800 mb-2">{issue.adminNotes[issue.adminNotes.length - 1].content}</p>
            <p className="text-amber-700 text-xs font-medium">— {issue.adminNotes[issue.adminNotes.length - 1].adminName}</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100">
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center gap-2.5 text-sm text-gray-700 font-medium">
              <User size={16} className="flex-shrink-0 text-blue-600" />
              <span className="truncate">{issue.reporterName}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-700 font-medium">
              <Calendar size={16} className="flex-shrink-0 text-purple-600" />
              <span>{new Date(issue.reportedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Comments Count */}
          {issue.comments !== undefined && issue.comments > 0 && (
            <div className="flex items-center gap-2 text-sm text-blue-700 font-bold pt-2 mb-3 bg-blue-50 py-2 px-3 rounded-lg">
              <MessageCircle size={16} />
              <span>{issue.comments} {issue.comments === 1 ? 'comment' : 'comments'}</span>
            </div>
          )}

          {/* Confirmation Button for Reporters */}
          {showConfirmButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirmResolution?.(issue.id);
              }}
              className="btn-success w-full flex items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-60"
            >
              <CheckCircle size={16} />
              Confirm Resolution
            </button>
          )}

          {/* Mark Resolved Button for Admins (only for "in-progress" status) */}
          {isAdmin && issue.status === 'in_progress' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkResolved?.(issue.id);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-bold rounded-lg transition-all duration-200 transform hover:translate-y-[-2px] shadow-md"
            >
              <CheckCircle size={16} />
              Mark as Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

