import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getPagination, paginatedResponse } from '../utils/helpers';
import { BillingService } from '../services/billingService';

const router = Router();

router.post('/run', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const billingService = new BillingService(prisma);
    const result = await billingService.runBilling(req.user!.id);
    await prisma.billingActivityLog.create({
      data: {
        userId: req.user!.id, action: 'manual_trigger',
        status: result.errors.length === 0 ? 'success' : 'failure',
        message: `Processed ${result.processed} subscriptions, created ${result.invoicesCreated} invoices. ${result.errors.length} errors.`,
      },
    });
    res.json(result);
  } catch (error: any) {
    console.error('Billing error:', error);
    res.status(500).json({ error: 'Billing run failed' });
  }
});

router.get('/activity', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', status, subscriptionId } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    const where: any = {};
    if (status) where.status = status as string;
    if (subscriptionId) where.subscriptionId = subscriptionId as string;
    const [logs, total] = await Promise.all([
      prisma.billingActivityLog.findMany({
        where, take, skip, orderBy: { executedAt: 'desc' },
        include: { subscription: { select: { id: true, number: true } }, user: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.billingActivityLog.count({ where }),
    ]);
    res.json(paginatedResponse(logs, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch billing activity' });
  }
});

router.get('/cycles', authenticate, authorize('admin', 'staff'), async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', subscriptionId, status } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    const where: any = {};
    if (subscriptionId) where.subscriptionId = subscriptionId as string;
    if (status) where.status = status as string;
    const [cycles, total] = await Promise.all([
      prisma.billingCycle.findMany({
        where, take, skip, orderBy: { periodStart: 'desc' },
        include: { subscription: { select: { id: true, number: true } }, invoice: { select: { id: true, number: true, total: true, status: true } } },
      }),
      prisma.billingCycle.count({ where }),
    ]);
    res.json(paginatedResponse(cycles, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch billing cycles' });
  }
});

export default router;
