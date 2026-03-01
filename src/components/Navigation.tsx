import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, LogOut, Settings, LogIn, CheckCircle2, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, isAdmin, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container-padded max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-gray-700">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              WA
            </div>
            <span className="hidden sm:inline">WeAssist</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {isAuthenticated && (
              <>
                {!isAdmin && (
                  <Link
                    to="/"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive('/') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    title="Home"
                  >
                    <Home size={18} />
                    <span className="hidden sm:inline">Home</span>
                  </Link>
                )}

                {!isAdmin && (
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <AlertCircle size={18} />
                    <span className="hidden sm:inline">Issues</span>
                  </Link>
                )}

                {!isAdmin && (
                  <Link
                    to="/events"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive('/events') ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar size={18} />
                    <span className="hidden sm:inline">Events</span>
                  </Link>
                )}

                {isAdmin && (
                  <>
                    <Link
                      to="/"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActive('/') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      title="Home"
                    >
                      <Home size={18} />
                      <span className="hidden sm:inline">Home</span>
                    </Link>

                    <Link
                      to="/admin/issues"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActive('/admin/issues') ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Settings size={18} />
                      <span className="hidden sm:inline">Manage Issues</span>
                    </Link>

                    <Link
                      to="/admin/events"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActive('/admin/events') ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Calendar size={18} />
                      <span className="hidden sm:inline">Events</span>
                    </Link>

                    <Link
                      to="/admin/students"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActive('/admin/students') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <CheckCircle2 size={18} />
                      <span className="hidden sm:inline">Verify Students</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right Section - User Profile / Login */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {currentUser?.name?.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{currentUser?.name}</span>
                  <span className="text-xs text-gray-500">{currentUser?.email}</span>
                </div>
                {isAdmin && <span className="text-xs font-semibold text-red-600 ml-2">Admin</span>}
                {currentUser?.status === 'pending_verification' && (
                  <span className="text-xs font-semibold text-yellow-600 ml-2">Pending Verification</span>
                )}
                {currentUser?.status === 'verified' && !isAdmin && (
                  <span className="text-xs font-semibold text-green-600 ml-2">Verified</span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
                title="Sign out"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              <LogIn size={18} />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
