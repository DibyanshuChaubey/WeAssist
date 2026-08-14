import { useState, useMemo, useEffect } from 'react';
import { Status, Priority, Category, HostelIssue } from '../types/index';
import {
  Header,
  FilterBar,
  IssueCard,
  EmptyState,
  Pagination,
  Navigation,
} from '../components';
import { filterIssues, getSortedIssues, getStats } from '../utils/filterUtils';
import { useAuth } from '../context/AuthContext';
import { BarChart3, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const API_URL = getApiBaseUrl();
const ISSUES_PER_PAGE = 6;

export const AdminDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Status | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { token } = useAuth();
  const [issues, setIssues] = useState<HostelIssue[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/issues`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setIssues(data.issues || []))
      .catch(() => setIssues([]));
  }, [token]);

  const filteredAndSortedIssues = useMemo(() => {
    const filtered = filterIssues(issues, {
      searchQuery,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      priority: selectedPriority === 'all' ? undefined : selectedPriority,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
    });
    return getSortedIssues(filtered);
  }, [issues, searchQuery, selectedStatus, selectedPriority, selectedCategory]);

  const totalPages = Math.ceil(filteredAndSortedIssues.length / ISSUES_PER_PAGE);
  const paginatedIssues = filteredAndSortedIssues.slice(
    (currentPage - 1) * ISSUES_PER_PAGE,
    currentPage * ISSUES_PER_PAGE
  );

  const stats = useMemo(() => getStats(issues), [issues]);
  const pendingConfirmation = issues.filter((issue) => issue.status === 'resolved_by_admin').length;

  const handleMarkResolved = async (issueId: string, note: string) => {
    try {
      const res = await fetch(`${API_URL}/issues/${issueId}/mark-resolved`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error('Failed to mark as resolved');
      const data = await res.json();
      setIssues((prev) => prev.map((issue) => issue.id === issueId ? data.issue : issue));
    } catch {
      alert('Failed to mark as resolved');
    }
  };

  const handleConfirmResolution = async (issueId: string) => {
    try {
      const res = await fetch(`${API_URL}/issues/${issueId}/confirm-resolution`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to confirm resolution');
      const data = await res.json();
      setIssues((prev) => prev.map((issue) => issue.id === issueId ? data.issue : issue));
    } catch {
      alert('Failed to confirm resolution');
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedCategory('all');
    setCurrentPage(1);
  };

  return (
    <>
      <Navigation />
      <main className="container-padded mx-auto max-w-7xl space-y-8 py-8">
        <div className="ios-surface-strong rounded-[30px] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Operations center</p>
              <Header
                title="Admin Issue Management"
                subtitle="Manage hostel issues, add notes, and track resolution status"
                icon={BarChart3}
              />
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/65 px-4 py-3 text-sm text-slate-700 backdrop-blur-sm">
              Live queue • {issues.length} items
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Issues', value: stats.total, accent: 'bg-blue-100 text-blue-600', icon: AlertCircle },
            { label: 'Reported', value: stats.reported, accent: 'bg-red-100 text-red-600', icon: AlertCircle },
            { label: 'Pending Confirmation', value: pendingConfirmation, accent: 'bg-amber-100 text-amber-600', icon: Clock },
            { label: 'Closed', value: stats.closed, accent: 'bg-green-100 text-green-600', icon: CheckCircle2 },
          ].map(({ label, value, accent, icon: Icon }) => (
            <div key={label} className="ios-surface rounded-[26px] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">{label}</p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onReset={handleReset}
        />

        {paginatedIssues.length === 0 ? (
          <EmptyState
            title="No issues found"
            description={
              filteredAndSortedIssues.length === 0
                ? 'No issues match your filters. Try adjusting your search criteria.'
                : 'All issues have been resolved!'
            }
          />
        ) : (
          <>
            <div className="grid gap-4">
              {paginatedIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onMarkResolved={(issueId) => handleMarkResolved(issueId, '')}
                  onConfirmResolution={handleConfirmResolution}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </>
        )}

        <div className="rounded-[24px] border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-900">
          <strong>Dual-Verification Workflow:</strong> When you mark an issue as resolved, the reporting student must confirm the fix before the issue closes.
        </div>
      </main>
    </>
  );
};

