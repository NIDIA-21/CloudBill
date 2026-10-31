import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  X,
  FileStack,
  Trash2,
  AlertCircle,
  Check,
} from 'lucide-react';

export const QuotationsPage: React.FC = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal State for New Quotation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedDiscountId, setSelectedDiscountId] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([
    { productId: '', variantId: '', planId: '', taxRuleId: '', quantity: 1, unitPrice: 0 },
  ]);

  // Convert Modal State
  const [convertingQuo, setConvertingQuo] = useState<any | null>(null);
  const [convertPlanId, setConvertPlanId] = useState('');
  const [convertStartDate, setConvertStartDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const [quoRes, custRes, prodRes, planRes, tplRes, taxRes, discRes] = await Promise.all([
        api.get(`/quotations?${params.toString()}`),
        api.get('/customers?status=active'),
        api.get('/products?status=active'),
        api.get('/plans?status=active'),
        api.get('/quotation-templates'),
        api.get('/taxes?status=active'),
        api.get('/discounts?status=active'),
      ]);

      setQuotations(quoRes.data.data);
      setCustomers(custRes.data.data);
      setProducts(prodRes.data.data);
      setPlans(planRes.data.data);
      setTemplates(tplRes.data.data);
      setTaxes(taxRes.data.data);
      setDiscounts(discRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, search]);

  const handleOpenModal = () => {
    setSelectedCustomerId(customers[0]?.id || '');
    setSelectedTemplateId('');
    setSelectedDiscountId('');
    setValidityDays(30);
    setNotes('');

    const defaultProd = products[0];
    setItems([
      {
        productId: defaultProd?.id || '',
        variantId: defaultProd?.variants?.[0]?.id || '',
        planId: plans[0]?.id || '',
        taxRuleId: taxes[0]?.id || '',
        quantity: 1,
        unitPrice: Number(defaultProd?.salesPrice || 0),
      },
    ]);
    setIsModalOpen(true);
  };

  // When a template is picked, auto-populate lines
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setValidityDays(tpl.validityDays);
      if (tpl.items?.length > 0) {
        setItems(
          tpl.items.map((it: any) => ({
            productId: it.productId,
            variantId: it.variantId || '',
            planId: it.planId || '',
            taxRuleId: it.taxRuleId || '',
            quantity: it.quantity,
            unitPrice: Number(it.unitPrice),
          }))
        );
      }
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

  const addItemRow = () => {
    const defaultProd = products[0];
    setItems([
      ...items,
      {
        productId: defaultProd?.id || '',
        variantId: defaultProd?.variants?.[0]?.id || '',
        planId: plans[0]?.id || '',
        taxRuleId: taxes[0]?.id || '',
        quantity: 1,
        unitPrice: Number(defaultProd?.salesPrice || 0),
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/quotations', {
        customerId: selectedCustomerId,
        templateId: selectedTemplateId || null,
        discountId: selectedDiscountId || null,
        validityDays: Number(validityDays),
        notes,
        items: items.map((it) => ({
          ...it,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      });

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create quotation');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/quotations/${id}/status`, { status });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Status update failed');
    }
  };

  const openConvertModal = (quo: any) => {
    setConvertingQuo(quo);
    // Find default plan from first item if present
    const firstPlanId = quo.items?.[0]?.planId;
    setConvertPlanId(firstPlanId || plans[0]?.id || '');
    setConvertStartDate(new Date().toISOString().split('T')[0]);
  };

  const handleConvertQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingQuo) return;

    try {
      const res = await api.post(`/quotations/${convertingQuo.id}/convert`, {
        planId: convertPlanId,
        startDate: convertStartDate,
      });

      alert(`Quotation ${convertingQuo.number} converted to Subscription ${res.data.number}!`);
      setConvertingQuo(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Conversion failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sales Quotations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Prepare, dispatch, validate and convert quotation offers into active recurring subscriptions
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Quotation</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search quotation by number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Quotation #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Tax</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Expires On</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading quotations...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => {
                  const isExpired = new Date(q.expiresAt) < new Date();

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{q.number}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {q.customer?.firstName} {q.customer?.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{formatCurrency(q.subtotal)}</td>
                      <td className="py-3.5 px-4 text-emerald-600">
                        {Number(q.discountAmount) > 0 ? `-${formatCurrency(q.discountAmount)}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">+{formatCurrency(q.taxAmount)}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {formatCurrency(q.total)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={isExpired ? 'text-red-500 font-semibold' : 'text-slate-500'}>
                          {formatDate(q.expiresAt)}
                        </span>
                        {isExpired && q.status !== 'accepted' && (
                          <span className="block text-[10px] text-red-500 font-bold uppercase">Expired</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(q.status)}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        {/* Status Actions */}
                        {q.status === 'draft' && (
                          <button
                            onClick={() => handleUpdateStatus(q.id, 'sent')}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold"
                            title="Send to customer"
                          >
                            Send
                          </button>
                        )}

                        {q.status === 'sent' && !isExpired && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(q.id, 'accepted')}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold"
                              title="Mark Accepted"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(q.id, 'rejected')}
                              className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-semibold"
                              title="Mark Rejected"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {q.status === 'accepted' && (
                          <button
                            onClick={() => openConvertModal(q)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs inline-flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Convert to Sub</span>
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

      {/* New Quotation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Prepare New Quotation</h3>
                <p className="text-xs text-slate-500">
                  Select customer, optionally apply a template, adjust items, variants and discounts
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Account
                  </label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Load Template (Optional)
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Manual Lines (No Template)</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.validityDays}d)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Items Line Editor */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                    Quotation Line Items
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 rounded-md font-semibold text-xs flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Product Line
                  </button>
                </div>

                {items.map((it, idx) => {
                  const currentProduct = products.find((p) => p.id === it.productId);
                  const availableVariants = currentProduct?.variants || [];

                  return (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Product</label>
                          <select
                            required
                            value={it.productId}
                            onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <option value="">Select product...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Product Variant
                          </label>
                          <select
                            value={it.variantId}
                            onChange={(e) => handleItemChange(idx, 'variantId', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <option value="">Standard Base</option>
                            {availableVariants.map((v: any) => (
                              <option key={v.id} value={v.id}>
                                {v.name} (+{formatCurrency(v.additionalPrice)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Subscription Cadence
                          </label>
                          <select
                            value={it.planId}
                            onChange={(e) => handleItemChange(idx, 'planId', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <option value="">Select plan...</option>
                            {plans.map((pl) => (
                              <option key={pl.id} value={pl.id}>
                                {pl.name} ({pl.billingFrequency})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Unit Price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Tax Rule</label>
                          <select
                            value={it.taxRuleId}
                            onChange={(e) => handleItemChange(idx, 'taxRuleId', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <option value="">None (0%)</option>
                            {taxes.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.rate}%)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex justify-end pt-3">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete row"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Discount selection */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Apply Discount Voucher (Optional)
                </label>
                <select
                  value={selectedDiscountId}
                  onChange={(e) => setSelectedDiscountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">No Discount</option>
                  {discounts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name} ({d.type === 'percentage' ? `${d.value}%` : `₹${d.value}`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Quotation Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Terms, delivery timeline, or custom notes..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
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
                  Generate Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Subscription Modal */}
      {convertingQuo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Convert Quotation {convertingQuo.number} to Subscription
                </h3>
                <p className="text-xs text-slate-500">
                  Customer: {convertingQuo.customer?.firstName} {convertingQuo.customer?.lastName}
                </p>
              </div>
              <button onClick={() => setConvertingQuo(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConvertQuotation} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Subscription Billing Plan
                </label>
                <select
                  required
                  value={convertPlanId}
                  onChange={(e) => setConvertPlanId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select Plan...</option>
                  {plans.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name} ({pl.billingFrequency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Subscription Start Date
                </label>
                <input
                  type="date"
                  required
                  value={convertStartDate}
                  onChange={(e) => setConvertStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <span className="font-bold text-blue-900 block">Subscription Summary</span>
                <p className="text-slate-700">Total Contract Value: {formatCurrency(convertingQuo.total)}</p>
                <p className="text-slate-600">
                  Initial Status: <span className="font-bold text-blue-700">CONFIRMED</span> (ready for activation)
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConvertingQuo(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Confirm & Create Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
