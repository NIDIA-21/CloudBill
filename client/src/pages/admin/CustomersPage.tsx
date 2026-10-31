import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatDate, formatCurrency, getStatusColor } from '../../lib/utils';
import { Users, Search, Eye, Edit, X, Mail, Phone, Calendar, RefreshCw } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await api.get(`/customers?${params.toString()}`);
      setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const viewDetails = async (id: string) => {
    try {
      const res = await api.get(`/customers/${id}`);
      setSelectedCustomer(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered customer accounts, their active subscription plans, and billing records
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading customer accounts...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {c.firstName?.[0]}
                          {c.lastName?.[0]}
                        </div>
                        <span>
                          {c.firstName} {c.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{c.email}</td>
                    <td className="py-3.5 px-4 text-slate-500">{c.phone || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(c.createdAt)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => viewDetails(c.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-medium transition"
                      >
                        View Account
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {isDetailOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h3>
                <p className="text-xs text-slate-500">{selectedCustomer.email}</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Info Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Phone Number</span>
                  <p className="font-semibold text-slate-800">{selectedCustomer.phone || 'None provided'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Account Status</span>
                  <p className="font-semibold text-slate-800 capitalize">{selectedCustomer.status}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Registered On</span>
                  <p className="font-semibold text-slate-800">{formatDate(selectedCustomer.createdAt)}</p>
                </div>
              </div>

              {/* Subscriptions */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                  <span>Associated Subscriptions</span>
                </h4>
                {selectedCustomer.subscriptions?.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Sub #</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Amount</th>
                          <th className="py-2 px-3">Start Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedCustomer.subscriptions.map((s: any) => (
                          <tr key={s.id}>
                            <td className="py-2 px-3 font-bold text-slate-800">{s.number}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(s.status)}`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{formatCurrency(s.total)}</td>
                            <td className="py-2 px-3 text-slate-500">{formatDate(s.startDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No subscriptions created yet.</p>
                )}
              </div>

              {/* Invoices */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Customer Invoices</h4>
                {selectedCustomer.invoices?.length > 0 ? (
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
                        {selectedCustomer.invoices.map((inv: any) => (
                          <tr key={inv.id}>
                            <td className="py-2 px-3 font-bold text-slate-800">{inv.number}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(inv.status)}`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{formatCurrency(inv.total)}</td>
                            <td className="py-2 px-3 font-semibold text-red-600">{formatCurrency(inv.outstandingAmount)}</td>
                            <td className="py-2 px-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No invoices issued yet.</p>
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
    </div>
  );
};
