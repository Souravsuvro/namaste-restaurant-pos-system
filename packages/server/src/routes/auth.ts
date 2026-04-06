import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../config/database';
import { config } from '../config/env';
import { IUser, IUserPublic, IAuthPayload } from '../models/User';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

const loginSchema = z.object({
  pin: z.string().min(4).max(10),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), (req: Request, res: Response) => {
  const { pin } = req.body;

  // Get all active users and compare PINs
  const users = db.prepare('SELECT * FROM users WHERE active = 1').all() as IUser[];

  let matchedUser: IUser | null = null;
  for (const user of users) {
    if (bcrypt.compareSync(pin, user.pin)) {
      matchedUser = user;
      break;
    }
  }

  if (!matchedUser) {
    res.status(401).json({ error: 'Invalid PIN.' });
    return;
  }

  const payload: IAuthPayload = {
    userId: matchedUser.id,
    role: matchedUser.role,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as string & jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as string & jwt.SignOptions['expiresIn'],
  });

  const userPublic: IUserPublic = {
    id: matchedUser.id,
    name: matchedUser.name,
    role: matchedUser.role,
    active: matchedUser.active,
    created_at: matchedUser.created_at,
    updated_at: matchedUser.updated_at,
  };

  res.json({
    user: userPublic,
    accessToken,
    refreshToken,
  });
});

// POST /api/auth/refresh
router.post('/refresh', validate(refreshSchema), (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as IAuthPayload;

    // Verify user still exists and is active
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND active = 1').get(decoded.userId) as IUser | undefined;
    if (!user) {
      res.status(401).json({ error: 'User no longer active.' });
      return;
    }

    const payload: IAuthPayload = {
      userId: user.id,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string & jwt.SignOptions['expiresIn'],
    });

    const newRefreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as string & jwt.SignOptions['expiresIn'],
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = db.prepare(
    'SELECT id, name, role, active, created_at, updated_at FROM users WHERE id = ?'
  ).get(req.user!.userId) as IUserPublic | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json(user);
});

export default router;
