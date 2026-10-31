import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getPagination, paginatedResponse } from '../utils/helpers';

const router = Router();

router.get('/', authenticate, authorize('admin', 'staff'), async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search, status = 'active' } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    const where: any = {};
    if (status) where.status = status as string;
    if (search) where.name = { contains: search as string };
    const [templates, total] = await Promise.all([
      prisma.quotationTemplate.findMany({
        where, take, skip, orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true, variant: true, plan: true, taxRule: true } } },
      }),
      prisma.quotationTemplate.count({ where }),
    ]);
    res.json(paginatedResponse(templates, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.get('/:id', authenticate, authorize('admin', 'staff'), async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.quotationTemplate.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: true, variant: true, plan: true, taxRule: true } } },
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, validityDays, items } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const template = await prisma.quotationTemplate.create({
      data: {
        name, description, validityDays: validityDays || 30,
        items: items && items.length > 0 ? {
          create: items.map((item: any) => ({
            productId: item.productId, variantId: item.variantId || null,
            planId: item.planId || null, taxRuleId: item.taxRuleId || null,
            quantity: item.quantity || 1, unitPrice: Number(item.unitPrice),
          })),
        } : undefined,
      },
      include: { items: { include: { product: true, variant: true, plan: true, taxRule: true } } },
    });
    res.status(201).json(template);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, validityDays, status, items } = req.body;
    if (items) {
      await prisma.quotationTemplateItem.deleteMany({ where: { templateId: req.params.id } });
    }
    const template = await prisma.quotationTemplate.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }), ...(description !== undefined && { description }),
        ...(validityDays !== undefined && { validityDays }), ...(status && { status }),
        ...(items ? { items: { create: items.map((item: any) => ({
          productId: item.productId, variantId: item.variantId || null,
          planId: item.planId || null, taxRuleId: item.taxRuleId || null,
          quantity: item.quantity || 1, unitPrice: Number(item.unitPrice),
        })) } } : {}),
      },
      include: { items: { include: { product: true, variant: true, plan: true, taxRule: true } } },
    });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update template' });
  }
});

export default router;
