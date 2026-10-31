import { Decimal } from '@prisma/client/runtime/library';

// Generate sequential numbers like SUB-0001, INV-0001, QUO-0001, PAY-0001
export async function getNextSequence(prisma: any, name: string, prefix: string): Promise<string> {
  const seq = await prisma.sequence.upsert({
    where: { name },
    update: { current: { increment: 1 } },
    create: { name, current: 1 },
  });
  return `${prefix}-${String(seq.current).padStart(4, '0')}`;
}

// Calculate next billing date from current date and frequency
export function calculateNextBillingDate(fromDate: Date, frequency: string): Date {
  const next = new Date(fromDate);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      // Handle month-end: if original was Jan 31, next should be Feb 28
      if (next.getDate() !== fromDate.getDate()) {
        next.setDate(0); // Set to last day of previous month
      }
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      // Handle leap year
      if (next.getDate() !== fromDate.getDate()) {
        next.setDate(0);
      }
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}

// Calculate billing period end date
export function calculatePeriodEnd(periodStart: Date, frequency: string): Date {
  const end = new Date(periodStart);
  switch (frequency) {
    case 'daily':
      end.setDate(end.getDate() + 1);
      break;
    case 'weekly':
      end.setDate(end.getDate() + 7);
      break;
    case 'monthly':
      end.setMonth(end.getMonth() + 1);
      break;
    case 'yearly':
      end.setFullYear(end.getFullYear() + 1);
      break;
  }
  end.setMilliseconds(end.getMilliseconds() - 1);
  return end;
}

// Calculate line total: (unitPrice + variantPrice) * quantity
export function calculateLineTotal(unitPrice: number, variantPrice: number, quantity: number): number {
  return (unitPrice + variantPrice) * quantity;
}

// Calculate tax amount
export function calculateTaxAmount(amount: number, taxRate: number, taxType: string): number {
  if (taxType === 'percentage') {
    return Math.round((amount * taxRate / 100) * 100) / 100;
  }
  return taxRate; // fixed amount
}

// Calculate discount amount
export function calculateDiscountAmount(amount: number, discountValue: number, discountType: string): number {
  if (discountType === 'percentage') {
    return Math.round((amount * discountValue / 100) * 100) / 100;
  }
  return Math.min(discountValue, amount); // fixed, capped at amount
}

// Validate password strength
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain at least one lowercase letter' };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { valid: false, message: 'Password must contain at least one special character' };
  return { valid: true, message: 'Password meets requirements' };
}

// Pagination helper
export function getPagination(page: number = 1, limit: number = 20) {
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;
  return { take, skip };
}

export function paginatedResponse(data: any[], total: number, page: number, limit: number) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Convert Decimal to number safely
export function toNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  return Number(val);
}
