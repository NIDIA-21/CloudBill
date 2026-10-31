import { PrismaClient, Prisma } from '@prisma/client';
import { getNextSequence, calculateNextBillingDate, calculatePeriodEnd, calculateDiscountAmount, toNumber } from '../utils/helpers';

export class BillingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async runBilling(triggeredBy?: string): Promise<{ processed: number; invoicesCreated: number; errors: string[] }> {
    const now = new Date();
    const results = { processed: 0, invoicesCreated: 0, errors: [] as string[] };

    // Find all active subscriptions due for billing
    const dueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'active',
        nextBillingDate: { lte: now },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
            taxRule: true,
          },
        },
        plan: true,
        customer: true,
        discount: {
          include: { discountProducts: true },
        },
      },
    });

    for (const subscription of dueSubscriptions) {
      results.processed++;
      try {
        await this.processSubscriptionBilling(subscription, now, triggeredBy);
        results.invoicesCreated++;
      } catch (error: any) {
        const errMsg = `Subscription ${subscription.number}: ${error.message}`;
        results.errors.push(errMsg);
        
        // Log the failure
        await this.prisma.billingActivityLog.create({
          data: {
            subscriptionId: subscription.id,
            userId: triggeredBy,
            action: 'billing_failed',
            billingPeriod: `${subscription.nextBillingDate.toISOString()}`,
            status: 'failure',
            message: error.message,
          },
        });
      }
    }

    return results;
  }

  private async processSubscriptionBilling(subscription: any, now: Date, triggeredBy?: string) {
    const periodStart = new Date(subscription.nextBillingDate);
    const periodEnd = calculatePeriodEnd(periodStart, subscription.plan.billingFrequency);

    // Check if subscription has expired
    if (subscription.endDate && new Date(subscription.endDate) < periodStart) {
      // Auto-close if configured
      if (subscription.plan.autoClose) {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'closed', closedAt: now, closureReason: 'Plan period ended' },
        });
      }
      throw new Error('Subscription has expired');
    }

    // Use transaction for atomicity
    await this.prisma.$transaction(async (tx) => {
      // Try to create billing cycle - unique constraint prevents duplicates
      const existingCycle = await tx.billingCycle.findFirst({
        where: {
          subscriptionId: subscription.id,
          periodStart: periodStart,
          periodEnd: periodEnd,
        },
      });

      if (existingCycle) {
        throw new Error(`Billing cycle already exists for period ${periodStart.toISOString()} - ${periodEnd.toISOString()}`);
      }

      // Calculate invoice amounts
      let subtotal = 0;
      const invoiceItems: any[] = [];

      for (const item of subscription.items) {
        const unitPrice = toNumber(item.unitPrice);
        const variantPrice = toNumber(item.variantPrice);
        const effectivePrice = unitPrice + variantPrice;
        const lineAmount = effectivePrice * item.quantity;
        
        let taxAmount = 0;
        let taxRate = 0;
        if (item.taxRule && item.taxRule.status === 'active') {
          taxRate = toNumber(item.taxRule.rate);
          if (item.taxRule.type === 'percentage') {
            taxAmount = Math.round((lineAmount * taxRate / 100) * 100) / 100;
          } else {
            taxAmount = taxRate;
          }
        }

        invoiceItems.push({
          productId: item.productId,
          variantId: item.variantId,
          taxRuleId: item.taxRuleId,
          productName: item.product.name,
          variantName: item.variant?.name || null,
          quantity: item.quantity,
          unitPrice: unitPrice,
          variantPrice: variantPrice,
          taxRate: taxRate,
          taxAmount: taxAmount,
          lineTotal: lineAmount + taxAmount,
        });

        subtotal += lineAmount;
      }

      // Apply discount if applicable
      let discountAmount = 0;
      if (subscription.discount) {
        const discount = subscription.discount;
        const isValid = this.isDiscountValid(discount, subtotal, subscription.items);
        if (isValid) {
          discountAmount = calculateDiscountAmount(subtotal, toNumber(discount.value), discount.type);
          
          // Track usage
          await tx.discount.update({
            where: { id: discount.id },
            data: { usedCount: { increment: 1 } },
          });
          
          await tx.discountUsage.create({
            data: {
              discountId: discount.id,
            },
          });
        }
      }

      // Calculate total tax on discounted amount
      const taxableAmount = subtotal - discountAmount;
      let totalTaxAmount = 0;
      // Recalculate tax on discounted amounts proportionally
      for (const item of invoiceItems) {
        const itemProportion = (toNumber(item.unitPrice) + toNumber(item.variantPrice)) * item.quantity / subtotal;
        const itemTaxableAmount = taxableAmount * itemProportion;
        if (item.taxRate > 0) {
          item.taxAmount = Math.round((itemTaxableAmount * item.taxRate / 100) * 100) / 100;
        }
        item.lineTotal = ((toNumber(item.unitPrice) + toNumber(item.variantPrice)) * item.quantity) + item.taxAmount;
        totalTaxAmount += item.taxAmount;
      }

      const total = taxableAmount + totalTaxAmount;
      const dueDate = new Date(periodStart);
      dueDate.setDate(dueDate.getDate() + (subscription.paymentTermDays || 15));

      // Generate invoice number
      const invoiceNumber = await getNextSequence(tx, 'invoice', 'INV');

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          subscriptionId: subscription.id,
          customerId: subscription.customerId,
          discountId: subscription.discountId,
          subtotal: subtotal,
          discountAmount: discountAmount,
          taxAmount: totalTaxAmount,
          total: total,
          outstandingAmount: total,
          periodStart: periodStart,
          periodEnd: periodEnd,
          dueDate: dueDate,
          status: 'draft',
          items: {
            create: invoiceItems,
          },
        },
      });

      // Create billing cycle record
      await tx.billingCycle.create({
        data: {
          subscriptionId: subscription.id,
          periodStart: periodStart,
          periodEnd: periodEnd,
          invoiceId: invoice.id,
          status: 'completed',
          executedAt: now,
        },
      });

      // Update next billing date
      const nextBilling = calculateNextBillingDate(periodStart, subscription.plan.billingFrequency);
      await tx.subscription.update({
        where: { id: subscription.id },
        data: { nextBillingDate: nextBilling },
      });

      // Log success
      await tx.billingActivityLog.create({
        data: {
          subscriptionId: subscription.id,
          userId: triggeredBy,
          action: 'invoice_generated',
          invoiceNumber: invoiceNumber,
          billingPeriod: `${periodStart.toISOString()} - ${periodEnd.toISOString()}`,
          status: 'success',
          message: `Invoice ${invoiceNumber} generated for ₹${total.toFixed(2)}`,
        },
      });
    });
  }

  private isDiscountValid(discount: any, subtotal: number, items: any[]): boolean {
    const now = new Date();
    
    if (discount.status !== 'active') return false;
    if (discount.startDate && new Date(discount.startDate) > now) return false;
    if (discount.endDate && new Date(discount.endDate) < now) return false;
    if (discount.maxUsage !== null && discount.usedCount >= discount.maxUsage) return false;
    if (toNumber(discount.minPurchase) > 0 && subtotal < toNumber(discount.minPurchase)) return false;
    
    // Check min quantity
    if (discount.minQuantity > 0) {
      const totalQty = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      if (totalQty < discount.minQuantity) return false;
    }

    // Check product-specific discount
    if (discount.discountProducts && discount.discountProducts.length > 0) {
      const applicableProductIds = discount.discountProducts.map((dp: any) => dp.productId);
      const hasApplicableProduct = items.some((item: any) => applicableProductIds.includes(item.productId));
      if (!hasApplicableProduct) return false;
    }

    return true;
  }
}
