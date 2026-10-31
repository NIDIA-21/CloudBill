import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  RefreshCw,
  Plus,
  Search,
  Play,
  Pause,
  RotateCcw,
  StopCircle,
  Eye,
  CheckCircle2,
  X,
  Calendar,
  AlertTriangle,
  Receipt,
  FileCheck,
} from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Details Modal
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // New Subscription Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<any[]>([
    { productId: '', variantId: '', quantity: 1, unitPrice: 0 },
  ]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const [subRes, custRes, planRes, prodRes] = await Promise.all([
        api.get(`/subscriptions?${params.toString()}`),
        api.get('/customers?status=active'),
        api.get('/plans?status=active'),
        api.get('/products?status=active'),
      ]);

      setSubscriptions(subRes.data.data);
      setCustomers(custRes.data.data);
      setPlans(planRes.data.data);
      setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, search]);

  const viewDetails = async (id: string) => {
    try {
      const res = await api.get(`/subscriptions/${id}`);
      setSelectedSub(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (id: string, action: string, reason?: string) => {
    if (action === 'close' && !confirm('Are you sure you want to close this subscription?')) return;
    try {
      await api.patch(`/subscriptions/${id}/status`, { action, reason });
      fetchSubscriptions();
      if (selectedSub && selectedSub.id === id) {
        viewDetails(id);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || `Action ${action} failed`);
    }
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/subscriptions', {
        customerId,
        planId,
        startDate,
        items: items.map((it) => ({
          ...it,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      });

      setIsCreateOpen(false);
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create subscription');
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'productId') {
      const selected = products.find((p) => p.id === value);
      if (selected) {
        updated[index].unitPrice = Number(selected.salesPrice);
        updated[index].variantId = selected.variants?.[0]?.id || '';
      }
    }
    setItems(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Subscriptions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage contract lifecycles: DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED, plus Pause/Resume
          </p>
        </div>

        <button
          onClick={() => {
            setCustomerId(customers[0]?.id || '');
            setPlanId(plans[0]?.id || '');
            const defP = products[0];
            setItems([
              {
                productId: defP?.id || '',
                variantId: defP?.variants?.[0]?.id || '',
                quantity: 1,
                unitPrice: Number(defP?.salesPrice || 0),
              },
            ]);
            setIsCreateOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Subscription</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search subscription by SUB-xxxx..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none capitalize"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="confirmed">Confirmed</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Subscription #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan & Cadence</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Next Billing Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((s) => {
                  const isDue = s.status === 'active' && new Date(s.nextBillingDate) <= new Date();

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <button
                          onClick={() => viewDetails(s.id)}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {s.number}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {s.customer?.firstName} {s.customer?.lastName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700 block">{s.plan?.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {s.plan?.billingFrequency}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {formatCurrency(s.total)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={isDue ? 'text-amber-600 font-bold' : 'text-slate-600'}>
                            {formatDate(s.nextBillingDate)}
                          </span>
                          {isDue && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold uppercase">
                              Due
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        {/* Lifecycle Buttons */}
                        {s.status === 'draft' && (
                          <button
                            onClick={() => handleAction(s.id, 'confirm')}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold"
                            title="Confirm Subscription"
                          >
                            Confirm
                          </button>
                        )}

                        {s.status === 'confirmed' && (
                          <button
                            onClick={() => handleAction(s.id, 'activate')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                            title="Activate Subscription"
                          >
                            <Play className="h-3 w-3" />
                            <span>Activate</span>
                          </button>
                        )}

                        {s.status === 'active' && (
                          <>
                            {s.plan?.allowPause && (
                              <button
                                onClick={() => handleAction(s.id, 'pause')}
                                className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-xs font-semibold"
                                title="Pause Recurring Billing"
                              >
                                Pause
                              </button>
                            )}
                            <button
                              onClick={() => handleAction(s.id, 'close')}
                              className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-xs font-semibold"
                              title="Close Subscription"
                            >
                              Close
                            </button>
                          </>
                        )}

                        {s.status === 'paused' && (
                          <button
                            onClick={() => handleAction(s.id, 'resume')}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold"
                            title="Resume Subscription"
                          >
                            Resume
                          </button>
                        )}

                        {s.status === 'closed' && s.plan?.allowRenewal && (
                          <button
                            onClick={() => handleAction(s.id, 'renew')}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold"
                            title="Renew Subscription"
                          >
                            Renew
                          </button>
                        )}

                        <button
                          onClick={() => viewDetails(s.id)}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-xs"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Detail Modal */}
      {isDetailOpen && selectedSub && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{selectedSub.number}</h3>
                  <span className={`px-2 py-0.5 rounded-full capitalize font-semibold text-xs ${getStatusColor(selectedSub.status)}`}>
                    {selectedSub.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer: {selectedSub.customer?.firstName} {selectedSub.customer?.lastName} ({selectedSub.customer?.email})
                </p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Overview Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Plan</span>
                  <p className="font-semibold text-slate-800">{selectedSub.plan?.name}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Cadence</span>
                  <p className="font-semibold text-slate-800 capitalize">{selectedSub.plan?.billingFrequency}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Start Date</span>
                  <p className="font-semibold text-slate-800">{formatDate(selectedSub.startDate)}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Next Billing</span>
                  <p className="font-semibold text-blue-600">{formatDate(selectedSub.nextBillingDate)}</p>
                </div>
              </div>

              {/* Product Lines */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Subscription Product Lines</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Product</th>
                        <th className="py-2 px-3">Variant</th>
                        <th className="py-2 px-3">Qty</th>
                        <th className="py-2 px-3">Unit Price</th>
                        <th className="py-2 px-3">Tax</th>
                        <th className="py-2 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSub.items?.map((it: any) => (
                        <tr key={it.id}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{it.product?.name}</td>
                          <td className="py-2 px-3 text-purple-700 font-medium">
                            {it.variant ? `${it.variant.name} (+₹${it.variant.additionalPrice})` : 'Standard'}
                          </td>
                          <td className="py-2 px-3">{it.quantity}</td>
                          <td className="py-2 px-3">{formatCurrency(it.unitPrice)}</td>
                          <td className="py-2 px-3 text-slate-500">{formatCurrency(it.taxAmount)}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(it.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoices Generated Under this Subscription */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Generated Recurring Invoices</h4>
                {selectedSub.invoices?.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Invoice #</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Total</th>
                          <th className="py-2 px-3">Outstanding</th>
                          <th className="py-2 px-3">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedSub.invoices.map((inv: any) => (
                          <tr key={inv.id}>
                            <td className="py-2 px-3 font-bold text-slate-900">{inv.number}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(inv.status)}`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900">{formatCurrency(inv.total)}</td>
                            <td className="py-2 px-3 font-bold text-red-600">{formatCurrency(inv.outstandingAmount)}</td>
                            <td className="py-2 px-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No recurring invoices issued yet for this subscription.</p>
                )}
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

      {/* Create Subscription Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Create Direct Subscription</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSub} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Customer
                  </label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Plan
                  </label>
                  <select
                    required
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {plans.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name} ({pl.billingFrequency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  Product & Variant
                </span>
                {items.map((it, idx) => {
                  const currP = products.find((p) => p.id === it.productId);
                  return (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Product</label>
                        <select
                          value={it.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Variant</label>
                        <select
                          value={it.variantId}
                          onChange={(e) => handleItemChange(idx, 'variantId', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <option value="">Base Version</option>
                          {currP?.variants?.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {v.name} (+₹{v.additionalPrice})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Create Draft Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
