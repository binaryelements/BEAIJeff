import { Router, Request, Response } from 'express';
import { db } from '../db';
import { calls, callTranscripts, callEvents, callbackSchedules, auditLogs } from '../db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const createCallSchema = z.object({
  callSid: z.string(),
  companyId: z.number().optional(),
  phoneNumberId: z.number().optional(),
  phoneNumber: z.string().optional(),
  calledNumber: z.string().optional(),
  status: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateCallSchema = z.object({
  status: z.string().optional(),
  department: z.string().optional(),
  transferReason: z.string().optional(),
  resolution: z.string().optional(),
  customerSatisfied: z.boolean().optional(),
  conversationSummary: z.string().optional(),
  endedAt: z.string().datetime().optional(),
  duration: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

const createTranscriptSchema = z.object({
  callSid: z.string(),
  transcripts: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string(),
    timestamp: z.string().datetime(),
    metadata: z.record(z.any()).optional(),
  }))
});

const createEventSchema = z.object({
  callSid: z.string(),
  eventType: z.string(),
  eventData: z.record(z.any()).optional(),
});

const createCallbackSchema = z.object({
  callSid: z.string().optional(),
  callbackId: z.string(),
  phoneNumber: z.string(),
  preferredTime: z.string(),
  topic: z.string(),
  scheduledFor: z.string().datetime().optional(),
});

// Get all calls with pagination and filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      limit = 10, 
      offset = 0, 
      status,
      startDate,
      endDate,
      phoneNumber,
      companyId 
    } = req.query;
    
    let query = db.select().from(calls);
    const conditions = [];
    
    if (status) {
      conditions.push(eq(calls.status, status as string));
    }
    
    if (phoneNumber) {
      conditions.push(eq(calls.phoneNumber, phoneNumber as string));
    }
    
    if (companyId) {
      conditions.push(eq(calls.companyId, Number(companyId)));
    }
    
    if (startDate) {
      conditions.push(gte(calls.startedAt, new Date(startDate as string)));
    }
    
    if (endDate) {
      conditions.push(lte(calls.startedAt, new Date(endDate as string)));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query
      .limit(Number(limit))
      .offset(Number(offset))
      .orderBy(desc(calls.startedAt));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

// Get call by ID or callSid
router.get('/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    
    const isNumeric = /^\d+$/.test(identifier);
    const [call] = await db
      .select()
      .from(calls)
      .where(isNumeric ? eq(calls.id, Number(identifier)) : eq(calls.callSid, identifier))
      .limit(1);
    
    if (!call) {
      res.status(404).json({ error: 'Call not found' });
      return;
    }
    
    res.json(call);
  } catch (error) {
    console.error('Error fetching call:', error);
    res.status(500).json({ error: 'Failed to fetch call' });
  }
});

// Create new call
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createCallSchema.parse(req.body);
    
    const [newCall] = await db
      .insert(calls)
      .values(validatedData)
      .$returningId();
    
    const [createdCall] = await db
      .select()
      .from(calls)
      .where(eq(calls.id, newCall.id))
      .limit(1);
    
    // Log call creation for internal services
    await db.insert(auditLogs).values({
      action: 'calls:create',
      resource: 'call',
      resourceId: String(newCall.id),
      metadata: validatedData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.status(201).json(createdCall);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
      return;
    }
    console.error('Error creating call:', error);
    res.status(500).json({ error: 'Failed to create call' });
  }
});

