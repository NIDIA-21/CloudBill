import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { BillingService } from '../services/billingService';
import { getPagination, paginatedResponse, getNextSequence, toNumber, calculateLineTotal, calculateTaxAmount, calculateDiscountAmount } from '../utils/helpers';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search, status, customerId, planId } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    const where: any = {};
    if (req.user!.role === 'customer') where.customerId = req.user!.id;
    if (status) where.status = status as string;
    if (customerId && req.user!.role !== 'customer') where.customerId = customerId as string;
    if (planId) where.planId = planId as string;
    if (search) where.number = { contains: search as string };
    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where, take, skip, orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          plan: true,
          items: { include: { product: true, variant: true, taxRule: true } },
          discount: true,
        },
      }),
      prisma.subscription.count({ where }),
    ]);
    res.json(paginatedResponse(subscriptions, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const where: any = { id: req.params.id };
    if (req.user!.role === 'customer') where.customerId = req.user!.id;
    const subscription = await prisma.subscription.findFirst({
      where,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        plan: true,
        items: { include: { product: true, variant: true, taxRule: true } },
        discount: true,
        invoices: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, number: true, total: true, status: true, dueDate: true, paidAmount: true, outstandingAmount: true } },
        billingCycles: { orderBy: { periodStart: 'desc' }, take: 10 },
      },
    });
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

