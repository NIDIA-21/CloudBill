import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getPagination, paginatedResponse } from '../utils/helpers';

const router = Router();

// List variants with optional product filter
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', productId, status = 'active' } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    
    const where: any = {};
    if (status) where.status = status as string;
    if (productId) where.productId = productId as string;

    const [variants, total] = await Promise.all([
      prisma.productVariant.findMany({ where, take, skip, orderBy: { createdAt: 'desc' }, include: { product: { select: { id: true, name: true, salesPrice: true } } } }),
      prisma.productVariant.count({ where }),
    ]);

    res.json(paginatedResponse(variants, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch variants' });
  }
});

// Get single variant
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: req.params.id },
      include: { product: true },
    });
    if (!variant) return res.status(404).json({ error: 'Variant not found' });
    res.json(variant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch variant' });
  }
});

// Create variant (admin only)
router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { productId, name, additionalPrice, description } = req.body;
    if (!productId || !name) {
      return res.status(400).json({ error: 'Product ID and name are required' });
    }
    const variant = await prisma.productVariant.create({
      data: { productId, name, additionalPrice: Number(additionalPrice || 0), description },
      include: { product: { select: { id: true, name: true } } },
    });
    res.status(201).json(variant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create variant' });
  }
});

// Update variant (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, additionalPrice, description, status } = req.body;
    const variant = await prisma.productVariant.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(additionalPrice !== undefined && { additionalPrice: Number(additionalPrice) }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
    });
    res.json(variant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update variant' });
  }
});

export default router;
