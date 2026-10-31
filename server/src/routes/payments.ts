import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getPagination, paginatedResponse, getNextSequence, toNumber } from '../utils/helpers';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search, method, customerId, invoiceId, fromDate, toDate } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    const where: any = {};
    if (req.user!.role === 'customer') where.customerId = req.user!.id;
    if (method) where.method = method as string;
    if (customerId && req.user!.role !== 'customer') where.customerId = customerId as string;
    if (invoiceId) where.invoiceId = invoiceId as string;
    if (search) where.number = { contains: search as string };
    if (fromDate || toDate) {
      where.paymentDate = {};
      if (fromDate) where.paymentDate.gte = new Date(fromDate as string);
      if (toDate) where.paymentDate.lte = new Date(toDate as string);
    }
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where, take, skip, orderBy: { paymentDate: 'desc' },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          invoice: { select: { id: true, number: true, total: true, status: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);
    res.json(paginatedResponse(payments, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.post('/', authenticate, authorize('admin', 'staff', 'customer'), async (req: AuthRequest, res: Response) => {
  try {
    const { invoiceId, method, amount, transactionRef, note, paymentDate } = req.body;
    if (!invoiceId || !method || amount === undefined) {
      return res.status(400).json({ error: 'Invoice, payment method, and amount are required' });
    }
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'cancelled') return res.status(400).json({ error: 'Cannot pay cancelled invoice' });

    const paymentAmount = Number(amount);
    const totalPaid = invoice.payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
    const outstanding = toNumber(invoice.total) - totalPaid;
    if (paymentAmount <= 0) return res.status(400).json({ error: 'Amount must be positive' });
    if (paymentAmount > outstanding + 0.01) return res.status(400).json({ error: `Exceeds outstanding ₹${outstanding.toFixed(2)}` });

    const number = await getNextSequence(prisma, 'payment', 'PAY');
    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          number, invoiceId, customerId: invoice.customerId, method,
          amount: paymentAmount, transactionRef, note,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        },
        include: { customer: { select: { id: true, firstName: true, lastName: true } }, invoice: { select: { id: true, number: true } } },
      });

      const newTotalPaid = totalPaid + paymentAmount;
      const newOutstanding = toNumber(invoice.total) - newTotalPaid;
      let newStatus = invoice.status;
      if (newOutstanding <= 0.01) newStatus = 'paid';
      else if (newTotalPaid > 0 && invoice.status !== 'paid') newStatus = 'partially_paid';

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { paidAmount: newTotalPaid, outstandingAmount: Math.max(0, newOutstanding), status: newStatus },
      });
      return newPayment;
    });
    res.status(201).json(payment);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

export default router;
