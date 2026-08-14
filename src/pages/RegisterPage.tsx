import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../context/ThemeContext';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const API_URL = getApiBaseUrl();

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    hostel: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const hostels = ['Hostel A', 'Hostel B', 'Hostel C', 'Hostel D', 'Hostel E', 'Hostel F', 'Hostel G', 'Hostel H'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.hostel) newErrors.hostel = 'Please select your hostel';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          hostel: formData.hostel,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setServerError(data.message || 'Registration failed');
        return;
      }

      navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
    } catch {
      setServerError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),transparent_32%)]" />
      <div className="relative w-full max-w-5xl">
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white"
          >
            <ArrowLeft size={15} />
            Back home
          </button>
          <ThemeToggle compact />
        </div>

        <div className="mx-auto w-full max-w-lg animate-fade-in">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-[0_20px_40px_rgba(79,70,229,0.35)]">
              WA
            </div>
            <h1 className="text-4xl font-black tracking-[-0.06em] text-slate-900">Create account</h1>
            <p className="mt-2 text-base text-slate-600">Join WeAssist and unlock campus access</p>
          </div>

          <div className="ios-surface-strong rounded-[30px] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-center text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Welcome</p>
              <h2 className="mt-2 text-2xl font-bold">Start your student profile</h2>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 p-5 sm:p-6">
              {serverError && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 shrink-0" size={18} />
                  <p>{serverError}</p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" className={`form-input ${errors.name ? 'border-red-300' : ''}`} />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@hostel.com" className={`form-input ${errors.email ? 'border-red-300' : ''}`} />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Hostel</label>
                <select name="hostel" value={formData.hostel} onChange={handleChange} className={`form-select ${errors.hostel ? 'border-red-300' : ''}`}>
                  <option value="">Select your hostel</option>
                  {hostels.map((hostel) => (
                    <option key={hostel} value={hostel}>{hostel}</option>
                  ))}
                </select>
                {errors.hostel && <p className="mt-1 text-sm text-red-600">{errors.hostel}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className={`form-input pr-11 ${errors.password ? 'border-red-300' : ''}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-500">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className={`form-input pr-11 ${errors.confirmPassword ? 'border-red-300' : ''}`} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-slate-500">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-60">
                {loading && <Loader size={18} className="animate-spin" />}
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="border-t border-slate-200/80 bg-white/40 px-5 py-4 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
