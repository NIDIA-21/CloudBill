import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { Receipt, Download, AlertCircle, FileText, CreditCard, CheckCircle2 } from 'lucide-react';

export const CustomerInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pay Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('upi');
  const [transRef, setTransRef] = useState<string>('');
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      setInvoices(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownloadPDF = async (id: string, number: string) => {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download invoice PDF');
    }
  };

  const openPayModal = (inv: any) => {
    setSelectedInvoice(inv);
    const due = Number(inv.outstandingAmount || inv.total || 0);
    setPayAmount(due);
    setPayMethod('upi');
    setTransRef(`TXN-${Date.now().toString().slice(-6)}`);
    setPaySuccess(false);
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return;
    try {
      setPaying(true);
      await api.post('/payments', {
        invoiceId: selectedInvoice.id,
        amount: payAmount,
        method: payMethod,
        transactionRef: transRef,
        note: 'Customer Portal Online Settlement',
      });
      setPaySuccess(true);
      setTimeout(() => {
        setSelectedInvoice(null);
        fetchInvoices();
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Invoices & Receipts</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          View official tax invoices generated for your recurring billing periods, download printable PDFs, and settle outstanding balances
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Payment Due Date</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading your invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    You have no invoices issued yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isPaid = inv.status === 'paid' || Number(inv.outstandingAmount) <= 0;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{inv.number}</td>
                      <td className="py-3.5 px-4 text-slate-600">{formatDate(inv.issueDate)}</td>
                      <td className="py-3.5 px-4 text-slate-600">{formatDate(inv.dueDate)}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{formatCurrency(inv.total)}</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-semibold">{formatCurrency(inv.paidAmount || 0)}</td>
                      <td className={`py-3.5 px-4 font-bold ${Number(inv.outstandingAmount) > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {formatCurrency(inv.outstandingAmount || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && (
                            <button
                              onClick={() => openPayModal(inv)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Pay Online</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPDF(inv.id, inv.number)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">Settle Invoice Online</h3>
                <p className="text-xs text-emerald-100 mt-0.5">{selectedInvoice.number}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {paySuccess ? (
                <div className="text-center py-6 space-y-2">
                  <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Payment Successful!</h4>
                  <p className="text-xs text-slate-500">Invoice {selectedInvoice.number} has been marked as PAID.</p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Outstanding Balance</span>
                    <span className="text-lg font-black text-red-600">
                      {formatCurrency(selectedInvoice.outstandingAmount || selectedInvoice.total)}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'upi', label: 'UPI / QR' },
                        { id: 'card', label: 'Card' },
                        { id: 'bank_transfer', label: 'NetBanking' },
                      ].map((m) => (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setPayMethod(m.id)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                            payMethod === m.id
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-700 ring-2 ring-emerald-500/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Amount to Pay (₹)
                    </label>
                    <input
                      type="number"
                      value={payAmount}
                      max={selectedInvoice.outstandingAmount || selectedInvoice.total}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full text-sm font-bold p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Transaction Reference
                    </label>
                    <input
                      type="text"
                      value={transRef}
                      onChange={(e) => setTransRef(e.target.value)}
                      className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(null)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={paying || payAmount <= 0}
                      onClick={handleProcessPayment}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
                    >
                      {paying ? 'Processing...' : `Pay ${formatCurrency(payAmount)}`}
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
