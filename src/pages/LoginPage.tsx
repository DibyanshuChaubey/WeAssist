import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
import { demoAccountsService } from '../services/demoAccounts';
import { UserRole } from '../types';

const API_URL = getApiBaseUrl();

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    hostel: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPending(false);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (data.user.status === 'pending_verification') {
        setPending(true);
        return;
      }
      login({ ...data.user, token: data.access_token });
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPending(false);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          hostel: form.hostel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setPending(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setLoading(true);
    setError('');
    setPending(false);
    try {
      const data = await demoAccountsService.loginByRole(role);
      if (data.user.status === 'pending_verification') {
        setPending(true);
        return;
      }
      login({ ...data.user, token: data.access_token }, { storage: 'session' });
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10"></div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-6 shadow-2xl">
            {isRegister ? (
              <UserPlus className="text-blue-600" size={32} />
            ) : (
              <LogIn className="text-blue-600" size={32} />
            )}
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">WeAssist</h1>
          <p className="text-blue-100 text-lg">Hostel Management Platform</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-lg">
            <button
              className={`flex-1 font-semibold text-sm px-4 py-2.5 rounded-md transition-all duration-200 ${
                !isRegister
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
              onClick={() => {
                setIsRegister(false);
                setError('');
                setPending(false);
              }}
            >
              Sign In
            </button>
            <button
              className={`flex-1 font-semibold text-sm px-4 py-2.5 rounded-md transition-all duration-200 ${
                isRegister
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
              onClick={() => {
                setIsRegister(true);
                setError('');
                setPending(false);
              }}
            >
              Register
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex gap-3 animate-slide-up">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Pending Alert */}
          {pending && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex gap-3 animate-slide-up">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>Your account is pending admin verification. You will be able to access the system once verified.</span>
            </div>
          )}

          {/* Sign In Form */}
          {!isRegister ? (
            <form onSubmit={handleLogin}>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="form-input"
                />
              </div>
              <div className="mb-7">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 mb-6 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <LogIn size={20} />
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              {/* Demo Login Section */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-600 font-medium">Quick Demo Access</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-3 text-center">
                Demo access is temporary for this browser session and resets when the tab/browser is closed.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-900 font-bold py-2.5 px-3 rounded-lg transition-all duration-200 text-sm disabled:opacity-50 shadow-sm"
                >
                  👨‍💼 Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('student')}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-900 font-bold py-2.5 px-3 rounded-lg transition-all duration-200 text-sm disabled:opacity-50 shadow-sm"
                >
                  👨‍🎓 Student
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister}>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="form-input"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="form-input"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Hostel</label>
                <input
                  type="text"
                  name="hostel"
                  value={form.hostel}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Hostel A"
                  className="form-input"
                />
              </div>
              <div className="mb-7">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <UserPlus size={20} />
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        {/* Sign In / Register Link */}
        <p className="text-center text-sm text-white/90">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setPending(false);
            }}
            className="ml-2 font-bold text-white hover:text-blue-100 transition-colors underline"
          >
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};
