import { useState, useMemo, useEffect } from 'react';
import { HostelEvent, EventType, SportsType, RegistrationStatus } from '../types/index';
import { Header } from '../components';
import { Plus, Edit2, Trash2, Users, Calendar, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const defaultEventFormData: HostelEvent = {
  id: '',
  title: '',
  description: '',
  eventType: 'cultural' as EventType,
  sportsType: undefined,
  date: '',
  startTime: '',
  endTime: '',
  venue: '',
  registrationStatus: 'upcoming' as RegistrationStatus,
  registeredCount: 0,
  totalSlots: 50,
  organizer: '',
  tags: [],
  imageUrl: '',
};

export const AdminEventsManagement: React.FC = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState<HostelEvent[]>([]);
    // Fetch events from backend
    useEffect(() => {
      if (!token) return;
      fetch(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setEvents(data.events || []))
        .catch(() => setEvents([]));
    }, [token]);
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<HostelEvent>(
    defaultEventFormData
  );
  const [selectedEventForStudents, setSelectedEventForStudents] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  const handleOpenForm = (event?: HostelEvent) => {
    if (event) {
      setEditingEventId(event.id);
      setFormData(event);
    } else {
      setEditingEventId(null);
      setFormData(defaultEventFormData);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEventId(null);
    setFormData(defaultEventFormData);
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.date || !formData.venue) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      let res: Response, data: any;
      if (editingEventId) {
        res = await fetch(`${API_URL}/events/${editingEventId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to update event');
        data = await res.json();
        setEvents((prev) => prev.map((event) => event.id === editingEventId ? data.event : event));
      } else {
        res = await fetch(`${API_URL}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to create event');
        data = await res.json();
        setEvents((prev) => [data.event, ...prev]);
      }
      handleCloseForm();
    } catch {
      alert('Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`${API_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete event');
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      if (selectedEventForStudents === eventId) {
        setSelectedEventForStudents(null);
      }
    } catch {
      alert('Failed to delete event');
    }
  };

  return (
    <main className="container-padded max-w-7xl mx-auto py-8 space-y-8">
      <Header
        title="Event Management"
        subtitle="Create, edit, and manage hostel events"
        icon={Calendar}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{events.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Events</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {events.filter((e) => e.registrationStatus === 'open').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Plus className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Registrations</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {events.reduce((sum, e) => sum + (e.registeredCount || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Create Event
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Event</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Registered</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{event.eventType}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        event.registrationStatus === 'open'
                          ? 'bg-green-100 text-green-700'
                          : event.registrationStatus === 'upcoming'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {event.registrationStatus.charAt(0).toUpperCase() +
                        event.registrationStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">
                      {event.registeredCount || 0}
                      {event.totalSlots && ` / ${event.totalSlots}`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedEventForStudents(event.id)}
                        title="View registered students"
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                      >
                        <Users size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenForm(event)}
                        title="Edit event"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        title="Delete event"
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEvents.length === 0 && (
          <div className="p-8 text-center text-gray-500">No events found</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingEventId ? 'Edit Event' : 'Create Event'}
              </h2>
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
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Annual Sports Day"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Event details..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type *
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        eventType: e.target.value as EventType,
                        sportsType: undefined,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>

                {formData.eventType === 'sports' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sports Type
                    </label>
                    <select
                      value={formData.sportsType || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sportsType: (e.target.value as SportsType) || undefined,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select sport</option>
                      <option value="cricket">Cricket</option>
                      <option value="badminton">Badminton</option>
                      <option value="volleyball">Volleyball</option>
                      <option value="football">Football</option>
                      <option value="table-tennis">Table Tennis</option>
                      <option value="basketball">Basketball</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue *
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    placeholder="Event location"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Status
                  </label>
                  <select
                    value={formData.registrationStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationStatus: e.target.value as RegistrationStatus,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Slots
                  </label>
                  <input
                    type="number"
                    value={formData.totalSlots || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalSlots: e.target.value ? parseInt(e.target.value) : 50,
                      })
                    }
                    placeholder="e.g., 50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organizer
                  </label>
                  <input
                    type="text"
                    value={formData.organizer || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, organizer: e.target.value })
                    }
                    placeholder="Event organizer name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {editingEventId ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEventForStudents && <RegisteredStudentsModal eventId={selectedEventForStudents} onClose={() => setSelectedEventForStudents(null)} token={token} />}
    </main>
  );
};

interface RegisteredStudentsModalProps {
  eventId: string;
  onClose: () => void;
  token: string | null;
}

const RegisteredStudentsModal: React.FC<RegisteredStudentsModalProps> = ({ eventId, onClose, token }) => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/events/${eventId}/registrations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch registrations');
        const data = await res.json();
        setRegistrations(data.registrations || []);
      } catch (error) {
        console.error('Error fetching registrations:', error);
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [eventId, token]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Registered Students</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-500">Loading registrations...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center text-gray-500">No registrations yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Hostel</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registrations.map((reg: any) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">{reg.studentName}</td>
                      <td className="px-4 py-3 text-gray-600">{reg.email}</td>
                      <td className="px-4 py-3 text-gray-600">{reg.hostel}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(reg.registeredDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
