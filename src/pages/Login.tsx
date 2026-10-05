import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response: any = await api.post('/api/v1/auth/signin', {
        username,
        password,
      });

      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.token);
        localStorage.setItem('username', response.data.username);
        localStorage.setItem('email', response.data.email);
        localStorage.setItem('userId', response.data.id.toString());
        localStorage.setItem('roles', JSON.stringify(response.data.roles));
        navigate('/');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12 bg-slate-900 border border-slate-800 p-8 rounded-lg shadow-xl shadow-slate-950/50">
      <h2 className="text-2xl font-bold text-center text-slate-100 mb-6 tracking-wide">
        Sign In to <span className="text-indigo-400">RailTrack</span>
      </h2>

      {error && (
        <div className="mb-4 bg-red-950/40 border border-red-800/60 p-3 rounded-md flex items-center space-x-2 text-red-300 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
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
              className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md w-full pl-10 pr-3 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-650"
              placeholder="Enter your username"
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
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 cursor-pointer"
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
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-450 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-indigo-400 hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
}
