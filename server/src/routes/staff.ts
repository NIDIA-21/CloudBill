import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getPagination, paginatedResponse, validatePassword } from '../utils/helpers';

const router = Router();

router.get('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const { take, skip } = getPagination(Number(page), Number(limit));
    
    const where: any = { role: 'staff' };
    if (search) {
      where.OR = [
        { firstName: { contains: search as string } },
        { lastName: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const [staff, total] = await Promise.all([
      prisma.user.findMany({
        where, take, skip, orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);

    res.json(paginatedResponse(staff, total, Number(page), take));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Create staff (admin only)
router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.message });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const staff = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashedPassword, firstName, lastName, phone, role: 'staff' },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
    });
    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone, status } = req.body;
    const staff = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(status && { status }),
      },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true },
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

export default router;
