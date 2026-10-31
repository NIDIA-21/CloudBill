import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getPagination, paginatedResponse } from '../utils/helpers';

const router = Router();

router.get('/', authenticate, authorize('admin', 'staff'), async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search, status } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    
    const where: any = { role: 'customer' };
    if (status) where.status = status as string;
    if (search) {
      where.OR = [
        { firstName: { contains: search as string } },
        { lastName: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);

    res.json(paginatedResponse(customers, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.get('/:id', authenticate, authorize('admin', 'staff'), async (req: AuthRequest, res: Response) => {
  try {
    const customer = await prisma.user.findFirst({
      where: { id: req.params.id, role: 'customer' },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true, status: true, createdAt: true,
        subscriptions: { select: { id: true, number: true, status: true, total: true, startDate: true, endDate: true }, take: 10, orderBy: { createdAt: 'desc' } },
        invoices: { select: { id: true, number: true, status: true, total: true, outstandingAmount: true, dueDate: true }, take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'staff'), async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone, status } = req.body;
    const customer = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(status && { status }),
      },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true },
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

export default router;
