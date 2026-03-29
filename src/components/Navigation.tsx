import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, LogOut, Settings, LogIn, CheckCircle2, Home, MessageSquare } from 'lucide-react';
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
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
      <div className="container-padded max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              WA
            </div>
            <span className="hidden sm:inline text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">WeAssist</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {isAuthenticated && (
              <>
                {!isAdmin && (
                  <Link
                    to="/"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isActive('/events') ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar size={18} />
                    <span className="hidden sm:inline">Events</span>
                  </Link>
                )}

                <Link
                  to="/assistant"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive('/assistant') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare size={18} />
                  <span className="hidden sm:inline">Assistant</span>
                </Link>

                {isAdmin && (
                  <>
                    <Link
                      to="/"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isActive('/') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      title="Home"
                    >
                      <Home size={18} />
                      <span className="hidden sm:inline">Home</span>
                    </Link>

                    <Link
                      to="/admin/issues"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isActive('/admin/issues') ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Settings size={18} />
                      <span className="hidden sm:inline">Manage Issues</span>
                    </Link>

                    <Link
                      to="/admin/events"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isActive('/admin/events') ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Calendar size={18} />
                      <span className="hidden sm:inline">Events</span>
                    </Link>

                    <Link
                      to="/admin/students"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
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
              <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {currentUser?.name?.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">{currentUser?.name}</span>
                  <span className="text-xs text-gray-600">{currentUser?.email}</span>
                </div>
                {isAdmin && <span className="text-xs font-bold text-red-600 ml-2 bg-red-100 px-2 py-1 rounded">Admin</span>}
                {currentUser?.status === 'pending_verification' && (
                  <span className="text-xs font-bold text-yellow-600 ml-2 bg-yellow-100 px-2 py-1 rounded">Pending</span>
                )}
                {currentUser?.status === 'verified' && !isAdmin && (
                  <span className="text-xs font-bold text-green-600 ml-2 bg-green-100 px-2 py-1 rounded">Verified</span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 font-medium text-sm"
                title="Sign out"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 text-sm shadow-md hover:shadow-lg transform hover:translate-y-[-2px]"
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