router.post('/', authenticate, authorize('admin', 'staff'), async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, planId, discountId, startDate, endDate, paymentTermDays, items } = req.body;
    if (!customerId || !planId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Customer, plan, and at least one item are required' });
    }
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(400).json({ error: 'Plan not found' });

    let subtotal = 0; let totalTax = 0;
    const processedItems: any[] = [];
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return res.status(400).json({ error: 'Product not found' });
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
        if (taxRule && taxRule.status === 'active') taxAmount = calculateTaxAmount(lineAmount, toNumber(taxRule.rate), taxRule.type);
      }
      processedItems.push({
        productId: item.productId, variantId: item.variantId || null, taxRuleId: item.taxRuleId || null,
        quantity: item.quantity || 1, unitPrice, variantPrice, taxAmount, lineTotal: lineAmount + taxAmount,
      });
      subtotal += lineAmount; totalTax += taxAmount;
    }

    let discountAmount = 0;
    if (discountId) {
      const discount = await prisma.discount.findUnique({ where: { id: discountId } });
      if (discount && discount.status === 'active') discountAmount = calculateDiscountAmount(subtotal, toNumber(discount.value), discount.type);
    }

    const total = subtotal - discountAmount + totalTax;
    const number = await getNextSequence(prisma, 'subscription', 'SUB');
    const start = startDate ? new Date(startDate) : new Date();

    const subscription = await prisma.subscription.create({
      data: {
        number, customerId, planId, discountId: discountId || null,
        startDate: start, endDate: endDate ? new Date(endDate) : plan.availabilityEnd,
        nextBillingDate: start, paymentTermDays: paymentTermDays || 15,
        subtotal, discountAmount, taxAmount: totalTax, total, status: 'draft',
        items: { create: processedItems },
      },
      include: { customer: { select: { id: true, firstName: true, lastName: true } }, plan: true, items: { include: { product: true, variant: true } } },
    });
    res.status(201).json(subscription);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { action } = req.body;
    const sub = await prisma.subscription.findFirst({ where: { id: req.params.id }, include: { plan: true } });
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    if (req.user!.role === 'customer' && sub.customerId !== req.user!.id) return res.status(403).json({ error: 'Access denied' });

    let updateData: any = {};
    switch (action) {
      case 'confirm':
        if (sub.status !== 'draft' && sub.status !== 'quotation') return res.status(400).json({ error: 'Can only confirm draft or quotation subscriptions' });
        updateData = { status: 'confirmed' };
        break;
      case 'activate':
        if (sub.status !== 'confirmed') return res.status(400).json({ error: 'Can only activate confirmed subscriptions' });
        updateData = { status: 'active' };
        break;
      case 'pause':
        if (sub.status !== 'active') return res.status(400).json({ error: 'Can only pause active subscriptions' });
        if (!sub.plan.allowPause) return res.status(400).json({ error: 'This plan does not allow pausing' });
        updateData = { status: 'paused', pausedAt: new Date() };
        break;
      case 'resume':
        if (sub.status !== 'paused') return res.status(400).json({ error: 'Can only resume paused subscriptions' });
        updateData = { status: 'active', pausedAt: null };
        break;
      case 'close':
        if (!['active', 'paused', 'confirmed'].includes(sub.status)) return res.status(400).json({ error: 'Cannot close this subscription' });
        if (!sub.plan.allowEarlyClose && req.user!.role === 'customer') return res.status(400).json({ error: 'Early closure not allowed' });
        updateData = { status: 'closed', closedAt: new Date(), closureReason: req.body.reason || 'Manually closed' };
        break;
      case 'renew':
        if (!['active', 'closed'].includes(sub.status)) return res.status(400).json({ error: 'Can only renew active or closed subscriptions' });
        if (!sub.plan.allowRenewal) return res.status(400).json({ error: 'Renewal not allowed' });
        const newStart = sub.endDate ? new Date(sub.endDate) : new Date();
        updateData = { status: 'active', startDate: newStart, nextBillingDate: newStart, closedAt: null, closureReason: null, pausedAt: null };
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const updated = await prisma.subscription.update({
      where: { id: req.params.id }, data: updateData,
      include: { plan: true, customer: { select: { id: true, firstName: true, lastName: true } }, items: { include: { product: true, variant: true } } },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});


// Customer Self-Service: Purchase & activate software subscription
router.post('/purchase', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.role === 'customer' ? req.user!.id : (req.body.customerId || req.user!.id);
    const { productId, variantId, planId, taxRuleId, discountCode, quantity = 1 } = req.body;

    if (!productId || !planId) {
      return res.status(400).json({ error: 'Product and Plan selection are required' });
    }

    const [product, plan] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId }, include: { variants: true } }),
      prisma.subscriptionPlan.findUnique({ where: { id: planId } }),
    ]);

    if (!product) return res.status(400).json({ error: 'Product not found' });
    if (!plan) return res.status(400).json({ error: 'Subscription plan not found' });

    let variantPrice = 0;
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (variant) variantPrice = toNumber(variant.additionalPrice);
    }

    const unitPrice = toNumber(product.salesPrice);
    const qty = Math.max(1, Number(quantity) || 1);
    const lineAmount = calculateLineTotal(unitPrice, variantPrice, qty);

    let discountId: string | null = null;
    let discountAmount = 0;
    if (discountCode && discountCode.trim()) {
      const code = discountCode.trim().toUpperCase();
      const discount = await prisma.discount.findFirst({
        where: { code, status: 'active' },
      });
      if (discount) {
        discountId = discount.id;
        discountAmount = calculateDiscountAmount(lineAmount, toNumber(discount.value), discount.type);
      }
    }

    let activeTaxRuleId = taxRuleId;
    let taxRate = 18;
    let taxType = 'percentage';
    if (!activeTaxRuleId) {
      const defaultTax = await prisma.taxRule.findFirst({ where: { status: 'active' } });
      if (defaultTax) {
        activeTaxRuleId = defaultTax.id;
        taxRate = toNumber(defaultTax.rate);
        taxType = defaultTax.type;
      }
    } else {
      const taxRule = await prisma.taxRule.findUnique({ where: { id: activeTaxRuleId } });
      if (taxRule) {
        taxRate = toNumber(taxRule.rate);
        taxType = taxRule.type;
      }
    }

    const taxableAmount = Math.max(0, lineAmount - discountAmount);
    const taxAmount = calculateTaxAmount(taxableAmount, taxRate, taxType);
    const total = taxableAmount + taxAmount;

    const number = await getNextSequence(prisma, 'subscription', 'SUB');
    const now = new Date();

    const subscription = await prisma.subscription.create({
      data: {
        number,
        customerId,
        planId,
        discountId,
        startDate: now,
        endDate: plan.availabilityEnd,
        nextBillingDate: now,
        paymentTermDays: 15,
        subtotal: lineAmount,
        discountAmount,
        taxAmount,
        total,
        status: 'active',
        items: {
          create: [
            {
              productId,
              variantId: variantId || null,
              taxRuleId: activeTaxRuleId || null,
              quantity: qty,
              unitPrice,
              variantPrice,
              taxAmount,
              lineTotal: lineAmount + taxAmount,
            },
          ],
        },
      },
      include: {
        customer: true,
        plan: true,
        items: { include: { product: true, variant: true, taxRule: true } },
        discount: { include: { discountProducts: true } },
      },
    });

    // Run immediate billing to generate the first invoice
    const billingService = new BillingService(prisma);
    await billingService.processSubscriptionBilling(subscription, now, customerId);

    // Fetch the generated invoice and auto-confirm it
    const invoice = await prisma.invoice.findFirst({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    if (invoice && invoice.status === 'draft') {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'confirmed' },
      });
    }

    res.status(201).json({
      message: 'Subscription successfully created and activated!',
      subscription,
      invoice,
    });
  } catch (error: any) {
    console.error('Purchase subscription error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete subscription purchase' });
  }
});

export default router;
