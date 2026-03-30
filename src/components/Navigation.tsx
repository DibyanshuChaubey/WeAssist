import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, LogOut, Settings, LogIn, CheckCircle2, Home, MessageSquare, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const baseLinkClass =
    'flex items-center gap-2 px-3 sm:px-4 py-2.5 min-h-11 rounded-lg font-medium transition-all duration-200 whitespace-nowrap';

  const standardLinkClass = (path: string, activeClass: string) =>
    `${baseLinkClass} ${isActive(path) ? activeClass : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`;

  const assistantLinkClass = (mobile = false) =>
    `relative overflow-hidden ${mobile ? 'w-full justify-start' : ''} flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 min-h-10 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap border ${
      isActive('/assistant')
        ? 'text-white border-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 shadow-lg shadow-violet-300/40 scale-[1.02]'
        : 'text-violet-700 border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 hover:from-violet-100 hover:to-fuchsia-100 hover:border-violet-300 hover:shadow-md hover:shadow-violet-200/50 hover:-translate-y-0.5'
    }`;

  const navLinks = !isAuthenticated
    ? []
    : isAdmin
      ? [
          { to: '/', label: 'Home', icon: Home, activeClass: 'bg-blue-50 text-blue-700' },
          { to: '/admin/issues', label: 'Manage Issues', icon: Settings, activeClass: 'bg-red-50 text-red-700' },
          { to: '/admin/events', label: 'Events', icon: Calendar, activeClass: 'bg-purple-50 text-purple-700' },
          { to: '/admin/students', label: 'Verify Students', icon: CheckCircle2, activeClass: 'bg-green-50 text-green-700' },
        ]
      : [
          { to: '/', label: 'Home', icon: Home, activeClass: 'bg-blue-50 text-blue-700' },
          { to: '/dashboard', label: 'Issues', icon: AlertCircle, activeClass: 'bg-blue-50 text-blue-700' },
          { to: '/events', label: 'Events', icon: Calendar, activeClass: 'bg-purple-50 text-purple-700' },
        ];

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
      <div className="container-padded max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 gap-2 lg:gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              WA
            </div>
            <span className="hidden sm:inline text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">WeAssist</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 flex-1 justify-center min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1">
            {isAuthenticated && (
              <>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={standardLinkClass(link.to, link.activeClass)}
                      title={link.label}
                    >
                      <Icon size={18} />
                      <span className="hidden lg:inline">{link.label}</span>
                    </Link>
                  );
                })}

                <Link to="/assistant" className={assistantLinkClass(false)} title="Open AI Assistant">
                  <span className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_45%)]" />
                  <MessageSquare size={16} className="relative" />
                  <span className="text-sm relative hidden lg:inline">Assistant</span>
                  <span
                    className={`relative hidden lg:inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide ${
                      isActive('/assistant') ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'
                    }`}
                  >
                    AI
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Right Section - User Profile / Login */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                <div className="hidden xl:flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/30 max-w-[18rem]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {currentUser?.name?.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-gray-900 truncate">{currentUser?.name}</span>
                    <span className="text-xs text-gray-600 truncate">{currentUser?.email}</span>
                  </div>
                  {isAdmin && <span className="text-xs font-bold text-red-600 ml-2 bg-red-100 px-2 py-1 rounded">Admin</span>}
                  {currentUser?.status === 'pending_verification' && (
                    <span className="text-xs font-bold text-yellow-600 ml-2 bg-yellow-100 px-2 py-1 rounded">Pending</span>
                  )}
                  {currentUser?.status === 'verified' && !isAdmin && (
                    <span className="text-xs font-bold text-green-600 ml-2 bg-green-100 px-2 py-1 rounded">Verified</span>
                  )}
                </div>

                <div className="hidden md:flex xl:hidden items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-bold shadow-sm">
                  {currentUser?.name?.split(' ').map(n => n[0]).join('')}
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-2.5 lg:px-3.5 py-2.5 min-h-10 lg:min-h-11 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 font-medium text-sm"
                  title="Sign out"
                >
                  <LogOut size={18} />
                  <span className="hidden xl:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 min-h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 text-sm shadow-md hover:shadow-lg transform hover:translate-y-[-2px]"
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="inline-flex items-center justify-center min-h-10 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm"
              >
                <LogIn size={16} />
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center min-h-10 px-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center min-h-10 px-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && isAuthenticated && (
          <div className="md:hidden pb-3 animate-in fade-in duration-200">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-2 space-y-1">
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{currentUser?.name}</p>
                <p className="text-xs text-gray-600 truncate">{currentUser?.email}</p>
              </div>

              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={`mobile-${link.to}`}
                    to={link.to}
                    className={`${standardLinkClass(link.to, link.activeClass)} w-full justify-start`}
                    title={link.label}
                  >
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <Link to="/assistant" className={assistantLinkClass(true)} title="Open AI Assistant">
                <span className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_45%)]" />
                <MessageSquare size={16} className="relative" />
                <span className="text-sm relative">Assistant</span>
                <span
                  className={`relative ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide ${
                    isActive('/assistant') ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'
                  }`}
                >
                  AI
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
