import { Router } from 'express';
import { db } from '../db';
import { contacts, calls, Contact, NewContact } from '../db/schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import { authenticate, AuthRequest, getCompanyId } from '../middleware/auth';

const router = Router();

// Search contacts (for AI to use)
router.get('/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const { query, phoneNumber, name, email, isInternal, allowCallTransfer } = req.query;
    const companyId = getCompanyId(req); // Get from auth context

    let conditions = [eq(contacts.companyId, companyId)];

    if (query) {
      // General search across multiple fields
      const searchPattern = `%${query}%`;
      conditions.push(
        or(
          like(contacts.name, searchPattern),
          like(contacts.phoneNumber, searchPattern),
          like(contacts.email, searchPattern),
          like(contacts.companyName, searchPattern)
        )!
      );
    }

    if (phoneNumber) {
      conditions.push(like(contacts.phoneNumber, `%${phoneNumber}%`));
    }

    if (name) {
      conditions.push(like(contacts.name, `%${name}%`));
    }

    if (email) {
      conditions.push(like(contacts.email, `%${email}%`));
    }
    
    if (isInternal !== undefined) {
      conditions.push(eq(contacts.isInternal, isInternal === 'true'));
    }
    
    if (allowCallTransfer !== undefined) {
      conditions.push(eq(contacts.allowCallTransfer, allowCallTransfer === 'true'));
    }

    const results = await db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(desc(contacts.lastContactedAt), desc(contacts.createdAt))
      .limit(100); // Increased limit for better search results

    res.json(results);
  } catch (error) {
    console.error('Error searching contacts:', error);
    res.status(500).json({ error: 'Failed to search contacts' });
  }
});

// Get contact by phone number for a company
router.get('/lookup/:phoneNumber', authenticate, async (req: AuthRequest, res) => {
  try {
    const { phoneNumber } = req.params;
    const companyId = getCompanyId(req); // Get from auth context

    const contact = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.companyId, companyId),
          eq(contacts.phoneNumber, phoneNumber)
        )
      )
      .limit(1);

    if (contact.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact[0]);
  } catch (error) {
    console.error('Error looking up contact:', error);
    res.status(500).json({ error: 'Failed to lookup contact' });
  }
});

// Get internal contacts for a company
router.get('/company/:companyId/internal', authenticate, async (req: AuthRequest, res) => {
  try {
    const companyId = getCompanyId(req); // Get from auth context, ignore URL param
    const { allowCallTransfer } = req.query;
    
    let conditions = [
      eq(contacts.companyId, companyId),
      eq(contacts.isInternal, true)
    ];
    
    if (allowCallTransfer !== undefined) {
      conditions.push(eq(contacts.allowCallTransfer, allowCallTransfer === 'true'));
    }
    
    const results = await db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(contacts.name);
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching internal contacts:', error);
    res.status(500).json({ error: 'Failed to fetch internal contacts' });
  }
});

// Get all contacts for a company
router.get('/company/:companyId', authenticate, async (req: AuthRequest, res) => {
  try {
    const companyId = getCompanyId(req); // Get from auth context, ignore URL param
    const { page = 1, limit = 50 } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const results = await db
      .select()
      .from(contacts)
      .where(eq(contacts.companyId, companyId))
      .orderBy(desc(contacts.createdAt))
      .limit(parseInt(limit as string))
      .offset(offset);

    res.json(results);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// List all contacts with optional search
router.get('/', async (req: any, res) => {
  try {
    const companyId = 1; // Temporarily hardcode for testing
    const { q } = req.query as any;
    
    let conditions = [eq(contacts.companyId, companyId)];
    
    // Handle search query
    if (q) {
      const searchTerm = `%${q}%`;
      conditions.push(
        or(
          like(contacts.name, searchTerm),
          like(contacts.phoneNumber, searchTerm),
          like(contacts.email, searchTerm),
          like(contacts.companyName, searchTerm)
        )!
      );
    }
    
    const results = await db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(desc(contacts.lastContactedAt), desc(contacts.createdAt))
      .limit(100);
    
    res.json(results);
  } catch (error) {
    console.error('Error listing contacts:', error);
    res.status(500).json({ error: 'Failed to list contacts' });
  }
});

// Get single contact
router.get('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = 1; // Temporarily hardcode for testing

    const contact = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, parseInt(id)),
          eq(contacts.companyId, companyId) // Ensure contact belongs to user's company
        )
      )
      .limit(1);

    if (contact.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact[0]);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Create or update contact (upsert)
router.post('/', async (req: any, res) => {
  try {
    const companyId = 1; // Temporarily hardcode for testing
    const contactData: NewContact = {
      ...req.body,
      companyId // Ensure contact is created for user's company
    };

    // Check if contact exists
    const existing = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.companyId, contactData.companyId),
          eq(contacts.phoneNumber, contactData.phoneNumber)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing contact
      const updated = await db
        .update(contacts)
        .set({
          ...contactData,
          updatedAt: sql`CURRENT_TIMESTAMP`,
          totalCalls: sql`total_calls + 1`,
          lastContactedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(contacts.id, existing[0].id));

      const updatedContact = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, existing[0].id))
        .limit(1);

      res.json(updatedContact[0]);
    } else {
      // Create new contact
      const result = await db.insert(contacts).values({
        ...contactData,
        totalCalls: 1,
        lastContactedAt: sql`CURRENT_TIMESTAMP`,
      });

      const newContact = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, result[0].insertId))
        .limit(1);

      res.status(201).json(newContact[0]);
    }
  } catch (error) {
    console.error('Error creating/updating contact:', error);
    res.status(500).json({ error: 'Failed to create/update contact' });
  }
});

// Update contact
router.patch('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = 1; // Temporarily hardcode for testing
    const updates = req.body;

    await db
      .update(contacts)
      .set({
        ...updates,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(contacts.id, parseInt(id)),
          eq(contacts.companyId, companyId) // Ensure can only update own company's contacts
        )
      );

    const updated = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, parseInt(id)))
      .limit(1);

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete contact
router.delete('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = 1; // Temporarily hardcode for testing

    const result = await db
      .delete(contacts)
      .where(
        and(
          eq(contacts.id, parseInt(id)),
          eq(contacts.companyId, companyId) // Ensure can only delete own company's contacts
        )
      );

    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Get contact's call history
router.get('/:id/calls', async (req: any, res) => {
  try {
    const { id } = req.params;

    const callHistory = await db
      .select()
      .from(calls)
      .where(eq(calls.contactId, parseInt(id)))
      .orderBy(desc(calls.startedAt));

    res.json(callHistory);
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

export default router;