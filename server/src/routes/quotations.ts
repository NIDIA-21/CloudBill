import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getPagination, paginatedResponse, getNextSequence, toNumber, calculateLineTotal, calculateTaxAmount, calculateDiscountAmount } from '../utils/helpers';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search, status, customerId } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    const where: any = {};
    if (req.user!.role === 'customer') where.customerId = req.user!.id;
    if (status) where.status = status as string;
    if (customerId && req.user!.role !== 'customer') where.customerId = customerId as string;
    if (search) where.number = { contains: search as string };
    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where, take, skip, orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          items: { include: { product: true, variant: true, plan: true, taxRule: true } },
          discount: true,
        },
      }),
      prisma.quotation.count({ where }),
    ]);
    res.json(paginatedResponse(quotations, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const where: any = { id: req.params.id };
    if (req.user!.role === 'customer') where.customerId = req.user!.id;
    const quotation = await prisma.quotation.findFirst({
      where,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        items: { include: { product: true, variant: true, plan: true, taxRule: true } },
        discount: true,
      },
    });
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quotation' });
  }
});

router.post('/', authenticate, authorize('admin', 'staff'), async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, templateId, discountId, items, notes, validityDays } = req.body;
    if (!customerId) return res.status(400).json({ error: 'Customer is required' });

    let quotationItems = items || [];
    let validity = validityDays || 30;

    if (templateId) {
      const template = await prisma.quotationTemplate.findUnique({
        where: { id: templateId },
        include: { items: { include: { product: true, variant: true } } },
      });
      if (template) {
        validity = template.validityDays;
        if (!items || items.length === 0) {
          quotationItems = template.items.map((ti: any) => ({
            productId: ti.productId, variantId: ti.variantId, planId: ti.planId,
            taxRuleId: ti.taxRuleId, quantity: ti.quantity, unitPrice: toNumber(ti.unitPrice),
          }));
        }
      }
    }

    if (quotationItems.length === 0) return res.status(400).json({ error: 'At least one item is required' });

    let subtotal = 0;
    let totalTax = 0;
    const processedItems: any[] = [];

    for (const item of quotationItems) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return res.status(400).json({ error: `Product not found` });

      let variantPrice = 0;
      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
        if (variant) variantPrice = toNumber(variant.additionalPrice);
      }

      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : toNumber(product.salesPrice);
      const lineAmount = calculateLineTotal(unitPrice, variantPrice, item.quantity || 1);
      let taxAmount = 0;
      if (item.taxRuleId) {
        const taxRule = await prisma.taxRule.findUnique({ where: { id: item.taxRuleId } });
        if (taxRule && taxRule.status === 'active') {
          taxAmount = calculateTaxAmount(lineAmount, toNumber(taxRule.rate), taxRule.type);
        }
      }

      processedItems.push({
        productId: item.productId, variantId: item.variantId || null,
        planId: item.planId || null, taxRuleId: item.taxRuleId || null,
        quantity: item.quantity || 1, unitPrice, variantPrice, taxAmount,
        lineTotal: lineAmount + taxAmount,
      });
      subtotal += lineAmount;
      totalTax += taxAmount;
    }

    let discountAmount = 0;
    if (discountId) {
      const discount = await prisma.discount.findUnique({ where: { id: discountId } });
      if (discount && discount.status === 'active') {
        discountAmount = calculateDiscountAmount(subtotal, toNumber(discount.value), discount.type);
        totalTax = 0;
        for (const item of processedItems) {
          if (item.taxRuleId) {
            const taxRule = await prisma.taxRule.findUnique({ where: { id: item.taxRuleId } });
            if (taxRule) {
              const proportion = ((item.unitPrice + item.variantPrice) * item.quantity) / subtotal;
              const itemTaxable = (subtotal - discountAmount) * proportion;
              item.taxAmount = calculateTaxAmount(itemTaxable, toNumber(taxRule.rate), taxRule.type);
              item.lineTotal = ((item.unitPrice + item.variantPrice) * item.quantity) + item.taxAmount;
            }
          }
          totalTax += item.taxAmount;
        }
      }
    }

    const total = subtotal - discountAmount + totalTax;
    const number = await getNextSequence(prisma, 'quotation', 'QUO');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validity);

    const quotation = await prisma.quotation.create({
      data: {
        number, customerId, createdById: req.user!.id, templateId: templateId || null,
        discountId: discountId || null, subtotal, discountAmount, taxAmount: totalTax,
        total, expiresAt, notes, status: 'draft',
        items: { create: processedItems },
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: { include: { product: true, variant: true, plan: true, taxRule: true } },
        discount: true,
      },
    });
    res.status(201).json(quotation);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

router.patch('/:id/status', authenticate, authorize('admin', 'staff'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
    if (status === 'accepted' && quotation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Quotation has expired' });
    }

    const updated = await prisma.quotation.update({
      where: { id: req.params.id }, data: { status },
      include: { customer: { select: { id: true, firstName: true, lastName: true } }, items: { include: { product: true, variant: true } } },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update quotation status' });
  }
});

router.post('/:id/convert', authenticate, authorize('admin', 'staff'), async (req: AuthRequest, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: true, variant: true, taxRule: true } } },
    });
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
    if (quotation.status !== 'accepted') return res.status(400).json({ error: 'Only accepted quotations can be converted' });

    const existingSub = await prisma.subscription.findUnique({ where: { quotationId: quotation.id } });
    if (existingSub) return res.status(400).json({ error: 'Quotation already converted' });

    const { planId, startDate, paymentTermDays } = req.body;
    if (!planId) return res.status(400).json({ error: 'Plan is required' });

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(400).json({ error: 'Plan not found' });

    const subNumber = await getNextSequence(prisma, 'subscription', 'SUB');
    const start = startDate ? new Date(startDate) : new Date();

    const subscription = await prisma.subscription.create({
      data: {
        number: subNumber, customerId: quotation.customerId, planId,
        quotationId: quotation.id, discountId: quotation.discountId,
        startDate: start, endDate: plan.availabilityEnd, nextBillingDate: start,
        paymentTermDays: paymentTermDays || 15,
        subtotal: toNumber(quotation.subtotal), discountAmount: toNumber(quotation.discountAmount),
        taxAmount: toNumber(quotation.taxAmount), total: toNumber(quotation.total),
        status: 'confirmed',
        items: {
          create: quotation.items.map(item => ({
            productId: item.productId, variantId: item.variantId, taxRuleId: item.taxRuleId,
            quantity: item.quantity, unitPrice: toNumber(item.unitPrice),
            variantPrice: toNumber(item.variantPrice), taxAmount: toNumber(item.taxAmount),
            lineTotal: toNumber(item.lineTotal),
          })),
        },
      },
      include: { items: { include: { product: true, variant: true } }, plan: true, customer: { select: { id: true, firstName: true, lastName: true } } },
    });
    res.status(201).json(subscription);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to convert quotation' });
  }
});

export default router;
