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
      className={`bg-white rounded-lg border transition-all cursor-pointer h-full flex flex-col hover:border-gray-300 hover:shadow-md ${
        isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-200'
      }`}
      onClick={() => onClick?.(issue)}
    >
      {/* Urgent Badge */}
      {isUrgent && (
        <div className="px-5 pt-4 pb-0">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <AlertCircle size={12} />
            Urgent
          </div>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">{issue.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">{issue.description}</p>
        </div>

        {issue.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
            <img
              src={issue.imageUrl}
              alt={issue.title}
              className="w-full h-40 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Category and Location */}
        <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
          <CategoryTag category={issue.category} variant="filled" />
          <div className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md font-medium">
            <MapPin size={12} />
            <span className="line-clamp-1">
              {issue.location.hostel}, Floor {issue.location.floor}, Room {issue.location.room}
            </span>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <StatusBadge status={issue.status} />
          <PriorityChip priority={displayPriority} />
          {isAdmin && issue.priorityAiSuggested && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium" title={`AI Suggested: ${issue.priorityAiSuggested}`}>
              AI
            </span>
          )}
          {isReporter && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Your Report</span>}
        </div>

        {/* Tags */}
        {issue.tags && issue.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {issue.tags.slice(0, 2).map((tag: string) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                {tag}
              </span>
            ))}
            {issue.tags.length > 2 && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                +{issue.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Admin Notes (visible to everyone) */}
        {issue.adminNotes && issue.adminNotes.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs">
            <div className="font-semibold text-amber-900 mb-1">Latest Update:</div>
            <p className="text-amber-800">{issue.adminNotes[issue.adminNotes.length - 1].content}</p>
            <p className="text-amber-700 mt-1 text-xs">— {issue.adminNotes[issue.adminNotes.length - 1].adminName}</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100">
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <User size={12} className="flex-shrink-0" />
              <span className="truncate">{issue.reporterName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar size={12} className="flex-shrink-0" />
              <span>{new Date(issue.reportedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Comments Count */}
          {issue.comments !== undefined && issue.comments > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium pt-2 mb-3">
              <MessageCircle size={12} />
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle size={14} />
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors"
            >
              <CheckCircle size={14} />
              Mark as Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

