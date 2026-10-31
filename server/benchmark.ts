import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:5000/api';

async function benchmark() {
  console.log('===============================================================');
  console.log('⚡ PERFORMANCE & SCALABILITY BENCHMARK (SUB-2S REQUIREMENT)');
  console.log('===============================================================\n');

  // 1. Get an existing customer and plan
  const customer = await prisma.user.findFirst({ where: { role: 'customer' } });
  const plan = await prisma.subscriptionPlan.findFirst({ where: { billingFrequency: 'monthly' } });
  const product = await prisma.product.findFirst();

  if (!customer || !plan || !product) {
    console.error('Missing seed records for benchmark');
    return;
  }

  // 2. Check current count, synthesize up to 2,000 records if needed
  const currentCount = await prisma.subscription.count();
  console.log(`Current subscription count: ${currentCount}`);

  if (currentCount < 1000) {
    const toCreate = 1000 - currentCount;
    console.log(`Synthesizing ${toCreate} subscriptions and invoices to stress-test pagination and aggregation...`);
    const batchSize = 100;
    const now = new Date();

    for (let b = 0; b < Math.ceil(toCreate / batchSize); b++) {
      const subBatch: any[] = [];
      for (let i = 0; i < batchSize && (b * batchSize + i) < toCreate; i++) {
        const num = `SYN-SUB-${String(currentCount + b * batchSize + i + 1).padStart(5, '0')}`;
        subBatch.push({
          number: num,
          customerId: customer.id,
          planId: plan.id,
          startDate: now,
          nextBillingDate: new Date(now.getTime() + (i % 30) * 24 * 60 * 60 * 1000),
          subtotal: 5000,
          total: 5900,
          status: i % 5 === 0 ? 'confirmed' : i % 7 === 0 ? 'paused' : 'active',
        });
      }

      await prisma.subscription.createMany({ data: subBatch });
    }
    console.log('✅ Synthetic dataset created successfully.');
  }

  const finalSubCount = await prisma.subscription.count();
  const finalInvCount = await prisma.invoice.count();
  console.log(`Total database size for test: ${finalSubCount} Subscriptions, ${finalInvCount} Invoices\n`);

  // 3. Login as Admin
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@brightloop.com', password: 'Admin@123' }),
  });
  const { token } = await loginRes.json();
  const headers = { Authorization: `Bearer ${token}` };

  // 4. Measure key endpoints
  const endpoints = [
    { name: 'Dashboard Aggregation (MRR, Revenue, Counts)', url: '/dashboard' },
    { name: 'Subscriptions Paginated (page 1, limit 20)', url: '/subscriptions?page=1&limit=20' },
    { name: 'Subscriptions Paginated (page 25, limit 20)', url: '/subscriptions?page=25&limit=20' },
    { name: 'Subscriptions Search & Filter', url: '/subscriptions?search=SUB&status=active' },
    { name: 'Invoices Paginated (page 1, limit 20)', url: '/invoices?page=1&limit=20' },
    { name: 'Customers Paginated (page 1, limit 20)', url: '/customers?page=1&limit=20' },
    { name: 'Products & Variants List', url: '/products?limit=20' },
    { name: 'Billing Cycles History', url: '/billing/cycles?limit=20' },
  ];

  console.log('-----------------------------------------------------------------------------------------');
  console.log('| Endpoint Tested                                    | Response Time | Threshold (<2s) |');
  console.log('-----------------------------------------------------------------------------------------');

  let allPassed = true;

  for (const ep of endpoints) {
    const start = performance.now();
    const res = await fetch(`${API_BASE}${ep.url}`, { headers });
    const end = performance.now();
    const ms = Math.round((end - start) * 10) / 10;
    const passed = ms < 2000;
    if (!passed) allPassed = false;

    console.log(
      `| ${ep.name.padEnd(50)} | ${`${ms} ms`.padStart(13)} | ${passed ? '  ✅ PASS   ' : '  ❌ FAIL   '} |`
    );
  }

  console.log('-----------------------------------------------------------------------------------------\n');
  if (allPassed) {
    console.log('🎉 ALL ENDPOINTS RESPONDED WELL UNDER THE 2-SECOND SUB-LATENCY REQUIREMENT!\n');
  } else {
    console.log('⚠️ Some endpoints exceeded 2000 ms limit.\n');
  }

  await prisma.$disconnect();
}

benchmark();
