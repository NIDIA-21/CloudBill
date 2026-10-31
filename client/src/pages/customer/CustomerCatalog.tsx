import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import {
  Package,
  Layers,
  CalendarCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Tag,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const CustomerCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [discountCode, setDiscountCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; value: number; type: string } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Modal / Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, planRes] = await Promise.all([
          api.get('/products?status=active&limit=50'),
          api.get('/plans?status=active&limit=50'),
        ]);
        const fetchedProducts = prodRes.data.data || [];
        const fetchedPlans = planRes.data.data || [];
        setProducts(fetchedProducts);
        setPlans(fetchedPlans);
        if (fetchedPlans.length > 0) setSelectedPlanId(fetchedPlans[0].id);
      } catch (err) {
        console.error('Error fetching catalog data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openSubscribeModal = (product: any) => {
    setSelectedProduct(product);
    if (product.variants && product.variants.length > 0) {
      // Default to Odoo brand if present, otherwise first variant
      const odooVar = product.variants.find((v: any) => v.name.toLowerCase().includes('odoo'));
      setSelectedVariantId(odooVar ? odooVar.id : product.variants[0].id);
    } else {
      setSelectedVariantId('');
    }
    setQuantity(1);
    setDiscountCode('');
    setAppliedDiscount(null);
    setDiscountError(null);
    setOrderSuccess(null);
    setIsCheckoutOpen(true);
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountError(null);
    try {
      const res = await api.get('/discounts?status=active');
      const discounts = res.data.data || [];
      const match = discounts.find(
        (d: any) => d.code.toUpperCase() === discountCode.trim().toUpperCase()
      );
      if (match) {
        setAppliedDiscount({
          code: match.code,
          value: Number(match.value),
          type: match.type,
        });
      } else {
        setDiscountError('Invalid or expired discount code. Try code "DEMO4797" for -₹500!');
      }
    } catch {
      setDiscountError('Could not validate discount code.');
    }
  };

  // Calculations
  const basePrice = selectedProduct ? Number(selectedProduct.salesPrice) : 0;
  const activeVariant = selectedProduct?.variants?.find((v: any) => v.id === selectedVariantId);
  const variantSurcharge = activeVariant ? Number(activeVariant.additionalPrice) : 0;
  const unitTotal = basePrice + variantSurcharge;
  const lineSubtotal = unitTotal * Math.max(1, quantity);

  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === 'percentage') {
      discountAmount = (lineSubtotal * appliedDiscount.value) / 100;
    } else {
      discountAmount = Math.min(appliedDiscount.value, lineSubtotal);
    }
  }

  const taxableAmount = Math.max(0, lineSubtotal - discountAmount);
  const gstRate = 0.18; // Standard 18% GST for software services
  const taxAmount = Math.round(taxableAmount * gstRate * 100) / 100;
  const finalOrderTotal = taxableAmount + taxAmount;

  const handleConfirmPurchase = async () => {
    if (!selectedProduct || !selectedPlanId) return;
    try {
      setSubmitting(true);
      const res = await api.post('/subscriptions/purchase', {
        productId: selectedProduct.id,
        variantId: selectedVariantId || undefined,
        planId: selectedPlanId,
        quantity,
        discountCode: appliedDiscount ? appliedDiscount.code : undefined,
      });
      setOrderSuccess(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Purchase failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Brightloop Software Catalog</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Explore Software Products & Plans
          </h2>
          <p className="text-blue-100 text-sm mt-1 max-w-2xl">
            Choose from enterprise-ready software suites, select your brand variant (including Standard, Premium, or Odoo Brand), and activate your subscription in 1 click.
          </p>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          <span>Available Software Suites</span>
        </h3>

        {products.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            No software products currently available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                      {prod.type || 'Software'}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {prod.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3">
                    {prod.description || 'Full-featured enterprise subscription product with automated recurring billing, tax compliance, and instant portal access.'}
                  </p>

                  {/* Variants Pills */}
                  {prod.variants && prod.variants.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
                        Available Editions / Brands:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {prod.variants.map((v: any) => (
                          <span
                            key={v.id}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-medium"
                          >
                            <span>{v.name}</span>
                            <span className="text-blue-600 font-semibold">
                              {Number(v.additionalPrice) > 0 ? `(+₹${v.additionalPrice})` : '(Base)'}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 pt-0 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between mt-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Starts at</span>
                    <div className="text-xl font-black text-slate-900">
                      {formatCurrency(prod.salesPrice)}
                    </div>
                  </div>

                  <button
                    onClick={() => openSubscribeModal(prod)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition cursor-pointer"
                  >
                    <span>Subscribe Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Billing Frequencies / Plans Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-indigo-600" />
          <span>Supported Billing Frequencies</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Brightloop supports flexible recurring frequencies with automated invoice dispatch and date calculation:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Daily Subscriptions', freq: 'daily', badge: 'High Frequency' },
            { label: 'Weekly Subscriptions', freq: 'weekly', badge: 'Flexible Sprint' },
            { label: 'Monthly Subscriptions', freq: 'monthly', badge: 'Most Popular' },
            { label: 'Yearly Subscriptions', freq: 'yearly', badge: 'Best Value' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                {item.badge}
              </span>
              <h5 className="font-bold text-slate-800 text-sm">{item.label}</h5>
              <p className="text-[11px] text-slate-500 mt-1 capitalize">Cadence: {item.freq}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Configure & Checkout */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg">Subscribe to Software</h3>
                <p className="text-xs text-blue-100 mt-0.5">{selectedProduct?.name}</p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {orderSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-slate-900">Subscription Activated!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Subscription <span className="font-bold text-blue-600">{orderSuccess.subscription?.number}</span> has been created.
                    </p>
                    <p className="text-xs text-slate-500">
                      Invoice <span className="font-bold text-slate-900">{orderSuccess.invoice?.number}</span> is ready for review or immediate online payment.
                    </p>
                  </div>

                  <div className="flex justify-center gap-3 pt-3">
                    <button
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        navigate('/portal/subscriptions');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
                    >
                      View My Subscriptions
                    </button>
                    <button
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        navigate('/portal/invoices');
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
                    >
                      View & Pay Invoice
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Select Plan */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      1. Select Subscription Plan / Cadence
                    </label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.billingFrequency}) — {formatCurrency(p.price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Brand Variant */}
                  {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                        2. Select Product Brand Variant
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {selectedProduct.variants.map((v: any) => {
                          const isSelected = selectedVariantId === v.id;
                          return (
                            <button
                              type="button"
                              key={v.id}
                              onClick={() => setSelectedVariantId(v.id)}
                              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <span className="text-xs font-bold text-slate-900">{v.name}</span>
                              <span className="text-[11px] font-semibold text-blue-600 mt-1">
                                {Number(v.additionalPrice) > 0 ? `+₹${v.additionalPrice}` : 'Included'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="flex items-center justify-between border-t border-b border-slate-100 py-3">
                    <span className="text-xs font-bold text-slate-700">Licenses / Quantity</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="h-7 w-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold w-6 text-center">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="h-7 w-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Promo Code Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Promotional Discount Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. DEMO4797"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="flex-1 text-xs uppercase p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyDiscount}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                      >
                        Apply
                      </button>
                    </div>
                    {discountError && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{discountError}</span>
                      </p>
                    )}
                    {appliedDiscount && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Code {appliedDiscount.code} applied (-{appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}%` : `₹${appliedDiscount.value}`})</span>
                      </p>
                    )}
                  </div>

                  {/* Financial Breakdown */}
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-200">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Base Unit Price</span>
                      <span>{formatCurrency(basePrice)}</span>
                    </div>
                    {variantSurcharge > 0 && (
                      <div className="flex justify-between text-xs text-blue-600 font-medium">
                        <span>Variant Brand Surcharge ({activeVariant?.name})</span>
                        <span>+{formatCurrency(variantSurcharge)}</span>
                      </div>
                    )}
                    {quantity > 1 && (
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Quantity Multiplier</span>
                        <span>× {quantity}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                        <span>Discount ({appliedDiscount?.code})</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>GST (18%)</span>
                      <span>+{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                      <span>Total Subscription Due</span>
                      <span className="text-blue-700 text-base">{formatCurrency(finalOrderTotal)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleConfirmPurchase}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 inline-flex items-center justify-center gap-2 transition"
                    >
                      {submitting ? (
                        <span>Activating...</span>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          <span>Activate Subscription</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
