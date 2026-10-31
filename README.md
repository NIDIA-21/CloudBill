# BRIGHTLOOP SOFTWARE – COMPLETE SUBSCRIPTION & RECURRING BILLING PLATFORM
**Makeathon 9.0 Solution · Production-Grade SaaS MVP**

---

## 🌟 Executive Overview
**Brightloop Software** is a complete, fully integrated Subscription Management and Automated Recurring Billing System. It replaces error-prone spreadsheet tracking and manual billing with an automated, idempotent billing engine, multi-frequency subscription lifecycle tracking, quotation conversions, tax calculations, variant pricing (including the mandatory **Odoo Brand +₹560**), partial payment tracking, and real-time financial reporting.

The system enforces strict role-based access control across **Administrator**, **Staff**, and **Customer Self-Service** roles with multi-tenant data isolation.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies Used | Description |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts | Enterprise SaaS administration dashboard, dark navy sidebar, responsive design, interactive charts, and customer portal |
| **Backend** | Node.js (v24), Express.js, TypeScript, TSX | RESTful APIs, JWT authentication, role authorization middleware, cron billing engine |
| **Database** | SQLite via Prisma ORM 5.22.0 (Zero external installation required) | Normalized schema with foreign keys, compound indexes, unique idempotency constraints |
| **Engine** | Node-cron, PDFKit, Nodemailer | Automated multi-frequency billing with period calculation, PDF invoice rendering, and email dispatch with dev preview |

---

## 🔑 Demo Login Credentials

The database is pre-seeded with accounts for all roles. All accounts use standard passwords meeting the 4-rule complexity requirement (8+ characters, 1 uppercase, 1 lowercase, 1 special character):

| Role | Email Address | Password | Permissions & Scope |
|---|---|---|---|
| **Administrator** | `admin@brightloop.com` | `Admin@123` | Full system control: products, variants, plans, staff creation, tax, discounts, billing trigger, reports |
| **Staff Member 1** | `staff1@brightloop.com` | `Staff@123` | Operational console: customers, quotations, subscriptions, invoices, payment settlements |
| **Staff Member 2** | `staff2@brightloop.com` | `Staff@123` | Operational console (cannot provision staff or alter system discount rules) |
| **Customer 1** | `customer1@example.com` | `Customer@123` | Self-service portal: view own subscriptions, invoices, payment receipts, pause/renew |
| **Customer 2** | `customer2@example.com` | `Customer@123` | Has active subscription with Odoo Brand variant (+₹560) |
| **Customer 3** | `customer3@example.com` | `Customer@123` | Has active weekly plan with partial payments |
| **Customer 4** | `customer4@example.com` | `Customer@123` | Has paused subscription |
| **Customer 5** | `customer5@example.com` | `Customer@123` | Has closed subscription |

> 💡 **Quick Login:** On the login page, click any of the **Quick-Fill buttons** (Admin, Staff, Customer) to test without typing.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Install Dependencies
```bash
# In server directory
cd server
npm install

# In client directory
cd ../client
npm install
```

### 3. Database Migration & Seeding
```bash
cd server

# Synchronize database schema
npx prisma db push

# Populate demonstration seed records
npx tsx prisma/seed.ts
```

### 4. Running the Application
Open two terminal windows:

**Terminal 1 (Backend API - Port 5000):**
```bash
cd server
npm run dev
# Server runs at http://localhost:5000
```

**Terminal 2 (Frontend Client - Port 5173):**
```bash
cd client
npm run dev
# Client runs at http://localhost:5173
```
Visit **`http://localhost:5173`** in your browser.

---

## ⚡ The 20-Step End-to-End Workflow Demonstration

The entire 20-step lifecycle required by the specification can be verified via the UI or automated test suite:

```bash
cd server
npx tsx test-workflow.ts
```

