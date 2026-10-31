import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import variantRoutes from './routes/variants';
import planRoutes from './routes/plans';
import customerRoutes from './routes/customers';
import staffRoutes from './routes/staff';
import taxRoutes from './routes/taxes';
import discountRoutes from './routes/discounts';
import quotationTemplateRoutes from './routes/quotationTemplates';
import quotationRoutes from './routes/quotations';
import subscriptionRoutes from './routes/subscriptions';
import billingRoutes from './routes/billing';
import invoiceRoutes from './routes/invoices';
import paymentRoutes from './routes/payments';
import dashboardRoutes from './routes/dashboard';
import settingsRoutes from './routes/settings';

// Import billing service
import { BillingService } from './services/billingService';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Make prisma available
app.set('prisma', prisma);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/quotation-templates', quotationTemplateRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString() }); });

// Schedule billing - runs every hour, checks for due subscriptions
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Running scheduled billing check...');
  const billingService = new BillingService(prisma);
  try {
    const result = await billingService.runBilling();
    console.log('[CRON] Billing complete:', result);
  } catch (error) {
    console.error('[CRON] Billing error:', error);
  }
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Brightloop Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

export { prisma };
export default app;
