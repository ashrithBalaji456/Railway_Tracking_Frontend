import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Mail, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Username validation
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response: any = await api.post('/api/v1/auth/signup', {
        username,
        email,
        password,
      });

      if (response.success) {
        setSuccess('Registration successful! Redirecting to sign in...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Username or email already exists');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12 bg-slate-900 border border-slate-800 p-8 rounded-lg shadow-xl shadow-slate-950/50">
      <h2 className="text-2xl font-bold text-center text-slate-100 mb-6 tracking-wide">
        Create a <span className="text-indigo-400">RailTrack</span> Account
      </h2>

      {error && (
        <div className="mb-4 bg-red-950/40 border border-red-800/60 p-3 rounded-md flex items-center space-x-2 text-red-300 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-950/40 border border-green-800/60 p-3 rounded-md flex items-center space-x-2 text-green-300 text-sm">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <User className="h-5 w-5" />
            </span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md w-full pl-10 pr-3 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-655"
              placeholder="Min 3 characters"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Mail className="h-5 w-5" />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md w-full pl-10 pr-3 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-655"
              placeholder="e.g. name@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Lock className="h-5 w-5" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md w-full pl-10 pr-10 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-655 text-sm"
              placeholder="Min 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-355 cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white py-2.5 rounded-md font-semibold tracking-wide shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-450 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:underline">
          Sign in here
        </Link>
      </p>
    </div>
  );
}
