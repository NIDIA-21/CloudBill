import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  Receipt,
  Search,
  Download,
  Mail,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  CreditCard,
  Printer,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Selected Invoice Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Email Status Alert
  const [emailAlert, setEmailAlert] = useState<{ message: string; preview?: string } | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const res = await api.get(`/invoices?${params.toString()}`);
      setInvoices(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, search, fromDate, toDate]);

  const viewInvoice = async (id: string) => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setSelectedInvoice(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await api.patch(`/invoices/${id}/confirm`);
      fetchInvoices();
      if (selectedInvoice) viewInvoice(id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to confirm invoice');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this invoice? This will set outstanding balance to ₹0.')) return;
    try {
      await api.patch(`/invoices/${id}/cancel`);
      fetchInvoices();
      if (selectedInvoice) viewInvoice(id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel invoice');
    }
  };

  const handleSendEmail = async (id: string) => {
    try {
      const res = await api.post(`/invoices/${id}/send`);
      setEmailAlert({
        message: 'Invoice email dispatched to customer successfully!',
        preview: res.data.preview,
      });
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send invoice email');
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Invoices & Receivables</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-generated recurring invoices, payment due dates, PDF generation and email delivery
          </p>
        </div>
      </div>

      {/* Email Alert Banner */}
      {emailAlert && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-2 relative">
          <button
            onClick={() => setEmailAlert(null)}
            className="absolute top-3 right-3 text-blue-500 hover:text-blue-700"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <Mail className="h-4 w-4" />
            <span>{emailAlert.message}</span>
          </div>
          {emailAlert.preview && (
            <div className="p-3 bg-white border border-blue-100 rounded-lg text-slate-700 max-h-40 overflow-y-auto">
              <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">
                Development Mode HTML Preview:
              </span>
              <div dangerouslySetInnerHTML={{ __html: emailAlert.preview }} />
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number (e.g. INV-0001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none capitalize"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed (Unpaid)</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            title="From Issue Date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            title="To Issue Date"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
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
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isOverdue =
                    ['confirmed', 'partially_paid'].includes(inv.status) &&
                    new Date(inv.dueDate) < new Date();

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <button
                          onClick={() => viewInvoice(inv.id)}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {inv.number}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {inv.customer?.firstName} {inv.customer?.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(inv.issueDate)}</td>
                      <td className="py-3.5 px-4">
                        <span className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                          {formatDate(inv.dueDate)}
                        </span>
                        {isOverdue && (
                          <span className="block text-[9px] text-red-600 font-bold uppercase">Overdue</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-600 font-semibold">
                        {formatCurrency(inv.paidAmount || 0)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-red-600">
                        {formatCurrency(inv.outstandingAmount || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleDownloadPDF(inv.id, inv.number)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                          title="Download PDF Invoice"
                        >
                          <Download className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleSendEmail(inv.id)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                          title="Email Invoice to Customer"
                        >
                          <Mail className="h-4 w-4" />
                        </button>

                        {inv.status === 'draft' && (
                          <button
                            onClick={() => handleConfirm(inv.id)}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold"
                            title="Confirm Draft Invoice"
                          >
                            Confirm
                          </button>
                        )}

                        {user?.role === 'admin' && inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(inv.id)}
                            className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-semibold"
                            title="Cancel Invoice"
                          >
                            Cancel
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

      {/* Invoice Detail Modal */}
      {isDetailOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">Invoice {selectedInvoice.number}</h3>
                  <span className={`px-2 py-0.5 rounded-full capitalize font-semibold text-xs ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sub: {selectedInvoice.subscription?.number || 'Direct'} · Period: {formatDate(selectedInvoice.periodStart)} - {formatDate(selectedInvoice.periodEnd)}
                </p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Customer & Dates */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Bill To</span>
                  <p className="font-semibold text-slate-800">
                    {selectedInvoice.customer?.firstName} {selectedInvoice.customer?.lastName}
                  </p>
                  <p className="text-[11px] text-slate-500">{selectedInvoice.customer?.email}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Issue Date</span>
                  <p className="font-semibold text-slate-800">{formatDate(selectedInvoice.issueDate)}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Due Date</span>
                  <p className="font-semibold text-red-600">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Sent via Email</span>
                  <p className="font-semibold text-slate-700">
                    {selectedInvoice.sentAt ? formatDate(selectedInvoice.sentAt) : 'Not dispatched yet'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Itemized Breakdown</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Product Name</th>
                        <th className="py-2 px-3">Variant (Brand)</th>
                        <th className="py-2 px-3">Qty</th>
                        <th className="py-2 px-3">Unit Price</th>
                        <th className="py-2 px-3">Tax</th>
                        <th className="py-2 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items?.map((it: any) => (
                        <tr key={it.id}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{it.productName}</td>
                          <td className="py-2 px-3 text-purple-700 font-medium">{it.variantName || 'Standard'}</td>
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

              {/* Financial Calculation Summary */}
              <div className="flex justify-end">
                <div className="w-72 space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>

                  {Number(selectedInvoice.discountAmount) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount Applied:</span>
                      <span>-{formatCurrency(selectedInvoice.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Applicable Tax:</span>
                    <span>+{formatCurrency(selectedInvoice.taxAmount)}</span>
                  </div>

                  <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-2">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(selectedInvoice.total)}</span>
                  </div>

                  <div className="flex justify-between text-emerald-600 font-semibold border-t border-slate-200 pt-1">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                  </div>

                  <div className="flex justify-between text-red-600 font-bold text-sm">
                    <span>Outstanding Balance:</span>
                    <span>{formatCurrency(selectedInvoice.outstandingAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment History for this invoice */}
              {selectedInvoice.payments?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">Linked Payments</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Payment #</th>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3">Reference</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedInvoice.payments.map((p: any) => (
                          <tr key={p.id}>
                            <td className="py-2 px-3 font-bold text-slate-800">{p.number}</td>
                            <td className="py-2 px-3 uppercase font-semibold text-slate-600">
                              {p.method.replace('_', ' ')}
                            </td>
                            <td className="py-2 px-3 text-slate-500">{p.transactionRef || '-'}</td>
                            <td className="py-2 px-3 text-slate-500">{formatDate(p.paymentDate)}</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-600">
                              +{formatCurrency(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice.id, selectedInvoice.number)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => handleSendEmail(selectedInvoice.id)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Mail className="h-4 w-4" />
                  <span>Send by Email</span>
                </button>
              </div>

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
