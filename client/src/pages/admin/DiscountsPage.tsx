import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Percent, Plus, Search, Edit, X, CheckCircle2, AlertCircle } from 'lucide-react';

export const DiscountsPage: React.FC = () => {
  const { user } = useAuth();
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: '',
    minPurchase: '0',
    minQuantity: 0,
    startDate: '',
    endDate: '',
    maxUsage: '',
  });

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await api.get(`/discounts?${params.toString()}`);
      setDiscounts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [search]);

  const handleOpenModal = (disc?: any) => {
    if (disc) {
      setEditingDiscount(disc);
      setFormData({
        name: disc.name,
        code: disc.code,
        type: disc.type,
        value: String(disc.value),
        minPurchase: String(disc.minPurchase || 0),
        minQuantity: disc.minQuantity || 0,
        startDate: disc.startDate ? disc.startDate.split('T')[0] : '',
        endDate: disc.endDate ? disc.endDate.split('T')[0] : '',
        maxUsage: disc.maxUsage ? String(disc.maxUsage) : '',
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        name: '',
        code: '',
        type: 'percentage',
        value: '10',
        minPurchase: '0',
        minQuantity: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        maxUsage: '100',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDiscount) {
        await api.put(`/discounts/${editingDiscount.id}`, {
          ...formData,
          value: Number(formData.value),
          minPurchase: Number(formData.minPurchase),
          minQuantity: Number(formData.minQuantity),
          maxUsage: formData.maxUsage ? Number(formData.maxUsage) : null,
        });
      } else {
        await api.post('/discounts', {
          ...formData,
          value: Number(formData.value),
          minPurchase: Number(formData.minPurchase),
          minQuantity: Number(formData.minQuantity),
          maxUsage: formData.maxUsage ? Number(formData.maxUsage) : null,
        });
      }
      setIsModalOpen(false);
      fetchDiscounts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save discount');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Discounts & Promotion Rules</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure percentage and fixed value promotion vouchers with minimum thresholds and atomic usage limits
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Discount</span>
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search discount by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Discount Value</th>
                <th className="py-3 px-4">Min Spend / Qty</th>
                <th className="py-3 px-4">Usage Limit</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading discount rules...
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No discounts configured.
                  </td>
                </tr>
              ) : (
                discounts.map((d) => {
                  const isExpired = d.endDate && new Date(d.endDate) < new Date();
                  const isExhausted = d.maxUsage !== null && d.usedCount >= d.maxUsage;

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono tracking-wider">
                        <span className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
                          {d.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{d.name}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 text-sm">
                        {d.type === 'percentage' ? `${d.value}% Off` : `₹${d.value} Flat Off`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>Min Spend: {Number(d.minPurchase) > 0 ? formatCurrency(d.minPurchase) : 'None'}</div>
                        {d.minQuantity > 0 && <div className="text-[10px] text-slate-400">Min Qty: {d.minQuantity}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900">
                          {d.usedCount} / {d.maxUsage ?? '∞'}
                        </span>
                        {isExhausted && (
                          <span className="block text-[9px] text-red-600 font-bold uppercase">Exhausted</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {d.endDate ? (
                          <span className={isExpired ? 'text-red-500 font-bold' : ''}>
                            Until {formatDate(d.endDate)}
                          </span>
                        ) : (
                          'No expiry'
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(d.status)}`}>
                          {isExpired ? 'Expired' : d.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleOpenModal(d)}
                            className="p-1 text-slate-500 hover:text-blue-600 transition"
                            title="Edit Discount"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingDiscount ? 'Edit Discount Rule' : 'Create Promotion Discount'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Discount Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Festive Welcome Offer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingDiscount}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. FESTIVE15"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Discount Value ({formData.type === 'percentage' ? '%' : '₹'})
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Max Usage Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUsage}
                    onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Min Purchase (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Date (Expiry)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
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
                  {editingDiscount ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
