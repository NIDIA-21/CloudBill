import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCurrency, getStatusColor } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Layers, Plus, Search, Edit, X, Sparkles, Building } from 'lucide-react';

export const VariantsPage: React.FC = () => {
  const { user } = useAuth();
  const [variants, setVariants] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    additionalPrice: '',
    description: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedProduct) params.append('productId', selectedProduct);

      const [varRes, prodRes] = await Promise.all([
        api.get(`/variants?${params.toString()}`),
        api.get('/products?status=active'),
      ]);

      setVariants(varRes.data.data);
      setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProduct]);

  const handleOpenModal = (variant?: any) => {
    if (variant) {
      setEditingVariant(variant);
      setFormData({
        productId: variant.productId,
        name: variant.name,
        additionalPrice: String(variant.additionalPrice),
        description: variant.description || '',
      });
    } else {
      setEditingVariant(null);
      setFormData({
        productId: products[0]?.id || '',
        name: '',
        additionalPrice: '0',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  // Quick Preset Helper for the Mandatory Odoo Brand
  const setOdooBrandPreset = () => {
    setFormData((prev) => ({
      ...prev,
      name: 'Odoo Brand',
      additionalPrice: '560',
      description: 'Odoo branded variant with native theme integration (+₹560)',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVariant) {
        await api.put(`/variants/${editingVariant.id}`, formData);
      } else {
        await api.post('/variants', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving variant', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Product Variants & Pricing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure brand versions (e.g. Standard ₹0, Premium ₹500, Odoo Brand ₹560) that alter actual financial calculations
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Variant</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Filter by Product:</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatCurrency(p.salesPrice)})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Formula: <span className="text-slate-800 font-mono font-bold">Final Price = Base Product Price + Variant Additional Price</span>
        </div>
      </div>

      {/* Variants Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Variant Name</th>
                <th className="py-3 px-4">Parent Product</th>
                <th className="py-3 px-4">Base Product Price</th>
                <th className="py-3 px-4">Additional Surcharge</th>
                <th className="py-3 px-4">Calculated Final Unit Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading variants...
                  </td>
                </tr>
              ) : variants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No variants created yet.
                  </td>
                </tr>
              ) : (
                variants.map((v) => {
                  const base = Number(v.product?.salesPrice || 0);
                  const add = Number(v.additionalPrice || 0);
                  const finalPrice = base + add;
                  const isOdoo = v.name.toLowerCase().includes('odoo');

                  return (
                    <tr key={v.id} className={`hover:bg-slate-50/60 transition ${isOdoo ? 'bg-purple-50/20' : ''}`}>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {isOdoo && <Sparkles className="h-3.5 w-3.5 text-purple-600" />}
                          <span>{v.name}</span>
                        </div>
                        <div className="text-[11px] font-normal text-slate-400">{v.description || 'No description'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {v.product?.name || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatCurrency(base)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-blue-600">
                        +{formatCurrency(add)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {formatCurrency(finalPrice)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(v.status)}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleOpenModal(v)}
                            className="p-1 text-slate-500 hover:text-blue-600 transition"
                            title="Edit Variant"
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
                {editingVariant ? 'Edit Variant' : 'Create Product Variant'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {!editingVariant && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-800 font-semibold">
                    <Sparkles className="h-4 w-4" />
                    <span>Quick Fill: Odoo Brand (+₹560)</span>
                  </div>
                  <button
                    type="button"
                    onClick={setOdooBrandPreset}
                    className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700"
                  >
                    Apply Preset
                  </button>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Product
                </label>
                <select
                  required
                  disabled={!!editingVariant}
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
                >
                  <option value="">Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Base Price: {formatCurrency(p.salesPrice)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Variant Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Odoo Brand, Premium Brand"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Additional Price (₹)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.additionalPrice}
                  onChange={(e) => setFormData({ ...formData, additionalPrice: e.target.value })}
                  placeholder="e.g. 560"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Added on top of the base product price for all invoices.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Variant description..."
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
                  {editingVariant ? 'Save Variant' : 'Create Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
