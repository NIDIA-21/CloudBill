import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getPagination, paginatedResponse, toNumber } from '../utils/helpers';
import { generateInvoicePDF } from '../services/pdfService';
import { sendInvoiceEmail } from '../utils/email';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search, status, customerId, subscriptionId, fromDate, toDate } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    const where: any = {};
    if (req.user!.role === 'customer') where.customerId = req.user!.id;
    if (status) where.status = status as string;
    if (customerId && req.user!.role !== 'customer') where.customerId = customerId as string;
    if (subscriptionId) where.subscriptionId = subscriptionId as string;
    if (search) where.number = { contains: search as string };
    if (fromDate || toDate) {
      where.issueDate = {};
      if (fromDate) where.issueDate.gte = new Date(fromDate as string);
      if (toDate) where.issueDate.lte = new Date(toDate as string);
    }
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where, take, skip, orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          subscription: { select: { id: true, number: true } },
          items: true, discount: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);
    res.json(paginatedResponse(invoices, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const where: any = { id: req.params.id };
    if (req.user!.role === 'customer') where.customerId = req.user!.id;
    const invoice = await prisma.invoice.findFirst({
      where,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        subscription: { select: { id: true, number: true } },
        items: true, payments: { orderBy: { paymentDate: 'desc' } }, discount: true,
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

router.patch('/:id/confirm', authenticate, authorize('admin', 'staff'), async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status !== 'draft') return res.status(400).json({ error: 'Only draft invoices can be confirmed' });
    const updated = await prisma.invoice.update({ where: { id: req.params.id }, data: { status: 'confirmed' } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm invoice' });
  }
});

router.patch('/:id/cancel', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(400).json({ error: 'Cannot cancel paid invoice' });
    const updated = await prisma.invoice.update({ where: { id: req.params.id }, data: { status: 'cancelled', outstandingAmount: 0 } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel invoice' });
  }
});

router.post('/:id/send', authenticate, authorize('admin', 'staff'), async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id }, include: { customer: true } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const result = await sendInvoiceEmail(invoice.customer.email, invoice.number,
      `${invoice.customer.firstName} ${invoice.customer.lastName}`,
      toNumber(invoice.total).toFixed(2), new Date(invoice.dueDate).toLocaleDateString('en-IN'));
    if (result.success) await prisma.invoice.update({ where: { id: req.params.id }, data: { sentAt: new Date() } });
    res.json({ success: result.success, preview: result.preview });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

router.get('/:id/pdf', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const where: any = { id: req.params.id };
    if (req.user!.role === 'customer') where.customerId = req.user!.id;
    const invoice = await prisma.invoice.findFirst({
      where,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        subscription: { select: { id: true, number: true } }, items: true,
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const pdfBuffer = await generateInvoicePDF(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.number}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;
