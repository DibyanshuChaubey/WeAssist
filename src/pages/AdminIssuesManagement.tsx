// Admin Issues Management Page

import React, { useState, useEffect } from 'react';
import { issuesService } from '../services/api';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityChip } from '../components/PriorityChip';
import { CategoryTag } from '../components/CategoryTag';

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priorityFinal?: string;
  priorityAiSuggested?: string;
  aiReason?: string;
  reporterName?: string;
  location: {
    hostel: string;
    floor: number;
    room: string;
  };
  reportedDate: string;
  updatedDate: string;
}

export const AdminIssuesManagement: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [statistics, setStatistics] = useState<any>(null);

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    fetchIssues();
    fetchStatistics();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await issuesService.getIssues({ per_page: 100 });
      setIssues(response.issues);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await issuesService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedIssue || !newStatus) return;

    try {
      await issuesService.updateIssueStatus(
        selectedIssue.id,
        newStatus,
        statusReason
      );
      alert('Status updated successfully');
      setShowStatusModal(false);
      fetchIssues();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handlePriorityUpdate = async () => {
    if (!selectedIssue || !newPriority) return;

    try {
      await issuesService.setIssuePriority(selectedIssue.id, newPriority);
      alert('Priority updated successfully');
      setShowPriorityModal(false);
      fetchIssues();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update priority');
    }
  };

  const handleAddNote = async () => {
    if (!selectedIssue || !noteContent) return;

    try {
      await issuesService.addAdminNote(selectedIssue.id, noteContent);
      alert('Note added successfully');
      setShowNoteModal(false);
      setNoteContent('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add note');
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Issue Management
        </h1>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium">Total Issues</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statistics.total}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium">Reported</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {statistics.by_status?.reported || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium">In Progress</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {statistics.by_status?.in_progress || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium">Resolved</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {statistics.by_status?.resolved_by_admin || 0}
              </p>
            </div>
          </div>
        )}

        {/* Issues Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Final Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No issues found
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {issue.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {issue.location.hostel} - Floor {issue.location.floor} - Room{' '}
                        {issue.location.room}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <CategoryTag category={issue.category} />
                    </td>
                    <td className="px-6 py-4">
                      {issue.priorityAiSuggested ? (
                        <div>
                          <PriorityChip priority={issue.priorityAiSuggested} />
                          {issue.aiReason && (
                            <p className="text-xs text-gray-500 mt-1">
                              {issue.aiReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {issue.priorityFinal ? (
                        <PriorityChip priority={issue.priorityFinal} />
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedIssue(issue);
                            setNewPriority(issue.priorityAiSuggested || 'medium');
                            setShowPriorityModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Set Priority
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => {
                          setSelectedIssue(issue);
                          setNewStatus(issue.status);
                          setShowStatusModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Update Status
                      </button>
                      <button
                        onClick={() => {
                          setSelectedIssue(issue);
                          setShowNoteModal(true);
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        Add Note
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Update Issue Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="reported">Reported</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved_by_admin">Resolved by Admin</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleStatusUpdate}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPriorityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Set Issue Priority</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                {selectedIssue?.priorityAiSuggested && (
                  <p className="text-sm text-gray-600 mt-2">
                    AI Suggested: <strong>{selectedIssue.priorityAiSuggested}</strong>
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handlePriorityUpdate}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  Set Priority
                </button>
                <button
                  onClick={() => setShowPriorityModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add Admin Note</h3>
            <div className="space-y-4">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter note..."
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={4}
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleAddNote}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  Add Note
                </button>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminIssuesManagement;
