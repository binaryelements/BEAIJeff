import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [dbCheck] = await db.execute(sql`SELECT 1 as healthy`);
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'private-api',
      database: dbCheck ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'private-api',
      error: 'Database connection failed',
    });
  }
});

router.get('/ready', async (req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.status(200).send('OK');
  } catch (error) {
    res.status(503).send('Not Ready');
  }
});

export default router;