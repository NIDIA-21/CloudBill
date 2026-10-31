import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Admin / Staff Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { ProductsPage } from './pages/admin/ProductsPage';
import { VariantsPage } from './pages/admin/VariantsPage';
import { PlansPage } from './pages/admin/PlansPage';
import { CustomersPage } from './pages/admin/CustomersPage';
import { StaffPage } from './pages/admin/StaffPage';
import { QuotationTemplatesPage } from './pages/admin/QuotationTemplatesPage';
import { QuotationsPage } from './pages/admin/QuotationsPage';
import { SubscriptionsPage } from './pages/admin/SubscriptionsPage';
import { BillingPage } from './pages/admin/BillingPage';
import { BillingActivityPage } from './pages/admin/BillingActivityPage';
import { InvoicesPage } from './pages/admin/InvoicesPage';
import { DiscountsPage } from './pages/admin/DiscountsPage';
import { TaxesPage } from './pages/admin/TaxesPage';
import { PaymentsPage } from './pages/admin/PaymentsPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerSubscriptions } from './pages/customer/CustomerSubscriptions';
import { CustomerInvoices } from './pages/customer/CustomerInvoices';
import { CustomerPayments } from './pages/customer/CustomerPayments';
import { CustomerProfile } from './pages/customer/CustomerProfile';

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'staff') return <Navigate to="/staff/dashboard" replace />;
  return <Navigate to="/portal/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AppLayout title="Administrator Workspace" />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="variants" element={<VariantsPage />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="quotations" element={<QuotationsPage />} />
              <Route path="quotation-templates" element={<QuotationTemplatesPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="billing-activity" element={<BillingActivityPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="discounts" element={<DiscountsPage />} />
              <Route path="taxes" element={<TaxesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Staff Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
            <Route path="/staff" element={<AppLayout title="Staff Operations Console" />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="quotations" element={<QuotationsPage />} />
              <Route path="quotation-templates" element={<QuotationTemplatesPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
            </Route>
          </Route>

          {/* Customer Portal Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route path="/portal" element={<AppLayout title="Customer Self-Service Portal" />}>
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="subscriptions" element={<CustomerSubscriptions />} />
              <Route path="invoices" element={<CustomerInvoices />} />
              <Route path="payments" element={<CustomerPayments />} />
              <Route path="profile" element={<CustomerProfile />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
