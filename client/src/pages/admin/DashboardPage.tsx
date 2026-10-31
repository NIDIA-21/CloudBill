import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Zap,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  DollarSign,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingRunning, setBillingRunning] = useState(false);
  const [billingResult, setBillingResult] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRunBilling = async () => {
    try {
      setBillingRunning(true);
      setBillingResult(null);
      const res = await api.post('/billing/run');
      setBillingResult(res.data);
      // Refresh dashboard after billing run
      fetchDashboardData();
    } catch (err: any) {
      setBillingResult({
        processed: 0,
        invoicesCreated: 0,
        errors: [err.response?.data?.error || 'Billing run failed'],
      });
    } finally {
      setBillingRunning(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Billing Engine Live Trigger */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Zap className="h-4 w-4" />
            <span>Automated Recurring Billing Engine</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Financial & Subscription Overview</h2>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Real-time multi-frequency billing engine for daily, weekly, monthly, and yearly subscriptions with idempotent billing cycle protection.
          </p>
        </div>

        {user?.role === 'admin' && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleRunBilling}
              disabled={billingRunning}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2.5 transition transform active:scale-95"
            >
              <Zap className={`h-4 w-4 ${billingRunning ? 'animate-spin' : ''}`} />
              <span>{billingRunning ? 'Processing Billing...' : '⚡ Run Billing Now'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Billing Result Alert */}
      {billingResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition ${
            billingResult.errors?.length === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm">
              Billing Execution Completed: {billingResult.invoicesCreated} Invoices Generated (Processed {billingResult.processed} Subscriptions)
            </p>
            {billingResult.errors?.length > 0 && (
              <div className="text-amber-700 mt-1">
                <span className="font-semibold">Notes / Handled Conditions:</span>
                <ul className="list-disc list-inside">
                  {billingResult.errors.map((err: string, idx: number) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Active Subscriptions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Subs</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <RefreshCw className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{data?.activeSubscriptions || 0}</div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>{data?.subscriptionSummary?.approachingExpiry || 0} expiring soon</span>
          </p>
        </div>

        {/* Revenue Collected */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Revenue Collected</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(data?.revenueCollected || 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Actual completed payments</p>
        </div>

        {/* MRR */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Normalized MRR</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(data?.mrr || 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Monthly Recurring Run-rate</p>
        </div>

        {/* Outstanding Amount */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding</span>
            <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(data?.outstandingAmount || 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Across {data?.outstandingCount || 0} invoices</p>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(data?.overdueAmount || 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">{data?.overdueCount || 0} overdue invoices</p>
        </div>
      </div>

      {/* Subscription Status Breakdown Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Subscription Lifecycle Distribution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg">
            <span className="text-xs font-semibold text-emerald-800">Active</span>
            <div className="text-xl font-bold text-emerald-700">{data?.subscriptionSummary?.active || 0}</div>
          </div>
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
            <span className="text-xs font-semibold text-blue-800">Confirmed</span>
            <div className="text-xl font-bold text-blue-700">{data?.subscriptionSummary?.confirmed || 0}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-xs font-semibold text-slate-600">Draft</span>
            <div className="text-xl font-bold text-slate-800">{data?.subscriptionSummary?.draft || 0}</div>
          </div>
          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-lg">
            <span className="text-xs font-semibold text-amber-800">Paused</span>
            <div className="text-xl font-bold text-amber-700">{data?.subscriptionSummary?.paused || 0}</div>
          </div>
          <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-lg">
            <span className="text-xs font-semibold text-slate-500">Closed</span>
            <div className="text-xl font-bold text-slate-600">{data?.subscriptionSummary?.closed || 0}</div>
          </div>
          <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-lg">
            <span className="text-xs font-semibold text-rose-800">Expiring &lt;30d</span>
            <div className="text-xl font-bold text-rose-700">{data?.subscriptionSummary?.approachingExpiry || 0}</div>
          </div>
        </div>
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
            Monthly Collected Revenue Trend
          </h3>
          <p className="text-xs text-slate-500 mb-6">Historical payment receipts aggregated over time</p>

          <div className="h-64">
            {data?.monthlyRevenue?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Revenue']}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No historical payment data recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Revenue By Product */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">Revenue by Product</h3>
          <p className="text-xs text-slate-500 mb-6">Top performing product offerings</p>

          <div className="h-64">
            {data?.revenueByProduct?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueByProduct} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v}`} />
                  <YAxis type="category" dataKey="product" stroke="#475569" fontSize={11} width={90} tickLine={false} />
                  <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No product revenue records yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices & Payments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Invoices</h3>
            <span className="text-xs text-slate-500">Latest 10 invoices</span>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.recentInvoices?.map((inv: any) => (
              <div key={inv.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{inv.number}</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    Customer: {inv.customer?.firstName} {inv.customer?.lastName} · Due {formatDate(inv.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-sm">{formatCurrency(inv.total)}</div>
                  {Number(inv.outstandingAmount) > 0 && (
                    <span className="text-red-600 font-semibold text-[11px]">
                      Due: {formatCurrency(inv.outstandingAmount)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Payment Receipts</h3>
            <span className="text-xs text-slate-500">Latest completed receipts</span>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.recentPayments?.map((pay: any) => (
              <div key={pay.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{pay.number}</span>
                    <span className="px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-50 text-emerald-700">
                      {pay.method.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    Customer: {pay.customer?.firstName} {pay.customer?.lastName} · Invoice {pay.invoice?.number}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600 text-sm">+{formatCurrency(pay.amount)}</div>
                  <span className="text-slate-400 text-[11px]">{formatDate(pay.paymentDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
