import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  RefreshCw,
  Receipt,
  CreditCard,
  Calendar,
  AlertCircle,
  Download,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPDF = async (id: string, number: string) => {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download invoice PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="h-4 w-4" />
          <span>Customer Self-Service Hub</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Welcome back, {user?.firstName} {user?.lastName}!
        </h2>
        <p className="text-blue-100 text-sm mt-1 max-w-xl">
          Manage your software subscriptions, monitor upcoming recurring billing dates, view and download your official PDF invoices.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Subscriptions</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <RefreshCw className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{data?.activeSubscriptions || 0}</div>
          <Link
            to="/portal/subscriptions"
            className="text-xs text-blue-600 font-semibold hover:underline mt-2 inline-flex items-center gap-1"
          >
            <span>View Subscriptions</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Balance</span>
            <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className={`text-3xl font-bold ${Number(data?.outstandingAmount) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {formatCurrency(data?.outstandingAmount || 0)}
          </div>
          <Link
            to="/portal/invoices"
            className="text-xs text-blue-600 font-semibold hover:underline mt-2 inline-flex items-center gap-1"
          >
            <span>Review Invoices</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Renewals (&lt;7d)</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{data?.upcomingBilling?.length || 0}</div>
          <span className="text-xs text-slate-500 mt-2 block">Scheduled automated cycles</span>
        </div>
      </div>

      {/* Subscriptions Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Your Active Software Plans</h3>
          <Link to="/portal/subscriptions" className="text-xs text-blue-600 font-semibold hover:underline">
            Manage all
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {data?.subscriptions?.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No active subscriptions at this time.</div>
          ) : (
            data?.subscriptions?.map((sub: any) => (
              <div key={sub.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{sub.number}</span>
                    <span className="font-semibold text-slate-700">· {sub.plan?.name}</span>
                    <span className={`px-2 py-0.5 rounded-full capitalize font-semibold text-[10px] ${getStatusColor(sub.status)}`}>
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">
                    Cadence: <span className="capitalize font-medium text-slate-700">{sub.plan?.billingFrequency}</span> · Next billing:{' '}
                    <span className="font-semibold text-blue-600">{formatDate(sub.nextBillingDate)}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-sm">{formatCurrency(sub.total)}</div>
                  <span className="text-[11px] text-slate-400">/{sub.plan?.billingFrequency}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Recent Invoices</h3>
          <Link to="/portal/invoices" className="text-xs text-blue-600 font-semibold hover:underline">
            View full history
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {data?.recentInvoices?.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No invoices issued yet.</div>
          ) : (
            data?.recentInvoices?.map((inv: any) => (
              <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{inv.number}</span>
                    <span className={`px-2 py-0.5 rounded-full capitalize font-semibold text-[10px] ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    Issued {formatDate(inv.issueDate)} · Due {formatDate(inv.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-slate-900 text-sm">{formatCurrency(inv.total)}</div>
                    {Number(inv.outstandingAmount) > 0 && (
                      <span className="text-red-600 font-semibold text-[11px]">
                        Due: {formatCurrency(inv.outstandingAmount)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDownloadPDF(inv.id, inv.number)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
