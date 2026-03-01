// Public Issues Feed Component - Transparent View of All Issues

import React, { useState, useEffect } from 'react';
import { issuesService } from '../services/api';
import { IssueCard } from './IssueCard';
import { FilterBar } from './FilterBar';
import { Pagination } from './Pagination';
import { IssueCardSkeleton } from './SkeletonLoader';
import { EmptyState } from './EmptyState';
import { HostelIssue, Status, Priority, Category } from '../types/index';

interface IssuesFeedProps {
  showFilters?: boolean;
  limit?: number;
}

export const IssuesFeed: React.FC<IssuesFeedProps> = ({
  showFilters = true,
  limit,
}) => {
  const [issues, setIssues] = useState<HostelIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Individual filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Status | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  useEffect(() => {
    fetchIssues();
  }, [currentPage, selectedStatus, selectedPriority, selectedCategory]);

  const fetchIssues = async () => {
    setLoading(true);
    setError('');

    try {
      const params: any = {
        page: currentPage,
        per_page: limit || 10,
      };

      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedPriority !== 'all') params.priority = selectedPriority;

      const response = await issuesService.getIssues(params);

      // Map API response to HostelIssue format
      const mappedIssues: HostelIssue[] = response.issues.map((issue: any) => ({
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
      setTotalPages(response.pagination.total_pages);
      setTotalItems(response.pagination.total_items);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Failed to load issues. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResolution = async (issueId: string) => {
    try {
      await issuesService.confirmResolution(issueId);
      fetchIssues();
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Failed to confirm resolution. Please try again.'
      );
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedCategory('all');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reported Issues</h2>
          <p className="text-gray-600 mt-1">
            Transparent view of all hostel issues - {totalItems} total
          </p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
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
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchIssues}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((__, index) => (
            <IssueCardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && issues.length === 0 && (
        <EmptyState
          title="No issues found"
          description={
            selectedStatus !== 'all' || selectedCategory !== 'all' || selectedPriority !== 'all'
              ? 'Try adjusting your filters'
              : 'No issues have been reported yet'
          }
        />
      )}

      {/* Issues List */}
      {!loading && !error && issues.length > 0 && (
        <>
          <div className="space-y-4">
            {issues.map((issue) => (
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
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default IssuesFeed;
