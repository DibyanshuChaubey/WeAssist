import { useState, useEffect } from 'react';
import { Header, Navigation } from '../components';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, AlertCircle, Loader, XCircle } from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

interface PendingStudent {
  id: string;
  name: string;
  email: string;
  hostel: string;
  created_at: string;
  status: string;
}

const API_URL = getApiBaseUrl();

export const AdminStudentsManagement: React.FC = () => {
  const { token } = useAuth();
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const [declineConfirm, setDeclineConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch pending students
  useEffect(() => {
    if (!token) return;

    const fetchPendingStudents = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/auth/pending-students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch pending students');
        const data = await res.json();
        setPendingStudents(data.pending_students || []);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pending students');
        setPendingStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingStudents();
  }, [token]);

  // Handle student verification
  const handleVerifyStudent = async (studentId: string) => {
    if (!token) return;

    try {
      setVerifying(studentId);
      setSuccessMessage('');
      const res = await fetch(`${API_URL}/auth/verify-user/${studentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to verify student');

      // Remove verified student from list
      setPendingStudents((prev) => prev.filter((student) => student.id !== studentId));
      setSuccessMessage(`Student verified successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify student');
    } finally {
      setVerifying(null);
    }
  };

  // Handle student decline
  const handleDeclineStudent = async (studentId: string) => {
    if (!token) return;

    try {
      setDeclining(studentId);
      setSuccessMessage('');
      const res = await fetch(`${API_URL}/auth/decline-user/${studentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to decline student');

      // Remove declined student from list
      setPendingStudents((prev) => prev.filter((student) => student.id !== studentId));
      setSuccessMessage(`Student enrollment declined`);
      setDeclineConfirm(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline student');
    } finally {
      setDeclining(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <Header title="Student Authentication Management" />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Verification</p>
                <p className="text-3xl font-bold text-gray-900">{pendingStudents.length}</p>
              </div>
              <Clock size={40} className="text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Processed</p>
                <p className="text-3xl font-bold text-gray-900">Coming soon</p>
              </div>
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="text-green-600 mt-0.5 flex-shrink-0" size={20} />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Students List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Pending Student Verifications</h2>
            <p className="text-gray-600 mt-1">Review and authenticate new student registrations</p>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader className="animate-spin text-blue-600" size={32} />
            </div>
          ) : pendingStudents.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="mx-auto text-green-500 mb-3" size={48} />
              <p className="text-gray-600 font-medium">All students verified!</p>
              <p className="text-gray-500 text-sm mt-1">No pending students to authenticate.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Hostel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{student.hostel}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(student.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVerifyStudent(student.id)}
                            disabled={verifying === student.id || declining === student.id}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {verifying === student.id ? (
                              <>
                                <Loader size={16} className="animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={16} />
                                Verify
                              </>
                            )}
                          </button>

                          <div className="relative">
                            <button
                              onClick={() => setDeclineConfirm(student.id)}
                              disabled={verifying === student.id || declining === student.id}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                              {declining === student.id ? (
                                <>
                                  <Loader size={16} className="animate-spin" />
                                  Declining...
                                </>
                              ) : (
                                <>
                                  <XCircle size={16} />
                                  Decline
                                </>
                              )}
                            </button>

                            {/* Decline Confirmation Dialog */}
                            {declineConfirm === student.id && (
                              <div className="absolute right-0 mt-2 w-64 bg-white border border-red-200 rounded-lg shadow-lg p-4 z-10">
                                <p className="text-red-900 font-medium mb-4">
                                  Are you sure you want to decline {student.name}'s enrollment?
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleDeclineStudent(student.id)}
                                    disabled={declining === student.id}
                                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:bg-gray-400 text-sm"
                                  >
                                    Confirm Decline
                                  </button>
                                  <button
                                    onClick={() => setDeclineConfirm(null)}
                                    className="flex-1 px-3 py-2 bg-gray-200 text-gray-900 rounded font-medium hover:bg-gray-300 text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
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
