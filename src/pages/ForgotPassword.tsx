import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP & New Password, 3: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to Email
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response: any = await api.post('/api/v1/auth/forgot-password', { email: trimmedEmail });
      if (response.success || response.status === 200) {
        setStep(2);
        setResendCooldown(60);
      } else {
        setError(response.message || 'Could not send reset code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code. Verify your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setError('Please enter the valid 6-digit OTP code');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response: any = await api.post('/api/v1/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: trimmedOtp,
        newPassword,
      });

      if (response.success || response.status === 200) {
        setStep(3);
      } else {
        setError(response.message || 'Password reset failed. Please check the OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Please ensure the code is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-6 sm:my-12 bg-slate-900 border border-slate-800 p-4 sm:p-8 rounded-xl shadow-xl shadow-slate-950/50">
      
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-wide">
          {step === 3 ? 'Password Reset!' : 'Reset Your Password'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {step === 1 && 'Enter your registered email to receive a 6-digit recovery code.'}
          {step === 2 && `Enter the 6-digit code sent to ${email}`}
          {step === 3 && 'Your account password has been updated successfully.'}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-950/40 border border-red-800/60 p-3 rounded-md flex items-center space-x-2 text-red-300 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Email Form */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Registered Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md w-full pl-10 pr-3 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 text-sm"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white py-2.5 rounded-md font-semibold tracking-wide shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <span>Send Recovery Code</span>
            )}
          </button>
        </form>
      )}

      {/* Step 2: OTP & New Password */}
      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">6-Digit Recovery OTP</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <KeyRound className="h-5 w-5" />
              </span>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md w-full pl-10 pr-3 py-2.5 text-indigo-300 font-mono tracking-widest text-lg outline-none transition-all placeholder:text-slate-650"
                placeholder="123456"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md w-full pl-10 pr-10 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 text-sm"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Confirm New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md w-full pl-10 pr-10 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 text-sm"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Didn't get the code?</span>
            <button
              type="button"
              disabled={resendCooldown > 0 || loading}
              onClick={() => handleRequestOtp()}
              className="text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 font-medium cursor-pointer disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white py-2.5 rounded-md font-semibold tracking-wide shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2 mt-4"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>
      )}

      {/* Step 3: Success Screen */}
      {step === 3 && (
        <div className="text-center space-y-6 py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <p className="text-slate-300 text-sm">
            Your password has been changed securely. You can now use your new password to sign in.
          </p>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-md font-semibold tracking-wide shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      )}

      {/* Back to Login link */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
        <Link
          to="/login"
          className="inline-flex items-center space-x-1.5 text-xs sm:text-sm text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Sign In</span>
        </Link>
      </div>

    </div>
  );
}

