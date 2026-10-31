import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.billingActivityLog.deleteMany();
  await prisma.billingCycle.deleteMany();
  await prisma.discountUsage.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscriptionItem.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.quotationTemplateItem.deleteMany();
  await prisma.quotationTemplate.deleteMany();
  await prisma.discountProduct.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.planProduct.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.taxRule.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.sequence.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash('Admin@123', 12);
  const staffPw = await bcrypt.hash('Staff@123', 12);
  const custPw = await bcrypt.hash('Customer@123', 12);

  // ─── USERS ───────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { email: 'admin@brightloop.com', password: pw, firstName: 'Rajesh', lastName: 'Kumar', phone: '+91-9876543210', role: 'admin' },
  });

  const staff1 = await prisma.user.create({
    data: { email: 'staff1@brightloop.com', password: staffPw, firstName: 'Priya', lastName: 'Sharma', phone: '+91-9876543211', role: 'staff' },
  });

  const staff2 = await prisma.user.create({
    data: { email: 'staff2@brightloop.com', password: staffPw, firstName: 'Amit', lastName: 'Patel', phone: '+91-9876543212', role: 'staff' },
  });

  const cust1 = await prisma.user.create({
    data: { email: 'customer1@example.com', password: custPw, firstName: 'Sanjay', lastName: 'Gupta', phone: '+91-9876543213', role: 'customer' },
  });
  const cust2 = await prisma.user.create({
    data: { email: 'customer2@example.com', password: custPw, firstName: 'Anita', lastName: 'Desai', phone: '+91-9876543214', role: 'customer' },
  });
  const cust3 = await prisma.user.create({
    data: { email: 'customer3@example.com', password: custPw, firstName: 'Vikram', lastName: 'Singh', phone: '+91-9876543215', role: 'customer' },
  });
  const cust4 = await prisma.user.create({
    data: { email: 'customer4@example.com', password: custPw, firstName: 'Meera', lastName: 'Nair', phone: '+91-9876543216', role: 'customer' },
  });
  const cust5 = await prisma.user.create({
    data: { email: 'customer5@example.com', password: custPw, firstName: 'Arjun', lastName: 'Reddy', phone: '+91-9876543217', role: 'customer' },
  });

  console.log('✅ Users created');

  // ─── PRODUCTS ─────────────────────────────────────────
  const prod1 = await prisma.product.create({
    data: { name: 'CloudBill ERP', type: 'software', salesPrice: 5000, costPrice: 2000, description: 'Complete cloud-based ERP solution for SMBs' },
  });
  const prod2 = await prisma.product.create({
    data: { name: 'CloudBill CRM', type: 'software', salesPrice: 3000, costPrice: 1200, description: 'Customer relationship management module' },
  });
  const prod3 = await prisma.product.create({
    data: { name: 'CloudBill Inventory', type: 'software', salesPrice: 2500, costPrice: 1000, description: 'Advanced inventory management' },
  });
  const prod4 = await prisma.product.create({
    data: { name: 'CloudBill Analytics', type: 'addon', salesPrice: 1500, costPrice: 500, description: 'Business intelligence and reporting add-on' },
  });
  const prod5 = await prisma.product.create({
    data: { name: 'Priority Support', type: 'service', salesPrice: 1000, costPrice: 300, description: '24/7 priority support package' },
  });

  console.log('✅ Products created');

  // ─── PRODUCT VARIANTS ─────────────────────────────────
  const var1 = await prisma.productVariant.create({
    data: { productId: prod1.id, name: 'Standard Brand', additionalPrice: 0, description: 'Standard CloudBill branding' },
  });
  const var2 = await prisma.productVariant.create({
    data: { productId: prod1.id, name: 'Premium Brand', additionalPrice: 500, description: 'Premium white-label branding' },
  });
  const var3 = await prisma.productVariant.create({
    data: { productId: prod1.id, name: 'Odoo Brand', additionalPrice: 560, description: 'Odoo-branded variant' },
  });
  const var4 = await prisma.productVariant.create({
    data: { productId: prod2.id, name: 'Standard Brand', additionalPrice: 0, description: 'Standard CRM branding' },
  });
  const var5 = await prisma.productVariant.create({
    data: { productId: prod2.id, name: 'Enterprise Brand', additionalPrice: 800, description: 'Enterprise white-label CRM' },
  });

  console.log('✅ Product variants created');

  // ─── TAX RULES ────────────────────────────────────────
  const tax1 = await prisma.taxRule.create({
    data: { name: 'GST 18%', type: 'percentage', rate: 18, description: 'Standard GST rate' },
  });
  const tax2 = await prisma.taxRule.create({
    data: { name: 'GST 12%', type: 'percentage', rate: 12, description: 'Reduced GST rate' },
  });
  const tax3 = await prisma.taxRule.create({
    data: { name: 'GST 5%', type: 'percentage', rate: 5, description: 'Low GST rate' },
  });
  const tax4 = await prisma.taxRule.create({
    data: { name: 'Service Tax', type: 'fixed', rate: 200, description: 'Fixed service charge', status: 'inactive' },
  });

  console.log('✅ Tax rules created');

  // ─── SUBSCRIPTION PLANS ────────────────────────────────
  const planDaily = await prisma.subscriptionPlan.create({
    data: { name: 'Daily Trial', billingFrequency: 'daily', price: 100, description: 'Daily billing trial plan', allowPause: false, allowEarlyClose: true, allowRenewal: true },
  });
  const planWeekly = await prisma.subscriptionPlan.create({
    data: { name: 'Weekly Starter', billingFrequency: 'weekly', price: 500, description: 'Weekly billing starter plan', allowPause: true, allowEarlyClose: true, allowRenewal: true },
  });
  const planMonthly = await prisma.subscriptionPlan.create({
    data: { name: 'Monthly Professional', billingFrequency: 'monthly', price: 2000, description: 'Monthly professional plan', allowPause: true, allowEarlyClose: true, allowRenewal: true },
  });
  const planYearly = await prisma.subscriptionPlan.create({
    data: { name: 'Yearly Enterprise', billingFrequency: 'yearly', price: 20000, description: 'Yearly enterprise plan with savings', allowPause: true, allowEarlyClose: false, allowRenewal: true },
  });

  console.log('✅ Subscription plans created');

  // ─── DISCOUNTS ────────────────────────────────────────
  const disc1 = await prisma.discount.create({
    data: { name: 'Welcome Offer', code: 'WELCOME10', type: 'percentage', value: 10, minPurchase: 1000, startDate: new Date('2024-01-01'), endDate: new Date('2027-12-31'), maxUsage: 100 },
  });
  const disc2 = await prisma.discount.create({
    data: { name: 'Flat ₹500 Off', code: 'FLAT500', type: 'fixed', value: 500, minPurchase: 3000, startDate: new Date('2024-01-01'), endDate: new Date('2027-12-31'), maxUsage: 50 },
  });
  const disc3 = await prisma.discount.create({
    data: { name: 'Expired Discount', code: 'EXPIRED20', type: 'percentage', value: 20, endDate: new Date('2024-06-30'), maxUsage: 10 },
  });
  const disc4 = await prisma.discount.create({
    data: { name: 'Bulk Purchase', code: 'BULK15', type: 'percentage', value: 15, minQuantity: 5, startDate: new Date('2024-01-01'), endDate: new Date('2027-12-31') },
  });

  console.log('✅ Discounts created');

  // ─── QUOTATION TEMPLATES ──────────────────────────────
  const template1 = await prisma.quotationTemplate.create({
    data: {
      name: 'ERP Starter Package',
      description: 'CloudBill ERP with monthly plan',
      validityDays: 30,
      items: {
        create: [
          { productId: prod1.id, variantId: var1.id, planId: planMonthly.id, taxRuleId: tax1.id, quantity: 1, unitPrice: 5000 },
        ],
      },
    },
  });

  const template2 = await prisma.quotationTemplate.create({
    data: {
      name: 'Complete Business Suite',
      description: 'ERP + CRM + Analytics with yearly plan',
      validityDays: 15,
      items: {
        create: [
          { productId: prod1.id, variantId: var2.id, planId: planYearly.id, taxRuleId: tax1.id, quantity: 1, unitPrice: 5000 },
          { productId: prod2.id, variantId: var4.id, planId: planYearly.id, taxRuleId: tax1.id, quantity: 1, unitPrice: 3000 },
          { productId: prod4.id, planId: planYearly.id, taxRuleId: tax2.id, quantity: 1, unitPrice: 1500 },
        ],
      },
    },
  });

  console.log('✅ Quotation templates created');

  // ─── SEQUENCES ─────────────────────────────────────────
  await prisma.sequence.create({ data: { name: 'subscription', current: 10 } });
  await prisma.sequence.create({ data: { name: 'invoice', current: 20 } });
  await prisma.sequence.create({ data: { name: 'quotation', current: 5 } });
  await prisma.sequence.create({ data: { name: 'payment', current: 15 } });

  // ─── SAMPLE QUOTATIONS ────────────────────────────────
  const quo1 = await prisma.quotation.create({
    data: {
      number: 'QUO-0001', customerId: cust1.id, createdById: staff1.id,
      subtotal: 5000, taxAmount: 900, total: 5900, status: 'accepted',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: {
        create: [{ productId: prod1.id, variantId: var1.id, planId: planMonthly.id, taxRuleId: tax1.id, quantity: 1, unitPrice: 5000, variantPrice: 0, taxAmount: 900, lineTotal: 5900 }],
      },
    },
  });

  const quo2 = await prisma.quotation.create({
    data: {
      number: 'QUO-0002', customerId: cust2.id, createdById: staff1.id,
      subtotal: 5560, taxAmount: 1000.80, total: 6560.80, status: 'draft',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: {
        create: [{ productId: prod1.id, variantId: var3.id, planId: planMonthly.id, taxRuleId: tax1.id, quantity: 1, unitPrice: 5000, variantPrice: 560, taxAmount: 1000.80, lineTotal: 6560.80 }],
      },
    },
  });

  console.log('✅ Quotations created');

  // ─── SAMPLE SUBSCRIPTIONS ─────────────────────────────
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const lastMonth = new Date(now); lastMonth.setMonth(now.getMonth() - 1);
  const twoMonthsAgo = new Date(now); twoMonthsAgo.setMonth(now.getMonth() - 2);
  const nextYear = new Date(now); nextYear.setFullYear(now.getFullYear() + 1);

  // Active monthly subscription (due for billing = yesterday, so billing engine can demo)
  const sub1 = await prisma.subscription.create({
    data: {
      number: 'SUB-0001', customerId: cust1.id, planId: planMonthly.id,
      startDate: lastMonth, nextBillingDate: yesterday,
      endDate: nextYear, subtotal: 5000, taxAmount: 900, total: 5900, status: 'active',
      items: {
        create: [{ productId: prod1.id, variantId: var1.id, taxRuleId: tax1.id, quantity: 1, unitPrice: 5000, variantPrice: 0, taxAmount: 900, lineTotal: 5900 }],
      },
    },
  });

  // Active subscription with Odoo Brand variant (due for billing)
  const sub2 = await prisma.subscription.create({
    data: {
      number: 'SUB-0002', customerId: cust2.id, planId: planMonthly.id, discountId: disc1.id,
      startDate: lastMonth, nextBillingDate: yesterday,
      endDate: nextYear, subtotal: 5560, discountAmount: 556, taxAmount: 900.72, total: 5904.72, status: 'active',
      items: {
        create: [{ productId: prod1.id, variantId: var3.id, taxRuleId: tax1.id, quantity: 1, unitPrice: 5000, variantPrice: 560, taxAmount: 900.72, lineTotal: 6460.72 }],
      },
    },
  });

  // Active weekly subscription
  const threeDaysAgo = new Date(now); threeDaysAgo.setDate(now.getDate() - 3);
  const sub3 = await prisma.subscription.create({
    data: {
      number: 'SUB-0003', customerId: cust3.id, planId: planWeekly.id,
      startDate: threeDaysAgo, nextBillingDate: yesterday,
      endDate: nextYear, subtotal: 3000, taxAmount: 540, total: 3540, status: 'active',
      items: {
        create: [{ productId: prod2.id, variantId: var4.id, taxRuleId: tax1.id, quantity: 1, unitPrice: 3000, variantPrice: 0, taxAmount: 540, lineTotal: 3540 }],
      },
    },
  });

  // Paused subscription
  const sub4 = await prisma.subscription.create({
    data: {
      number: 'SUB-0004', customerId: cust4.id, planId: planMonthly.id,
      startDate: twoMonthsAgo, nextBillingDate: now,
      endDate: nextYear, subtotal: 2500, taxAmount: 300, total: 2800, status: 'paused', pausedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      items: {
        create: [{ productId: prod3.id, taxRuleId: tax2.id, quantity: 1, unitPrice: 2500, variantPrice: 0, taxAmount: 300, lineTotal: 2800 }],
      },
    },
  });

  // Closed subscription
  const sub5 = await prisma.subscription.create({
    data: {
      number: 'SUB-0005', customerId: cust5.id, planId: planYearly.id,
      startDate: twoMonthsAgo, nextBillingDate: now,
      endDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      subtotal: 5000, taxAmount: 900, total: 5900, status: 'closed', closedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), closureReason: 'Contract ended',
      items: {
        create: [{ productId: prod1.id, variantId: var2.id, taxRuleId: tax1.id, quantity: 1, unitPrice: 5000, variantPrice: 500, taxAmount: 900, lineTotal: 6400 }],
      },
    },
  });

  // Daily subscription (active, due for billing)
  const sub6 = await prisma.subscription.create({
    data: {
      number: 'SUB-0006', customerId: cust1.id, planId: planDaily.id,
      startDate: threeDaysAgo, nextBillingDate: yesterday,
      endDate: nextYear, subtotal: 1500, taxAmount: 75, total: 1575, status: 'active',
      items: {
        create: [{ productId: prod4.id, taxRuleId: tax3.id, quantity: 1, unitPrice: 1500, variantPrice: 0, taxAmount: 75, lineTotal: 1575 }],
      },
    },
  });

  // Draft subscription
  const sub7 = await prisma.subscription.create({
    data: {
      number: 'SUB-0007', customerId: cust3.id, planId: planMonthly.id,
      startDate: now, nextBillingDate: now,
      subtotal: 1000, taxAmount: 180, total: 1180, status: 'draft',
      items: {
        create: [{ productId: prod5.id, taxRuleId: tax1.id, quantity: 1, unitPrice: 1000, variantPrice: 0, taxAmount: 180, lineTotal: 1180 }],
      },
    },
  });

  // Confirmed subscription
  const sub8 = await prisma.subscription.create({
    data: {
      number: 'SUB-0008', customerId: cust4.id, planId: planWeekly.id,
      startDate: now, nextBillingDate: now,
      endDate: nextYear, subtotal: 3800, taxAmount: 684, total: 4484, status: 'confirmed',
      items: {
        create: [{ productId: prod2.id, variantId: var5.id, taxRuleId: tax1.id, quantity: 1, unitPrice: 3000, variantPrice: 800, taxAmount: 684, lineTotal: 4484 }],
      },
    },
  });

  console.log('✅ Subscriptions created');

  // ─── SAMPLE INVOICES ──────────────────────────────────
  const lastMonthEnd = new Date(lastMonth); lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1);
  const dueDate1 = new Date(lastMonth); dueDate1.setDate(dueDate1.getDate() + 15);
  
  // Paid invoice
  const inv1 = await prisma.invoice.create({
    data: {
      number: 'INV-0001', subscriptionId: sub1.id, customerId: cust1.id,
      subtotal: 5000, taxAmount: 900, total: 5900, paidAmount: 5900, outstandingAmount: 0,
      periodStart: twoMonthsAgo, periodEnd: lastMonth, dueDate: dueDate1, status: 'paid',
      items: {
        create: [{ productId: prod1.id, variantId: var1.id, taxRuleId: tax1.id, productName: 'CloudBill ERP', variantName: 'Standard Brand', quantity: 1, unitPrice: 5000, variantPrice: 0, taxRate: 18, taxAmount: 900, lineTotal: 5900 }],
      },
    },
  });

  // Confirmed invoice (outstanding)
  const dueDateOverdue = new Date(now); dueDateOverdue.setDate(dueDateOverdue.getDate() - 5);
  const inv2 = await prisma.invoice.create({
    data: {
      number: 'INV-0002', subscriptionId: sub2.id, customerId: cust2.id, discountId: disc1.id,
      subtotal: 5560, discountAmount: 556, taxAmount: 900.72, total: 5904.72, paidAmount: 0, outstandingAmount: 5904.72,
      periodStart: lastMonth, periodEnd: now, dueDate: dueDateOverdue, status: 'confirmed',
      items: {
        create: [{ productId: prod1.id, variantId: var3.id, taxRuleId: tax1.id, productName: 'CloudBill ERP', variantName: 'Odoo Brand', quantity: 1, unitPrice: 5000, variantPrice: 560, taxRate: 18, taxAmount: 900.72, lineTotal: 6460.72 }],
      },
    },
  });

  // Partially paid invoice
  const dueDateFuture = new Date(now); dueDateFuture.setDate(dueDateFuture.getDate() + 10);
  const inv3 = await prisma.invoice.create({
    data: {
      number: 'INV-0003', subscriptionId: sub3.id, customerId: cust3.id,
      subtotal: 3000, taxAmount: 540, total: 3540, paidAmount: 2000, outstandingAmount: 1540,
      periodStart: lastMonth, periodEnd: now, dueDate: dueDateFuture, status: 'partially_paid',
      items: {
        create: [{ productId: prod2.id, variantId: var4.id, taxRuleId: tax1.id, productName: 'CloudBill CRM', variantName: 'Standard Brand', quantity: 1, unitPrice: 3000, variantPrice: 0, taxRate: 18, taxAmount: 540, lineTotal: 3540 }],
      },
    },
  });

  // Draft invoice
  const inv4 = await prisma.invoice.create({
    data: {
      number: 'INV-0004', subscriptionId: sub1.id, customerId: cust1.id,
      subtotal: 5000, taxAmount: 900, total: 5900, paidAmount: 0, outstandingAmount: 5900,
      periodStart: lastMonth, periodEnd: now, dueDate: dueDateFuture, status: 'draft',
      items: {
        create: [{ productId: prod1.id, variantId: var1.id, taxRuleId: tax1.id, productName: 'CloudBill ERP', variantName: 'Standard Brand', quantity: 1, unitPrice: 5000, variantPrice: 0, taxRate: 18, taxAmount: 900, lineTotal: 5900 }],
      },
    },
  });

  // Cancelled invoice
  const inv5 = await prisma.invoice.create({
    data: {
      number: 'INV-0005', subscriptionId: sub5.id, customerId: cust5.id,
      subtotal: 5500, taxAmount: 990, total: 6490, paidAmount: 0, outstandingAmount: 0,
      periodStart: twoMonthsAgo, periodEnd: lastMonth, dueDate: dueDate1, status: 'cancelled',
      items: {
        create: [{ productId: prod1.id, variantId: var2.id, taxRuleId: tax1.id, productName: 'CloudBill ERP', variantName: 'Premium Brand', quantity: 1, unitPrice: 5000, variantPrice: 500, taxRate: 18, taxAmount: 990, lineTotal: 6490 }],
      },
    },
  });

  // More paid invoices for revenue data
  for (let i = 6; i <= 15; i++) {
    const pStart = new Date(now);
    pStart.setMonth(pStart.getMonth() - (15 - i));
    const pEnd = new Date(pStart);
    pEnd.setMonth(pEnd.getMonth() + 1);
    const dd = new Date(pStart);
    dd.setDate(dd.getDate() + 15);
    const amt = 3000 + Math.floor(Math.random() * 5000);
    const tax = Math.round(amt * 0.18 * 100) / 100;
    const total = amt + tax;

    await prisma.invoice.create({
      data: {
        number: `INV-${String(i).padStart(4, '0')}`, subscriptionId: sub1.id, customerId: cust1.id,
        subtotal: amt, taxAmount: tax, total: total, paidAmount: total, outstandingAmount: 0,
        periodStart: pStart, periodEnd: pEnd, dueDate: dd, status: 'paid',
        items: {
          create: [{ productId: prod1.id, variantId: var1.id, taxRuleId: tax1.id, productName: 'CloudBill ERP', variantName: 'Standard Brand', quantity: 1, unitPrice: amt, variantPrice: 0, taxRate: 18, taxAmount: tax, lineTotal: total }],
        },
      },
    });
  }

  console.log('✅ Invoices created');

  // ─── SAMPLE PAYMENTS ──────────────────────────────────
  await prisma.payment.create({
    data: { number: 'PAY-0001', invoiceId: inv1.id, customerId: cust1.id, method: 'upi', amount: 5900, transactionRef: 'UPI-REF-001', paymentDate: new Date(lastMonth.getTime() + 2 * 24 * 60 * 60 * 1000) },
  });
  await prisma.payment.create({
    data: { number: 'PAY-0002', invoiceId: inv3.id, customerId: cust3.id, method: 'bank_transfer', amount: 2000, transactionRef: 'NEFT-REF-002', paymentDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
  });

  // Payments for the historical paid invoices
  for (let i = 6; i <= 15; i++) {
    const inv = await prisma.invoice.findUnique({ where: { number: `INV-${String(i).padStart(4, '0')}` } });
    if (inv) {
      const methods = ['upi', 'bank_transfer', 'credit_card', 'debit_card', 'cash'];
      await prisma.payment.create({
        data: {
          number: `PAY-${String(i - 3).padStart(4, '0')}`, invoiceId: inv.id, customerId: inv.customerId,
          method: methods[i % methods.length], amount: Number(inv.total),
          transactionRef: `TXN-REF-${String(i).padStart(3, '0')}`,
          paymentDate: new Date(inv.issueDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log('✅ Payments created');

  // ─── BILLING CYCLES ────────────────────────────────────
  await prisma.billingCycle.create({
    data: { subscriptionId: sub1.id, periodStart: twoMonthsAgo, periodEnd: lastMonth, invoiceId: inv1.id, status: 'completed', executedAt: twoMonthsAgo },
  });

  console.log('✅ Billing cycles created');

  // ─── SETTINGS ──────────────────────────────────────────
  await prisma.setting.createMany({
    data: [
      { key: 'businessName', value: 'Brightloop Software' },
      { key: 'currency', value: 'INR' },
      { key: 'currencySymbol', value: '₹' },
      { key: 'timezone', value: 'Asia/Kolkata' },
      { key: 'paymentTermDays', value: '15' },
      { key: 'defaultTaxId', value: tax1.id },
    ],
  });

  console.log('✅ Settings created');

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo Credentials:');
  console.log('─────────────────');
  console.log('Admin:    admin@brightloop.com    / Admin@123');
  console.log('Staff 1:  staff1@brightloop.com   / Staff@123');
  console.log('Staff 2:  staff2@brightloop.com   / Staff@123');
  console.log('Customer: customer1@example.com   / Customer@123');
  console.log('Customer: customer2@example.com   / Customer@123');
  console.log('Customer: customer3@example.com   / Customer@123');
  console.log('Customer: customer4@example.com   / Customer@123');
  console.log('Customer: customer5@example.com   / Customer@123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
