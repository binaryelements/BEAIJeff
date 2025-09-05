import { Router } from 'express';
import { db } from '../db';
import { apiKeys, auditLogs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { AuthRequest, requirePermission } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

const createApiKeySchema = z.object({
  userId: z.number(),
  name: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
});

function generateApiKey(): string {
  return `pk_${crypto.randomBytes(32).toString('hex')}`;
}

router.get('/', requirePermission('api-keys:read'), async (req: AuthRequest, res) => {
  try {
    const { userId, limit = 10, offset = 0 } = req.query;
    
    let query = db.select().from(apiKeys);
    
    if (userId) {
      query = query.where(eq(apiKeys.userId, Number(userId)));
    }
    
    const result = await query
      .limit(Number(limit))
      .offset(Number(offset))
      .orderBy(desc(apiKeys.createdAt));
    
    const sanitizedResult = result.map(key => ({
      ...key,
      key: `${key.key.substring(0, 10)}...`,
    }));
    
    res.json(sanitizedResult);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

router.post('/', requirePermission('api-keys:create'), async (req: AuthRequest, res) => {
  try {
    const validatedData = createApiKeySchema.parse(req.body);
    const newKey = generateApiKey();
    
    const [createdKey] = await db
      .insert(apiKeys)
      .values({
        ...validatedData,
        key: newKey,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      })
      .$returningId();
    
    await db.insert(auditLogs).values({
      userId: req.user?.id,
      action: 'api-keys:create',
      resource: 'api-key',
      resourceId: String(createdKey.id),
      metadata: { name: validatedData.name, userId: validatedData.userId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.status(201).json({
      id: createdKey.id,
      key: newKey,
      message: 'Store this key securely. It will not be shown again.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
      return;
    }
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

router.delete('/:id', requirePermission('api-keys:delete'), async (req: AuthRequest, res) => {
  try {
    const keyId = parseInt(req.params.id);
    
    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, keyId));
    
    await db.insert(auditLogs).values({
      userId: req.user?.id,
      action: 'api-keys:delete',
      resource: 'api-key',
      resourceId: String(keyId),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

export default router;