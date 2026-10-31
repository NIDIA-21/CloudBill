import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { RefreshCw, Play, Pause, RotateCcw, StopCircle, Eye, X, Check, AlertCircle } from 'lucide-react';

export const CustomerSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscriptions');
      setSubscriptions(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleAction = async (id: string, action: string) => {
    if (action === 'close' && !confirm('Request early closure of this subscription?')) return;
    try {
      await api.patch(`/subscriptions/${id}/status`, { action });
      fetchSubscriptions();
      if (selectedSub && selectedSub.id === id) {
        viewDetails(id);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || `Action failed`);
    }
  };

  const viewDetails = async (id: string) => {
    try {
      const res = await api.get(`/subscriptions/${id}`);
      setSelectedSub(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Subscriptions</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          View your active plans, manage recurring billing status, pause or renew according to plan terms
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Subscription #</th>
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4">Cadence</th>
                <th className="py-3 px-4">Recurring Price</th>
                <th className="py-3 px-4">Next Billing Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Self-Service Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading your subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    You have no subscriptions yet.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <button onClick={() => viewDetails(sub.id)} className="hover:text-blue-600 hover:underline">
                        {sub.number}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{sub.plan?.name}</td>
                    <td className="py-3.5 px-4 capitalize text-slate-600">{sub.plan?.billingFrequency}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{formatCurrency(sub.total)}</td>
                    <td className="py-3.5 px-4 font-medium text-blue-600">{formatDate(sub.nextBillingDate)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {sub.status === 'active' && sub.plan?.allowPause && (
                        <button
                          onClick={() => handleAction(sub.id, 'pause')}
                          className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-xs font-semibold"
                          title="Pause subscription"
                        >
                          Pause
                        </button>
                      )}

                      {sub.status === 'paused' && (
                        <button
                          onClick={() => handleAction(sub.id, 'resume')}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold"
                          title="Resume subscription"
                        >
                          Resume
                        </button>
                      )}

                      {sub.status === 'active' && sub.plan?.allowEarlyClose && (
                        <button
                          onClick={() => handleAction(sub.id, 'close')}
                          className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-xs font-semibold"
                          title="Cancel subscription"
                        >
                          Cancel
                        </button>
                      )}

                      {sub.status === 'closed' && sub.plan?.allowRenewal && (
                        <button
                          onClick={() => handleAction(sub.id, 'renew')}
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold"
                          title="Renew subscription"
                        >
                          Renew
                        </button>
                      )}

                      <button
                        onClick={() => viewDetails(sub.id)}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-xs"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailOpen && selectedSub && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{selectedSub.number}</h3>
                  <span className={`px-2 py-0.5 rounded-full capitalize font-semibold text-xs ${getStatusColor(selectedSub.status)}`}>
                    {selectedSub.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{selectedSub.plan?.name}</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Start Date</span>
                  <p className="font-semibold text-slate-800">{formatDate(selectedSub.startDate)}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Next Billing</span>
                  <p className="font-semibold text-blue-600">{formatDate(selectedSub.nextBillingDate)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Included Products</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {selectedSub.items?.map((it: any) => (
                    <div key={it.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 block">{it.product?.name}</span>
                        {it.variant && (
                          <span className="text-[11px] text-purple-700 block font-medium">
                            Variant: {it.variant.name} (+{formatCurrency(it.variant.additionalPrice)})
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{formatCurrency(it.lineTotal)}</span>
                        <span className="text-slate-400 block text-[10px]">Qty: {it.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