// Update call
router.patch('/:callSid', async (req: Request, res: Response) => {
  try {
    const { callSid } = req.params;
    const validatedData = updateCallSchema.parse(req.body);
    
    if (validatedData.endedAt) {
      validatedData.endedAt = new Date(validatedData.endedAt) as any;
    }
    
    await db
      .update(calls)
      .set(validatedData)
      .where(eq(calls.callSid, callSid));
    
    const [updatedCall] = await db
      .select()
      .from(calls)
      .where(eq(calls.callSid, callSid))
      .limit(1);
    
    if (!updatedCall) {
      res.status(404).json({ error: 'Call not found' });
      return;
    }
    
    // Log call update for internal services
    await db.insert(auditLogs).values({
      action: 'calls:update',
      resource: 'call',
      resourceId: String(updatedCall.id),
      metadata: validatedData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.json(updatedCall);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
      return;
    }
    console.error('Error updating call:', error);
    res.status(500).json({ error: 'Failed to update call' });
  }
});

// Add transcripts to call
router.post('/transcripts', async (req: Request, res: Response) => {
  try {
    const validatedData = createTranscriptSchema.parse(req.body);
    
    // Find the call by callSid
    const [call] = await db
      .select()
      .from(calls)
      .where(eq(calls.callSid, validatedData.callSid))
      .limit(1);
    
    if (!call) {
      res.status(404).json({ error: 'Call not found' });
      return;
    }
    
    // Insert all transcripts
    const transcriptsToInsert = validatedData.transcripts.map(transcript => ({
      callId: call.id,
      role: transcript.role,
      text: transcript.text,
      timestamp: new Date(transcript.timestamp),
      metadata: transcript.metadata,
    }));
    
    await db.insert(callTranscripts).values(transcriptsToInsert);
    
    res.status(201).json({ 
      success: true, 
      message: `Added ${transcriptsToInsert.length} transcripts to call ${validatedData.callSid}` 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
      return;
    }
    console.error('Error adding transcripts:', error);
    res.status(500).json({ error: 'Failed to add transcripts' });
  }
});

// Get call transcripts
router.get('/:callSid/transcripts', async (req: Request, res: Response) => {
  try {
    const { callSid } = req.params;
    
    const [call] = await db
      .select()
      .from(calls)
      .where(eq(calls.callSid, callSid))
      .limit(1);
    
    if (!call) {
      res.status(404).json({ error: 'Call not found' });
      return;
    }
    
    const transcripts = await db
      .select()
      .from(callTranscripts)
      .where(eq(callTranscripts.callId, call.id))
      .orderBy(callTranscripts.timestamp);
    
    res.json(transcripts);
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    res.status(500).json({ error: 'Failed to fetch transcripts' });
  }
});

// Add event to call
router.post('/events', async (req: Request, res: Response) => {
  try {
    const validatedData = createEventSchema.parse(req.body);
    
    const [call] = await db
      .select()
      .from(calls)
      .where(eq(calls.callSid, validatedData.callSid))
      .limit(1);
    
    if (!call) {
      res.status(404).json({ error: 'Call not found' });
      return;
    }
    
    const [newEvent] = await db
      .insert(callEvents)
      .values({
        callId: call.id,
        eventType: validatedData.eventType,
        eventData: validatedData.eventData,
      })
      .$returningId();
    
    res.status(201).json({ 
      success: true, 
      eventId: newEvent.id,
      message: `Event ${validatedData.eventType} recorded for call ${validatedData.callSid}` 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
      return;
    }
    console.error('Error adding event:', error);
    res.status(500).json({ error: 'Failed to add event' });
  }
});

// Create callback schedule
router.post('/callbacks', async (req: Request, res: Response) => {
  try {
    const validatedData = createCallbackSchema.parse(req.body);
    
    let callId = null;
    if (validatedData.callSid) {
      const [call] = await db
        .select()
        .from(calls)
        .where(eq(calls.callSid, validatedData.callSid))
        .limit(1);
      
      if (call) {
        callId = call.id;
      }
    }
    
    const [newCallback] = await db
      .insert(callbackSchedules)
      .values({
        callId,
        callbackId: validatedData.callbackId,
        phoneNumber: validatedData.phoneNumber,
        preferredTime: validatedData.preferredTime,
        topic: validatedData.topic,
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : undefined,
      })
      .$returningId();
    
    const [createdCallback] = await db
      .select()
      .from(callbackSchedules)
      .where(eq(callbackSchedules.id, newCallback.id))
      .limit(1);
    
    res.status(201).json(createdCallback);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
      return;
    }
    console.error('Error creating callback:', error);
    res.status(500).json({ error: 'Failed to create callback' });
  }
});

// Get call statistics
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, companyId } = req.query;
    
    const conditions = [];
    if (companyId) {
      conditions.push(eq(calls.companyId, Number(companyId)));
    }
    if (startDate) {
      conditions.push(gte(calls.startedAt, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(calls.startedAt, new Date(endDate as string)));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const allCalls = await db
      .select()
      .from(calls)
      .where(whereClause);
    
    const stats = {
      totalCalls: allCalls.length,
      completedCalls: allCalls.filter(c => c.status === 'completed').length,
      inProgressCalls: allCalls.filter(c => c.status === 'in_progress').length,
      transferredCalls: allCalls.filter(c => c.department).length,
      satisfiedCustomers: allCalls.filter(c => c.customerSatisfied === true).length,
      averageDuration: allCalls.reduce((acc, c) => acc + (c.duration || 0), 0) / (allCalls.filter(c => c.duration).length || 1),
      departmentBreakdown: {
        sales: allCalls.filter(c => c.department === 'sales').length,
        support: allCalls.filter(c => c.department === 'support').length,
        billing: allCalls.filter(c => c.department === 'billing').length,
        technical: allCalls.filter(c => c.department === 'technical').length,
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;