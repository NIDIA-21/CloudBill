import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Layers,
  CalendarCheck,
  Users,
  ShieldAlert,
  FileText,
  FileStack,
  RefreshCw,
  Zap,
  History,
  Receipt,
  Percent,
  Landmark,
  CreditCard,
  BarChart3,
  Settings,
  UserCheck,
  LogOut,
  Building2,
  ChevronRight,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Product Variants', path: '/admin/variants', icon: Layers },
    { label: 'Subscription Plans', path: '/admin/plans', icon: CalendarCheck },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Staff Management', path: '/admin/staff', icon: ShieldAlert },
    { label: 'Quotations', path: '/admin/quotations', icon: FileText },
    { label: 'Quotation Templates', path: '/admin/quotation-templates', icon: FileStack },
    { label: 'Subscriptions', path: '/admin/subscriptions', icon: RefreshCw },
    { label: 'Billing Engine', path: '/admin/billing', icon: Zap, badge: 'Auto' },
    { label: 'Billing Activity', path: '/admin/billing-activity', icon: History },
    { label: 'Invoices', path: '/admin/invoices', icon: Receipt },
    { label: 'Discounts', path: '/admin/discounts', icon: Percent },
    { label: 'Tax Management', path: '/admin/taxes', icon: Landmark },
    { label: 'Payments', path: '/admin/payments', icon: CreditCard },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const staffNavItems = [
    { label: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
    { label: 'Customers', path: '/staff/customers', icon: Users },
    { label: 'Quotations', path: '/staff/quotations', icon: FileText },
    { label: 'Quotation Templates', path: '/staff/quotation-templates', icon: FileStack },
    { label: 'Subscriptions', path: '/staff/subscriptions', icon: RefreshCw },
    { label: 'Invoices', path: '/staff/invoices', icon: Receipt },
    { label: 'Payments', path: '/staff/payments', icon: CreditCard },
  ];

  const customerNavItems = [
    { label: 'Overview', path: '/portal/dashboard', icon: LayoutDashboard },
    { label: 'My Subscriptions', path: '/portal/subscriptions', icon: RefreshCw },
    { label: 'My Invoices', path: '/portal/invoices', icon: Receipt },
    { label: 'Payment History', path: '/portal/payments', icon: CreditCard },
    { label: 'My Profile', path: '/portal/profile', icon: UserCheck },
  ];

  const navItems =
    user?.role === 'admin'
      ? adminNavItems
      : user?.role === 'staff'
      ? staffNavItems
      : customerNavItems;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <span className="font-bold text-white tracking-tight text-lg">Brightloop</span>
          <span className="text-xs block text-slate-400 font-medium tracking-wider uppercase">
            {user?.role === 'admin'
              ? 'Admin Suite'
              : user?.role === 'staff'
              ? 'Staff Console'
              : 'Customer Portal'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
              <span className="flex-1 truncate">{item.label}</span>
              {(item as any).badge ? (
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold px-1.5 py-0.5 rounded-full">
                  {(item as any).badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </div>

      {/* User Footer Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 uppercase text-sm">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
              user?.role === 'admin'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : user?.role === 'staff'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}
          >
            {user?.role}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 py-2 rounded-lg border border-rose-900/40 transition-colors font-medium"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
