import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { prisma } from '../lib/db.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  registrationNumber: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  course: z.string().optional().or(z.literal('')),
  yearOfStudy: z.coerce.number().int().optional(),
  role: z.enum(['student', 'lecturer', 'admin']).default('student'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const sanitizeUser = (user: {
  id: string;
  email: string;
  name: string;
  role: string;
  registrationNumber?: string | null;
  department?: string | null;
  course?: string | null;
  yearOfStudy?: number | null;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  registrationNumber: user.registrationNumber ?? null,
  department: user.department ?? null,
  course: user.course ?? null,
  yearOfStudy: user.yearOfStudy ?? null,
});

const createToken = (user: { id: string; email: string; name: string; role: string }) =>
  jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, config.jwtSecret, {
    expiresIn: '7d',
  });

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Validation failed.', errors: parsed.error.flatten() });
  }

  const payload = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
  if (existingUser) {
    return res.status(409).json({ message: 'An account with that email already exists.' });
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash,
      registrationNumber: payload.registrationNumber ?? null,
      department: payload.department ?? null,
      course: payload.course ?? null,
      yearOfStudy: payload.yearOfStudy ?? null,
      role: payload.role,
    },
  });

  const token = createToken(user);
  return res.status(201).json({
    token,
    user: sanitizeUser(user),
  });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Validation failed.', errors: parsed.error.flatten() });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = createToken(user);
  return res.json({
    token,
    user: sanitizeUser(user),
  });
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      registrationNumber: true,
      department: true,
      course: true,
      yearOfStudy: true,
      role: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({ user: sanitizeUser(user) });
});

router.post('/forgot-password', (_req, res) => {
  return res.json({
    message:
      'Password reset is not enabled in this demo. In production, a secure reset email would be sent to the registered address.',
  });
});

export default router;
