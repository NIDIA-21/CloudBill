const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function runDemo() {
  const recordingsDir = path.join(__dirname, 'recordings');
  if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir);

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1366, height: 768 },
    },
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();

  // Helper for human-paced delay
  const wait = (ms) => page.waitForTimeout(ms);

  console.log('🎥 Starting video recording of Brightloop Subscription Management System...');

  // 1. Visit Login Page
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await wait(2000);

  // 2. Admin Login
  console.log('1. Admin Sign In');
  await page.click('button:has-text("Admin")');
  await wait(1200);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  await wait(3000);

  // Scroll down dashboard slightly and back up
  await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
  await wait(2000);
  await page.evaluate(() => window.scrollBy({ top: -350, behavior: 'smooth' }));
  await wait(1500);

  // 3. Products
  console.log('2. Products & Variants (Odoo Brand +560)');
  await page.click('a[href="/admin/products"]');
  await wait(2500);

  // 4. Product Variants (Odoo Brand)
  await page.click('a[href="/admin/variants"]');
  await wait(3000);

  // 5. Subscription Plans
  console.log('3. Subscription Plans (Daily, Weekly, Monthly, Yearly)');
  await page.click('a[href="/admin/plans"]');
  await wait(3000);

  // 6. Quotation Templates
  console.log('4. Quotation Templates');
  await page.click('a[href="/admin/quotation-templates"]');
  await wait(2500);

  // 7. Quotations
  console.log('5. Quotations Lifecycle');
  await page.click('a[href="/admin/quotations"]');
  await wait(2500);

  // 8. Subscriptions
  console.log('6. Active Subscriptions');
  await page.click('a[href="/admin/subscriptions"]');
  await wait(2500);

  // 9. Billing Engine (Automated Recurring Billing & Idempotency)
  console.log('7. Automated Billing Engine');
  await page.click('a[href="/admin/billing"]');
  await wait(2000);

  // Trigger Billing
  const runBillingBtn = await page.$('button:has-text("Run Billing Now")');
  if (runBillingBtn) {
    await runBillingBtn.click();
    await wait(3000);
  }

  // 10. Invoices
  console.log('8. Generated Invoices & Taxes');
  await page.click('a[href="/admin/invoices"]');
  await wait(2500);

  // 11. Discounts & Taxes
  console.log('9. Discounts & Taxes');
  await page.click('a[href="/admin/discounts"]');
  await wait(2000);
  await page.click('a[href="/admin/taxes"]');
  await wait(2000);

  // 12. Payments
  console.log('10. Payments Recording');
  await page.click('a[href="/admin/payments"]');
  await wait(2500);

  // 13. Reports & Analytics
  console.log('11. Finance Reports & Performance Metrics');
  await page.click('a[href="/admin/reports"]');
  await wait(3000);

  // 14. Staff Management
  console.log('12. Staff Management');
  await page.click('a[href="/admin/staff"]');
  await wait(2500);

  // 15. Sign Out Admin
  console.log('13. Sign Out Admin');
  await page.click('button:has-text("Sign Out")');
  await page.waitForURL('**/login', { timeout: 10000 });
  await wait(2000);

  // 16. Customer Portal Sign In
  console.log('14. Customer Self-Service Portal Sign In');
  await page.click('button:has-text("Customer")');
  await wait(1200);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/portal/dashboard', { timeout: 10000 });
  await wait(3000);

  // 17. Software Catalog & Purchase
  console.log('15. Software Catalog & Odoo Brand Variant Selection');
  await page.click('a[href="/portal/catalog"]');
  await wait(3000);

  // Click "Subscribe Now" on first product
  const subNowBtns = await page.$$('button:has-text("Subscribe Now")');
  if (subNowBtns.length > 0) {
    await subNowBtns[0].click();
    await wait(2000);

    // Select Odoo Brand if visible
    const odooVariantBtn = await page.$('button:has-text("Odoo Brand")');
    if (odooVariantBtn) {
      await odooVariantBtn.click();
      await wait(1500);
    }

    // Apply promo code DEMO4797
    const promoInput = await page.$('input[placeholder*="DEMO4797"]');
    if (promoInput) {
      await promoInput.fill('DEMO4797');
      await wait(800);
      const applyBtn = await page.$('button:has-text("Apply")');
      if (applyBtn) await applyBtn.click();
      await wait(1500);
    }

    // Click "Activate Subscription"
    const activateBtn = await page.$('button:has-text("Activate Subscription")');
    if (activateBtn) {
      await activateBtn.click();
      await wait(3000);
    }

    // Click "View & Pay Invoice"
    const viewPayBtn = await page.$('button:has-text("View & Pay Invoice")');
    if (viewPayBtn) {
      await viewPayBtn.click();
      await wait(2500);
    }
  }

  // 18. Customer Invoices & Online Payment
  console.log('16. Customer Invoices & Online Payment');
  await page.goto('http://localhost:5173/portal/invoices', { waitUntil: 'networkidle' });
  await wait(2500);

  // Pay online if an invoice has "Pay Online"
  const payOnlineBtn = await page.$('button:has-text("Pay Online")');
  if (payOnlineBtn) {
    await payOnlineBtn.click();
    await wait(2000);

    // Click Pay button inside modal
    const confirmPayBtn = await page.$('div[class*="fixed"] button:has-text("Pay ")');
    if (confirmPayBtn) {
      await confirmPayBtn.click();
      await wait(3000);
    }
  }

  // 19. Back to Customer Overview
  console.log('17. Customer Overview with active subscription and ₹0 balance');
  await page.click('a[href="/portal/dashboard"]');
  await wait(3500);

  // 20. Sign Out Customer
  console.log('18. Customer Sign Out');
  await page.click('button:has-text("Sign Out")');
  await page.waitForURL('**/login', { timeout: 10000 });
  await wait(2000);

  console.log('🏁 Completed walkthrough. Finalizing video encoding...');
  await context.close();
  await browser.close();

  console.log('🎉 Video successfully recorded and saved!');
}

runDemo().catch((err) => {
  console.error('Demo recording error:', err);
  process.exit(1);
});
