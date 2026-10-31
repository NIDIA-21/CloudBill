import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { FileStack, Plus, Trash2, Edit, X } from 'lucide-react';

export const QuotationTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [items, setItems] = useState<any[]>([
    { productId: '', variantId: '', planId: '', taxRuleId: '', quantity: 1, unitPrice: 0 },
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tplRes, prodRes, planRes, taxRes] = await Promise.all([
        api.get('/quotation-templates'),
        api.get('/products?status=active'),
        api.get('/plans?status=active'),
        api.get('/taxes?status=active'),
      ]);
      setTemplates(tplRes.data.data);
      setProducts(prodRes.data.data);
      setPlans(planRes.data.data);
      setTaxes(taxRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setTemplateName('');
    setDescription('');
    setValidityDays(30);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/quotation-templates', {
        name: templateName,
        description,
        validityDays: Number(validityDays),
        items: items.map((it) => ({
          ...it,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create template', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quotation Templates</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-configured product bundles and plan offers enabling sales staff to quickly prepare accurate quotes
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Template</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400">No quotation templates found.</div>
        ) : (
          templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{tpl.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{tpl.description || 'No description'}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  Valid {tpl.validityDays} days
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Bundled Lines ({tpl.items?.length || 0})
                </span>
                {tpl.items?.map((it: any) => (
                  <div key={it.id} className="text-xs flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                    <div>
                      <span className="font-semibold text-slate-800">{it.product?.name}</span>
                      {it.variant && (
                        <span className="text-[10px] text-purple-700 block font-medium">
                          Variant: {it.variant.name} (+{formatCurrency(it.variant.additionalPrice)})
                        </span>
                      )}
                      {it.plan && (
                        <span className="text-[10px] text-slate-500 block">Plan: {it.plan.name}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{formatCurrency(it.unitPrice)}</div>
                      <span className="text-[10px] text-slate-400">Qty: {it.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Create Quotation Template</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. ERP Starter Suite"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Offer notes and details..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Items Line Editor */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                    Template Lines
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
                            Variant (Brand)
                          </label>
                          <select
                            value={it.variantId}
                            onChange={(e) => handleItemChange(idx, 'variantId', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <option value="">No Variant / Base</option>
                            {availableVariants.map((v: any) => (
                              <option key={v.id} value={v.id}>
                                {v.name} (+{formatCurrency(v.additionalPrice)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Subscription Plan
                          </label>
                          <select
                            value={it.planId}
                            onChange={(e) => handleItemChange(idx, 'planId', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <option value="">Select plan cadence...</option>
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
                            <option value="">None</option>
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
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
