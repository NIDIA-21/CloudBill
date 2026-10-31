import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDate, formatDateTime, getStatusColor } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldCheck,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  Receipt,
} from 'lucide-react';

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [cycles, setCycles] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cycRes, actRes] = await Promise.all([
        api.get('/billing/cycles?limit=15'),
        api.get('/billing/activity?limit=15'),
      ]);
      setCycles(cycRes.data.data);
      setLogs(actRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunBilling = async () => {
    try {
      setRunning(true);
      setResult(null);
      const res = await api.post('/billing/run');
      setResult(res.data);
      fetchData();
    } catch (err: any) {
      setResult({
        processed: 0,
        invoicesCreated: 0,
        errors: [err.response?.data?.error || 'Billing engine error'],
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Control Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
              <Zap className="h-3.5 w-3.5" />
              <span>Idempotent Recurring Billing Engine</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Recurring Billing Console</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Automated invoice generation for active daily, weekly, monthly and yearly subscriptions.
              Guarantees zero duplicate invoices through strict database idempotency keys on (Subscription ID, Period Start, Period End).
            </p>
          </div>

          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            {user?.role === 'admin' ? (
              <button
                onClick={handleRunBilling}
                disabled={running}
                className="w-full sm:w-auto px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold rounded-2xl text-base shadow-xl shadow-blue-600/40 flex items-center justify-center gap-3 transition transform active:scale-95"
              >
                <Zap className={`h-5 w-5 ${running ? 'animate-spin' : ''}`} />
                <span>{running ? 'Executing Billing Engine...' : '⚡ Run Billing Now'}</span>
              </button>
            ) : (
              <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800 p-3 rounded-xl">
                Manual billing trigger requires Administrator privileges.
              </div>
            )}
            <span className="text-[11px] text-slate-400">
              Background Cron runs hourly: <span className="font-mono text-emerald-400">0 * * * *</span>
            </span>
          </div>
        </div>
      </div>

      {/* Execution Result Banner */}
      {result && (
        <div
          className={`p-5 rounded-2xl border flex items-start gap-3.5 shadow-sm transition ${
            result.errors?.length === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="text-sm font-bold">Billing Cycle Execution Report</h4>
            <p className="text-slate-700">
              Scanned and processed <span className="font-bold">{result.processed}</span> subscriptions. Created{' '}
              <span className="font-bold text-emerald-700">{result.invoicesCreated}</span> new recurring invoices.
            </p>
            {result.errors?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-amber-200/80">
                <span className="font-bold text-amber-800">Engine Notes / Idempotency Checks:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-900">
                  {result.errors.map((e: string, i: number) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Engine Architecture Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Duplicate Prevention</h3>
          <p className="text-slate-500 leading-relaxed">
            Every billing cycle is guarded by a unique constraint on <span className="font-mono font-semibold text-slate-700">BillingCycle(subscriptionId, periodStart, periodEnd)</span>. Concurrent runs or immediate re-clicks cannot double-bill.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
            <Clock className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Date Calculations</h3>
          <p className="text-slate-500 leading-relaxed">
            The next billing date is automatically incremented based on the plan's exact cadence (daily +1d, weekly +7d, monthly +1m with month-end protection, yearly +1y with leap-year handling).
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
            <Layers className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Financial Integrity</h3>
          <p className="text-slate-500 leading-relaxed">
            Invoices preserve snapshot pricing from product variants (including Odoo Brand +₹560), applicable tax rules, and validate active discounts with atomic usage tracking.
          </p>
        </div>
      </div>

      {/* Two Columns: Recent Billing Cycles and Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Cycles */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Billing Cycle Records</h3>
              <p className="text-xs text-slate-500">Atomic idempotency tracking</p>
            </div>
            <span className="text-[11px] font-semibold text-blue-600">Latest 15</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {cycles.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No billing cycles recorded yet.</div>
            ) : (
              cycles.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <span className="font-bold text-slate-900">{c.subscription?.number}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Period: {formatDate(c.periodStart)} → {formatDate(c.periodEnd)}
                    </p>
                  </div>
                  <div className="text-right">
                    {c.invoice ? (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        {c.invoice.number} ({formatCurrency(c.invoice.total)})
                      </span>
                    ) : (
                      <span className="text-slate-400 capitalize">{c.status}</span>
                    )}
                    <span className="text-slate-400 block text-[10px] mt-0.5">
                      {formatDateTime(c.executedAt || c.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Billing Activity Audit Log</h3>
              <p className="text-xs text-slate-500">Every engine action and outcome</p>
            </div>
            <span className="text-[11px] font-semibold text-blue-600">Latest 15</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No activity logs recorded yet.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 flex items-start justify-between hover:bg-slate-50 transition">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider px-1.5 py-0.5 bg-slate-100 rounded">
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.2 rounded-full font-bold uppercase text-[9px] ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">{log.message}</p>
                    {log.subscription && (
                      <span className="text-[11px] text-slate-400 block">Sub: {log.subscription.number}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-3">
                    {formatDateTime(log.executedAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
