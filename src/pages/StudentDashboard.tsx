import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IssuesFeed } from '../components/IssuesFeed';
import { IssueSubmissionForm } from '../components/IssueSubmissionForm';
import { Navigation } from '../components/Navigation';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'submit'>('feed');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleIssueSubmitted = () => {
    setActiveTab('feed');
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="app-shell min-h-screen">
      <Navigation />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="ios-surface-strong mb-8 rounded-[30px] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Student portal</p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.06em] text-slate-900 sm:text-4xl">
                Welcome back, {currentUser?.name}.
              </h1>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm text-slate-700 backdrop-blur-sm">
              Hostel: <span className="font-semibold text-slate-900">{currentUser?.hostel}</span>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">
            Report issues, monitor updates, and stay on top of your hostel experience with a clearer, calmer operations flow.
          </p>
        </section>

        <div className="mb-6 rounded-[22px] border border-slate-200/80 bg-white/65 p-2 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                activeTab === 'feed'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              All Issues
            </button>
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                activeTab === 'submit'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Report New Issue
            </button>
          </div>
        </div>

        <div>
          {activeTab === 'feed' && <IssuesFeed key={refreshKey} />}
          {activeTab === 'submit' && (
            <IssueSubmissionForm userHostel={currentUser?.hostel} onSuccess={handleIssueSubmitted} />
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
