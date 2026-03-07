import { useState, useMemo, useEffect } from 'react';
import { Status, Priority, Category, HostelIssue } from '../types/index';
import {
  Header,
  FilterBar,
  IssueCard,
  EmptyState,
  Pagination,
} from '../components';
import { filterIssues, getSortedIssues, getStats } from '../utils/filterUtils';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Plus, X } from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const API_URL = getApiBaseUrl();
const ISSUES_PER_PAGE = 6;

export const IssuesDashboard: React.FC = () => {
  const { currentUser } = useAuth();
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
        .then((data) => {
          // Map API response to HostelIssue format
          const mappedIssues: HostelIssue[] = (data.issues || []).map((issue: any) => ({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            category: issue.category,
            status: issue.status,
            priority: issue.priorityFinal || issue.priorityAiSuggested || 'low',
            priorityFinal: issue.priorityFinal,
            priorityAiSuggested: issue.priorityAiSuggested,
            aiReason: issue.aiReason,
            reporterId: issue.reporterId || '',
            reporterName: issue.reporterName || 'Unknown',
            reportedDate: issue.reportedDate,
            updatedDate: issue.updatedDate,
            location: issue.location || { hostel: '', floor: 0, room: '' },
            resolvedByAdminDate: issue.resolvedByAdminDate,
            confirmedByReporterDate: issue.confirmedByReporterDate,
            adminNotes: issue.adminNotes || [],
            statusLogs: issue.statusLogs || [],
          }));
          setIssues(mappedIssues);
        })
        .catch(() => setIssues([]));
    }, [token]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other' as Category,
    location: {
      hostel: currentUser?.hostel || '',
      floor: 1,
      room: '',
    },
  });

  // Filter issues by hostel (only show issues from current user's hostel)
  const hostelIssues = useMemo(
    () => issues.filter((issue) => issue.location.hostel === currentUser?.hostel),
    [issues, currentUser?.hostel]
  );

  // Filter and sort issues
  const filteredAndSortedIssues = useMemo(() => {
    const filtered = filterIssues(hostelIssues, {
      searchQuery,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      priority: selectedPriority === 'all' ? undefined : selectedPriority,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
    });
    return getSortedIssues(filtered);
  }, [hostelIssues, searchQuery, selectedStatus, selectedPriority, selectedCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedIssues.length / ISSUES_PER_PAGE);
  const paginatedIssues = filteredAndSortedIssues.slice(
    (currentPage - 1) * ISSUES_PER_PAGE,
    currentPage * ISSUES_PER_PAGE
  );

  // Statistics
  const stats = useMemo(() => getStats(hostelIssues), [hostelIssues]);

  // Count your reports
  const yourReports = hostelIssues.filter((issue) => issue.reporterId === currentUser?.id).length;

  // Handlers
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
      setIssues((prev) =>
        prev.map((issue) => (issue.id === issueId ? data.issue : issue))
      );
    } catch {
      alert('Failed to confirm resolution');
    }
  };

  const handleCreateIssue = async () => {
    if (!formData.title || !formData.description || !formData.location.room) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
        }),
      });
      if (!res.ok) throw new Error('Failed to create issue');
      const data = await res.json();
      setIssues((prev) => [data.issue, ...prev]);
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        category: 'other',
        location: {
          hostel: currentUser?.hostel || '',
          floor: 1,
          room: '',
        },
      });
    } catch {
      alert('Failed to create issue');
    }
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setFormData({
      title: '',
      description: '',
      category: 'other',
      location: {
        hostel: currentUser?.hostel || '',
        floor: 1,
        room: '',
      },
    });
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedCategory('all');
    setCurrentPage(1);
  };

  return (
    <main className="container-padded max-w-7xl mx-auto py-8 space-y-8">
      {/* Header */}
      <Header
        title="Hostel Issues"
        subtitle={`${currentUser?.hostel} Hostel - Track and manage reported issues`}
        icon={AlertCircle}
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
              <p className="text-sm font-medium text-gray-600">Your Reports</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{yourReports}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <AlertCircle className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <AlertCircle className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.closed}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <AlertCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar and Create Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1">
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
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <Plus size={18} />
          Report Issue
        </button>
      </div>

      {/* Issues Grid */}
      {paginatedIssues.length === 0 ? (
        <EmptyState
          title={hostelIssues.length === 0 ? 'No issues in your hostel' : 'No issues found'}
          description={
            hostelIssues.length === 0
              ? `There are no reported issues in ${currentUser?.hostel} Hostel yet.`
              : 'No issues match your filters. Try adjusting your search criteria.'
          }
        />
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          <strong>Dual-Verification Workflow:</strong> When an admin marks an issue as "Resolved", you'll see a confirmation button. Please verify that the issue is actually fixed before confirming. Your confirmation ensures accurate problem resolution.
        </p>
      </div>

      {/* Create Issue Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Report an Issue</h2>
              <button
                onClick={handleCloseForm}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Leaky faucet in bathroom"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed information about the issue..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    value={formData.location.room}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, room: e.target.value },
                      })
                    }
                    placeholder="e.g., 101"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Floor
                  </label>
                  <input
                    type="number"
                    value={formData.location.floor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, floor: parseInt(e.target.value) },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as Category })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="wifi">WiFi/Internet</option>
                  <option value="electrical">Electrical</option>
                  <option value="cleanliness">Cleanliness</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="security">Security</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateIssue}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
