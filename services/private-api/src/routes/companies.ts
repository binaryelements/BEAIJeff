import { Router } from 'express';
import { db } from '../db';
import { companies, auditLogs } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Validation schemas
const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  timezone: z.string().optional(),
  businessHours: z.object({
    start: z.string().optional(),
    end: z.string().optional()
  }).optional(),
  supportNumber: z.string().optional(),
  metadata: z.any().optional()
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, Number(id)))
      .limit(1);

    if (!company.length) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company[0]);
  } catch (error: any) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Get all companies (admin only)
router.get('/', async (req, res) => {
  try {
    const allCompanies = await db
      .select()
      .from(companies)
      .orderBy(companies.name);

    res.json(allCompanies);
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Create company
router.post('/', async (req, res) => {
  try {
    const validatedData = updateCompanySchema.parse(req.body);
    
    const result = await db
      .insert(companies)
      .values({
        name: validatedData.name || 'New Company',
        ...validatedData
      });

    // Log the action
    await db.insert(auditLogs).values({
      userId: req.user?.id,
      action: 'CREATE_COMPANY',
      entityType: 'company',
      entityId: String(result.insertId),
      metadata: validatedData
    });

    res.status(201).json({ 
      id: result.insertId,
      message: 'Company created successfully' 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: error.errors 
      });
    }
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Update company
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateCompanySchema.parse(req.body);
    
    // Check if company exists
    const existing = await db
      .select()
      .from(companies)
      .where(eq(companies.id, Number(id)))
      .limit(1);

    if (!existing.length) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Update company
    await db
      .update(companies)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(companies.id, Number(id)));

    // Log the action
    await db.insert(auditLogs).values({
      userId: req.user?.id,
      action: 'UPDATE_COMPANY',
      entityType: 'company',
      entityId: id,
      metadata: validatedData
    });

    res.json({ message: 'Company updated successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: error.errors 
      });
    }
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Delete company (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if company exists
    const existing = await db
      .select()
      .from(companies)
      .where(eq(companies.id, Number(id)))
      .limit(1);

    if (!existing.length) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Soft delete by setting deletedAt
    await db
      .update(companies)
      .set({
        deletedAt: new Date()
      })
      .where(eq(companies.id, Number(id)));

    // Log the action
    await db.insert(auditLogs).values({
      userId: req.user?.id,
      action: 'DELETE_COMPANY',
      entityType: 'company',
      entityId: id,
      metadata: { softDelete: true }
    });

    res.json({ message: 'Company deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

export default router;