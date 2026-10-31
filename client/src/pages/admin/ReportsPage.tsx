import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { BarChart3, TrendingUp, DollarSign, Calendar, FileSpreadsheet } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Financial Analytics</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Audited performance reports, normalized MRR run-rates, product contribution and aging balances
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Revenue Collected
          </span>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(data?.revenueCollected || 0)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Actual cash received into accounts</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Normalized MRR Run-Rate
          </span>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(data?.mrr || 0)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Calculated across active subscriptions</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Outstanding Balance
          </span>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(data?.outstandingAmount || 0)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Across {data?.outstandingCount || 0} invoices</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Overdue Balance
          </span>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(data?.overdueAmount || 0)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">{data?.overdueCount || 0} delinquent invoices</span>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Cash Collection Run-Rate (Past 12 Months)</h3>
        <p className="text-xs text-slate-500 mb-6">Aggregated payments received per calendar month</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.monthlyRevenue || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Collections']} />
              <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} fill="url(#colorRev2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Contribution Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Product Revenue Contribution</h3>
        <p className="text-xs text-slate-500 mb-6">Total invoiced value by product catalog category</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.revenueByProduct || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="product" stroke="#475569" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Invoiced']} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
