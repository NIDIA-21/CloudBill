import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getPagination, paginatedResponse } from '../utils/helpers';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search, billingFrequency, status = 'active' } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    
    const where: any = {};
    if (status) where.status = status as string;
    if (billingFrequency) where.billingFrequency = billingFrequency as string;
    if (search) where.name = { contains: search as string };

    const [plans, total] = await Promise.all([
      prisma.subscriptionPlan.findMany({ where, take, skip, orderBy: { createdAt: 'desc' }, include: { planProducts: { include: { product: true } } } }),
      prisma.subscriptionPlan.count({ where }),
    ]);

    res.json(paginatedResponse(plans, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: req.params.id },
      include: { planProducts: { include: { product: true } } },
    });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, billingFrequency, price, minQuantity, availabilityStart, availabilityEnd, autoClose, allowEarlyClose, allowPause, allowRenewal, productIds } = req.body;
    if (!name || !billingFrequency || price === undefined) {
      return res.status(400).json({ error: 'Name, billing frequency, and price are required' });
    }
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        billingFrequency,
        price: Number(price),
        minQuantity: minQuantity || 1,
        availabilityStart: availabilityStart ? new Date(availabilityStart) : null,
        availabilityEnd: availabilityEnd ? new Date(availabilityEnd) : null,
        autoClose: autoClose !== undefined ? autoClose : true,
        allowEarlyClose: allowEarlyClose !== undefined ? allowEarlyClose : true,
        allowPause: allowPause !== undefined ? allowPause : true,
        allowRenewal: allowRenewal !== undefined ? allowRenewal : true,
        ...(productIds && productIds.length > 0 ? {
          planProducts: {
            create: productIds.map((pid: string) => ({ productId: pid })),
          },
        } : {}),
      },
      include: { planProducts: { include: { product: true } } },
    });
    res.status(201).json(plan);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, billingFrequency, price, minQuantity, availabilityStart, availabilityEnd, autoClose, allowEarlyClose, allowPause, allowRenewal, status } = req.body;
    const plan = await prisma.subscriptionPlan.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(billingFrequency && { billingFrequency }),
        ...(price !== undefined && { price: Number(price) }),
        ...(minQuantity !== undefined && { minQuantity }),
        ...(availabilityStart !== undefined && { availabilityStart: availabilityStart ? new Date(availabilityStart) : null }),
        ...(availabilityEnd !== undefined && { availabilityEnd: availabilityEnd ? new Date(availabilityEnd) : null }),
        ...(autoClose !== undefined && { autoClose }),
        ...(allowEarlyClose !== undefined && { allowEarlyClose }),
        ...(allowPause !== undefined && { allowPause }),
        ...(allowRenewal !== undefined && { allowRenewal }),
        ...(status && { status }),
      },
    });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

export default router;
