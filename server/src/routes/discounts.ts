import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getPagination, paginatedResponse } from '../utils/helpers';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', status, search } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    
    const where: any = {};
    if (status) where.status = status as string;
    if (search) where.OR = [{ name: { contains: search as string } }, { code: { contains: search as string } }];

    const [discounts, total] = await Promise.all([
      prisma.discount.findMany({ where, take, skip, orderBy: { createdAt: 'desc' }, include: { discountProducts: { include: { product: { select: { id: true, name: true } } } } } }),
      prisma.discount.count({ where }),
    ]);

    res.json(paginatedResponse(discounts, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch discounts' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const discount = await prisma.discount.findUnique({
      where: { id: req.params.id },
      include: { discountProducts: { include: { product: true } } },
    });
    if (!discount) return res.status(404).json({ error: 'Discount not found' });
    res.json(discount);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch discount' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, type, value, minPurchase, minQuantity, startDate, endDate, maxUsage, productIds } = req.body;
    if (!name || !code || !type || value === undefined) {
      return res.status(400).json({ error: 'Name, code, type, and value are required' });
    }

    // Check unique code
    const existing = await prisma.discount.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) return res.status(409).json({ error: 'Discount code already exists' });

    const discount = await prisma.discount.create({
      data: {
        name,
        code: code.toUpperCase(),
        type,
        value: Number(value),
        minPurchase: Number(minPurchase || 0),
        minQuantity: minQuantity || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        maxUsage: maxUsage || null,
        ...(productIds && productIds.length > 0 ? {
          discountProducts: {
            create: productIds.map((pid: string) => ({ productId: pid })),
          },
        } : {}),
      },
      include: { discountProducts: { include: { product: { select: { id: true, name: true } } } } },
    });
    res.status(201).json(discount);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create discount' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, value, minPurchase, minQuantity, startDate, endDate, maxUsage, status } = req.body;
    const discount = await prisma.discount.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(value !== undefined && { value: Number(value) }),
        ...(minPurchase !== undefined && { minPurchase: Number(minPurchase) }),
        ...(minQuantity !== undefined && { minQuantity }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(maxUsage !== undefined && { maxUsage }),
        ...(status && { status }),
      },
    });
    res.json(discount);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update discount' });
  }
});

// Validate discount code
router.post('/validate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code, amount, quantity } = req.body;
    if (!code) return res.status(400).json({ error: 'Discount code is required' });

    const discount = await prisma.discount.findUnique({
      where: { code: code.toUpperCase() },
      include: { discountProducts: true },
    });

    if (!discount || discount.status !== 'active') {
      return res.status(404).json({ error: 'Invalid discount code' });
    }

    const now = new Date();
    if (discount.startDate && discount.startDate > now) return res.status(400).json({ error: 'Discount not yet active' });
    if (discount.endDate && discount.endDate < now) return res.status(400).json({ error: 'Discount has expired' });
    if (discount.maxUsage !== null && discount.usedCount >= discount.maxUsage) return res.status(400).json({ error: 'Discount usage limit reached' });
    if (amount && Number(discount.minPurchase) > 0 && amount < Number(discount.minPurchase)) return res.status(400).json({ error: `Minimum purchase of ₹${discount.minPurchase} required` });
    if (quantity && discount.minQuantity > 0 && quantity < discount.minQuantity) return res.status(400).json({ error: `Minimum quantity of ${discount.minQuantity} required` });

    res.json({ valid: true, discount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate discount' });
  }
});

export default router;
