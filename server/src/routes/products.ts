import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getPagination, paginatedResponse } from '../utils/helpers';

const router = Router();

// List products with pagination, search, filter
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search, type, status = 'active' } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    
    const where: any = {};
    if (status) where.status = status as string;
    if (type) where.type = type as string;
    if (search) where.name = { contains: search as string };

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, take, skip, orderBy: { createdAt: 'desc' }, include: { variants: true } }),
      prisma.product.count({ where }),
    ]);

    res.json(paginatedResponse(products, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { variants: true },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (admin only)
router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, salesPrice, costPrice, description } = req.body;
    if (!name || salesPrice === undefined) {
      return res.status(400).json({ error: 'Name and sales price are required' });
    }
    const product = await prisma.product.create({
      data: { name, type: type || 'software', salesPrice: Number(salesPrice), costPrice: Number(costPrice || 0), description },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, salesPrice, costPrice, description, status } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(salesPrice !== undefined && { salesPrice: Number(salesPrice) }),
        ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Archive product (admin only)
router.patch('/:id/archive', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { status: 'archived' },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive product' });
  }
});

export default router;
