import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCurrency, getStatusColor } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarCheck, Plus, Edit, Check, X, Clock, AlertCircle } from 'lucide-react';

export const PlansPage: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [frequencyFilter, setFrequencyFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    billingFrequency: 'monthly',
    price: '',
    minQuantity: 1,
    autoClose: true,
    allowEarlyClose: true,
    allowPause: true,
    allowRenewal: true,
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (frequencyFilter) params.append('billingFrequency', frequencyFilter);

      const res = await api.get(`/plans?${params.toString()}`);
      setPlans(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [frequencyFilter]);

  const handleOpenModal = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        billingFrequency: plan.billingFrequency,
        price: String(plan.price),
        minQuantity: plan.minQuantity || 1,
        autoClose: plan.autoClose !== undefined ? plan.autoClose : true,
        allowEarlyClose: plan.allowEarlyClose !== undefined ? plan.allowEarlyClose : true,
        allowPause: plan.allowPause !== undefined ? plan.allowPause : true,
        allowRenewal: plan.allowRenewal !== undefined ? plan.allowRenewal : true,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        billingFrequency: 'monthly',
        price: '2000',
        minQuantity: 1,
        autoClose: true,
        allowEarlyClose: true,
        allowPause: true,
        allowRenewal: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, formData);
      } else {
        await api.post('/plans', formData);
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      console.error('Error saving plan', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Subscription Plans</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure recurring billing cadences (Daily, Weekly, Monthly, Yearly) and customer self-service permissions
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Plan</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-600">Filter by Frequency:</label>
        <select
          value={frequencyFilter}
          onChange={(e) => setFrequencyFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
        >
          <option value="">All Frequencies</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-4 py-12 text-center text-xs text-slate-400">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="col-span-4 py-12 text-center text-xs text-slate-400">No subscription plans found.</div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-blue-300 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {plan.billingFrequency}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getStatusColor(plan.status)}`}>
                    {plan.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg leading-tight">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.description || 'No description provided'}</p>

                <div className="my-5">
                  <span className="text-2xl font-bold text-slate-900">{formatCurrency(plan.price)}</span>
                  <span className="text-xs text-slate-500 ml-1">/{plan.billingFrequency}</span>
                </div>

                {/* Plan Permissions List */}
                <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Can be Paused:</span>
                    {plan.allowPause ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Allowed
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <X className="h-3.5 w-3.5" /> No
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Early Closure:</span>
                    {plan.allowEarlyClose ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Allowed
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <X className="h-3.5 w-3.5" /> Restricted
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Allow Renewal:</span>
                    {plan.allowRenewal ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Allowed
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <X className="h-3.5 w-3.5" /> No
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Auto Close on Expiry:</span>
                    {plan.autoClose ? (
                      <span className="text-blue-600 font-semibold flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="text-slate-400">Manual</span>
                    )}
                  </div>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="pt-6 border-t border-slate-100 mt-4 flex justify-end">
                  <button
                    onClick={() => handleOpenModal(plan)}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-200"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit Plan</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Monthly Professional, Yearly Enterprise"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Frequency
                  </label>
                  <select
                    value={formData.billingFrequency}
                    onChange={(e) => setFormData({ ...formData, billingFrequency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 capitalize"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Base Plan Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Plan features, SLA, billing details..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Permissions Checklist */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Configurable Business Conditions
                </p>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowPause}
                    onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Allow subscriptions on this plan to be Paused</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowEarlyClose}
                    onChange={(e) => setFormData({ ...formData, allowEarlyClose: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Allow Early Cancellation / Closure</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowRenewal}
                    onChange={(e) => setFormData({ ...formData, allowRenewal: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Allow Renewal upon completion</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoClose}
                    onChange={(e) => setFormData({ ...formData, autoClose: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Automatically Close upon reaching End Date</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
