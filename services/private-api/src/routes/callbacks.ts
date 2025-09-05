import { Router } from 'express';
import { db } from '../db';
import { callbackSchedules, calls, type NewCallbackSchedule } from '../db/schema';
import { eq, desc, and, or, gte, lte, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all callbacks
router.get('/', async (req, res) => {
  try {
    const { status, phoneNumber, from, to } = req.query;
    
    let query = db.select({
      id: callbackSchedules.id,
      callbackId: callbackSchedules.callbackId,
      callId: callbackSchedules.callId,
      phoneNumber: callbackSchedules.phoneNumber,
      preferredTime: callbackSchedules.preferredTime,
      topic: callbackSchedules.topic,
      status: callbackSchedules.status,
      createdAt: callbackSchedules.createdAt,
      scheduledFor: callbackSchedules.scheduledFor,
      completedAt: callbackSchedules.completedAt,
      callSid: calls.callSid,
    })
    .from(callbackSchedules)
    .leftJoin(calls, eq(callbackSchedules.callId, calls.id));

    // Add filters
    const conditions = [];
    if (status) {
      conditions.push(eq(callbackSchedules.status, status as string));
    }
    if (phoneNumber) {
      conditions.push(eq(callbackSchedules.phoneNumber, phoneNumber as string));
    }
    if (from) {
      conditions.push(gte(callbackSchedules.createdAt, new Date(from as string)));
    }
    if (to) {
      conditions.push(lte(callbackSchedules.createdAt, new Date(to as string)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const callbacks = await query.orderBy(desc(callbackSchedules.createdAt));
    res.json(callbacks);
  } catch (error) {
    console.error('Error fetching callbacks:', error);
    res.status(500).json({ error: 'Failed to fetch callbacks' });
  }
});

// Get callback by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const callback = await db.select({
      id: callbackSchedules.id,
      callbackId: callbackSchedules.callbackId,
      callId: callbackSchedules.callId,
      phoneNumber: callbackSchedules.phoneNumber,
      preferredTime: callbackSchedules.preferredTime,
      topic: callbackSchedules.topic,
      status: callbackSchedules.status,
      createdAt: callbackSchedules.createdAt,
      scheduledFor: callbackSchedules.scheduledFor,
      completedAt: callbackSchedules.completedAt,
      callSid: calls.callSid,
    })
    .from(callbackSchedules)
    .leftJoin(calls, eq(callbackSchedules.callId, calls.id))
    .where(eq(callbackSchedules.callbackId, id))
    .limit(1);

    if (!callback.length) {
      return res.status(404).json({ error: 'Callback not found' });
    }

    res.json(callback[0]);
  } catch (error) {
    console.error('Error fetching callback:', error);
    res.status(500).json({ error: 'Failed to fetch callback' });
  }
});

// Create a new callback
router.post('/', async (req, res) => {
  try {
    const { 
      callId, 
      phoneNumber, 
      preferredTime, 
      topic, 
      scheduledFor 
    } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const callbackId = `CB${uuidv4().substring(0, 8).toUpperCase()}`;

    const newCallback: NewCallbackSchedule = {
      callbackId,
      callId: callId || null,
      phoneNumber,
      preferredTime: preferredTime || null,
      topic: topic || null,
      status: 'pending',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    };

    const [inserted] = await db.insert(callbackSchedules).values(newCallback);
    
    // Fetch the created callback
    const callback = await db.select()
      .from(callbackSchedules)
      .where(eq(callbackSchedules.callbackId, callbackId))
      .limit(1);

    res.status(201).json(callback[0]);
  } catch (error) {
    console.error('Error creating callback:', error);
    res.status(500).json({ error: 'Failed to create callback' });
  }
});

// Update callback status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updates: any = { status };
    
    // Set completedAt if status is completed
    if (status === 'completed') {
      updates.completedAt = new Date();
    }

    await db.update(callbackSchedules)
      .set(updates)
      .where(eq(callbackSchedules.callbackId, id));

    const updated = await db.select()
      .from(callbackSchedules)
      .where(eq(callbackSchedules.callbackId, id))
      .limit(1);

    if (!updated.length) {
      return res.status(404).json({ error: 'Callback not found' });
    }

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating callback status:', error);
    res.status(500).json({ error: 'Failed to update callback status' });
  }
});

// Schedule a callback
router.patch('/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledFor } = req.body;

    if (!scheduledFor) {
      return res.status(400).json({ error: 'Scheduled time is required' });
    }

    await db.update(callbackSchedules)
      .set({ 
        scheduledFor: new Date(scheduledFor),
        status: 'scheduled'
      })
      .where(eq(callbackSchedules.callbackId, id));

    const updated = await db.select()
      .from(callbackSchedules)
      .where(eq(callbackSchedules.callbackId, id))
      .limit(1);

    if (!updated.length) {
      return res.status(404).json({ error: 'Callback not found' });
    }

    res.json(updated[0]);
  } catch (error) {
    console.error('Error scheduling callback:', error);
    res.status(500).json({ error: 'Failed to schedule callback' });
  }
});

// Get upcoming callbacks (for scheduling/reminders)
router.get('/upcoming/:minutes', async (req, res) => {
  try {
    const { minutes } = req.params;
    const minutesInt = parseInt(minutes);
    
    if (isNaN(minutesInt)) {
      return res.status(400).json({ error: 'Invalid minutes parameter' });
    }

    const now = new Date();
    const future = new Date(now.getTime() + minutesInt * 60000);

    const upcomingCallbacks = await db.select()
      .from(callbackSchedules)
      .where(
        and(
          eq(callbackSchedules.status, 'scheduled'),
          gte(callbackSchedules.scheduledFor, now),
          lte(callbackSchedules.scheduledFor, future)
        )
      )
      .orderBy(callbackSchedules.scheduledFor);

    res.json(upcomingCallbacks);
  } catch (error) {
    console.error('Error fetching upcoming callbacks:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming callbacks' });
  }
});

// Delete callback
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.delete(callbackSchedules)
      .where(eq(callbackSchedules.callbackId, id));

    res.json({ message: 'Callback deleted successfully' });
  } catch (error) {
    console.error('Error deleting callback:', error);
    res.status(500).json({ error: 'Failed to delete callback' });
  }
});

export default router;