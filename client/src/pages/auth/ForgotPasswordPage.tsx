import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Building2, Mail, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      if (res.data.devToken) {
        setDevToken(res.data.devToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 pb-4 text-center border-b border-slate-100">
          <div className="inline-flex h-12 w-12 rounded-xl bg-blue-600 text-white items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password</h2>
          <p className="text-sm text-slate-500 mt-1">We'll send you instructions to reset your password</p>
        </div>

        <div className="p-8 space-y-4">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm text-slate-700 font-medium">
                If an account exists with <span className="font-bold">{email}</span>, a password reset link has been dispatched.
              </p>

              {devToken && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-left">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
                    Demo Mode Reset Link:
                  </p>
                  <Link
                    to={`/reset-password?token=${devToken}`}
                    className="text-xs font-semibold text-blue-600 hover:underline break-all"
                  >
                    Click here to reset with token: {devToken.substring(0, 16)}...
                  </Link>
                </div>
              )}

              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-semibold pt-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Registered Email
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <span>{loading ? 'Sending Link...' : 'Send Reset Link'}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
