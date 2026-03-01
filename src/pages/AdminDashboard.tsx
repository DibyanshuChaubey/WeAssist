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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ISSUES_PER_PAGE = 6;

export const AdminDashboard: React.FC = () => {
  // const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Status | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { token } = useAuth();
  const [issues, setIssues] = useState<HostelIssue[]>([]);
  // Fetch issues from backend
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/issues`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setIssues(data.issues || []))
      .catch(() => setIssues([]));
  }, [token]);

  // Filter and sort issues
  const filteredAndSortedIssues = useMemo(() => {
    const filtered = filterIssues(issues, {
      searchQuery,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      priority: selectedPriority === 'all' ? undefined : selectedPriority,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
    });
    return getSortedIssues(filtered);
  }, [issues, searchQuery, selectedStatus, selectedPriority, selectedCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedIssues.length / ISSUES_PER_PAGE);
  const paginatedIssues = filteredAndSortedIssues.slice(
    (currentPage - 1) * ISSUES_PER_PAGE,
    currentPage * ISSUES_PER_PAGE
  );

  // Statistics
  const stats = useMemo(
    () => getStats(issues),
    [issues]
  );

  const pendingConfirmation = issues.filter(
    (issue) => issue.status === 'resolved_by_admin'
  ).length;

  // Handlers
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      <main className="container-padded max-w-7xl mx-auto py-8 space-y-8">
      {/* Header */}
      <Header
        title="Admin Issue Management"
        subtitle="Manage hostel issues, add notes, and track resolution status"
        icon={BarChart3}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Issues</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <AlertCircle className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reported</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.reported}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Confirmation</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingConfirmation}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.closed}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
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

      {/* Issues Grid */}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Dual-Verification Workflow:</strong> When you mark an issue as "Resolved", the hostel student (reporter) will receive a notification to confirm the resolution. The issue won't close until they verify that the problem is actually fixed.
        </p>
      </div>
    </main>
    </>
  );
};
