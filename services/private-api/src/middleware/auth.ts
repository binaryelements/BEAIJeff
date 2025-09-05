import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { apiKeys, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email?: string;
    companyId: number;
    permissions: string[];
    role?: string;
  };
}

export async function validateApiKey(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      res.status(401).json({ error: 'API key required' });
      return;
    }

    const [key] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, apiKey))
      .limit(1);

    if (!key || !key.isActive) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      res.status(401).json({ error: 'API key expired' });
      return;
    }

    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, key.id));

    // Get user to get companyId
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, key.userId))
      .limit(1);

    req.user = {
      id: key.userId,
      companyId: user?.companyId || 1,
      permissions: (key.permissions as string[]) || [],
      role: user?.role || 'user'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// JWT authentication middleware
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Get user from database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          companyId: user.companyId,
          permissions: ['*'], // JWT users have full permissions for their company
          role: user.role
        };
        return next();
      }
    }

    // No JWT token, continue without auth (will try API key next if needed)
    next();
  } catch (error) {
    // Invalid token, continue without auth
    next();
  }
}

// Flexible authentication - tries JWT first, then API key, then defaults
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  // Try JWT first
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          companyId: user.companyId,
          permissions: ['*'],
          role: user.role
        };
        return next();
      }
    } catch (error) {
      // Invalid JWT, try API key next
    }
  }

  // Try API key
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, apiKey))
      .limit(1);

    if (key && key.isActive) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, key.userId))
        .limit(1);

      req.user = {
        id: key.userId,
        companyId: user?.companyId || 1,
        permissions: (key.permissions as string[]) || [],
        role: user?.role || 'user'
      };
      return next();
    }
  }

  // No auth provided, use default for backwards compatibility
  req.user = {
    id: 1,
    email: 'default@company.com',
    companyId: 1,
    permissions: ['*'],
    role: 'admin'
  };
  next();
}

// Helper to get company ID from request
export function getCompanyId(req: AuthRequest): number {
  return req.user?.companyId || 1;
}

// Generate JWT token
export function generateToken(userId: number, email: string, companyId: number, role: string): string {
  return jwt.sign(
    { userId, email, companyId, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!req.user.permissions.includes(permission) && !req.user.permissions.includes('*')) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}