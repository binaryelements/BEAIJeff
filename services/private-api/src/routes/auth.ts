import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);
    
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    // Check password
    const isValid = await bcrypt.compare(validatedData.password, user.passwordHash);
    
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    if (!user.isActive) {
      res.status(403).json({ error: 'Account is disabled' });
      return;
    }
    
    // Return user data (without password hash)
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      companyId: user.companyId,
      role: user.role,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get current user (requires authentication context - to be implemented)
router.get('/me', async (req: Request, res: Response) => {
  // This would normally check session/token
  // For now, return mock data
  res.status(401).json({ error: 'Not authenticated' });
});

// Logout endpoint
router.post('/logout', async (req: Request, res: Response) => {
  // This would normally clear session/token
  res.json({ success: true });
});

export default router;