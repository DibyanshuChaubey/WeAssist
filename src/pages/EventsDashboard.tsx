import { useState, useMemo, useEffect } from 'react';
import { EventType, RegistrationStatus, HostelEvent } from '../types/index';
import { EventCard, EmptyState } from '../components';
import { useAuth } from '../context/AuthContext';
import { Search, Calendar, Award, LogIn } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const EVENTS_PER_PAGE = 6;

export const EventsDashboard: React.FC = () => {
  const { isAuthenticated, isStudent, currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<EventType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<RegistrationStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { token } = useAuth();
  const [events, setEvents] = useState<HostelEvent[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<HostelEvent | null>(null);

  // Fetch events from backend
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
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.organizer?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesEventType = selectedEventType === 'all' || event.eventType === selectedEventType;
      const matchesStatus = selectedStatus === 'all' || event.registrationStatus === selectedStatus;

      return matchesSearch && matchesEventType && matchesStatus;
    });
  }, [events, searchQuery, selectedEventType, selectedStatus]);

  // Get stats
  const stats = useMemo(() => {
    return {
      total: events.length,
      cultural: events.filter((e) => e.eventType === 'cultural').length,
      sports: events.filter((e) => e.eventType === 'sports').length,
      openRegistration: events.filter((e) => e.registrationStatus === 'open').length,
    };
  }, [events]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * EVENTS_PER_PAGE;
    return filteredEvents.slice(start, start + EVENTS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedEventType('all');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  // Register for event
  const handleRegisterEvent = async (eventId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to register');
      setRegisteredEvents((prev) => [...prev, eventId]);
    } catch {
      alert('Failed to register for event');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-8 md:py-12">
        <div className="container-padded max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={32} />
            <h1 className="text-3xl md:text-4xl font-bold">Hostel Events</h1>
          </div>
          <p className="text-purple-100 mb-6 text-lg">Discover cultural and sports events</p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur">
              <div className="text-purple-100 text-xs sm:text-sm font-medium mb-1">Total Events</div>
              <div className="text-2xl sm:text-3xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur">
              <div className="text-purple-100 text-xs sm:text-sm font-medium mb-1">Cultural</div>
              <div className="text-2xl sm:text-3xl font-bold">{stats.cultural}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur">
              <div className="text-purple-100 text-xs sm:text-sm font-medium mb-1">Sports</div>
              <div className="text-2xl sm:text-3xl font-bold">{stats.sports}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur">
              <div className="text-purple-100 text-xs sm:text-sm font-medium mb-1">Open</div>
              <div className="text-2xl sm:text-3xl font-bold">{stats.openRegistration}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container-padded max-w-7xl mx-auto py-8">
        {/* Auth Prompt */}
        {!isAuthenticated && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <LogIn className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm text-blue-900 font-semibold mb-1">Sign in to register for events</p>
              <p className="text-xs text-blue-800">Hostel students can register for cultural and sports events. <a href="/login" className="font-semibold underline hover:text-blue-700">Sign in now</a></p>
            </div>
          </div>
        )}
        {/* Filter Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 mb-8">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search events by name or organizer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Event Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value as EventType | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="all">All Events</option>
                <option value="cultural">Cultural</option>
                <option value="sports">Sports</option>
              </select>
            </div>

            {/* Registration Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as RegistrationStatus | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="upcoming">Upcoming</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={handleReset}
                disabled={!searchQuery && selectedEventType === 'all' && selectedStatus === 'all'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        {filteredEvents.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredEvents.length}</span> event
              {filteredEvents.length !== 1 ? 's' : ''}
              {filteredEvents.length !== stats.total && (
                <> of <span className="font-semibold text-gray-900">{stats.total}</span> total</>
              )}
            </p>
          </div>
        )}

        {/* Events Grid */}
        {paginatedEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedEvents.map((event) => (
                <div key={event.id} className="relative">
                  <EventCard
                    event={event}
                    onClick={(clickedEvent) => {
                      console.log('Event clicked:', clickedEvent);
                    }}
                  />
                  
                  {/* Registration Button Overlay */}
                  {event.registrationStatus === 'open' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-lg flex items-end p-4 pointer-events-none">
                      <button
                        onClick={() => {
                          if (isAuthenticated && isStudent) {
                            setSelectedEventForRegistration(event);
                            setShowRegistrationModal(true);
                          } else if (!isAuthenticated) {
                            // Can't register - not logged in
                          }
                        }}
                        disabled={!isAuthenticated || !isStudent}
                        className={`w-full py-2 px-3 rounded-lg font-semibold text-sm transition-colors pointer-events-auto flex items-center justify-center gap-2 ${
                          isAuthenticated && isStudent
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                        }`}
                        title={
                          !isAuthenticated
                            ? 'Sign in to register for events'
                            : !isStudent
                            ? 'Only hostel students can register'
                            : 'Register for this event'
                        }
                      >
                        {isAuthenticated && registeredEvents.includes(event.id) ? '✓ Registered' : 'Register'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between py-6">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="inline-flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ←
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            page === currentPage
                              ? 'bg-purple-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="No events found"
            description="Try adjusting your filters to find upcoming hostel events."
            onReset={handleReset}
          />
        )}
      </main>

      {/* Registration Modal */}
      {showRegistrationModal && selectedEventForRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Register for Event</h2>
            
            <div className="space-y-3 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">{selectedEventForRegistration.title}</h3>
              <p className="text-sm text-gray-600">{selectedEventForRegistration.description}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>📅 {new Date(selectedEventForRegistration.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                {selectedEventForRegistration.startTime && <p>⏰ {selectedEventForRegistration.startTime}</p>}
                <p>📍 {selectedEventForRegistration.venue}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hostel Student</label>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{currentUser?.name}</p>
              </div>
              {currentUser?.hostel && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hostel</label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{currentUser.hostel}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  setSelectedEventForRegistration(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (selectedEventForRegistration) {
                    await handleRegisterEvent(selectedEventForRegistration.id);
                    setShowRegistrationModal(false);
                    setSelectedEventForRegistration(null);
                  }
                }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Confirm Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
        <div className="container-padded max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award size={20} />
            <p className="text-sm font-semibold">Hostel Events Management System</p>
          </div>
          <p className="text-xs">Discover and register for amazing cultural and sports events.</p>
        </div>
      </footer>
    </div>
  );
};
