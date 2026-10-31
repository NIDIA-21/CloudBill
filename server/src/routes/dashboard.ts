import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { toNumber } from '../utils/helpers';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role === 'customer') {
      const [activeSubs, invoices, recentPayments] = await Promise.all([
        prisma.subscription.findMany({
          where: { customerId: req.user!.id, status: 'active' },
          include: { plan: true, items: { include: { product: true } } },
          orderBy: { nextBillingDate: 'asc' },
        }),
        prisma.invoice.findMany({
          where: { customerId: req.user!.id, status: { not: 'cancelled' } },
          orderBy: { dueDate: 'desc' }, take: 10,
        }),
        prisma.payment.findMany({
          where: { customerId: req.user!.id },
          orderBy: { paymentDate: 'desc' }, take: 5,
          include: { invoice: { select: { number: true } } },
        }),
      ]);
      const outstanding = invoices
        .filter(i => ['confirmed', 'partially_paid', 'overdue'].includes(i.status))
        .reduce((sum, i) => sum + toNumber(i.outstandingAmount), 0);
      return res.json({
        activeSubscriptions: activeSubs.length,
        subscriptions: activeSubs,
        upcomingBilling: activeSubs.filter(s => {
          const days = Math.ceil((new Date(s.nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return days <= 7 && days >= 0;
        }),
        outstandingAmount: outstanding,
        recentInvoices: invoices.slice(0, 5),
        recentPayments,
      });
    }

    // Admin/Staff dashboard
    const [subscriptionCounts, activeSubscriptions, revenue, outstandingInvoices, overdueInvoices,
      recentInvoices, recentPayments, monthlyRevenue, revenueByProduct] = await Promise.all([
      prisma.subscription.groupBy({ by: ['status'], _count: true }),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'completed' } }),
      prisma.invoice.aggregate({
        _sum: { outstandingAmount: true }, _count: true,
        where: { status: { in: ['confirmed', 'partially_paid', 'overdue'] } },
      }),
      prisma.invoice.aggregate({
        _sum: { outstandingAmount: true }, _count: true,
        where: { status: { in: ['confirmed', 'partially_paid'] }, dueDate: { lt: new Date() }, outstandingAmount: { gt: 0 } },
      }),
      prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' }, take: 10,
        include: { customer: { select: { firstName: true, lastName: true } }, subscription: { select: { number: true } } },
      }),
      prisma.payment.findMany({
        orderBy: { paymentDate: 'desc' }, take: 10,
        include: { customer: { select: { firstName: true, lastName: true } }, invoice: { select: { number: true } } },
      }),
      prisma.$queryRaw`SELECT strftime('%Y-%m', "paymentDate") as month, SUM(CAST("amount" AS REAL)) as revenue FROM "Payment" WHERE status = 'completed' AND "paymentDate" >= datetime('now', '-12 months') GROUP BY strftime('%Y-%m', "paymentDate") ORDER BY month ASC`,
      prisma.$queryRaw`SELECT ii."productName" as product, SUM(CAST(ii."lineTotal" AS REAL)) as revenue FROM "InvoiceItem" ii JOIN "Invoice" i ON ii."invoiceId" = i.id WHERE i.status IN ('paid', 'confirmed', 'partially_paid') GROUP BY ii."productName" ORDER BY revenue DESC LIMIT 10`,
    ]);

    const activeSubs = await prisma.subscription.findMany({ where: { status: 'active' }, include: { plan: true } });
    let mrr = 0;
    for (const sub of activeSubs) {
      const total = toNumber(sub.total);
      switch (sub.plan.billingFrequency) {
        case 'daily': mrr += total * 30; break;
        case 'weekly': mrr += total * 4.33; break;
        case 'monthly': mrr += total; break;
        case 'yearly': mrr += total / 12; break;
      }
    }

    const approachingExpiry = await prisma.subscription.count({
      where: { status: 'active', endDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() } },
    });

    const statusMap: Record<string, number> = {};
    for (const sc of subscriptionCounts) statusMap[sc.status] = sc._count;

    res.json({
      activeSubscriptions, revenueCollected: toNumber(revenue._sum.amount) || 0,
      outstandingAmount: toNumber(outstandingInvoices._sum.outstandingAmount) || 0,
      outstandingCount: outstandingInvoices._count || 0,
      overdueAmount: toNumber(overdueInvoices._sum.outstandingAmount) || 0,
      overdueCount: overdueInvoices._count || 0,
      mrr: Math.round(mrr * 100) / 100,
      subscriptionSummary: {
        active: statusMap['active'] || 0, draft: statusMap['draft'] || 0,
        confirmed: statusMap['confirmed'] || 0, paused: statusMap['paused'] || 0,
        closed: statusMap['closed'] || 0, approachingExpiry,
      },
      recentInvoices, recentPayments, monthlyRevenue, revenueByProduct,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
