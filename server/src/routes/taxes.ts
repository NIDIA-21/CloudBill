import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getPagination, paginatedResponse } from '../utils/helpers';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    
    const where: any = {};
    if (status) where.status = status as string;

    const [taxes, total] = await Promise.all([
      prisma.taxRule.findMany({ where, take, skip, orderBy: { createdAt: 'desc' } }),
      prisma.taxRule.count({ where }),
    ]);

    res.json(paginatedResponse(taxes, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tax rules' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const tax = await prisma.taxRule.findUnique({ where: { id: req.params.id } });
    if (!tax) return res.status(404).json({ error: 'Tax rule not found' });
    res.json(tax);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tax rule' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, rate, description, effectiveFrom, effectiveTo } = req.body;
    if (!name || rate === undefined) {
      return res.status(400).json({ error: 'Name and rate are required' });
    }
    const tax = await prisma.taxRule.create({
      data: {
        name,
        type: type || 'percentage',
        rate: Number(rate),
        description,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      },
    });
    res.status(201).json(tax);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tax rule' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, rate, description, effectiveFrom, effectiveTo, status } = req.body;
    const tax = await prisma.taxRule.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(rate !== undefined && { rate: Number(rate) }),
        ...(description !== undefined && { description }),
        ...(effectiveFrom !== undefined && { effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null }),
        ...(effectiveTo !== undefined && { effectiveTo: effectiveTo ? new Date(effectiveTo) : null }),
        ...(status && { status }),
      },
    });
    res.json(tax);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tax rule' });
  }
});

export default router;
