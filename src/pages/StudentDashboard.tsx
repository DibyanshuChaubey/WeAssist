// Student Dashboard Page

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IssuesFeed } from '../components/IssuesFeed';
import { IssueSubmissionForm } from '../components/IssueSubmissionForm';
import { Header } from '../components/Header';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'submit'>('feed');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleIssueSubmitted = () => {
    setActiveTab('feed');
    setRefreshKey((prev) => prev + 1); // Trigger refresh of feed
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {currentUser?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Hostel: <span className="font-semibold">{currentUser?.hostel}</span>
          </p>
          <p className="text-gray-500 mt-1 text-sm">
            Report issues, track progress, and view all hostel complaints
            transparently.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('feed')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'feed'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Issues
            </button>
            <button
              onClick={() => setActiveTab('submit')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'submit'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Report New Issue
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'feed' && <IssuesFeed key={refreshKey} />}
          {activeTab === 'submit' && (
            <IssueSubmissionForm
              userHostel={currentUser?.hostel}
              onSuccess={handleIssueSubmitted}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
