import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { EventCard, EmptyState, Navigation } from '../components';
import { HostelEvent } from '../types/index';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const API_URL = getApiBaseUrl();
const EVENTS_PER_PAGE = 6;

export const PublicHome: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [events, setEvents] = useState<HostelEvent[]>([]);

  // Fetch public events
  useEffect(() => {
    fetch(`${API_URL}/events`)
      .then((res) => res.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]));
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        searchQuery === '' ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEventType = selectedEventType === 'all' || event.eventType === selectedEventType;

      return matchesSearch && matchesEventType;
    });
  }, [events, searchQuery, selectedEventType]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE
  );

  // Stats
  const stats = useMemo(() => {
    return {
      total: events.length,
      cultural: events.filter((e) => e.eventType === 'cultural').length,
      sports: events.filter((e) => e.eventType === 'sports').length,
    };
  }, [events]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Use Navigation component if authenticated, else show custom nav */}
      {isAuthenticated ? (
        <Navigation />
      ) : (
        <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  WA
                </div>
                <span className="hidden sm:inline text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">WeAssist</span>
              </div>

              {/* Auth Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2.5 min-h-11 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-all duration-200"
                >
                  <LogIn size={18} />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2.5 min-h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-lg rounded-lg font-semibold transition-all duration-200 shadow-md transform hover:translate-y-[-2px]"
                >
                  <UserPlus size={18} />
                  <span className="hidden sm:inline">Register</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white py-16 sm:py-20 lg:py-28 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">Welcome to WeAssist</h1>
          <p className="text-xl sm:text-2xl text-blue-100 mb-8">
            Your hostel management platform for reporting issues and participating in events
          </p>
          <p className="text-lg text-blue-50">Sign in or register to access your dashboard and management tools</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="card-hover group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Total Events</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <Calendar size={40} className="sm:w-[50px] sm:h-[50px] text-blue-500/20 group-hover:text-blue-600/30 transition-colors" />
            </div>
          </div>
          <div className="card-hover group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Cultural Events</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">{stats.cultural}</p>
              </div>
              <AlertCircle size={40} className="sm:w-[50px] sm:h-[50px] text-purple-500/20 group-hover:text-purple-600/30 transition-colors" />
            </div>
          </div>
          <div className="card-hover group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Sports Events</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">{stats.sports}</p>
              </div>
              <Calendar size={40} className="sm:w-[50px] sm:h-[50px] text-orange-500/20 group-hover:text-orange-600/30 transition-colors" />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-6 mb-10 shadow-sm">
          <h2 className="text-xl font-bold text-blue-900 mb-2 flex items-center gap-2">
            📢 Explore Our Events
          </h2>
          <p className="text-blue-800 text-lg">
            Browse upcoming hostel events and register to participate. Sign in to your account to manage your registrations and access your dashboard.
          </p>
        </div>

        {/* Events Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200/50">
          <div className="p-6 sm:p-8 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">🎉 Upcoming Events</h2>
            <p className="text-gray-700 text-lg">Explore all hostel events and register to participate</p>
          </div>

          {/* Search and Filters */}
          <div className="p-6 sm:p-8 border-b border-gray-200/50 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search events by name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="form-input placeholder-gray-500"
                />
              </div>

              {/* Event Type Filter */}
              <select
                value={selectedEventType}
                onChange={(e) => {
                  setSelectedEventType(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-select"
              >
                <option value="all">All Event Types</option>
                <option value="cultural">🎭 Cultural</option>
                <option value="sports">⚽ Sports</option>
              </select>
            </div>
          </div>

          {/* Events Grid */}
          {paginatedEvents.length === 0 ? (
            <div className="p-12">
              <EmptyState
                title="No Events Found"
                description="No events match your search criteria. Try adjusting your filters."
              />
            </div>
          ) : (
            <>
              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedEvents.map((event) => (
                  <div key={event.id} className="cursor-default animate-fade-in">
                    <EventCard
                      event={event}
                      onClick={() => navigate('/login')}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 sm:p-8 border-t border-gray-200/50 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-2.5 min-h-11 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <div className="inline-flex sm:hidden items-center justify-center min-w-11 h-11 px-3 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700">
                    {currentPage}
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2.5 min-h-11 rounded-lg font-semibold transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 py-2.5 min-h-11 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* CTA Section - Only show when not authenticated */}
        {!isAuthenticated && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-lg mb-6">Create an account or sign in to manage your registrations and access your dashboard</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Register Now
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