### Manual UI Demonstration Steps:
1. **Admin Login**: Sign in as `admin@brightloop.com` / `Admin@123`.
2. **Create Product**: Navigate to **Products** → Click **Create Product** (e.g. CloudBill ERP, ₹6,000).
3. **Add Product Variant**: Navigate to **Product Variants** → Add variant **Odoo Brand** with additional price **₹560**.
4. **Subscription Plan**: Navigate to **Subscription Plans** → Create a **Monthly** plan.
5. **Tax Rule**: Navigate to **Tax Management** → Configure **GST 18%**.
6. **Discount Rule**: Navigate to **Discounts** → Create voucher code with minimum purchase criteria.
7. **Customer Registration**: Log out and click **Register** → Create customer account (strict password rules enforced).
8. **Staff Quotation**: Log in as `staff1@brightloop.com` → Navigate to **Quotations** → Click **New Quotation** → Select customer, choose the Odoo Brand variant (+₹560), and apply discount voucher.
9. **Accept Quotation**: In Quotations table, click **Send** then **Accept**.
10. **Convert to Subscription**: Click **Convert to Sub** → Status becomes **Confirmed**. Click **Activate** to start recurring billing.
11. **Recurring Billing Engine**: In **Billing Engine**, click **⚡ Run Billing Now** (Admin trigger).
12. **Invoice Generation**: The engine automatically generates the invoice, advances the subscription's next billing date, and writes an entry in **Billing Activity**.
13. **Financial Calculations**: Open the generated invoice:
    - Base Price: ₹6,000
    - Odoo Brand Variant: +₹560
    - Discount Applied: -₹500
    - Tax (18% on taxable subtotal): ₹1,090.80
    - Total: ₹7,150.80
14. **Confirm Invoice**: Click **Confirm** on the draft invoice.
15. **Customer Portal**: Sign in as the registered customer → Open **My Invoices** → Download official **PDF Invoice**.
16. **Record Payment**: Log back in as Staff → Open **Payments** → Click **Record Customer Payment** → Select invoice and record settlement.
17. **Invoice Paid**: Invoice status automatically updates to **PAID**, outstanding balance becomes ₹0.
18. **Dashboard Reflection**: Dashboard metrics update immediately: Revenue Collected increases by actual cash received, and normalized MRR updates.
19. **Next Billing Cycle**: Subscription date has automatically advanced to next month.
20. **Duplicate Prevention**: Click **⚡ Run Billing Now** again. The engine detects the cycle already completed for that period, skips re-invoicing, and outputs **0 duplicate invoices** (atomic idempotency).

---

## 📊 Performance & Scalability Benchmarks

The challenge specifically requires all endpoints to respond in **under 2 seconds**, even with large datasets. We verified this requirement by creating synthetic datasets with thousands of records:

```bash
cd server
npx tsx benchmark.ts
```

### Empirical Local Benchmark Results:
| Endpoint / Operation | Real Measured Response Time | Requirement | Status |
|---|---|---|---|
| **Dashboard Aggregation (MRR, Revenue, Status Breakdown)** | **100.4 ms** | < 2,000 ms | ✅ **PASS (20x faster)** |
| **Subscriptions List (Paginated Page 1)** | **18.7 ms** | < 2,000 ms | ✅ **PASS (100x faster)** |
| **Subscriptions List (Deep Page 25)** | **15.3 ms** | < 2,000 ms | ✅ **PASS** |
| **Subscriptions Search & Status Filter** | **14.5 ms** | < 2,000 ms | ✅ **PASS** |
| **Invoices Paginated List** | **16.4 ms** | < 2,000 ms | ✅ **PASS** |
| **Customer Accounts Directory** | **10.0 ms** | < 2,000 ms | ✅ **PASS** |
| **Products & Variants Catalog** | **10.5 ms** | < 2,000 ms | ✅ **PASS** |
| **Billing Cycles History** | **7.7 ms** | < 2,000 ms | ✅ **PASS** |

---

## 🛡️ Security & Idempotency Safeguards
- **bcrypt Password Hashing (Salt Rounds: 12)**
- **Password Strength Rules**: Enforced backend and frontend (8+ chars, 1 uppercase, 1 lowercase, 1 special character).
- **Backend Role-Based Access Control**: Staff and Customers cannot invoke admin endpoints regardless of frontend state.
- **Multi-Tenant Ownership Verification**: Changing an invoice or subscription ID in URL or query params returns `403 / 404` for unauthorized users.
- **Duplicate Billing Prevention**: Atomic unique compound database constraint on `BillingCycle(subscriptionId, periodStart, periodEnd)` wrapped in Prisma `$transaction`.

---

## 📄 License & Attribution
Developed for **Makeathon 9.0** by the Brightloop Engineering Team.
