import { Router } from 'express';
import { db } from '../db';
import { users, auditLogs } from '../db/schema';
import { eq, like, desc } from 'drizzle-orm';
import { z } from 'zod';
import { AuthRequest, requirePermission } from '../middleware/auth';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(100),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateUserSchema = createUserSchema.partial();

router.get('/', requirePermission('users:read'), async (req: AuthRequest, res) => {
  try {
    const { search, limit = 10, offset = 0 } = req.query;
    
    let query = db.select().from(users);
    
    if (search) {
      query = query.where(
        like(users.email, `%${search}%`)
      );
    }
    
    const result = await query
      .limit(Number(limit))
      .offset(Number(offset))
      .orderBy(desc(users.createdAt));
    
    await db.insert(auditLogs).values({
      userId: req.user?.id,
      action: 'users:list',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', requirePermission('users:read'), async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    await db.insert(auditLogs).values({
      userId: req.user?.id,
      action: 'users:read',
      resource: 'user',
      resourceId: String(userId),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/', requirePermission('users:create'), async (req: AuthRequest, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    
    const [newUser] = await db
      .insert(users)
      .values(validatedData)
      .$returningId();
    
    const [createdUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, newUser.id))
      .limit(1);
    
    await db.insert(auditLogs).values({
      userId: req.user?.id,
      action: 'users:create',
      resource: 'user',
      resourceId: String(newUser.id),
      metadata: validatedData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.status(201).json(createdUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
      return;
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.patch('/:id', requirePermission('users:update'), async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const validatedData = updateUserSchema.parse(req.body);
    
    await db
      .update(users)
      .set(validatedData)
      .where(eq(users.id, userId));
    
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    await db.insert(auditLogs).values({
      userId: req.user?.id,
      action: 'users:update',
      resource: 'user',
      resourceId: String(userId),
      metadata: validatedData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
      return;
    }
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', requirePermission('users:delete'), async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, userId));
    
    await db.insert(auditLogs).values({
      userId: req.user?.id,
      action: 'users:delete',
      resource: 'user',
      resourceId: String(userId),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;